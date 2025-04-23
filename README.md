</p>
<p align="center">
  Generate Instagram Captions from YouTube Videos using AI
</p>

---

[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat&logo=vercel)]([YOUR_VERCEL_DEPLOYMENT_URL_HERE]) <!-- Replace placeholder -->

A Flask web application that automatically generates Instagram post captions based on the content (transcript, title, description) of a YouTube video using the OpenAI API.

**🚀 Live Demo:** [**[YOUR_VERCEL_DEPLOYMENT_URL_HERE]**]([YOUR_VERCEL_DEPLOYMENT_URL_HERE]) <!-- Replace placeholder -->

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
*   Ready for deployment on platforms like Vercel.

## Technology Stack

*   **Backend:** Python 3.11+
*   **Framework:** Flask
*   **API Clients:**
    *   OpenAI API (`openai`)
    *   Google API Python Client (`google-api-python-client`) for YouTube Data API v3
    *   YouTube Transcript API (`youtube-transcript-api`)
*   **WSGI Server:** Gunicorn (used by Vercel implicitly or via `Procfile`)

## Prerequisites

*   **Python:** Version 3.11 or higher.
*   **pip:** Python package installer.
*   **Git:** For cloning the repository.
*   **API Keys:**
    *   **OpenAI API Key:** You need an API key from [OpenAI](https://platform.openai.com/account/api-keys).
    *   **YouTube Data API v3 Key:** You need an API key from the [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com). Ensure the YouTube Data API v3 is enabled for your project.

## Installation (Local Development)

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

1.  Create a file named `.env` in the root directory of the project (for local development).
2.  Add your API keys to the `.env` file:
    ```dotenv
    OPENAI_API_KEY=your_openai_api_key_here
    YOUTUBE_API_KEY=your_youtube_data_api_key_here
    ```
    Replace `your_openai_api_key_here` and `your_youtube_data_api_key_here` with your actual keys. The application uses `python-dotenv` to load these variables automatically during local development.
    **Note:** For deployment (e.g., Vercel), set these as Environment Variables in the platform's settings.

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

### Accessing the Deployed Version

Send POST requests to the `/generate_caption` endpoint on your Vercel deployment URL:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"youtube_url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"}' \
     [YOUR_VERCEL_DEPLOYMENT_URL_HERE]/generate_caption # Replace placeholder
```





</p>
<p align="center">
  透過 AI 從 YouTube 影片產生 Instagram 貼文標題
</p>

---

[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat&logo=vercel)]([YOUR_VERCEL_DEPLOYMENT_URL_HERE]) <!-- 替換佔位符 -->

一個 Flask 網路應用程式，使用 OpenAI API，根據 YouTube 影片的內容（字幕、標題、描述）自動產生 Instagram 貼文標題。

**🚀 線上演示 (Live Demo):** [**[YOUR_VERCEL_DEPLOYMENT_URL_HERE]**]([YOUR_VERCEL_DEPLOYMENT_URL_HERE]) <!-- 替換佔位符 -->

## 概述

這個工具利用 AI 簡化了社交媒體內容的創作。提供一個 YouTube 影片 URL，它將會：

1.  使用 `youtube-transcript-api` 取得影片的字幕。
2.  透過 YouTube Data API v3 取得影片的標題和描述。
3.  將收集到的文字資料傳送至 OpenAI 的 Chat Completion 端點 (GPT)。
4.  回傳一個生成的、總結影片內容的 Instagram 風格標題。

## 功能特色

*   簡單的 API 端點 (`/generate_caption`) 接受 YouTube URL。
*   利用影片字幕進行準確的內容分析。
*   結合影片標題和描述以提供上下文。
*   利用 OpenAI (GPT 模型) 進行自然語言標題生成。
*   使用 Python 和 Flask 建構。
*   已準備好在 Vercel 等平台上部署。

## 技術堆疊

*   **後端 (Backend):** Python 3.11+
*   **框架 (Framework):** Flask
*   **API 客戶端 (API Clients):**
    *   OpenAI API (`openai`)
    *   Google API Python Client (`google-api-python-client`) 用於 YouTube Data API v3
    *   YouTube Transcript API (`youtube-transcript-api`)
*   **WSGI 伺服器 (WSGI Server):** Gunicorn (Vercel 會隱式使用或透過 `Procfile` 使用)

## 先決條件

*   **Python:** 版本 3.11 或更高。
*   **pip:** Python 套件安裝程式。
*   **Git:** 用於複製儲存庫。
*   **API 金鑰 (API Keys):**
    *   **OpenAI API Key:** 您需要從 [OpenAI](https://platform.openai.com/account/api-keys) 獲取 API 金鑰。
    *   **YouTube Data API v3 Key:** 您需要從 [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com) 獲取 API 金鑰。請確保您的專案已啟用 YouTube Data API v3。

## 安裝 (本地開發)

1.  **複製儲存庫 (Clone the repository):**
    ```bash
    git clone https://github.com/flashkid11/Youtube-to-IG-post-caption.git
    cd Youtube-to-IG-post-caption
    ```

2.  **建立並啟用虛擬環境 (建議):**
    ```bash
    # Linux/macOS
    python3 -m venv venv
    source venv/bin/activate

    # Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **安裝依賴套件 (Install dependencies):**
    ```bash
    pip install -r requirements.txt
    ```

## 設定 (Configuration)

1.  在專案根目錄下建立一個名為 `.env` 的檔案（用於本地開發）。
2.  將您的 API 金鑰加入 `.env` 檔案中：
    ```dotenv
    OPENAI_API_KEY=your_openai_api_key_here
    YOUTUBE_API_KEY=your_youtube_data_api_key_here
    ```
    將 `your_openai_api_key_here` 和 `your_youtube_data_api_key_here` 替換成您實際的金鑰。在本地開發時，應用程式會使用 `python-dotenv` 自動載入這些變數。
    **注意：** 對於部署（例如 Vercel），請在平台的設定中將這些設定為環境變數 (Environment Variables)。

## 使用方式

### 本地運行

1.  **啟動 Flask 開發伺服器:**
    ```bash
    flask run
    ```
    應用程式通常會在 `http://127.0.0.1:5000` 上可用。

2.  **向 API 端點發送 POST 請求:**
    使用 `curl` 或 Postman 之類的工具，向 `/generate_caption` 端點發送 POST 請求，並在 JSON 主體中包含 YouTube URL。

    **使用 `curl` 的範例:**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
         -d '{"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
         http://127.0.0.1:5000/generate_caption
    ```
    將 `"https://www.youtube.com/watch?v=dQw4w9WgXcQ"` 替換為您想處理的實際 YouTube 影片 URL。

3.  **接收回應:**
    如果成功，您將收到一個包含生成標題的 JSON 回應：
    ```json
    {
      "caption": "這裡是根據影片內容由 AI 生成的 Instagram 標題..."
    }
    ```
    如果發生錯誤（例如，找不到字幕、URL 無效、API 金鑰問題），您將收到錯誤訊息：
    ```json
    {
      "error": "發生錯誤的描述。"
    }
    ```

### 存取已部署的版本

向您 Vercel 部署 URL 上的 `/generate_caption` 端點發送 POST 請求：

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"youtube_url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"}' \
     [YOUR_VERCEL_DEPLOYMENT_URL_HERE]/generate_caption # 替換佔位符
