export type UserRole = "student" | "admin"

export interface Subject {
  id: number
  name: string
  description: string
  slug: string
  level: "OC" | "Selective"
  grade: number
  sort_order: number
  created_at: string
}

export interface TestSet {
  id: number
  subject_id: number
  name: string
  description: string
  duration_minutes: number
  price_cents: number
  question_count: number
  is_published: boolean
  created_at: string
}

export interface Question {
  id: number
  test_set_id: number
  question_number: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: "A" | "B" | "C" | "D"
  solution_text: string
  sort_order: number
}

export interface Purchase {
  id: number
  user_id: string
  test_set_id: number
  stripe_session_id: string
  amount_cents: number
  purchased_at: string
}

export interface TestAttempt {
  id: number
  user_id: string
  test_set_id: number
  started_at: string
  completed_at: string | null
  score: number | null
  total_questions: number
  status: "in_progress" | "completed" | "timed_out"
}

export interface AttemptAnswer {
  id: number
  attempt_id: number
  question_id: number
  selected_option: string | null
  is_correct: boolean | null
  is_flagged: boolean
  answered_at: string | null
}

export interface TestSetWithSubject extends TestSet {
  subject: Subject
}

export interface AttemptWithTest extends TestAttempt {
  test_set: TestSetWithSubject
}

export interface QuestionWithAnswer extends Question {
  attempt_answer: AttemptAnswer | null
}
