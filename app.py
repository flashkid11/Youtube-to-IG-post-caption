import os
import uuid
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types
from typing_extensions import TypedDict
# from pydantic import BaseModel
import json
import re

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

app = Flask(__name__)

# Define the transcript data model
class Transcript(TypedDict):
    timestamp: str
    subtitle: str

# --- Main Transcription Logic ---
def generate_transcript(youtube_url, request_id):
    """
    Generates transcript for a YouTube URL using Gemini API.
    Uses unique request_id for logging purposes.
    """
    print(f"Starting transcript generation for: {youtube_url} (ID: {request_id})")

    if not GEMINI_API_KEY:
        print("Gemini API key not found.")
        raise ValueError("Gemini API key is required.")
    # print(f"Attempting transcription via Gemini API for ID: {request_id}...")
    # Configure the Gemini API
    client = genai.Client(api_key=GEMINI_API_KEY)

    # Construct the prompt
    prompt = """
    Analyze the following YouTube video and generate accurate timestamps with corresponding subtitles.
    Requirements:
    1. Language: Cantonese or English (prioritize accuracy in spoken language).
    2. Provide timestamps in the format MM:SS and the spoken text at each timestamp.
    Return the result as a JSON array of objects with 'timestamp' and 'subtitle' fields.
    """

    # Create content using types.Content and types.Part
    content = types.Content(
        parts=[
            types.Part(text=prompt),
            types.Part(file_data=types.FileData(file_uri=youtube_url))
        ]
    )

    # Generate content with JSON response
    response = client.models.generate_content(
        model='models/gemini-2.5-pro-exp-03-25',  # Adjusted to a valid model name
        contents=content,
        config=types.GenerateContentConfig(
            response_mime_type='application/json',
            response_schema=list[Transcript],
            temperature=1.0,
        )
    )

    # Extract JSON from response.text
    response_text = response.text
    print(f"Raw response text: {response_text}")

    # Use regex to extract the JSON content between ```json and ```
    json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        # Fallback: assume the entire text is JSON
        json_str = response_text

    # Parse the JSON string into a Python list
    transcript_data = json.loads(json_str)

    # Ensure it’s a list of dictionaries matching Transcript
    if not isinstance(transcript_data, list):
        raise ValueError("Response is not a list of transcripts")
    
    # Validate each item (optional, since schema should enforce this)
    for item in transcript_data:
        if not isinstance(item, dict) or 'timestamp' not in item or 'subtitle' not in item:
            raise ValueError(f"Invalid transcript item: {item}")

    print(f"Transcript successfully generated by Gemini API for ID: {request_id}.")
    return transcript_data

# --- Flask Routes ---
@app.route('/')
def index():
    """Renders the main page."""
    return render_template('index.html')

@app.route('/generate_transcript', methods=['POST'])
def generate_transcript_route():
    """Handles the transcript generation request."""
    youtube_link = request.form.get('youtube_link')
    if not youtube_link:
        return jsonify({'transcript': '錯誤：未提供 YouTube 鏈接。'}), 400

    print(f"--- Received Link in Route: {youtube_link} ---")
    request_id = str(uuid.uuid4())
    print(f"--- Processing with Request ID: {request_id} ---")

    try:
        transcript = generate_transcript(youtube_link, request_id)
        return jsonify({'transcript': transcript})
    except Exception as e:
        print(f"Unhandled error in /generate_transcript route for ID {request_id}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'transcript': f"嚴重錯誤：處理請求時發生意外問題。 {e}"}), 500

# --- Main Execution ---
if __name__ == '__main__':
    os.makedirs('downloads', exist_ok=True)  # Optional, can be removed if not needed
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))