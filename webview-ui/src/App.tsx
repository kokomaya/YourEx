import { useEffect } from 'react';
import type { WebViewType, ExtensionMessage } from './types/messages';
import { useTranslation, type Locale } from './i18n';
import { useMessageListener } from './hooks/useVSCode';
import { PromptPanel } from './components/PromptPanel';
import { Welcome } from './components/Welcome';
import { Leaderboard } from './components/Leaderboard';
import { ScoreDetail } from './components/ScoreDetail';
import { Codex } from './components/Codex';
import { LanguageSwitcher } from './components/LanguageSwitcher';

declare global {
  interface Window {
    __YOUREX_VIEW_TYPE__?: WebViewType;
  }
}

const viewType: WebViewType = window.__YOUREX_VIEW_TYPE__ ?? 'promptPanel';

function App() {
  const { setLocale } = useTranslation();

  // Listen for locale change from extension
  useMessageListener((msg: unknown) => {
    const data = msg as ExtensionMessage;
    if (data.command === 'localeChanged') {
      setLocale(data.locale as Locale);
    }
  });

  const renderView = () => {
    switch (viewType) {
      case 'welcome':
        return <Welcome />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'scoreDetail':
        return <ScoreDetail />;
      case 'codex':
        return <Codex />;
      case 'promptPanel':
      default:
        return <PromptPanel />;
    }
  };

  return (
    <>
      <LanguageSwitcher />
      {renderView()}
    </>
  );
}

export default App;
