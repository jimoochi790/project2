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
import { createSubject, updateSubject, deleteSubject } from "./page"
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react"
import type { Subject } from "@/types"

export function SubjectTable({ subjects }: { subjects: Subject[] }) {
  const [editing, setEditing] = useState<Subject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<Subject | null>(null)
  const [level, setLevel] = useState<"OC" | "Selective">("OC")

  function openAdd() {
    setEditing(null)
    setLevel("OC")
    setDialogOpen(true)
  }

  function openEdit(s: Subject) {
    setEditing(s)
    setLevel(s.level)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd}>
          <PlusIcon className="size-4" />
          Add Subject
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No subjects yet. Create your first subject.
                </TableCell>
              </TableRow>
            )}
            {subjects.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.slug}</TableCell>
                <TableCell>
                  <Badge variant={s.level === "OC" ? "default" : "secondary"}>
                    {s.level}
                  </Badge>
                </TableCell>
                <TableCell>Year {s.grade}</TableCell>
                <TableCell>{s.sort_order}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEdit(s)}>
                      <PencilIcon className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeleting(s)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Subject" : "Add Subject"}
            </DialogTitle>
          </DialogHeader>
          <form
            action={async (formData) => {
              if (editing) {
                formData.append("id", String(editing.id))
                await updateSubject(formData)
              } else {
                await createSubject(formData)
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
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={editing?.slug ?? ""}
                required
                placeholder="e.g. mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
                placeholder="Subject description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={level}
                  onValueChange={(v) => setLevel(v as "OC" | "Selective")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{level}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OC">OC</SelectItem>
                    <SelectItem value="Selective">Selective</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="level" value={level} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  name="grade"
                  type="number"
                  defaultValue={editing?.grade ?? 4}
                  required
                  min={1}
                  max={12}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                defaultValue={editing?.sort_order ?? 0}
              />
            </div>
            <DialogFooter showCloseButton>
              <Button type="submit">
                {editing ? "Save Changes" : "Create Subject"}
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
            <DialogTitle>Delete Subject</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleting?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter showCloseButton>
            <form
              action={async () => {
                if (!deleting) return
                const fd = new FormData()
                fd.append("id", String(deleting.id))
                await deleteSubject(fd)
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
