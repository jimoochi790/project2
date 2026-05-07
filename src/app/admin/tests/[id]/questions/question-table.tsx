"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  moveQuestionUp,
  moveQuestionDown,
} from "./page"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react"
import type { Question, TestSet } from "@/types"

interface TestSetWithSubject extends TestSet {
  subjects?: { id: number; name: string; level: string } | null
}

export function QuestionTable({
  testSetId,
  testSet,
  questions,
}: {
  testSetId: number
  testSet: TestSetWithSubject
  questions: Question[]
}) {
  const [editing, setEditing] = useState<Question | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<Question | null>(null)
  const [correctOption, setCorrectOption] = useState<string>("A")

  function openAdd() {
    setEditing(null)
    setCorrectOption("A")
    setDialogOpen(true)
  }

  function openEdit(q: Question) {
    setEditing(q)
    setCorrectOption(q.correct_option)
    setDialogOpen(true)
  }

  const correctLabels: Record<string, string> = {
    A: "A",
    B: "B",
    C: "C",
    D: "D",
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd}>
          <PlusIcon className="size-4" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No questions yet. Add your first question.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q, idx) => (
                <TableRow key={q.id}>
                  <TableCell className="text-muted-foreground">
                    {q.question_number}
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate">
                    {q.question_text}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {q.correct_option}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={idx === 0}
                        onClick={async () => {
                          const fd = new FormData()
                          fd.append("id", String(q.id))
                          fd.append("test_set_id", String(testSetId))
                          await moveQuestionUp(fd)
                        }}
                      >
                        <ChevronUpIcon className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={idx === questions.length - 1}
                        onClick={async () => {
                          const fd = new FormData()
                          fd.append("id", String(q.id))
                          fd.append("test_set_id", String(testSetId))
                          await moveQuestionDown(fd)
                        }}
                      >
                        <ChevronDownIcon className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEdit(q)}
                      >
                        <PencilIcon className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleting(q)}
                      >
                        <TrashIcon className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>
          <form
            action={async (formData) => {
              formData.set("test_set_id", String(testSetId))
              formData.set("correct_option", correctOption)
              if (editing) {
                formData.append("id", String(editing.id))
                await updateQuestion(formData)
              } else {
                await createQuestion(formData)
              }
              setDialogOpen(false)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question_number">Question Number</Label>
                <Input
                  id="question_number"
                  name="question_number"
                  type="number"
                  defaultValue={
                    editing?.question_number ?? questions.length + 1
                  }
                  required
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correct_option">Correct Answer</Label>
                <Select
                  value={correctOption}
                  onValueChange={(v) => v && setCorrectOption(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {correctLabels[correctOption]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question_text">Question Text</Label>
              <Textarea
                id="question_text"
                name="question_text"
                defaultValue={editing?.question_text ?? ""}
                required
                placeholder="Enter the question text"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="option_a">Option A</Label>
                <Input
                  id="option_a"
                  name="option_a"
                  defaultValue={editing?.option_a ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="option_b">Option B</Label>
                <Input
                  id="option_b"
                  name="option_b"
                  defaultValue={editing?.option_b ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="option_c">Option C</Label>
                <Input
                  id="option_c"
                  name="option_c"
                  defaultValue={editing?.option_c ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="option_d">Option D</Label>
                <Input
                  id="option_d"
                  name="option_d"
                  defaultValue={editing?.option_d ?? ""}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution_text">Solution Text</Label>
              <Textarea
                id="solution_text"
                name="solution_text"
                defaultValue={editing?.solution_text ?? ""}
                placeholder="Explain the solution"
              />
            </div>
            <DialogFooter showCloseButton>
              <Button type="submit">
                {editing ? "Save Changes" : "Add Question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete question{" "}
            <strong>#{deleting?.question_number}</strong>?
          </p>
          <DialogFooter showCloseButton>
            <form
              action={async () => {
                if (!deleting) return
                const fd = new FormData()
                fd.append("id", String(deleting.id))
                fd.append("test_set_id", String(testSetId))
                await deleteQuestion(fd)
                setDeleting(null)
              }}
            >
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
