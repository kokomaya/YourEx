import type { TutorialStep, TutorialUiText } from '../../types/messages';
import { t } from '../../i18n/t';

/**
 * Step IDs the controller references by name. Keep stable — used to drive
 * cross-IPC advance (e.g. step `execute` → `result` after a real submission).
 */
export const STEP_IDS = {
  storyArchive: 'story-archive',
  missionData: 'mission-data',
  promptInput: 'prompt-input',
  helperTools: 'helper-tools',
  execute: 'execute',
  result: 'result',
  regexDirect: 'regex-direct',
  regexDirectExecute: 'regex-direct-execute',
  // sidebar
  chaptersAndNodes: 'chapters-and-nodes',
  otherEntries: 'other-entries',
  finish: 'finish',
} as const;

export type TutorialArea = 'prompt' | 'map';

export function buildUiText(): TutorialUiText {
  return {
    skip: t('tutorial.skip'),
    next: t('tutorial.next'),
    prev: t('tutorial.prev'),
    finish: t('tutorial.finish'),
    stepCounter: t('tutorial.stepCounter'),
    waitForExecute: t('tutorial.waitForExecute'),
    waitingForLlm: t('tutorial.waitingForLlm'),
  };
}

/**
 * Steps shown in the main PromptPanel webview. The execute step is
 * `blockingNext: true` — the controller advances it only after a real
 * `executePrompt` (or `executeRegex`) lands a `showResult`.
 *
 * When `aiAvailable === false` the same 8-step skeleton is returned, but
 * the prompt-input / execute / result steps are swapped for short "Copilot
 * unavailable" copy and tagged `autoSkip: true`, so the player is gently
 * walked past the AI path and lands on the manual-regex flow.
 */
export function buildPromptPanelSteps(aiAvailable: boolean = true): TutorialStep[] {
  return [
    {
      id: STEP_IDS.storyArchive,
      anchor: 'header.signal-header, section.signal-story',
      title: t('tutorial.step.story.title'),
      body: t('tutorial.step.story.body'),
      placement: 'bottom',
    },
    {
      id: STEP_IDS.missionData,
      anchor: 'section.signal-challenge, section.test-data',
      title: t('tutorial.step.mission.title'),
      body: t('tutorial.step.mission.body'),
      placement: 'bottom',
    },
    aiAvailable
      ? {
          id: STEP_IDS.promptInput,
          anchor: 'section.prompt-input:not(.regex-input)',
          title: t('tutorial.step.promptInput.title'),
          body: t('tutorial.step.promptInput.body'),
          action: {
            kind: 'fillPrompt',
            label: t('tutorial.fillPrompt.button'),
            text: t('tutorial.fillPrompt.level_01'),
          },
          placement: 'top',
        }
      : {
          id: STEP_IDS.promptInput,
          anchor: 'section.prompt-input:not(.regex-input)',
          title: t('tutorial.step.promptInput.unavailableTitle'),
          body: t('tutorial.step.promptInput.unavailableBody'),
          placement: 'top',
          autoSkip: true,
        },
    {
      id: STEP_IDS.helperTools,
      anchor: '.prompt-input__header .scan-eye-btn, section.regex-input',
      title: t('tutorial.step.helpers.title'),
      body: t('tutorial.step.helpers.body'),
      placement: 'top',
    },
    aiAvailable
      ? {
          id: STEP_IDS.execute,
          anchor: '.action-buttons .btn-primary',
          title: t('tutorial.step.execute.title'),
          body: t('tutorial.step.execute.body'),
          blockingNext: true,
          action: { kind: 'waitFor', event: 'executePrompt', hint: t('tutorial.waitForExecute') },
          placement: 'top',
        }
      : {
          id: STEP_IDS.execute,
          anchor: '.action-buttons .btn-primary',
          title: t('tutorial.step.execute.unavailableTitle'),
          body: t('tutorial.step.execute.unavailableBody'),
          placement: 'top',
          autoSkip: true,
        },
    aiAvailable
      ? {
          id: STEP_IDS.result,
          anchor: '.result-panel',
          title: t('tutorial.step.result.title'),
          body: t('tutorial.step.result.body'),
          placement: 'top',
        }
      : {
          id: STEP_IDS.result,
          anchor: '.result-panel',
          title: t('tutorial.step.result.unavailableTitle'),
          body: t('tutorial.step.result.unavailableBody'),
          placement: 'top',
          autoSkip: true,
        },
    {
      id: STEP_IDS.regexDirect,
      anchor: 'section.regex-input',
      title: t('tutorial.step.regexDirect.title'),
      body: aiAvailable
        ? t('tutorial.step.regexDirect.body')
        : t('tutorial.step.regexDirect.bodyOnlyPath'),
      blockingNext: true,
      action: {
        kind: 'fillRegex',
        label: t('tutorial.fillRegex.button'),
        text: t('tutorial.fillRegex.level_01'),
      },
      placement: 'top',
    },
    {
      id: STEP_IDS.regexDirectExecute,
      anchor: '.action-buttons .btn-primary',
      title: t('tutorial.step.regexDirectExecute.title'),
      body: t('tutorial.step.regexDirectExecute.body'),
      blockingNext: true,
      action: {
        kind: 'waitFor',
        event: 'executePrompt',
        hint: t('tutorial.waitForExecute'),
      },
      placement: 'top',
    },
  ];
}

/**
 * Steps shown in the Mission Map sidebar webview after the prompt-panel
 * portion completes.
 */
export function buildMissionMapSteps(): TutorialStep[] {
  return [
    {
      id: STEP_IDS.chaptersAndNodes,
      anchor: '#chapter-tabs, .node-btn',
      title: t('tutorial.step.chapters.title'),
      body: t('tutorial.step.chapters.body'),
      placement: 'right',
    },
    {
      id: STEP_IDS.otherEntries,
      anchor: '#cert-footer, #sys-ops',
      title: t('tutorial.step.entries.title'),
      body: t('tutorial.step.entries.body'),
      placement: 'top',
    },
    {
      id: STEP_IDS.finish,
      anchor: null,
      title: t('tutorial.step.finish.title'),
      body: t('tutorial.step.finish.body'),
      blockingNext: true,
      placement: 'auto',
    },
  ];
}
