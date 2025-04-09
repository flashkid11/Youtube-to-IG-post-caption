import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import './App.css';

// --- API Base URL ---
// Keep the one appropriate for your current testing environment
const API_BASE_URL = 'http://localhost:5000/api'; // Local example
// const API_BASE_URL = '/api'; // Production example

function Spinner() {
  return <div className="spinner"></div>;
}

// --- Helper Function for Downloads (no changes needed) ---
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

// --- Helper Function to Format SRT (no changes needed, assuming console.warn is ok) ---
function formatTranscriptToSRT(transcriptData) {
    // ... (keep existing implementation) ...
    // Consider translating console.warn messages if needed for developers
    // using t() from props or context if this becomes a separate component
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


// --- Language Switcher Component ---
function LanguageSwitcher() {
  const { t, i18n } = useTranslation(); // Get both t and i18n instance

  // Determine the language code to switch TO
  const targetLang = i18n.language.startsWith('zh') ? 'en' : 'zh-Hant';

  // Determine the translation key for the target language's display name
  const targetLangDisplayKey = targetLang === 'en' ? 'current_language_en' : 'current_language_zh_hant';

  const changeLanguage = () => {
    i18n.changeLanguage(targetLang);
  };

  return (
      <div className="language-switcher">
           <button
              onClick={changeLanguage}
              // Use t() for the title attribute, providing the target language display name
              title={t('switch_language_title', { language: t(targetLangDisplayKey) })}
          >
              {/* Use t() for the button text */}
              {t(targetLangDisplayKey)}
          </button>
      </div>
  );
}


function App() {
  // --- i18n Hook ---
  const { t, i18n } = useTranslation(); // Use the hook

  // --- State ---
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcriptData, setTranscriptData] = useState(null);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [captionsList, setCaptionsList] = useState([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('casual');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  // Note: selectedLanguage for the *backend* API call remains 'English' or 'Cantonese'
  const [apiLanguage, setApiLanguage] = useState('Cantonese');
  const [copySuccess, setCopySuccess] = useState(false);
  const [numCaptions, setNumCaptions] = useState(3);

  // --- Define styles and languages for dropdowns ---
  // Labels will be translated dynamically in the JSX mapping below
  const captionStyles = [
    { value: 'casual', translationKey: 'style_casual' },
    { value: 'informative', translationKey: 'style_informative' }
  ];
  const languages = [ // API value vs Display Label translation key
    { value: 'English', translationKey: 'lang_english' },
    { value: 'Cantonese', translationKey: 'lang_cantonese' }
  ];
  const whatsappNumber = "YOUR_WHATSAPP_NUMBER_HERE"; // Keep placeholder or update
  const whatsappLink = `https://wa.me/${whatsappNumber}`;
  const captionCountOptions = [1, 3, 5];

  // --- Callbacks ---
  const formatTranscriptForDisplay = useCallback((data) => {
    // Use t() for fallback messages
    if (!Array.isArray(data)) return t('error_transcript_format');
    if (data.length === 0) return t('empty_caption_placeholder'); // Or a specific key if needed
    return data
      .map(item => `[${item?.timestamp || '??:??:??.???'}]: ${item?.subtitle?.trim() || t('empty_caption_placeholder')}`)
      .join('\n');
  }, [t]); // Add t as dependency

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
      setError(t('error_invalid_url'));
      return;
    }
    clearAllResults();
    setIsLoading(true);
    setLoadingMessage(t('loading_analyzing'));

    try {
      const response = await axios.post(`${API_BASE_URL}/generate_transcript`, { youtube_link: youtubeUrl.trim() });
      if (response.data?.transcript && Array.isArray(response.data.transcript)) {
        setTranscriptData(response.data.transcript);
        // Use the callback which now uses t()
        setDisplayTranscript(formatTranscriptForDisplay(response.data.transcript));
        setError('');
      } else {
        const errorMsg = response.data?.error || t('error_transcript_format');
        setError(`${t('error_fetching_transcript')}: ${errorMsg}`);
        setTranscriptData(null);
        setDisplayTranscript('');
      }
    } catch (err) {
      console.error('[Transcript] API Error:', err);
      let errorMessage = t('error_fetching_transcript');
      if (err.response) {
          errorMessage = t('error_server', {status: err.response.status, message: err.response.data?.error || 'Check logs.'})
      } else if (err.request) {
          errorMessage = t('error_network');
      } else {
          errorMessage = t('error_client', { message: err.message });
      }
      setError(errorMessage);
      setTranscriptData(null);
      setDisplayTranscript('');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [youtubeUrl, formatTranscriptForDisplay, t]); // Add t dependency

  const handleDownloadTxt = useCallback(() => {
    if (!transcriptData || transcriptData.length === 0) {
      alert(t('alert_no_transcript_download'));
      return;
    }
    const txtContent = transcriptData
      .map(item => `[${item?.timestamp || '??:??:??.???'}]: ${item?.subtitle?.trim() || ''}`)
      .join('\n');
    downloadFile('transcript.txt', txtContent, 'text/plain;charset=utf-8');
  }, [transcriptData, t]); // Add t dependency

  const handleDownloadSrt = useCallback(() => {
    if (!transcriptData || transcriptData.length === 0) {
      alert(t('alert_no_transcript_download'));
      return;
    }
    try {
      const srtContent = formatTranscriptToSRT(transcriptData); // Assuming this doesn't need t
      if (!srtContent) {
        alert(t('alert_srt_format_error'));
        return;
      }
      downloadFile('transcript.srt', srtContent, 'application/x-subrip;charset=utf-8');
    } catch (err) {
      console.error("Error generating SRT:", err);
      alert(t('alert_srt_generate_error', { message: err.message }));
    }
  }, [transcriptData, t]); // Add t dependency

  const handleGenerateCaption = useCallback(async (event) => {
    event?.preventDefault();
    if (!transcriptData || transcriptData.length === 0) {
      setError(t('error_generate_transcript_first'));
      return;
    }
    setError('');
    setCaptionsList([]);
    setSelectedCaptionIndex(null);
    setCopySuccess(false);
    setIsLoading(true);
    // Use t for loading message interpolation
    setLoadingMessage(t('loading_generating_captions', {
        count: numCaptions,
        language: apiLanguage, // Language sent to backend
        style: selectedStyle
    }));

    try {
      const response = await axios.post(`${API_BASE_URL}/generate_caption`, {
        transcript: transcriptData,
        style: selectedStyle,
        language: apiLanguage, // Send consistent value to backend
        num_captions: numCaptions,
      });

      if (response.data?.captions && Array.isArray(response.data.captions)) {
        setCaptionsList(response.data.captions);
        if (response.data.captions.length > 0) setSelectedCaptionIndex(0);
        setError('');
      } else {
        const errorMsg = response.data?.error || t('error_caption_format');
        setError(`${t('error_fetching_captions')}: ${errorMsg}`);
        setCaptionsList([]);
      }
    } catch (err) {
      console.error('[Caption] API Error:', err);
      let errorMessage = t('error_fetching_captions');
       if (err.response) {
          errorMessage = t('error_server', {status: err.response.status, message: err.response.data?.error || 'Check logs.'})
      } else if (err.request) {
          errorMessage = t('error_network');
      } else {
          errorMessage = t('error_client', { message: err.message });
      }
      setError(errorMessage);
      setCaptionsList([]);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [transcriptData, selectedStyle, apiLanguage, numCaptions, t]); // Add t dependency

  const handleCopyToClipboard = () => {
    if (captionsList.length === 0 || selectedCaptionIndex === null || selectedCaptionIndex >= captionsList.length) return;
    const captionToCopy = captionsList[selectedCaptionIndex];
    navigator.clipboard.writeText(captionToCopy).then(
      () => { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2500); },
      () => { alert(t('alert_copy_fail')); setCopySuccess(false); }
    );
  };


  // --- Render JSX ---
  return (
    <>
      {/* Background remains the same */}
      <div className="bubbles-background">
          {/* ... bubbles ... */}
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
      </div>

      <header className="site-header">
        {/* Updated header content for flex layout */}
        <div className="header-content">
          <img src="/logo.png" alt={t('appTitle')} className="company-logo" />
          <LanguageSwitcher /> {/* Add the switcher component */}
        </div>
      </header>

      {isLoading && (
        <div className="loading-indicator" aria-live="assertive">
          <Spinner />
          <span>{loadingMessage || t('loading_processing')}</span> {/* Translate fallback */}
        </div>
      )}

      <main className="container" aria-busy={isLoading}>
        {error && (
          <div className="error-banner" role="alert">
            <span className="error-icon" aria-hidden="true">⚠️</span> {error}
          </div>
        )}

        {/* --- Step 1 Form --- */}
        <form onSubmit={handleGenerateTranscript} className="card card-step-1">
          <h2><span className="step-number">1</span> {t('step1_heading')}</h2>
          <div className="form-group">
            <label htmlFor="youtubeUrl">{t('youtube_url_label')}</label>
            <input
              type="url"
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder={t('youtube_url_placeholder')}
              disabled={isLoading}
              required
              aria-required="true"
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>
          <button type="submit" disabled={isLoading || !youtubeUrl.trim()}>
            {t('generate_transcript_button')}
          </button>
        </form>

        {/* --- Step 2 Transcript Display --- */}
        {transcriptData && !isLoading && (
          <div className="card card-step-2">
            <h2><span className="step-number">2</span> {t('step2_heading')}</h2>
            <div className="output-area transcript-area">
              <textarea
                id="transcriptOutput"
                readOnly
                value={displayTranscript}
                rows={12}
                aria-label={t('transcript_area_label')}
                placeholder={t('transcript_area_placeholder')}
              />
            </div>
            <div className="download-buttons-container">
              <button onClick={handleDownloadTxt} disabled={isLoading} className="download-button txt-button">
                <span role="img" aria-hidden="true">💾</span> {t('download_txt_button')}
              </button>
              <button onClick={handleDownloadSrt} disabled={isLoading} className="download-button srt-button">
                <span role="img" aria-hidden="true">🎬</span> {t('download_srt_button')}
              </button>
            </div>
          </div>
        )}

        {/* --- Prompt Engineering Showcase --- */}
         {transcriptData && !isLoading && (
            <div className="card prompt-elements-card">
                <h2><span role="img" aria-hidden="true">💡</span> {t('caption_factors_heading')}</h2>
                <p>{t('caption_factors_intro')}</p>
                <ul>
                    {/* Note: We use apiLanguage state for the value sent to backend */}
                    <li><strong>{t('factor_language')}:</strong> {languages.find(l => l.value === apiLanguage)?.translationKey ? t(languages.find(l => l.value === apiLanguage)?.translationKey) : apiLanguage}</li>
                    <li><strong>{t('factor_style')}:</strong> {captionStyles.find(s => s.value === selectedStyle)?.translationKey ? t(captionStyles.find(s => s.value === selectedStyle)?.translationKey) : selectedStyle}</li>
                    <li><strong>{t('factor_number')}:</strong> {t('factor_number')}: {numCaptions} variations.</li>
                    <li><strong>{t('factor_content')}:</strong> {t('factor_content')}: Derived from the transcript above.</li>
                </ul>
                <div className="prompt-engineering-showcase">
                    <h3><span role="img" aria-hidden="true">🛠️</span> {t('prompt_showcase_heading')}</h3>
                    {/* Use dangerouslySetInnerHTML for the <strong> tags in the intro */}
                    <p dangerouslySetInnerHTML={{ __html: t('prompt_showcase_intro') }} />
                     <ul>
                        {/* Translate list items using interpolation */}
                        <li dangerouslySetInnerHTML={{ __html: t('prompt_showcase_item1', { numCaptions: numCaptions, selectedLanguage: apiLanguage, selectedStyle: selectedStyle }) }} />
                        <li dangerouslySetInnerHTML={{ __html: t('prompt_showcase_item2') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('prompt_showcase_item3') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('prompt_showcase_item4') }} />
                    </ul>
                    <p className="prompt-impact" dangerouslySetInnerHTML={{ __html: t('prompt_showcase_impact') }} />
                </div>
            </div>
         )}

        {/* --- Step 3 Caption Generation Form --- */}
        {transcriptData && !isLoading && (
          <form onSubmit={handleGenerateCaption} className="card card-step-3">
            <h2><span className="step-number">3</span> {t('step3_heading')}</h2>
            <p>{t('step3_intro')}</p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="captionLanguage">{t('select_language_label')}</label>
                <select
                  id="captionLanguage"
                  value={apiLanguage} // Control the value sent to API
                  onChange={(e) => { setCaptionsList([]); setSelectedCaptionIndex(null); setApiLanguage(e.target.value); }}
                  disabled={isLoading}
                >
                  {languages.map(lang => (
                    // Use the translation key for the displayed option text
                    <option key={lang.value} value={lang.value}>
                        {t(lang.translationKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="captionStyle">{t('select_style_label')}</label>
                <select
                  id="captionStyle"
                  value={selectedStyle}
                  onChange={(e) => { setCaptionsList([]); setSelectedCaptionIndex(null); setSelectedStyle(e.target.value); }}
                  disabled={isLoading}
                >
                  {captionStyles.map(style => (
                     // Use the translation key for the displayed option text
                    <option key={style.value} value={style.value}>
                        {t(style.translationKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="numCaptions">{t('select_variations_label')}</label>
                <select
                  id="numCaptions"
                  value={numCaptions}
                  onChange={(e) => { setCaptionsList([]); setSelectedCaptionIndex(null); setNumCaptions(Number(e.target.value)); }}
                  disabled={isLoading}
                >
                  {captionCountOptions.map(count => <option key={count} value={count}>{count}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={isLoading}>{t('generate_captions_button')}</button>
          </form>
        )}

        {/* --- Step 4 Caption Selection --- */}
        {(isLoading && loadingMessage.includes('caption')) || captionsList.length > 0 ? (
          <div className="card card-step-4">
            <h2><span className="step-number">4</span> {t('step4_heading')}</h2>
            {isLoading && loadingMessage.includes('caption') && (
              <div className="loading-overlay captions-loading-overlay">
                <Spinner /> <p>{loadingMessage}</p>
              </div>
            )}
            {!isLoading && captionsList.length > 0 && (
              <div className="captions-list" role="radiogroup" aria-label={t('caption_aria_label')}>
                <p>{t('caption_select_intro')}</p>
                {captionsList.map((captionOption, index) => (
                  <div key={index} className={`caption-option ${selectedCaptionIndex === index ? 'selected' : ''}`}>
                    <label htmlFor={`caption-${index}`}>
                      <input
                        type="radio"
                        id={`caption-${index}`}
                        name="caption-choice"
                        value={index}
                        checked={selectedCaptionIndex === index}
                        onChange={() => setSelectedCaptionIndex(index)}
                        disabled={isLoading}
                      />
                      <span className="caption-variation-number">{index + 1}.</span>
                      <pre className="caption-text">{captionOption || t('empty_caption_placeholder')}</pre>
                    </label>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && captionsList.length > 0 && (
              <div className="copy-container">
                <button
                  className="copy-button"
                  onClick={handleCopyToClipboard}
                  disabled={selectedCaptionIndex === null}
                  title={t('copy_button_title')}
                  aria-label={t('copy_button_title')}
                >
                  <span role="img" aria-hidden="true">📋</span> {t('copy_button')}
                </button>
                {copySuccess && <span className="copy-feedback" role="status">{t('copy_success_message')}</span>}
              </div>
            )}
          </div>
        ) : null}

        {/* Footer Placeholder */}
        <div className="app-footer-placeholder"></div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <img src="/logo.png" alt="DotAI" className="footer-logo" />
          <span className="footer-company-name">DotAI</span> |
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            {t('footer_contact_us')}
          </a>
        </div>
      </footer>
    </>
  );
}

export default App;