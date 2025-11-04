/**
 * Compares two objects and returns the differences.
 * @param oldObject - The old object.
 * @param newObject - The new object.
 * @returns The differences.
 * @returns {Object} The differences.
 * @returns {Array<string>} added - The keys that were added.
 * @returns {Array<string>} removed - The keys that were removed.
 * @returns {Array<string>} changed - The keys that were changed.
 */
export function objectsDiff(
  oldObject: Record<string, any>,
  newObject: Record<string, any>
) {
  const oldKeys = new Set(Object.keys(oldObject));
  const newKeys = new Set(Object.keys(newObject));

  const removed = Array.from(oldKeys).filter((key) => !newKeys.has(key));
  const added: string[] = [];
  const changed: string[] = [];

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      added.push(key);
    }

    if (oldObject[key] !== newObject[key]) {
      changed.push(key);
    }
  }
  return { added, removed, changed };
}
