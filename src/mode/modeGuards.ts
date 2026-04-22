export function computeAllowDeveloperMode(
  configuredAllowDeveloper: boolean,
  extensionMode: number
): boolean {
  // VS Code enum value: Production = 1
  if (extensionMode === 1) {
    return false;
  }
  return configuredAllowDeveloper;
}
