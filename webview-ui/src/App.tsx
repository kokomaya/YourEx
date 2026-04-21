import type { WebViewType } from './types/messages';
import { PromptPanel } from './components/PromptPanel';
import { Welcome } from './components/Welcome';
import { Leaderboard } from './components/Leaderboard';
import { ScoreDetail } from './components/ScoreDetail';

declare global {
  interface Window {
    __YOUREX_VIEW_TYPE__?: WebViewType;
  }
}

const viewType: WebViewType = window.__YOUREX_VIEW_TYPE__ ?? 'promptPanel';

function App() {
  switch (viewType) {
    case 'welcome':
      return <Welcome />;
    case 'leaderboard':
      return <Leaderboard />;
    case 'scoreDetail':
      return <ScoreDetail />;
    case 'promptPanel':
    default:
      return <PromptPanel />;
  }
}

export default App;
