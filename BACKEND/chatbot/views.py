from huggingface_hub import InferenceClient
from django.shortcuts import render
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse
import time
import uuid
import logging
def generate_response(preference, options):
    response = f"Your preference: **{preference}**\nOptions:\n"
    for option in options:
        response += f"*{option}*\n"
    return response

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = InferenceClient(api_key="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")  # Hugging Face API key
api_key = "AIzaSyAhm4JCM5KT76NIyIt6bB2w0as_7BMv6eQ"  # Google Places API key

def get_place_details(place_id):
    base_url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "key": api_key,
        "fields": "name,formatted_address,rating,opening_hours,price_level"
    }
    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        return response.json().get("result", {})
    else:
        logger.error(f"Error fetching place details: {response.status_code} - {response.text}")
        return {}

def google_places_text_search(api_key, query, location=None, radius=None):
    base_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": query,
        "key": api_key
    }
    if location and radius:
        params.update({"location": location, "radius": radius})
    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        results = response.json().get("results", [])
        detailed_results = []
        for place in results:
            place_id = place.get("place_id")
            if place_id:
                detailed_place = get_place_details(place_id)
                detailed_results.append(detailed_place)
        return detailed_results
    else:
        logger.error(f"Error fetching text search: {response.status_code} - {response.text}")
        return []

def travel_agent(user_input, request_id, timestamp, temp):
    return generate_planner_response(user_input, request_id, timestamp, temp)

def music_agent(user_input, request_id, timestamp, temp):
    return "Music agent response"

def food_agent(user_input, request_id, timestamp, temp):
    return "Food agent response"

def detect_agent(user_input):
    """Determine which agent should handle the request based on keywords."""
    keywords = {
        "travel": ["trip", "vacation", "places", "tourist", "visit"],
        "music": ["song", "playlist", "album", "band", "concert"],
        "food": ["restaurant", "cafe", "eat", "dining", "food"]
    }

    for category, words in keywords.items():
        if any(word in user_input.lower() for word in words):
            return category
    return "default"

def generate_planner_response(user_input, request_id, timestamp, temp):
    places_data = google_places_text_search(api_key, user_input)

    if isinstance(places_data, dict) and "error" in places_data:
        return places_data["error"]

    prompt = f"""
    [Request ID: {request_id}]
    [Timestamp: {timestamp}]
    Help the user create a simple day plan based on their list of places: {places_data} and from user input: '{user_input}'.
    Extract their preferences from the user input. For EACH preference, suggest **exactly three high-rated places**
    that match their interest, ensuring the places are open during the user's available hours.
    Provide address for each location from the places data shared earlier.
    Allow 30 minutes between each preference for transportation.
    For formatting, the first time show up of exactly three high-rated places for every perferences have format like **name**(two*). Any other format can not cover by ** like **context**! But for each preference that user input, please use /name/(only one /!)!

    Format the output in a warm, conversational tone that feels like local advice for a fun day out.
    """

    messages = [{"role": "user", "content": prompt}]

    stream = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3-70B-Instruct", 
        messages=messages, 
        max_tokens=2048,
        temperature=temp,  # Dynamic temperature parameter
        stream=True,
    )

    outputs = ""
    for chunk in stream:
        outputs += chunk.choices[0].delta.content
    
    formatted_response = f"Here are some fun activities you might enjoy (Request ID: {request_id}):\n\n" + outputs

    logger.info(f"Request ID: {request_id}")
    logger.info(f"User Input: {user_input}")
    logger.info(f"Generated Response: {formatted_response[:200]}...")

    return formatted_response

@api_view(['POST'])
def chatbot_api(request):
    if request.method == 'POST':
        user_input = request.POST.get('message')
        timestamp = request.POST.get('timestamp', int(time.time()))  # Current timestamp if not provided
        request_id = str(uuid.uuid4())  # Unique request ID
        temp = request.POST.get('temperature', 0.7)  # Default temperature if not provided

        agent = detect_agent(user_input)

        if agent == "travel":
            response = travel_agent(user_input, request_id, timestamp, temp)
        elif agent == "music":
            response = music_agent(user_input, request_id, timestamp, temp)
        elif agent == "food":
            response = food_agent(user_input, request_id, timestamp, temp)
        else:
            response = generate_planner_response(user_input, request_id, timestamp, temp)

        return HttpResponse(response) 

def call_model(request):
    if request.method == 'POST':
        message = request.POST.get('message')
        timestamp = request.POST.get('timestamp', int(time.time()))  # Current timestamp if not provided
        request_id = str(uuid.uuid4())  # Unique request ID
        temp = request.POST.get('temperature', 0.7)  # Default temperature if not provided

        agent = detect_agent(message)

        if agent == "travel":
            output = travel_agent(message, request_id, timestamp, temp)
        elif agent == "music":
            output = music_agent(message, request_id, timestamp, temp)
        elif agent == "food":
            output = food_agent(message, request_id, timestamp, temp)
        else:
            output = generate_planner_response(message, request_id, timestamp, temp)

        return render(request, 'chatbot/output_page.html', {'output': output})
    
    return render(request, 'chatbot/input_page.html')