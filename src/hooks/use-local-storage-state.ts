import { useCallback, useEffect, useState } from "react"

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore quota / private mode errors
    }
  }, [key, state])

  const setStoredState = useCallback((value: T | ((prev: T) => T)) => {
    setState(value)
  }, [])

  return [state, setStoredState]
}
