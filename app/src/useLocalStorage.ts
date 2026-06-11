import { useEffect, useState } from "react";

/** Persist a JSON-serialisable value under a localStorage key. */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  // Re-read when the key changes (e.g. navigating between chapters).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setValue(raw == null ? initial : (JSON.parse(raw) as T));
    } catch {
      setValue(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — state still works in-memory */
    }
  }, [key, value]);

  return [value, setValue];
}
