import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/state/gameState';
import { TutorialController } from '../../src/engine/tutorial/tutorialController';
import { STEP_IDS } from '../../src/engine/tutorial/tutorialSteps';
import type { TutorialDispatcher } from '../../src/engine/tutorial/tutorialController';

interface DispatcherCalls {
  startPrompt: number;
  startMap: number;
  advancePromptTo: string[];
  endPrompt: number;
  endMap: number;
  advanceLevel: number;
}

function makeDispatcher(): { dispatcher: TutorialDispatcher; calls: DispatcherCalls } {
  const calls: DispatcherCalls = {
    startPrompt: 0,
    startMap: 0,
    advancePromptTo: [],
    endPrompt: 0,
    endMap: 0,
    advanceLevel: 0,
  };
  const dispatcher: TutorialDispatcher = {
    startPromptArea: () => { calls.startPrompt++; },
    startMapArea: () => { calls.startMap++; },
    advancePromptArea: (id) => { calls.advancePromptTo.push(id); },
    endPromptArea: () => { calls.endPrompt++; },
    endMapArea: () => { calls.endMap++; },
    advanceLevel: () => { calls.advanceLevel++; },
  };
  return { dispatcher, calls };
}

describe('TutorialController', () => {
  let gsm: GameStateManager;

  beforeEach(() => {
    gsm = new GameStateManager();
  });

  it('shouldStart returns true only for level_01 when flag is false', () => {
    const { dispatcher } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    expect(ctrl.shouldStart('level_01')).toBe(true);
    expect(ctrl.shouldStart('level_02')).toBe(false);
    expect(ctrl.shouldStart('level_26')).toBe(false);
  });

  it('shouldStart returns false once tutorial is marked complete', () => {
    const { dispatcher } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    gsm.markTutorialCompleted();
    expect(ctrl.shouldStart('level_01')).toBe(false);
  });

  it('start fires startPromptArea and sets prompt area on first call', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    expect(calls.startPrompt).toBe(1);
    expect(ctrl.getActiveArea()).toBe('prompt');
  });

  it('notifyExecuted only advances when current prompt step is `execute`', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    // On the very first step, an unrelated submission should NOT advance.
    ctrl.notifyExecuted(true);
    expect(calls.advancePromptTo).toEqual([]);

    // Webview reaches the execute step.
    ctrl.noteCurrentPromptStep(STEP_IDS.execute);
    ctrl.notifyExecuted(true);
    expect(calls.advancePromptTo).toEqual([STEP_IDS.result]);

    // A second submission once we're already on result should NOT re-advance.
    ctrl.notifyExecuted(true);
    expect(calls.advancePromptTo).toEqual([STEP_IDS.result]);
  });

  it('notifyExecuted on regexDirectExecute step completes wizard and advances level on pass', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    ctrl.noteCurrentPromptStep(STEP_IDS.regexDirectExecute);

    // Failed submission: wizard stays open, no advance.
    ctrl.notifyExecuted(false);
    expect(calls.endPrompt).toBe(0);
    expect(calls.advanceLevel).toBe(0);
    expect(gsm.isTutorialCompleted()).toBe(false);

    // Pass submission: wizard tears down + level advances + flag flips.
    ctrl.notifyExecuted(true);
    expect(calls.endPrompt).toBe(1);
    expect(calls.advanceLevel).toBe(1);
    expect(gsm.isTutorialCompleted()).toBe(true);
    expect(ctrl.getActiveArea()).toBeNull();
  });

  it('notifyExecuted on regexDirect (fill-only) step does NOT complete on pass', () => {
    // The fill-only step must not auto-complete — the wizard advances locally
    // to regexDirectExecute, where the player presses Execute themselves.
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    ctrl.noteCurrentPromptStep(STEP_IDS.regexDirect);
    ctrl.notifyExecuted(true);
    expect(calls.endPrompt).toBe(0);
    expect(calls.advanceLevel).toBe(0);
    expect(gsm.isTutorialCompleted()).toBe(false);
    expect(ctrl.getActiveArea()).toBe('prompt');
  });

  it('handOff ends prompt area and starts map area', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    ctrl.handOff();
    expect(calls.endPrompt).toBe(1);
    expect(calls.startMap).toBe(1);
    expect(ctrl.getActiveArea()).toBe('map');
  });

  it('skip marks completed and ends whichever area is active', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    ctrl.skip();
    expect(gsm.isTutorialCompleted()).toBe(true);
    expect(calls.endPrompt).toBe(1);
    expect(calls.endMap).toBe(0);
    expect(ctrl.getActiveArea()).toBeNull();
  });

  it('finish from map area marks completed and advances the level', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    ctrl.handOff();
    ctrl.finish();
    expect(gsm.isTutorialCompleted()).toBe(true);
    expect(calls.endMap).toBe(1);
    expect(calls.advanceLevel).toBe(1);
  });

  it('finish is a no-op when called outside the map area', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start(); // prompt area
    ctrl.finish();
    expect(gsm.isTutorialCompleted()).toBe(false);
    expect(calls.advanceLevel).toBe(0);
  });

  it('shouldInterceptSidebarSelect is always false (extension uses getActiveArea instead)', () => {
    const { dispatcher } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    expect(ctrl.shouldInterceptSidebarSelect()).toBe(false);
    ctrl.start();
    expect(ctrl.shouldInterceptSidebarSelect()).toBe(false);
    ctrl.handOff();
    expect(ctrl.shouldInterceptSidebarSelect()).toBe(false);
  });

  it('start is re-emittable while already in prompt area (recovers lost first send)', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    expect(calls.startPrompt).toBe(1);
    // Webview ready arriving after a lost first dispatch must re-trigger.
    ctrl.start();
    expect(calls.startPrompt).toBe(2);
    expect(ctrl.getActiveArea()).toBe('prompt');
  });

  it('start is a no-op after handoff to map area', () => {
    const { dispatcher, calls } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    ctrl.start();
    ctrl.handOff();
    ctrl.start();
    expect(calls.startPrompt).toBe(1); // not re-emitted
    expect(ctrl.getActiveArea()).toBe('map');
  });

  it('shouldSuppressAutoAdvance is true whenever wizard is active', () => {
    const { dispatcher } = makeDispatcher();
    const ctrl = new TutorialController(gsm, dispatcher);
    expect(ctrl.shouldSuppressAutoAdvance()).toBe(false);
    ctrl.start();
    expect(ctrl.shouldSuppressAutoAdvance()).toBe(true);
    ctrl.handOff();
    expect(ctrl.shouldSuppressAutoAdvance()).toBe(true);
    ctrl.skip();
    expect(ctrl.shouldSuppressAutoAdvance()).toBe(false);
  });
});
