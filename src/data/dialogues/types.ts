export interface Dialogue {
  title: string;
  lines: string[];
}

export interface DialogueSet {
  welcome: Dialogue;
  rexReveal: string;
  storyLines: string[];
  startButton: string;
  chapterIntro: Record<number, Dialogue>;
  chapterComplete: Record<number, string>;
  rexSignals: string[];
  rexFinalSignals: string[];
}
