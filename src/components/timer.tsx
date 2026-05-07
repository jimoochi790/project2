"use client"

import { useEffect, useRef, useState } from "react"
import { formatTime } from "@/lib/utils"

interface TimerProps {
  durationMinutes: number
  onTimeUp: () => void
  onTick?: (remainingSeconds: number) => void
}

export function Timer({ durationMinutes, onTimeUp, onTick }: TimerProps) {
  const [remaining, setRemaining] = useState(durationMinutes * 60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeUpRef = useRef(onTimeUp)
  const onTickRef = useRef(onTick)
  const triggeredRef = useRef(false)

  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    triggeredRef.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(durationMinutes * 60)

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [durationMinutes])

  useEffect(() => {
    onTickRef.current?.(remaining)

    if (remaining <= 0 && !triggeredRef.current) {
      triggeredRef.current = true
      onTimeUpRef.current()
    }
  }, [remaining])

  return (
    <span
      className={`font-mono text-2xl font-bold tracking-wider tabular-nums ${
        remaining < 300 ? "text-red-500" : "text-white"
      }`}
    >
      {formatTime(remaining)}
    </span>
  )
}
