import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import './styles/global.css';

declare global {
  interface Window {
    __YOUREX_LOCALE__?: string;
  }
}

const initialLocale = (window.__YOUREX_LOCALE__ as 'zh-CN' | 'en') ?? 'zh-CN';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider initialLocale={initialLocale}>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
