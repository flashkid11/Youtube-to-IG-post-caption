<div align="center">

  <!-- Main Title -->
  <h1>🎬 YouTube to IG Caption Generator 📝</h1>
  <p><em>Automatically create Instagram captions from YouTube videos using AI ✨</em></p>

  <!-- Links / Badges -->
  <p>
    Built with:
     <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" title="YouTube">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg" width="25" alt="YouTube Logo">
     </a> 
     <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" title="Instagram">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" width="25" alt="Instagram Logo">
     </a> 
     <a href="https://openai.com/" target="_blank" rel="noopener noreferrer" title="OpenAI">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/openai.svg" width="25" alt="OpenAI Logo">
     </a> 
     <a href="https://flask.palletsprojects.com/" target="_blank" rel="noopener noreferrer" title="Flask">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/flask.svg" width="25" alt="Flask Logo">
     </a> 
     <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" title="Vercel">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/vercel.svg" width="25" alt="Vercel Logo">
     </a>
  </p>

</div>

--- <!-- Horizontal Rule to separate banner from main content -->

## Overview
<!-- Rest of your README content -->

---

[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat&logo=vercel)]([https://dot-ai-youtube-to-ig-post.vercel.app/]) <!-- Replace placeholder -->

A Flask web application that automatically generates Instagram post captions based on the content (transcript, title, description) of a YouTube video using the OpenAI API.

**🚀 Live Demo:** **[https://dot-ai-youtube-to-ig-post.vercel.app/]**

## Overview

This Flask web application leverages the power of **Google Gemini** to automatically process YouTube videos. It provides two main functionalities:

1.  **Transcript Generation:** Takes a YouTube video URL and uses Gemini's multimodal capabilities to generate an accurate transcript with timestamps. The transcript can be returned as structured JSON or downloaded as a standard `.srt` subtitle file.
2.  **Instagram Caption Generation:** Takes the generated transcript data, a desired style (e.g., "Casual", "Formal"), language (English/Cantonese), and number of variations, then uses Gemini to craft multiple engaging Instagram caption options.

This tool streamlines content creation by turning video content into usable text formats for subtitles and social media.

## Features

*   **Gemini-Powered Transcription:** Utilizes Google Gemini (Flash/Pro models) for generating transcripts with timestamps directly from YouTube video URLs.
*   **Multiple Output Formats:**
    *   Get transcripts as structured JSON.
    *   Download transcripts as `.srt` files suitable for video players.
*   **Multi-Caption Generation:** Generate 1-5 distinct Instagram caption variations based on the transcript.
*   **Customizable Captions:** Specify caption style (e.g., "Funny", "Informative") and language ("English" or "Cantonese").
*   **Robust Parsing:** Includes logic to handle potential variations in Gemini's JSON output format.
*   **Simple API:** Clear endpoints (`/api/generate_transcript`, `/api/generate_caption`) for integration.
*   **Deployable:** Ready for deployment on platforms like Vercel (includes extensive logging for debugging).

## Technology Stack

*   **Backend:** Python 3.11+
*   **Framework:** Flask
*   **AI Engine:** Google Gemini (`google-generativeai`)
*   **Deployment:** Vercel / Gunicorn

**(Note:** Previous dependencies like `openai` and `youtube-transcript-api` are no longer used.)

## Prerequisites

*   **Python:** Version 3.11 or higher.
*   **pip:** Python package installer.
*   **Git:** For cloning the repository.
*   **API Key:**
    *   **Google Gemini API Key:** You need an API key enabled for the Gemini API. Obtain this from [Google AI Studio](https://aistudio.google.com/app/apikey) or your Google Cloud Console project.
    *   **(Note:** A YouTube Data API key is **no longer required** by this script.)

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
    *(Ensure your `requirements.txt` file reflects the new script's imports: `Flask`, `Flask-Cors`, `python-dotenv`, `google-generativeai`, `gunicorn`)*
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

1.  Create a file named `.env` in the root directory of the project (for local development).
2.  Add your Gemini API key to the `.env` file:
    ```dotenv
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
    Replace `your_gemini_api_key_here` with your actual key.
    **Note:** For deployment (e.g., Vercel), set `GEMINI_API_KEY` as an Environment Variable in the platform's settings.

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
     [https://dot-ai-youtube-to-ig-post.vercel.app/]/generate_caption # Replace placeholder
```



<div align="center">

  <!-- Main Title -->
  <h1>🎬 YouTube to IG Caption Generator 📝</h1>
  <p><em>透過 AI 從 YouTube 影片產生 Instagram 貼文內容 ✨</em></p>

  <!-- Links / Badges -->
  <p>
    Built with:
     <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" title="YouTube">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg" width="25" alt="YouTube Logo">
     </a> 
     <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" title="Instagram">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" width="25" alt="Instagram Logo">
     </a> 
     <a href="https://openai.com/" target="_blank" rel="noopener noreferrer" title="OpenAI">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/openai.svg" width="25" alt="OpenAI Logo">
     </a> 
     <a href="https://flask.palletsprojects.com/" target="_blank" rel="noopener noreferrer" title="Flask">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/flask.svg" width="25" alt="Flask Logo">
     </a> 
     <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" title="Vercel">
       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/vercel.svg" width="25" alt="Vercel Logo">
     </a>

</div>

--- <!-- Horizontal Rule to separate banner from main content -->

## Overview
<!-- Rest of your README content -->

---

[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat&logo=vercel)]([https://dot-ai-youtube-to-ig-post.vercel.app/]) <!-- 替換佔位符 -->

一個 Flask 網路應用程式，使用 OpenAI API，根據 YouTube 影片的內容（字幕、標題、描述）自動產生 Instagram 貼文標題。

**🚀 線上演示 (Live Demo):** **[https://dot-ai-youtube-to-ig-post.vercel.app/]**

## 概述

這個 Flask 網路應用程式利用 Google Gemini 的強大功能來自動處理 YouTube 影片。它提供兩個主要功能：

1.  字幕稿生成： 輸入 YouTube 影片 URL，使用 Gemini 的多模態能力產生帶有時間戳記的準確字幕稿。字幕稿可以以結構化的 JSON 格式回傳，或下載為標準的 .srt 字幕檔。
2.  Instagram 標題生成： 輸入先前產生的字幕稿資料、期望的風格（例如「休閒」、「正式」）、語言（英文/粵語）以及數量，然後使用 Gemini 來產生多個引人入勝的 Instagram 貼文標題選項。

此工具將影片內容轉換為可用於字幕和社交媒體的文字格式，從而簡化內容創作流程。

## 功能特色

*   Gemini 驅動的字幕生成： 利用 Google Gemini (Flash/Pro 模型) 直接從 YouTube 影片 URL 產生帶時間戳記的字幕稿。
*   多種輸出格式：
  *  以結構化 JSON 格式取得字幕稿。
  *   下載適用於影片播放器的 .srt 格式字幕稿。
*   多標題生成： 根據字幕稿生成 1-5 個不同的 Instagram 標題變體。
*   可自訂標題： 指定標題風格（例如「有趣」、「資訊性」）和語言（「English」或「Cantonese」）。
*   穩健的解析： 包含處理 Gemini JSON 輸出格式潛在變化的邏輯。
*   簡單 API： 清晰的端點 (/api/generate_transcript, /api/generate_caption) 便於整合。
*   可部署： 已準備好部署到 Vercel 等平台（包含詳細的日誌記錄以便除錯）。

## 技術堆疊

*   **後端 (Backend): Python 3.11+
*   **框架 (Framework):** Flask
*   **AI 引擎 (AI Engine): Google Gemini (google-generativeai)
*   **部署 (Deployment): Vercel / Gunicorn

## 先決條件

*   **Python:** 版本 3.11 或更高。
*   **pip:** Python 套件安裝程式。
*   **Git:** 用於複製儲存庫。
*   **API 金鑰 (API Keys):**
    *   Google Gemini API Key: 您需要一個已啟用 Gemini API 的 API 金鑰。可以從 Google AI Studio 或您的 Google Cloud Console 專案取得。
    *   **(注意： 此腳本不再需要 YouTube Data API 金鑰。)

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
2.  將您的 Gemini API 金鑰加入 .env 檔案中：
    ```dotenv
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
    將 `your_gemini_api_key_here` 替換成您實際的金鑰。
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
     [https://dot-ai-youtube-to-ig-post.vercel.app/]/generate_caption # 替換佔位符
