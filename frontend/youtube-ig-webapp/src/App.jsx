// src/App.jsx

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './App.css'; // We will update this file significantly

const API_BASE_URL = 'http://localhost:5000'; // Adjust if needed

// Simple Spinner component
function Spinner() {
  return <div className="spinner"></div>;
}

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcriptData, setTranscriptData] = useState(null);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('casual');
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isLoadingCaption, setIsLoadingCaption] = useState(false);
  const [error, setError] = useState('');
  // --- NEW: Language State ---
  const [selectedLanguage, setSelectedLanguage] = useState('Cantonese'); // Default to Cantonese
  // --- END NEW ---

  const captionStyles = [
    { label: 'Casual 😎', value: 'casual' },
    { label: 'Funny 😂', value: 'funny' },
    { label: 'Serious 🧐', value: 'serious' },
    { label: 'Inspirational ✨', value: 'inspirational' },
    { label: 'Concise ✍️', value: 'concise' },
    { label: 'Enthusiastic 🎉', value: 'enthusiastic' },
    { label: 'Informative 💡', value: 'informative' },
  ];

  const languages = [
    { label: 'English', value: 'English' },
    { label: '廣東話 (Cantonese)', value: 'Cantonese' },
  ];

  const formatTranscriptForDisplay = useCallback((data) => {
    // ... (keep this function as before)
    if (!Array.isArray(data)) return 'Invalid transcript format.';
    if (data.length === 0) return 'Transcript is empty.';
    return data.map(item => `[${item.timestamp || '??:??'}] ${item.subtitle || ''}`).join('\n');
  }, []);

  const clearResults = () => {
    // ... (keep this function as before)
     setTranscriptData(null);
     setDisplayTranscript('');
     setCaption('');
     setError('');
  }

  const handleGenerateTranscript = useCallback(async (event) => {
     // ... (keep this function mostly as before)
    event.preventDefault();
    if (!youtubeUrl.trim() || !youtubeUrl.startsWith('http')) {
      setError('Please enter a valid YouTube URL (starting with http/https).');
      return;
    }
     clearResults();
    setIsLoadingTranscript(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/generate_transcript`, {
        youtube_link: youtubeUrl.trim(),
      });
      if (response.data?.transcript) {
        setTranscriptData(response.data.transcript);
        setDisplayTranscript(formatTranscriptForDisplay(response.data.transcript));
         setError('');
      } else {
        const errorMessage = response.data?.error || 'Failed to get transcript.';
        setError(`Transcript Error: ${errorMessage}`);
      }
    } catch (err) {
      console.error('[Transcript] API Error:', err);
       let errorMessage = 'An unexpected error occurred while fetching transcript.';
       if (err.response) {
         errorMessage = `Server Error (${err.response.status}): ${err.response.data?.error || 'Check server logs.'}`;
       } else if (err.request) {
         errorMessage = `Network Error: Could not connect to the backend at ${API_BASE_URL}. Is it running?`;
       } else {
         errorMessage = `Client Error: ${err.message}`;
       }
       setError(errorMessage);
    } finally {
      setIsLoadingTranscript(false);
    }
  }, [youtubeUrl, formatTranscriptForDisplay]);


  const handleGenerateCaption = useCallback(async (event) => {
     // ... (keep this function mostly as before)
    event.preventDefault();
    if (!transcriptData || transcriptData.length === 0) {
      setError('Please generate a transcript first.');
      return;
    }
     setError('');
     setCaption('');
    setIsLoadingCaption(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/generate_caption`, {
        transcript: transcriptData,
        style: selectedStyle,
        // --- NEW: Send selected language ---
        language: selectedLanguage,
        // --- END NEW ---
      });
       if (response.data?.caption) {
         setCaption(response.data.caption);
         setError('');
       } else {
         const errorMessage = response.data?.error || 'Failed to get caption.';
         setError(`Caption Error: ${errorMessage}`);
       }
    } catch (err) {
        console.error('[Caption] API Error:', err);
        let errorMessage = 'An unexpected error occurred while generating caption.';
        if (err.response) {
          errorMessage = `Server Error (${err.response.status}): ${err.response.data?.error || 'Check server logs.'}`;
        } else if (err.request) {
          errorMessage = `Network Error: Could not connect to the backend at ${API_BASE_URL}. Is it running?`;
        } else {
          errorMessage = `Client Error: ${err.message}`;
        }
        setError(errorMessage);
    } finally {
      setIsLoadingCaption(false);
    }
    // --- Update dependencies ---
  }, [transcriptData, selectedStyle, selectedLanguage]);
    // --- END Update dependencies ---

  return (
    // Use <form> elements for better accessibility and semantics
    <div className="container">
      <header className="app-header">
        <h1>YT ➡️ IG Caption Generator</h1>
        <p>Generate Instagram captions from YouTube video transcripts.</p>
      </header>

      {/* Display Global Errors */}
      {error && (
        <div className="error-banner" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step 1: URL Input */}
      <form onSubmit={handleGenerateTranscript} className="card">
        <h2>Step 1: Enter YouTube URL</h2>
        <div className="form-group">
          <label htmlFor="youtubeUrl">YouTube Video URL</label>
          <input
            type="url"
            id="youtubeUrl"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="e.g., https://www.youtube.com/watch?v=..."
            disabled={isLoadingTranscript || isLoadingCaption}
            required // Add basic HTML5 validation
            aria-describedby={error ? 'error-message' : undefined} // Link error for screen readers
          />
        </div>
        <button type="submit" disabled={isLoadingTranscript || isLoadingCaption || !youtubeUrl.trim()}>
          {isLoadingTranscript ? <><Spinner /> Generating...</> : 'Generate Transcript'}
        </button>
      </form>

      {/* Step 2: Transcript Display */}
      {(isLoadingTranscript || displayTranscript) && (
         <div className="card">
           <h2>Step 2: Generated Transcript</h2>
           <div className="output-area transcript-area">
             {isLoadingTranscript ? (
                <div className="loading-overlay">
                  <Spinner />
                  <p>Fetching and processing transcript...</p>
                </div>
             ) : (
               <textarea
                 id="transcriptOutput"
                 readOnly
                 value={displayTranscript}
                 rows={12}
                 aria-label="Generated Transcript"
               />
              )}
           </div>
         </div>
       )}


      {/* Step 3: Caption Settings & Generation */}
      {transcriptData && !isLoadingTranscript && (
        <form onSubmit={handleGenerateCaption} className="card">
          <h2>Step 3: Generate Caption</h2>
          <div className="form-row">
            {/* Language Selection */}
            <div className="form-group">
              <label htmlFor="captionLanguage">Caption Language</label>
              <select
                id="captionLanguage"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={isLoadingTranscript || isLoadingCaption}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            {/* Style Selection */}
            <div className="form-group">
              <label htmlFor="captionStyle">Caption Style</label>
              <select
                id="captionStyle"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                disabled={isLoadingTranscript || isLoadingCaption}
              >
                {captionStyles.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={isLoadingTranscript || isLoadingCaption}>
            {isLoadingCaption ? <><Spinner /> Generating...</> : 'Generate Caption'}
          </button>
        </form>
      )}

      {/* Step 4: Caption Display */}
       {(isLoadingCaption || caption) && (
         <div className="card">
           <h2>Step 4: Your Instagram Caption</h2>
           <div className="output-area caption-area">
            {isLoadingCaption ? (
               <div className="loading-overlay">
                  <Spinner />
                  <p>Generating styled caption...</p>
               </div>
            ) : (
              <textarea
                 id="captionOutput"
                 readOnly
                 value={caption}
                 rows={10}
                 aria-label="Generated Instagram Caption"
               />
            )}
            </div>
             {!isLoadingCaption && caption && (
                <button
                    className="copy-button"
                    onClick={() => navigator.clipboard.writeText(caption).then(() => alert('Caption copied to clipboard!'), () => alert('Failed to copy caption.'))}
                    title="Copy caption to clipboard"
                >
                    Copy Caption
                </button>
             )}
         </div>
       )}

       <footer className="app-footer">
            <p>Powered by Gemini API</p>
       </footer>

    </div> // End container
  );
}

export default App;