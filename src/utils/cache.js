/**
 * localStorage cache utility for API responses.
 * Stores data with timestamp, checks freshness on read.
 * Avoids calling the API on every page visit — serves cached data instantly,
 * then refreshes in the background if stale.
 */

const CACHE_PREFIX = 'foryou_cache_';
const DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes — fresh data threshold

/**
 * Get cached data if it exists and is fresh enough.
 * @param {string} key - Cache key
 * @param {number} maxAge - Max age in ms (default 2 min)
 * @returns {{ data: any, isStale: boolean } | null}
 */
export function getCache(key, maxAge = DEFAULT_TTL) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const { data, timestamp } = JSON.parse(raw);
    if (!data || !timestamp) return null;

    const age = Date.now() - timestamp;
    return { data, isStale: age > maxAge };
  } catch {
    // Corrupted cache — remove it
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }
}

/**
 * Store data in cache with current timestamp.
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export function setCache(key, data) {
  try {
    const payload = JSON.stringify({ data, timestamp: Date.now() });
    localStorage.setItem(CACHE_PREFIX + key, payload);
  } catch (e) {
    // localStorage full — clear old caches and retry
    clearOldCaches();
    try {
      const payload = JSON.stringify({ data, timestamp: Date.now() });
      localStorage.setItem(CACHE_PREFIX + key, payload);
    } catch {
      // Still failing — silently ignore, data will just fetch fresh
    }
  }
}

/**
 * Invalidate a specific cache key.
 * @param {string} key - Cache key to invalidate
 */
export function invalidateCache(key) {
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Invalidate all API caches (called after creating/updating projects).
 */
export function invalidateAllCaches() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

/**
 * Clear caches older than 10 minutes to free space.
 */
function clearOldCaches() {
  const maxAge = 10 * 60 * 1000;
  const now = Date.now();
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) {
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(k));
        if (now - timestamp > maxAge) keysToRemove.push(k);
      } catch {
        keysToRemove.push(k);
      }
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
