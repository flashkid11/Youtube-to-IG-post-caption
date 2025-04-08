import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

function Spinner() {
  return <div className="spinner"></div>;
}

// --- Helper Function for Downloads ---
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Helper Function to Format SRT ---
function formatTranscriptToSRT(transcriptData) {
  let srtContent = '';
  let sequence = 1;

  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return null;
    // Handle HH:MM:SS.mmm, MM:SS.mmm, or MM:SS
    const fullRegex = /^(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})$/;
    const shortRegex = /^(\d{2}):(\d{2})$/;
    let match = timeStr.match(fullRegex);
    if (match) {
      const [, hours = '00', minutes, seconds, milliseconds] = match;
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      const s = parseInt(seconds, 10);
      const ms = parseInt(milliseconds, 10);
      if (m >= 60 || s >= 60) return null;
      return h * 3600 + m * 60 + s + ms / 1000;
    }
    match = timeStr.match(shortRegex);
    if (match) {
      const [, minutes, seconds] = match;
      const m = parseInt(minutes, 10);
      const s = parseInt(seconds, 10);
      if (m >= 60 || s >= 60) return null;
      return m * 60 + s;
    }
    console.warn(`Invalid timestamp format: ${timeStr}`);
    return null;
  };

  const formatSecondsToSRTTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) seconds = 0;
    const totalMs = Math.round(seconds * 1000);
    const ms = totalMs % 1000;
    const totalSec = Math.floor(totalMs / 1000);
    const s = totalSec % 60;
    const totalMin = Math.floor(totalSec / 60);
    const m = totalMin % 60;
    const h = Math.floor(totalMin / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  for (let i = 0; i < transcriptData.length; i++) {
    const currentItem = transcriptData[i];
    const nextItem = transcriptData[i + 1];

    const startTimeStr = currentItem?.timestamp;
    const subtitleText = currentItem?.subtitle?.trim() || '';

    const startTimeSeconds = parseTimeToSeconds(startTimeStr);
    if (startTimeSeconds === null || !subtitleText) {
      console.warn(`Skipping SRT entry due to invalid time or empty subtitle:`, currentItem);
      continue;
    }

    let endTimeSeconds;
    const nextStartTimeSeconds = nextItem ? parseTimeToSeconds(nextItem.timestamp) : null;
    if (nextStartTimeSeconds !== null && nextStartTimeSeconds > startTimeSeconds) {
      endTimeSeconds = nextStartTimeSeconds - 0.001; // Slight offset to avoid overlap
    } else {
      endTimeSeconds = startTimeSeconds + 5.0; // Default 5-second duration
    }
    if (endTimeSeconds <= startTimeSeconds) {
      endTimeSeconds = startTimeSeconds + 0.5; // Minimum duration
    }

    const srtStartTime = formatSecondsToSRTTime(startTimeSeconds);
    const srtEndTime = formatSecondsToSRTTime(endTimeSeconds);

    srtContent += `${sequence}\n`;
    srtContent += `${srtStartTime} --> ${srtEndTime}\n`;
    srtContent += `${subtitleText}\n\n`;
    sequence++;
  }

  return srtContent;
}

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcriptData, setTranscriptData] = useState(null);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [captionsList, setCaptionsList] = useState([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('casual');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Cantonese');
  const [copySuccess, setCopySuccess] = useState(false);
  const [numCaptions, setNumCaptions] = useState(3);

  const captionStyles = [{ label: 'Casual 😎', value: 'casual' }, { label: 'Informative 💡', value: 'informative' }];
  const languages = [{ label: 'English', value: 'English' }, { label: '廣東話 (Cantonese)', value: 'Cantonese' }];
  const whatsappNumber = "YOUR_WHATSAPP_NUMBER_HERE";
  const whatsappLink = `https://wa.me/${whatsappNumber}`;
  const captionCountOptions = [1, 3, 5];

  const formatTranscriptForDisplay = useCallback((data) => {
    if (!Array.isArray(data)) return 'Invalid transcript format.';
    if (data.length === 0) return 'Transcript is empty.';
    return data
      .map(item => `[${item?.timestamp || '??:??:??.???'}]: ${item?.subtitle?.trim() || '(empty)'}`)
      .join('\n');
  }, []);

  const clearAllResults = () => {
    setTranscriptData(null);
    setDisplayTranscript('');
    setCaptionsList([]);
    setSelectedCaptionIndex(null);
    setError('');
    setCopySuccess(false);
    setLoadingMessage('');
  };

  const handleGenerateTranscript = useCallback(async (event) => {
    event?.preventDefault();
    if (!youtubeUrl.trim() || !youtubeUrl.startsWith('http')) {
      setError('Please enter a valid YouTube URL.');
      return;
    }
    clearAllResults();
    setIsLoading(true);
    setLoadingMessage('Analyzing video & generating transcript...');

    try {
      const response = await axios.post(`${API_BASE_URL}/generate_transcript`, { youtube_link: youtubeUrl.trim() });
      if (response.data?.transcript && Array.isArray(response.data.transcript)) {
        setTranscriptData(response.data.transcript);
        setDisplayTranscript(formatTranscriptForDisplay(response.data.transcript));
        setError('');
      } else {
        const errorMsg = response.data?.error || 'Received unexpected data format for transcript.';
        setError(`Transcript Error: ${errorMsg}`);
        setTranscriptData(null);
        setDisplayTranscript('');
      }
    } catch (err) {
      console.error('[Transcript] API Error:', err);
      let errorMessage = 'Error fetching transcript.';
      if (err.response) errorMessage = `Server Error (${err.response.status}): ${err.response.data?.error || 'Check logs.'}`;
      else if (err.request) errorMessage = `Network Error connecting to ${API_BASE_URL}.`;
      else errorMessage = `Client Error: ${err.message}`;
      setError(errorMessage);
      setTranscriptData(null);
      setDisplayTranscript('');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [youtubeUrl, formatTranscriptForDisplay]);

  const handleDownloadTxt = useCallback(() => {
    if (!transcriptData || transcriptData.length === 0) {
      alert('No transcript data to download.');
      return;
    }
    const txtContent = transcriptData
      .map(item => `[${item?.timestamp || '??:??:??.???'}]: ${item?.subtitle?.trim() || ''}`)
      .join('\n');
    downloadFile('transcript.txt', txtContent, 'text/plain;charset=utf-8');
  }, [transcriptData]);

  const handleDownloadSrt = useCallback(() => {
    if (!transcriptData || transcriptData.length === 0) {
      alert('No transcript data to download.');
      return;
    }
    try {
      const srtContent = formatTranscriptToSRT(transcriptData);
      if (!srtContent) {
        alert('Could not format transcript to SRT. Please check transcript data.');
        return;
      }
      downloadFile('transcript.srt', srtContent, 'application/x-subrip;charset=utf-8');
    } catch (err) {
      console.error("Error generating SRT:", err);
      alert(`Failed to generate SRT file: ${err.message}`);
    }
  }, [transcriptData]);

  const handleGenerateCaption = useCallback(async (event) => {
    event?.preventDefault();
    if (!transcriptData || transcriptData.length === 0) {
      setError('Generate transcript first.');
      return;
    }
    setError('');
    setCaptionsList([]);
    setSelectedCaptionIndex(null);
    setCopySuccess(false);
    setIsLoading(true);
    setLoadingMessage(`Generating ${numCaptions} ${selectedLanguage} captions (${selectedStyle})...`);

    try {
      const response = await axios.post(`${API_BASE_URL}/generate_caption`, {
        transcript: transcriptData,
        style: selectedStyle,
        language: selectedLanguage,
        num_captions: numCaptions,
      });

      if (response.data?.captions && Array.isArray(response.data.captions)) {
        setCaptionsList(response.data.captions);
        if (response.data.captions.length > 0) setSelectedCaptionIndex(0);
        setError('');
      } else {
        const errorMsg = response.data?.error || 'Received invalid data format for captions.';
        setError(`Caption Error: ${errorMsg}`);
        setCaptionsList([]);
      }
    } catch (err) {
      console.error('[Caption] API Error:', err);
      let errorMessage = 'Error generating captions.';
      if (err.response) errorMessage = `Server Error (${err.response.status}): ${err.response.data?.error || 'Check logs.'}`;
      else if (err.request) errorMessage = `Network Error connecting to ${API_BASE_URL}.`;
      else errorMessage = `Client Error: ${err.message}`;
      setError(errorMessage);
      setCaptionsList([]);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [transcriptData, selectedStyle, selectedLanguage, numCaptions]);

  const handleCopyToClipboard = () => {
    if (captionsList.length === 0 || selectedCaptionIndex === null || selectedCaptionIndex >= captionsList.length) return;
    const captionToCopy = captionsList[selectedCaptionIndex];
    navigator.clipboard.writeText(captionToCopy).then(
      () => { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2500); },
      () => { alert('Failed to copy caption.'); setCopySuccess(false); }
    );
  };

  return (
    <>
      <div className="bubbles-background">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        {/* Add more bubble divs if you want more bubbles */}
      </div>
      <header className="site-header">
        <div className="header-content"> <img src="/logo.png" alt="DotAI Logo" className="company-logo" /> </div>
      </header>

      {isLoading && ( <div className="loading-indicator" aria-live="assertive"> <Spinner /> <span>{loadingMessage || 'Processing...'}</span> </div> )}

      <main className="container" aria-busy={isLoading}>
        {error && ( <div className="error-banner" role="alert"> <span className="error-icon" aria-hidden="true">⚠️</span> {error} </div> )}

        <form onSubmit={handleGenerateTranscript} className="card card-step-1">
          <h2><span className="step-number">1</span> Enter YouTube URL</h2>
          <div className="form-group">
            <label htmlFor="youtubeUrl">YouTube Video URL</label>
            <input type="url" id="youtubeUrl" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube link here..." disabled={isLoading} required aria-required="true" aria-describedby={error ? 'error-message' : undefined} />
          </div>
          <button type="submit" disabled={isLoading || !youtubeUrl.trim()}>📄 Generate Transcript</button>
        </form>

        {transcriptData && !isLoading && (
          <div className="card card-step-2">
            <h2><span className="step-number">2</span> Generated Transcript</h2>
            <div className="output-area transcript-area">
              <textarea id="transcriptOutput" readOnly value={displayTranscript} rows={12} aria-label="Generated Transcript" placeholder="Transcript text." />
            </div>
            <div className="download-buttons-container">
              <button onClick={handleDownloadTxt} disabled={isLoading} className="download-button txt-button">
                <span role="img" aria-hidden="true">💾</span> Download .txt
              </button>
              <button onClick={handleDownloadSrt} disabled={isLoading} className="download-button srt-button">
                <span role="img" aria-hidden="true">🎬</span> Download .srt
              </button>
            </div>
          </div>
        )}

        {transcriptData && !isLoading && (
          <div className="card prompt-elements-card">
            <h2><span role="img" aria-hidden="true">💡</span> Caption Generation Factors</h2>
            <p>The captions generated below are influenced by:</p>
            <ul>
              <li><strong>Language:</strong> {languages.find(l => l.value === selectedLanguage)?.label || selectedLanguage}</li>
              <li><strong>Style:</strong> {captionStyles.find(s => s.value === selectedStyle)?.label || selectedStyle}</li>
              <li><strong>Number:</strong> Requesting {numCaptions} variations.</li>
              <li><strong>Content:</strong> Derived from the transcript above.</li>
            </ul>
            <div className="prompt-engineering-showcase">
              <h3><span role="img" aria-hidden="true">🛠️</span> How DotAI Crafted the AI Prompt</h3>
              <p>Our team applied advanced <strong>prompt engineering skills</strong> to ensure high-quality Instagram captions:</p>
              <ul>
                <li><strong>Precision:</strong> Specified exact requirements (e.g., {numCaptions} captions in {selectedLanguage} with a {selectedStyle} tone) to eliminate ambiguity.</li>
                <li><strong>Contextual Relevance:</strong> Instructed the AI to distill the transcript’s essence, ensuring captions reflect the video’s core message.</li>
                <li><strong>Engagement Focus:</strong> Directed the AI to create compelling hooks and calls-to-action, boosting likes, comments, and shares.</li>
                <li><strong>Format Control:</strong> Enforced a strict JSON array output, streamlining integration with this app.</li>
              </ul>
              <p className="prompt-impact"><strong>Impact:</strong> These techniques result in concise, engaging, and platform-ready captions tailored to your choices, saving you time and enhancing your social media presence!</p>
            </div>
          </div>
        )}

        {transcriptData && !isLoading && (
          <form onSubmit={handleGenerateCaption} className="card card-step-3">
            <h2><span className="step-number">3</span> Generate Captions</h2>
            <p>Select language, style, and how many caption options you want.</p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="captionLanguage">Language</label>
                <select id="captionLanguage" value={selectedLanguage} onChange={(e) => { setCaptionsList([]); setSelectedCaptionIndex(null); setSelectedLanguage(e.target.value); }} disabled={isLoading}>
                  {languages.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="captionStyle">Style</label>
                <select id="captionStyle" value={selectedStyle} onChange={(e) => { setCaptionsList([]); setSelectedCaptionIndex(null); setSelectedStyle(e.target.value); }} disabled={isLoading}>
                  {captionStyles.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="numCaptions">Number of Variations</label>
                <select id="numCaptions" value={numCaptions} onChange={(e) => { setCaptionsList([]); setSelectedCaptionIndex(null); setNumCaptions(Number(e.target.value)); }} disabled={isLoading}>
                  {captionCountOptions.map(count => <option key={count} value={count}>{count}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={isLoading}>✍️ Generate Captions</button>
          </form>
        )}

        {(isLoading && loadingMessage.includes('caption')) || captionsList.length > 0 ? (
          <div className="card card-step-4">
            <h2><span className="step-number">4</span> Choose Your Caption</h2>
            {isLoading && loadingMessage.includes('caption') && (
              <div className="loading-overlay captions-loading-overlay"> <Spinner /> <p>{loadingMessage}</p> </div>
            )}
            {!isLoading && captionsList.length > 0 && (
              <div className="captions-list" role="radiogroup" aria-label="Select a caption variation">
                <p>Select your preferred caption:</p>
                {captionsList.map((captionOption, index) => (
                  <div key={index} className={`caption-option ${selectedCaptionIndex === index ? 'selected' : ''}`}>
                    <label htmlFor={`caption-${index}`}>
                      <input type="radio" id={`caption-${index}`} name="caption-choice" value={index} checked={selectedCaptionIndex === index} onChange={() => setSelectedCaptionIndex(index)} disabled={isLoading} />
                      <span className="caption-variation-number">{index + 1}.</span>
                      <pre className="caption-text">{captionOption || '(Empty caption generated)'}</pre>
                    </label>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && captionsList.length > 0 && (
              <div className="copy-container">
                <button className="copy-button" onClick={handleCopyToClipboard} disabled={selectedCaptionIndex === null} title="Copy selected caption" aria-label="Copy selected caption">
                  <span role="img" aria-hidden="true">📋</span> Copy Selection
                </button>
                {copySuccess && <span className="copy-feedback" role="status">Copied!</span>}
              </div>
            )}
          </div>
        ) : null}

        <div className="app-footer-placeholder"></div>
      </main>

      <footer className="site-footer">
        <div className="footer-content"> <img src="/logo.png" alt="DotAI" className="footer-logo" /> <span className="footer-company-name">DotAI</span> | <a href={whatsappLink} target="_blank" rel="noopener noreferrer">Contact Us</a> </div>
      </footer>
    </>
  );
}

export default App;