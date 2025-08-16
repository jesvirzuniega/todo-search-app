import { useEffect, useState } from "react"

export default function useLocalStorageState<T>(key: string, defaultValue: T): [T, (state: T) => void, boolean] {
  const [state, setState] = useState<T>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const item = localStorage.getItem(key)
    if (item) setState(JSON.parse(item))
    setIsInitialized(true)
  }, [key])

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [state, key])

  return [state, setState, isInitialized]
}