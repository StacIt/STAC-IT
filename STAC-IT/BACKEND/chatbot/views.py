from django.shortcuts import render
import requests
import torch
import transformers

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

api_key = "API_KEY"  

def google_places_text_search(api_key, query, location=None, radius=None):
    base_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": query,
        "key": api_key
    }
    if location and radius:
        params["location"] = location
        params["radius"] = radius

    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        results = response.json().get('results', [])
        return results
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

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
            f"Place: {place['name']}, Location: {place.get('vicinity', 'N/A')}, "
            f"Rating: {place.get('rating', 'N/A')} (based on {place.get('user_ratings_total', 'N/A')} reviews), "
            f"Price Level: {place.get('price_level', 'N/A')}.\n"
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

    # Format the JSON response for readability
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
