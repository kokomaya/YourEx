import { useState, useEffect, useCallback } from 'react';

export type RewardPhase =
  | 'idle'
  | 'icon'       // Phase 1: status icon + headline
  | 'score'      // Phase 2: score card + XP + achievements
  | 'actions'    // Phase 3: action buttons visible
  | 'chapter'    // Chapter complete narrative
  | 'finale';    // Game complete / origin reveal

interface PhaseConfig {
  phase: RewardPhase;
  delay: number; // ms after previous phase
}

const LEVEL_PHASES: PhaseConfig[] = [
  { phase: 'icon', delay: 0 },
  { phase: 'score', delay: 1200 },
  { phase: 'actions', delay: 1000 },
];

const CHAPTER_PHASES: PhaseConfig[] = [
  { phase: 'icon', delay: 0 },
  { phase: 'score', delay: 1200 },
  { phase: 'chapter', delay: 1200 },
  { phase: 'actions', delay: 2000 },
];

const FINALE_PHASES: PhaseConfig[] = [
  { phase: 'icon', delay: 0 },
  { phase: 'score', delay: 1200 },
  { phase: 'finale', delay: 1200 },
  { phase: 'actions', delay: 3000 },
];

export function useRewardPhase(
  active: boolean,
  isChapterComplete: boolean,
  isGameComplete: boolean,
) {
  const [phase, setPhase] = useState<RewardPhase>('idle');
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phases = isGameComplete
    ? FINALE_PHASES
    : isChapterComplete
      ? CHAPTER_PHASES
      : LEVEL_PHASES;

  // Skip to final phase
  const skipToActions = useCallback(() => {
    setPhase('actions');
    setPhaseIndex(phases.length - 1);
  }, [phases.length]);

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      setPhaseIndex(0);
      return;
    }

    // Start first phase immediately
    setPhase(phases[0].phase);
    setPhaseIndex(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulativeDelay = 0;

    for (let i = 1; i < phases.length; i++) {
      cumulativeDelay += phases[i].delay;
      const idx = i;
      timers.push(
        setTimeout(() => {
          setPhase(phases[idx].phase);
          setPhaseIndex(idx);
        }, cumulativeDelay)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [active, phases]);

  return { phase, phaseIndex, skipToActions };
}
