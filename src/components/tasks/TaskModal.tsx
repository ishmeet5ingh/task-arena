"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { ArenaTask } from "@/types";

function toLocalInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: FormDataEntryValue | null) {
  if (!value) return "";
  const text = String(value);
  return text ? new Date(text).toISOString() : "";
}

export function TaskModal({
  open,
  task,
  slot,
  onClose,
  onSaved
}: {
  open: boolean;
  task?: ArenaTask | null;
  slot?: number | null;
  onClose: () => void;
  onSaved: (task: ArenaTask) => void;
}) {
  const [loading, setLoading] = useState(false);
  const title = task ? "Edit task crate" : `Create task in slot ${(slot ?? 0) + 1}`;

  const defaults = useMemo(
    () => ({
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: task?.priority ?? "medium",
      boxPosition: task?.boxPosition ?? slot ?? 0,
      durationMinutes: task?.durationMinutes ?? 25,
      startTime: toLocalInput(task?.startTime),
      dueTime: toLocalInput(task?.dueTime)
    }),
    [task, slot]
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"),
      description: form.get("description"),
      priority: form.get("priority"),
      boxPosition: Number(form.get("boxPosition")),
      durationMinutes: Number(form.get("durationMinutes")),
      startTime: toIso(form.get("startTime")),
      dueTime: toIso(form.get("dueTime"))
    };

    const res = await fetch(task ? `/api/tasks/${task._id}` : "/api/tasks", {
      method: task ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not save task");
      return;
    }

    toast.success(task ? "Task updated" : "Task created");
    onSaved(data.task);
    onClose();
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <FieldLabel label="Title">
          <Input name="title" defaultValue={defaults.title} required placeholder="Ship the sprint review" />
        </FieldLabel>
        <FieldLabel label="Description">
          <Textarea name="description" defaultValue={defaults.description} placeholder="Brief, acceptance criteria, notes..." />
        </FieldLabel>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldLabel label="Priority">
            <Select name="priority" defaultValue={defaults.priority}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </FieldLabel>
          <FieldLabel label="Slot">
            <Select name="boxPosition" defaultValue={defaults.boxPosition}>
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index} value={index}>
                  Slot {index + 1}
                </option>
              ))}
            </Select>
          </FieldLabel>
          <FieldLabel label="Minutes">
            <Input name="durationMinutes" type="number" min={5} max={720} defaultValue={defaults.durationMinutes} />
          </FieldLabel>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="Start time">
            <Input name="startTime" type="datetime-local" defaultValue={defaults.startTime} />
          </FieldLabel>
          <FieldLabel label="Due time">
            <Input name="dueTime" type="datetime-local" defaultValue={defaults.dueTime} />
          </FieldLabel>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={loading}>{loading ? "Saving..." : "Save task"}</Button>
        </div>
      </form>
    </Modal>
  );
}
