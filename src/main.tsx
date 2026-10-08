import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import './index.css';

// Manage PWA service worker safely in production
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    registerSW({
      immediate: true,
      onRegisterError(error: unknown) {
        console.warn('PWA service worker registration issue:', error);
      },
    });
  } catch (err) {
    console.warn('PWA registerSW call failed:', err);
  }
}

let rootElement = document.getElementById('root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (mountErr) {
  console.error('PlantCare AI root mount failure:', mountErr);
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F6F9F5; color: #163A2D;">
      <div style="max-width: 440px; width: 100%; background: #FFFFFF; border: 1px solid #DCE7DF; border-radius: 24px; padding: 32px 24px; text-align: center; box-shadow: 0 12px 32px rgba(22,58,45,0.08);">
        <div style="font-size: 36px; margin-bottom: 12px;">🌿</div>
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #163A2D;">PlantCare AI</h2>
        <p style="font-size: 14px; color: #668074; margin-bottom: 20px; line-height: 1.5;">Preparing your botanical care dashboard. If the view does not load automatically, tap below.</p>
        <button onclick="window.location.reload()" style="background: #176B4D; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 14px; font-size: 14px; font-weight: 600; cursor: pointer;">
          Load PlantCare AI
        </button>
      </div>
    </div>
  `;
}

