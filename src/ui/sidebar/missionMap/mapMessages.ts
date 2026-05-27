/* Message types shared between extension and mission map webview */

import type { TutorialStep, TutorialUiText } from '../../../types/messages';

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
  | { command: 'loadMap'; chapters: ChapterMapData[]; certificateUnlocked: boolean; hasProgress: boolean; resetLabel: string; resetTooltip: string }
  | { command: 'updateNode'; nodeId: string; status: MapNode['status']; score: number | null }
  | { command: 'setActiveChapter'; chapterId: number }
  | { command: 'setCertificateUnlocked'; unlocked: boolean }
  | { command: 'highlightLevel'; levelId: string }
  | { command: 'startTutorial'; steps: TutorialStep[]; uiText: TutorialUiText }
  | { command: 'endTutorial' };

export type MapWebviewToExt =
  | { command: 'ready' }
  | { command: 'selectLevel'; levelId: string }
  | { command: 'openJourneyCertificate' }
  | { command: 'resetProgress' }
  | { command: 'tutorialEvent'; type: 'ready' | 'skip' | 'finish' | 'stepShown'; stepId?: string };
