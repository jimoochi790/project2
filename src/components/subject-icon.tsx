"use client"

import { BookOpen, Calculator, Brain, type LucideIcon } from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  "oc-reading": BookOpen,
  "oc-math-reasoning": Calculator,
  "oc-thinking-skills": Brain,
  "selective-reading": BookOpen,
  "selective-math-reasoning": Calculator,
  "selective-thinking-skills": Brain,
}

export function SubjectIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = iconMap[slug] ?? BookOpen
  return <Icon className={className} />
}
