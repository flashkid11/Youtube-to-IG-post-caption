import React, { Suspense } from 'react'; // Import Suspense
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n'; // Import the i18n configuration

// Simple loading fallback component
function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Loading />}> {/* Wrap App in Suspense */}
      <App />
    </Suspense>
  </React.StrictMode>,
);