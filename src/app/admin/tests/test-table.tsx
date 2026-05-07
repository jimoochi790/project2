"use client"

import { useState } from "react"
import Link from "next/link"
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
import { createTestSet, updateTestSet, deleteTestSet } from "./page"
import { formatPrice, formatDuration } from "@/lib/utils"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ListIcon,
} from "lucide-react"
import type { TestSet, Subject } from "@/types"

interface TestSetWithSubjects extends TestSet {
  subjects?: { id: number; name: string; level: string } | null
}

export function TestTable({
  tests,
  subjects,
}: {
  tests: TestSetWithSubjects[]
  subjects: Subject[]
}) {
  const [editing, setEditing] = useState<TestSetWithSubjects | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<TestSetWithSubjects | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")
  const [isPublished, setIsPublished] = useState(false)

  function openAdd() {
    setEditing(null)
    setSelectedSubjectId(subjects[0] ? String(subjects[0].id) : "")
    setIsPublished(false)
    setDialogOpen(true)
  }

  function openEdit(ts: TestSetWithSubjects) {
    setEditing(ts)
    setSelectedSubjectId(String(ts.subject_id))
    setIsPublished(ts.is_published)
    setDialogOpen(true)
  }

  const grouped = new Map<string, { subject: string; level: string; tests: TestSetWithSubjects[] }>()
  for (const t of tests) {
    const key = t.subjects?.name ?? `Subject #${t.subject_id}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        subject: key,
        level: t.subjects?.level ?? "",
        tests: [],
      })
    }
    grouped.get(key)!.tests.push(t)
  }

  return (
    <>
      {subjects.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You need to create subjects before adding test sets.
          </p>
          <Link href="/admin/subjects">
            <Button variant="outline">Go to Subjects</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={openAdd}>
              <PlusIcon className="size-4" />
              Add Test Set
            </Button>
          </div>

          {tests.length === 0 && (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
              No test sets yet.
            </div>
          )}

          {Array.from(grouped.entries()).map(([subjectName, group]) => (
            <div key={subjectName} className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                {subjectName}
                {group.level && (
                  <Badge variant="outline" className="text-xs">
                    {group.level}
                  </Badge>
                )}
              </h2>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.tests.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell className="font-medium">
                          {ts.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDuration(ts.duration_minutes)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatPrice(ts.price_cents)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={ts.is_published ? "default" : "secondary"}
                          >
                            {ts.is_published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ts.question_count ?? 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/tests/${ts.id}/questions`}>
                              <Button variant="ghost" size="icon-xs">
                                <ListIcon className="size-3" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => openEdit(ts)}
                            >
                              <PencilIcon className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setDeleting(ts)}
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
            </div>
          ))}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Test Set" : "Add Test Set"}
            </DialogTitle>
          </DialogHeader>
          <form
            action={async (formData) => {
              formData.set("subject_id", selectedSubjectId)
              formData.set("is_published", isPublished ? "on" : "")
              if (editing) {
                formData.append("id", String(editing.id))
                await updateTestSet(formData)
              } else {
                await createTestSet(formData)
              }
              setDialogOpen(false)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editing?.name ?? ""}
                required
                placeholder="e.g. Mathematics Practice Test 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject_id">Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={(v) => v && setSelectedSubjectId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {subjects.find((s) => String(s.id) === selectedSubjectId)
                      ?.name ?? "Select subject"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} ({s.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
                placeholder="Test set description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  defaultValue={editing?.duration_minutes ?? 60}
                  required
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_cents">Price ($)</Label>
                <Input
                  id="price_cents"
                  name="price_cents"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={
                    editing ? (editing.price_cents / 100).toFixed(2) : "0.00"
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="is_published">Published</Label>
            </div>
            <DialogFooter showCloseButton>
              <Button type="submit">
                {editing ? "Save Changes" : "Create Test Set"}
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
            <DialogTitle>Delete Test Set</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleting?.name}</strong>? This will also delete all
            associated questions.
          </p>
          <DialogFooter showCloseButton>
            <form
              action={async () => {
                if (!deleting) return
                const fd = new FormData()
                fd.append("id", String(deleting.id))
                await deleteTestSet(fd)
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
