<!-- Banner Placeholder - Replace the src URL! -->
<p align="center">
  <a href="[YOUR_PROJECT_LINK_OR_REPO_URL]"> <!-- Optional: Link the banner -->
    <img src="[URL_TO_YOUR_HOSTED_SVG_BANNER.svg]" alt="YouTube to IG Caption Generator Banner" width="700"> <!-- Adjust width as needed -->
  </a>
</p>

# YouTube to Instagram Post Caption Generator

[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

A Flask web application that automatically generates Instagram post captions based on the content (transcript, title, description) of a YouTube video using the OpenAI API.

## Overview

This tool simplifies creating social media content by leveraging AI. Provide a YouTube video URL, and it will:

1.  Fetch the video's transcript using `youtube-transcript-api`.
2.  Retrieve the video's title and description via the YouTube Data API v3.
3.  Send the collected text data to OpenAI's Chat Completion endpoint (GPT).
4.  Return a generated Instagram-style caption summarizing the video content.

## Features

*   Simple API endpoint (`/generate_caption`) accepts YouTube URLs.
*   Utilizes video transcripts for accurate content analysis.
*   Incorporates video title and description for context.
*   Leverages OpenAI (GPT models) for natural language caption generation.
*   Built with Python and Flask.
*   Ready for deployment (includes `Procfile` for platforms like Heroku).

## Technology Stack

*   **Backend:** Python 3.11+
*   **Framework:** Flask
*   **API Clients:**
    *   OpenAI API (`openai`)
    *   Google API Python Client (`google-api-python-client`) for YouTube Data API v3
    *   YouTube Transcript API (`youtube-transcript-api`)
*   **WSGI Server (for deployment):** Gunicorn

## Prerequisites

*   **Python:** Version 3.11 or higher.
*   **pip:** Python package installer.
*   **Git:** For cloning the repository.
*   **API Keys:**
    *   **OpenAI API Key:** You need an API key from [OpenAI](https://platform.openai.com/account/api-keys).
    *   **YouTube Data API v3 Key:** You need an API key from the [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com). Ensure the YouTube Data API v3 is enabled for your project.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/flashkid11/Youtube-to-IG-post-caption.git
    cd Youtube-to-IG-post-caption
    ```

2.  **Create and activate a virtual environment (recommended):**
    ```bash
    # Linux/macOS
    python3 -m venv venv
    source venv/bin/activate

    # Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

1.  Create a file named `.env` in the root directory of the project.
2.  Add your API keys to the `.env` file:
    ```dotenv
    OPENAI_API_KEY=your_openai_api_key_here
    YOUTUBE_API_KEY=your_youtube_data_api_key_here
    ```
    Replace `your_openai_api_key_here` and `your_youtube_data_api_key_here` with your actual keys. The application uses `python-dotenv` to load these variables automatically.

## Usage

### Running Locally

1.  **Start the Flask development server:**
    ```bash
    flask run
    ```
    The application will typically be available at `http://127.0.0.1:5000`.

2.  **Send a POST request to the API endpoint:**
    Use a tool like `curl` or Postman to send a POST request to the `/generate_caption` endpoint with the YouTube URL in the JSON body.

    **Example using `curl`:**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
         -d '{"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
         http://127.0.0.1:5000/generate_caption
    ```
    Replace `"https://www.youtube.com/watch?v=dQw4w9WgXcQ"` with the actual YouTube video URL you want to process.

3.  **Receive the response:**
    If successful, you'll receive a JSON response containing the generated caption:
    ```json
    {
      "caption": "Here's the AI-generated Instagram caption based on the video content..."
    }
    ```
    If an error occurs (e.g., transcript not found, invalid URL, API key issue), you'll receive an error message:
    ```json
    {
      "error": "Description of the error that occurred."
    }
    ```

### Deployment

This application includes a `Procfile` and uses `gunicorn`, making it suitable for deployment on platforms like Heroku, Render, or other services that support Python WSGI applications. Ensure you set the `OPENAI_API_KEY` and `YOUTUBE_API_KEY` as environment variables in your deployment environment.

## License

*This project does not currently have a license. Please add a LICENSE file (e.g., MIT License) to define usage rights.*

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue on the GitHub repository. If you'd like to contribute code, please open a pull request.

---
