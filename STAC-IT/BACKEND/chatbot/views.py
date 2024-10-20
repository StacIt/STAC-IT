from django.shortcuts import render
import transformers
import torch
import googlemaps
import re

device = 0 if torch.cuda.is_available() else -1

model_id = 'chatbot/llamamodel/Meta-Llama-3.1-8B-Instruct'
pipeline = transformers.pipeline(
    "text-generation",
    model=model_id,
    model_kwargs={
        "torch_dtype": torch.bfloat16,
        "pad_token_id": None,  
    },
    device=device,
)

gmaps = googlemaps.Client(key='APIKEY')

def extract_location(user_input):
    location_regex = r'\b(?:in|at)\s+([A-Za-z\s,]+)'
    match = re.search(location_regex, user_input)
    if match:
        return match.group(1).strip() 
    return None

VALID_PLACE_TYPES = [
    'cafe', 'restaurant', 'bar', 'museum', 'park', 'gym', 'library', 'movie_theater', 'shopping_mall', 'art_gallery'
]

def extract_type(user_input):
    type_regex = r'\b(?:go to|visit|like|prefer|interested in)\s+([A-Za-z\s]+)'
    
    match = re.search(type_regex, user_input)
    if match:
        place_type = match.group(1).strip().lower()
        for valid_type in VALID_PLACE_TYPES:
            if valid_type in place_type:
                return valid_type
    return None

def google_places(user_input):
    user_location = extract_location(user_input)
    user_type = extract_type(user_input)
    
    if not user_location:
        user_location = "Stamford, Connecticut"  

    try:
        geocode_result = gmaps.geocode(user_location)
        if geocode_result:
            location = geocode_result[0]['geometry']['location']
            latitude = location['lat']
            longitude = location['lng']
        else:
            return {"error": f"Could not find location: {user_location}. Please provide a valid location."}
    except Exception as e:
        return {"error": f"Error finding location: {str(e)}"}
    
    radius = 1000 
    
    try:
        places_result = gmaps.places_nearby(location=f"{latitude},{longitude}", radius=radius, type=user_type)
        if places_result['status'] == 'OK':
            places_list = []
            for place in places_result['results']:
                places_list.append({
                    "name": place.get('name'),
                    "vicinity": place.get('vicinity'),
                    "rating": place.get('rating', 'N/A'),  
                    "user_ratings_total": place.get('user_ratings_total', 'N/A')
                })
            return places_list
        else:
            return {"error": "No places found nearby."}
    
    except Exception as e:
        return {"error": f"Error fetching places: {str(e)}"}


def generate_planner_response(user_input):
    places_data = google_places(user_input)
    
    if isinstance(places_data, dict) and "error" in places_data:
        return places_data["error"]

    if not places_data:
        return "No places found. Please provide a valid location or preferences."

    places_for_prompt = ""
    for place in places_data:
        places_for_prompt += (
            f"Place: {place['name']}, Location: {place['vicinity']}, "
            f"Rating: {place['rating']} (based on {place['user_ratings_total']} reviews).\n"
        )

    prompt = (
        f"""You are a helpful planning assistant. The user wants to create a schedule for the day. 
        They provided the following place_list: '{places_for_prompt}' also take into consideration ONLY the time input by the user here '{user_input}'.
        Make sure the places are open during the time provided by the user and matches the hours of operation from the place_list. 
        Please provide a varied list of EXACTLY 3 complete activities using the highest and most rated places provided in JSON format only, with no other text. 
        The JSON should be an array of objects. Each object should have the following fields: 
        {{
            "start_time": "<The time when the activity begins>",
            "end_time": "<The time when the activity ends>",
            "duration": "<The length of the activity in minutes or hours>",
            "activity": "<The name of the activity>",
            "details": "<Further details about the activity>",
            "location": "<Location of activity>",
            "open": "<hours of operation>"
        }}
        Output strictly in JSON format, with no explanation text.
        """
    )
    outputs = pipeline(
        prompt,
        max_new_tokens=512,  
        do_sample=True,
        temperature=0.6,
        top_p=0.9,
    )
    
    activities = outputs[0]["generated_text"].strip()

    activities_with_newlines = activities.replace('", "', '",\n "').replace('{', '{\n ').replace('},', '\n},')

    formatted_response = "Here are some fun activities you might enjoy:\n\n"
    formatted_response += activities_with_newlines

    return formatted_response

def chatbot_view(request):
    response = ""
    if request.method == 'POST':
        user_input = request.POST.get('message')
        response = generate_planner_response(user_input)
    
    return render(request, 'chatbot/chatbot.html', {'response': response})
