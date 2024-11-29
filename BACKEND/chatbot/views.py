from huggingface_hub import InferenceClient
from django.shortcuts import render
import requests
# import torch
# import transformers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.http import HttpResponse


"""device = 0 if torch.cuda.is_available() else -1
model_id = 'chatbot/llamamodel' #3.1B
pipeline = transformers.pipeline(
    "text-generation",
    model=model_id,
    model_kwargs={
        "torch_dtype": torch.bfloat16,
        "pad_token_id": None,
    },
    device=device,
)"""

client = InferenceClient(api_key="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") #hugging face
api_key = "AIzaSyDHZNxYLeb2Juq-1SAzMNsktEBEHk8HZQ8" #need to get an API key
#places api



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
        print(f"Error fetching place details: {response.status_code} - {response.text}")
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
        print(f"Error fetching text search: {response.status_code} - {response.text}")
        return []

def generate_planner_response(user_input):
    location = None 
    radius = None    

    places_data = google_places_text_search(api_key, user_input, location, radius)

    if isinstance(places_data, dict) and "error" in places_data:
        return places_data["error"]

    if not places_data:
        return "No places found. Please provide a valid location or preferences."

    places_for_prompt = ""
    for place in places_data:
        places_for_prompt += (
            f"Place: {place['name']}, Location: {place.get('formatted_address', 'N/A')}, "
            f"Rating: {place.get('rating', 'N/A')} (based on {place.get('user_ratings_total', 'N/A')} reviews), "
            f"Price Level: {place.get('price_level', 'N/A')}.\n"
        )

    prompt = (
        f"""Help the user create a simple day plan based on their list of places: '{places_for_prompt}' and from user input: '{user_input}' get preferences, and preferred time range. Ensure each chosen activity fits within the user's available hours and the location's open hours, allowing 30 minutes between activities for transportation. with exactly three stops based on the highest-rated places from the list. Match the activities to the user's interests (e.g., cake, steak, bubble tea) and ensure each place is open during the user's available times.

        For each stop, provide:

        Stop Number: Label each activity as Stop 1, Stop 2, and Stop 3.
        Place Name: Mention the name of the place.
        Activity Description: Describe what the user will enjoy at each location, including recommended flavors, dishes, or highlights.
        Location: Add the address of the location.
        Timing: Mention the start and end time for each stop, ensuring a 30-minute buffer for transportation.
        Open Hours: List the open hours for each place.
        Format the output in a warm, conversational tone that feels like local advice for a fun day out, with no technical formatting or code. 
        """
    )

    messages = [
    {
        "role": "user",
        "content": prompt
    }
]

    
    """outputs = pipeline(
        prompt,
        max_new_tokens=512,  
        do_sample=True,
        temperature=0.6,
        top_p=0.9,
    )"""

    stream = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3-70B-Instruct", 
	    messages=messages, 
	    max_tokens=512,
	    stream=True
    )

    """for chunk in stream:
        print(chunk.choices[0].delta.content, end="")"""

    outputs = ""
    for chunk in stream:
        outputs += chunk.choices[0].delta.content
    
    #activities = outputs[0]["generated_text"].strip()
    #activities = outputs[0]["generated_text"].strip()
    #activities_with_newlines = activities.replace('", "', '",\n "').replace('{', '{\n ').replace('},', '\n},')
    
    formatted_response = "Here are some fun activities you might enjoy:\n\n"
    #formatted_response += activities_with_newlines
    formatted_response += outputs

    return formatted_response

from rest_framework.decorators import api_view
from django.http import JsonResponse

@api_view(['POST'])
def chatbot_api(request):
    if request.method == 'POST':
        user_input = request.POST.get('message') 
        response = generate_planner_response(user_input)
        
        return HttpResponse(response) 

def call_model(request):
    if request.method == 'POST':
        message = request.POST.get('message')  # Get the user input

        if message:
            output = generate_planner_response(message)
            return render(request, 'chatbot/output_page.html', {'output': output})
        else:
            return render(request, 'chatbot/input_page.html', {'error': 'Please enter a message.'})

    return render(request, 'chatbot/input_page.html')