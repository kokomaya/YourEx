/* Message types shared between extension and mission map webview */

export interface MapNode {
  id: string;
  title: string;
  chapter: number;
  index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'locked' | 'available' | 'passed' | 'perfect';
  score: number | null;
  promptChallenge: string;
}

export interface ChapterMapData {
  chapter: number;
  name: string;
  unlocked: boolean;
  progress: number;
  total: number;
  themeColor: string;
  nodes: MapNode[];
}

export type MapExtToWebview =
  | { command: 'loadMap'; chapters: ChapterMapData[]; certificateUnlocked: boolean }
  | { command: 'updateNode'; nodeId: string; status: MapNode['status']; score: number | null }
  | { command: 'setActiveChapter'; chapterId: number }
  | { command: 'setCertificateUnlocked'; unlocked: boolean };

export type MapWebviewToExt =
  | { command: 'ready' }
  | { command: 'selectLevel'; levelId: string }
  | { command: 'openJourneyCertificate' };
