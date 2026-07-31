import { useEffect, useRef, useState, useCallback } from "react"

export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T
}