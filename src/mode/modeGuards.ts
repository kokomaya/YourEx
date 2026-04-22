export function computeAllowDeveloperMode(
  configuredAllowDeveloper: boolean,
  extensionMode: number
): boolean {
  // VS Code enum value: Production = 1
  if (extensionMode === 1) {
    return false;
  }

  // VS Code enum value: Development = 2
  if (extensionMode === 2) {
    return true;
  }

  return configuredAllowDeveloper;
}
