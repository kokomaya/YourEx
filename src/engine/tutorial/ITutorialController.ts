/**
 * Coordinates the first-time tutorial across the PromptPanel and Mission
 * Map webviews. Owns:
 *  - the active state (idle | running 'prompt' | running 'map')
 *  - the cross-IPC advance after the player actually clicks Execute
 *  - the handoff from prompt-area → map-area
 *  - skip / finish bookkeeping (writes back to GameState)
 *
 * Has no UI of its own; only sends `startTutorial` / `advanceTutorial` /
 * `endTutorial` messages through provider hooks supplied at wire-up time.
 */
export type TutorialArea = 'prompt' | 'map' | null;

export interface ITutorialController {
  /** True when level_01 is being shown and the player has not completed the tutorial. */
  shouldStart(levelId: string): boolean;
  /** Begin the prompt-panel portion. No-op if already running. */
  start(): void;
  /** Active area, or null when idle. */
  getActiveArea(): TutorialArea;
  /**
   * Called by PromptPanelProvider after a `showResult` triggered by a real
   * submission. `passed` is true when the result was pass/perfect — needed
   * by the final regex-direct step, which only completes on a clear.
   */
  notifyExecuted(passed: boolean): void;
  /** Webview asked to hand off from prompt area to map area. */
  handOff(): void;
  /** Webview Skip clicked anywhere — end immediately, mark complete. */
  skip(): void;
  /** Webview Finish clicked on the last sidebar step — mark complete, advance level. */
  finish(): void;
  /** Returns true while wizard is intercepting normal sidebar selection. */
  shouldInterceptSidebarSelect(): boolean;
  /** Returns true while wizard is intercepting auto-advance on level pass. */
  shouldSuppressAutoAdvance(): boolean;
}
