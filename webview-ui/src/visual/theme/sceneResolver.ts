import { FALLBACK_THEME, THEME_PROFILES } from './themeProfiles';
import type { SceneContext, ThemeProfile } from './types';

export function resolveThemeProfile(context: SceneContext): ThemeProfile {
  const chapter = context.chapterThemeOverride ?? context.chapterId ?? 1;
  return THEME_PROFILES[chapter] ?? FALLBACK_THEME;
}
