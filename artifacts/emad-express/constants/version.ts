import Constants from "expo-constants";

// The active client app version
export const CURRENT_APP_VERSION =
  Constants.expoConfig?.version || "18.0.4";

/**
 * Compares two semantic version strings (e.g. "18.0.4" vs "18.0.3").
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareAppVersions(v1: string, v2: string): number {
  if (!v1 || !v2) return 0;
  const clean = (v: string) => v.replace(/^v/i, "").split(/[-+]/)[0];
  const parts1 = clean(v1).split(".").map((n) => parseInt(n, 10) || 0);
  const parts2 = clean(v2).split(".").map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export function isUpdateAvailable(
  latestVersion?: string,
  currentVersion: string = CURRENT_APP_VERSION
): boolean {
  if (!latestVersion) return false;
  return compareAppVersions(latestVersion, currentVersion) > 0;
}
