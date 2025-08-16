import { useEffect, useState } from "react";

export default function useDebounce<T>(state: T, delay: number) {
  const [debouncedState, setDebouncedState] = useState<T>(state)
  const timeout: NodeJS.Timeout | null = null

  useEffect(() => {
    if (timeout) clearTimeout(timeout)
    setTimeout(() => setDebouncedState(state), delay)
    return () => clearTimeout(timeout!)
  }, [state, delay, timeout])

  return debouncedState
}