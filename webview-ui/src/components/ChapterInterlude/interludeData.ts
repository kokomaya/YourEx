export interface InterludeConfig {
  chapterId: number;
  flightPhase: 'cruise' | 'accelerate' | 'turbulence' | 'jump';
  cockpitAlert: 'normal' | 'warning' | 'critical';
  colorTheme: 'cold-blue' | 'teal-white' | 'orange-red' | 'purple-gold';
  bootLineCount: number;
  storyLineCount: number;
  targetLevel: string;
}

export const INTERLUDE_CONFIGS: Record<number, InterludeConfig> = {
  2: {
    chapterId: 2,
    flightPhase: 'cruise',
    cockpitAlert: 'normal',
    colorTheme: 'cold-blue',
    bootLineCount: 8,
    storyLineCount: 5,
    targetLevel: 'level_06',
  },
  3: {
    chapterId: 3,
    flightPhase: 'accelerate',
    cockpitAlert: 'normal',
    colorTheme: 'teal-white',
    bootLineCount: 8,
    storyLineCount: 5,
    targetLevel: 'level_11',
  },
  4: {
    chapterId: 4,
    flightPhase: 'cruise',
    cockpitAlert: 'critical',
    colorTheme: 'orange-red',
    bootLineCount: 9,
    storyLineCount: 5,
    targetLevel: 'level_16',
  },
  5: {
    chapterId: 5,
    flightPhase: 'turbulence',
    cockpitAlert: 'warning',
    colorTheme: 'purple-gold',
    bootLineCount: 10,
    storyLineCount: 5,
    targetLevel: 'level_21',
  },
};
