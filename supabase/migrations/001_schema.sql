-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''), 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Subjects
CREATE TABLE subjects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL CHECK (level IN ('OC', 'Selective')),
  grade INT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Test sets (purchasable packages)
CREATE TABLE test_sets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration_minutes INT NOT NULL DEFAULT 40,
  price_cents INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 35,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Questions
CREATE TABLE questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_set_id BIGINT NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  solution_text TEXT DEFAULT '',
  sort_order INT DEFAULT 0
);

-- Purchases
CREATE TABLE purchases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_set_id BIGINT NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
  stripe_session_id TEXT DEFAULT '',
  amount_cents INT NOT NULL DEFAULT 0,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, test_set_id)
);

-- Test attempts (each time a student takes a test)
CREATE TABLE test_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_set_id BIGINT NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INT,
  total_questions INT NOT NULL DEFAULT 35,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out'))
);

-- Individual answers within an attempt
CREATE TABLE attempt_answers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D', NULL)),
  is_correct BOOLEAN,
  is_flagged BOOLEAN DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_test_sets_subject ON test_sets(subject_id);
CREATE INDEX idx_questions_test_set ON questions(test_set_id);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_attempt_answers_attempt ON attempt_answers(attempt_id);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;

-- Users: everyone can read, users can update their own
CREATE POLICY "Users can read own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own" ON users FOR UPDATE USING (auth.uid() = id);

-- Subjects: public read
CREATE POLICY "Anyone can read subjects" ON subjects FOR SELECT USING (true);

-- Test sets: public read
CREATE POLICY "Anyone can read published test sets" ON test_sets FOR SELECT USING (is_published = true);

-- Questions: only readable if test set is published (public) or user owns purchase
CREATE POLICY "Public questions" ON questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM test_sets WHERE id = questions.test_set_id AND is_published = true));

-- Purchases: users see own
CREATE POLICY "Users can see own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Test attempts: users see own
CREATE POLICY "Users see own attempts" ON test_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attempts" ON test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attempts" ON test_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Attempt answers: users see/insert/update own
CREATE POLICY "Users see own answers" ON attempt_answers FOR SELECT
  USING (EXISTS (SELECT 1 FROM test_attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid()));
CREATE POLICY "Users insert own answers" ON attempt_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM test_attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid()));
CREATE POLICY "Users update own answers" ON attempt_answers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM test_attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid()));

-- Service role bypass (for admin operations and webhooks)
CREATE POLICY "Service role full access users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access test_sets" ON test_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access attempts" ON test_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access answers" ON attempt_answers FOR ALL USING (true) WITH CHECK (true);
