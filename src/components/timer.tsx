"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { EyeIcon, EyeOffIcon, ClockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimerProps {
  durationMinutes: number
  onTimeUp?: () => void
  onTick?: (remainingMs: number) => void
}

export function Timer({ durationMinutes, onTimeUp, onTick }: TimerProps) {
  const totalMs = durationMinutes * 60 * 1000
  const [remainingMs, setRemainingMs] = useState(totalMs)
  const [hidden, setHidden] = useState(false)
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick
  const firedRef = useRef(false)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const left = Math.max(0, totalMs - elapsed)
      setRemainingMs(left)
      onTickRef.current?.(left)
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true
        onTimeUpRef.current?.()
      }
    }, 200)
    return () => clearInterval(interval)
  }, [totalMs])

  const totalSeconds = Math.ceil(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const isLow = totalSeconds <= 300 && totalSeconds > 0

  const display = hours > 0
    ? `${hours} Hour${hours !== 1 ? "s" : ""} ${minutes} Minute${minutes !== 1 ? "s" : ""}`
    : `${minutes} Minute${minutes !== 1 ? "s" : ""}`

  return (
    <div className="flex items-center gap-2">
      <ClockIcon className={`size-4 ${isLow ? "text-red-400" : "text-slate-400"}`} />
      {hidden ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHidden(false)}
          className="h-auto px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/10"
        >
          <EyeIcon className="size-3.5 mr-1" />
          Show time
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${isLow ? "text-red-400 font-bold" : "text-slate-300"}`}
            onDoubleClick={() => setHidden(true)}
          >
            {display}
            <span className="text-xs ml-1 text-slate-500">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHidden(!hidden)}
            className="h-auto px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/10"
          >
            {hidden ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
            <span className="ml-1">{hidden ? "Show time" : "Hide time"}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
