import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider, useTranslation, type Locale } from './i18n';
import { useMessageListener } from './hooks/useVSCode';
import { Certificate } from './components/Certificate';
import type { ExtensionMessage } from './types/messages';
import './styles/global.css';

declare global {
  interface Window {
    __YOUREX_LOCALE__?: string;
  }
}

const initialLocale = (window.__YOUREX_LOCALE__ as Locale) ?? 'zh-CN';

function CertificateApp() {
  const { setLocale } = useTranslation();
  useMessageListener((msg: unknown) => {
    const data = msg as ExtensionMessage;
    if (data.command === 'localeChanged') {
      setLocale(data.locale as Locale);
    }
  });
  return <Certificate />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider initialLocale={initialLocale}>
      <CertificateApp />
    </I18nProvider>
  </React.StrictMode>
);
