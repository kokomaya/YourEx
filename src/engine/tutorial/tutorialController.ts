import type { GameStateManager } from '../../state/gameState';
import type { TutorialStep, TutorialUiText } from '../../types/messages';
import type { ITutorialController, TutorialArea } from './ITutorialController';
import {
  STEP_IDS,
  buildPromptPanelSteps,
  buildMissionMapSteps,
  buildUiText,
} from './tutorialSteps';

/**
 * Send a `startTutorial` payload to one of the two webviews. Both providers
 * register a hook on construction so the controller stays UI-agnostic.
 */
export interface TutorialDispatcher {
  startPromptArea(payload: { steps: TutorialStep[]; uiText: TutorialUiText }): void;
  startMapArea(payload: { steps: TutorialStep[]; uiText: TutorialUiText }): void;
  advancePromptArea(toStepId: string): void;
  endPromptArea(): void;
  endMapArea(): void;
  /** Trigger the normal nextLevel flow once tutorial completes. */
  advanceLevel(): void;
}

export class TutorialController implements ITutorialController {
  private _area: TutorialArea = null;
  /** Tracks which prompt-area step is current, so notifyExecuted can advance only when relevant. */
  private _currentPromptStepId: string | null = null;

  constructor(
    private readonly _gameState: GameStateManager,
    private readonly _dispatcher: TutorialDispatcher,
  ) {}

  shouldStart(levelId: string): boolean {
    if (levelId !== 'level_01') return false;
    return !this._gameState.isTutorialCompleted();
  }

  start(): void {
    // Re-emittable on purpose. The first `startTutorial` message can be lost
    // when the webview is still booting (postMessage runs before React's
    // listener is registered). When `case 'ready'` later triggers another
    // start() we still need the steps to reach the overlay — so always
    // re-post. The map area is unaffected because handOff() owns that flip.
    if (this._area === 'map') return;
    if (this._area === null) {
      this._area = 'prompt';
      this._currentPromptStepId = STEP_IDS.storyArchive;
    }
    this._dispatcher.startPromptArea({
      steps: buildPromptPanelSteps(),
      uiText: buildUiText(),
    });
  }

  getActiveArea(): TutorialArea {
    return this._area;
  }

  /** Webview calls this on every `stepShown` so notifyExecuted knows the current step. */
  noteCurrentPromptStep(stepId: string): void {
    if (this._area === 'prompt') {
      this._currentPromptStepId = stepId;
    }
  }

  notifyExecuted(passed: boolean): void {
    if (this._area !== 'prompt') return;
    if (this._currentPromptStepId === STEP_IDS.execute) {
      this._dispatcher.advancePromptArea(STEP_IDS.result);
      this._currentPromptStepId = STEP_IDS.result;
      return;
    }
    // Final step: the player filled the regex on `regexDirect` then was asked
    // on `regexDirectExecute` to actually press Execute themselves. Once the
    // submission lands a pass/perfect result we tear the wizard down and
    // advance to level_02 via the normal pipeline — skipping the map area
    // entirely. On a fail we leave the wizard up so the player can retry.
    if (this._currentPromptStepId === STEP_IDS.regexDirectExecute && passed) {
      this._area = null;
      this._currentPromptStepId = null;
      this._gameState.markTutorialCompleted();
      this._dispatcher.endPromptArea();
      this._dispatcher.advanceLevel();
    }
  }

  handOff(): void {
    if (this._area !== 'prompt') return;
    this._area = 'map';
    this._currentPromptStepId = null;
    this._dispatcher.endPromptArea();
    this._dispatcher.startMapArea({
      steps: buildMissionMapSteps(),
      uiText: buildUiText(),
    });
  }

  skip(): void {
    if (this._area === null) return;
    const wasArea = this._area;
    this._area = null;
    this._currentPromptStepId = null;
    this._gameState.markTutorialCompleted();
    if (wasArea === 'prompt') this._dispatcher.endPromptArea();
    if (wasArea === 'map') this._dispatcher.endMapArea();
  }

  finish(): void {
    if (this._area !== 'map') return;
    this._area = null;
    this._currentPromptStepId = null;
    this._gameState.markTutorialCompleted();
    this._dispatcher.endMapArea();
    // Advance to level_02 via the normal pipeline (chapter unlocks etc.).
    this._dispatcher.advanceLevel();
  }

  /** Drop in-memory wizard state without touching GameState. Use after reset. */
  hardResetInMemory(): void {
    if (this._area === 'prompt') this._dispatcher.endPromptArea();
    if (this._area === 'map') this._dispatcher.endMapArea();
    this._area = null;
    this._currentPromptStepId = null;
  }

  shouldInterceptSidebarSelect(): boolean {
    // Never block. If the player explicitly navigates the sidebar mid-wizard
    // we'd rather tear the wizard down (via skip()) than trap them. The
    // earlier hard-block ran into a race where the controller flipped to
    // 'prompt' before the overlay had actually mounted, leaving the sidebar
    // stuck with no way out.
    return false;
  }

  shouldSuppressAutoAdvance(): boolean {
    // Wizard is showing — never auto-trigger nextLevel; the player needs to
    // see the Result step / Finish button instead.
    return this._area !== null;
  }
}
