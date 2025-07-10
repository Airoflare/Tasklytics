"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Task, Status } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ChevronDown } from "lucide-react"
import { saveAttachment } from "@/lib/attachment-db"

import { useLanguage } from "@/lib/language-context"

import type { Task, Status, Tag, Priority } from "@/lib/types"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: Partial<Task>) => void
  statuses: Status[]
  tags: Tag[]
  priorities: Priority[]
}

export function CreateTaskModal({ isOpen, onClose, onSubmit, statuses, tags, priorities }: CreateTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [statusId, setStatusId] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [priorityId, setPriorityId] = useState<string | undefined>(undefined)
  const [deadline, setDeadline] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      if (statuses.length > 0 && !statusId) {
        setStatusId(statuses[0].id)
      }
    }
  }, [isOpen, statuses, statusId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !statusId) return

    const attachmentIds: string[] = []
    for (const file of attachments) {
      const id = await saveAttachment(file)
      attachmentIds.push(id)
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      statusId,
      tags: selectedTags,
      priorityId,
      deadline: deadline || undefined,
      attachments: attachmentIds,
    })

    setTitle("")
    setDescription("")
    setStatusId("")
    setSelectedTags([])
    setDeadline("")
    setAttachments([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      if (attachments.length + newFiles.length > 10) {
        alert(t("You can upload a maximum of 10 images."))
        return
      }
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-black  text-[#737373] dark:text-[#E8E7EA] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("Add New Task")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[#737373] dark:text-[#9E9E9E] block mb-2">{t("Task Name")}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("Enter task name...")}
              className=" border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626]"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#737373] dark:text-[#9E9E9E] block mb-2">{t("Description")}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("Enter task description...")}
              className="min-h-[100px] border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#737373] dark:text-[#9E9E9E] block mb-2">{t("Status")}</label>
              <Select value={statusId} onValueChange={setStatusId} required>
                <SelectTrigger className="border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626]">
                  <SelectValue placeholder={t("Select status...")} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black/90 rounded-lg border-black/10 dark:border-white/10">
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id} className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#000]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#737373] dark:text-[#9E9E9E] block mb-2">{t("Priority")}</label>
              <Select onValueChange={(value) => setPriorityId(value)} value={priorityId}>
                <SelectTrigger className=" border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626]">
                  <SelectValue placeholder={t("Select priority...")} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black/90 rounded-lg border-black/10 dark:border-white/10">
                  {priorities.length === 0 ? (
                    <div className="p-2 text-sm text-white-600 dark:bg-[#151515]">
                      {t("Create a new priority from settings page first")}
                    </div>
                  ) : (
                    priorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id} className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#000]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priority.color }} />
                          {priority.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#737373] dark:text-[#9E9E9E] block mb-2">{t("Deadline")}</label>
              <div className="relative">
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  onClick={(e) => e.target.showPicker()} // Ensure picker opens on focus
                  className="border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626] appearance-none pr-10"
                />
                <ChevronDown className="h-4 w-4 shrink-0 absolute mr-1 top-1/2 right-2 transform -translate-y-1/2 text-[#737373] dark:text-[#9E9E9E] transition-transform duration-200" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#737373] dark:text-[#9E9E9E] block mb-2">{t("Tags")}</label>
              <Select onValueChange={(value) => setSelectedTags(value ? [value] : [])}>
                <SelectTrigger className="border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626]">
                  <SelectValue placeholder={t("Select tags...")} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black/90 rounded-lg border-black/10 dark:border-white/10">
                  {tags.length === 0 ? (
                    <div className="p-2 text-sm text-white-600 dark:bg-[#151515]">
                      {t("Create a new tag from settings page first")}
                    </div>
                  ) : (
                    tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id} className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#000]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[#737373] dark:text-[#9E9E9E] block mb-2">{t("Attachments")}</label>
            <input
              id="attachments-input"
              type="file"
              multiple
              accept="image/*, application/pdf, text/plain, application/zip"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => document.getElementById("attachments-input")?.click()}
              variant="outline"
              className="w-full justify-center border-gray-700   dark:text-[#E8E7EA] bg-black/10 text-black/90 hover:text-black/90 text-sm cursor-pointer dark:bg-white/10 dark:hover:bg-white/20 dark:border-[#262626] border-none"
            >
              {t("Choose Files")}
            </Button>
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="relative w-16 h-16">
                  <img
                    src={URL.createObjectURL(file) || "/placeholder.svg"}
                    alt={file.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                  >
                    <X className="w-3 h-3 " />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" className="text-[#737373] hover:bg-black/10 hover:text-black dark:text-[#9E9E9E] text-sm dark:hover:bg-white/10" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" className="text-white/90 hover:bg-black hover:text-white bg-black/90 text-sm dark:bg-white/90 dark:text-black dark:hover:bg-gray-300" disabled={!title.trim() || !statusId}>
              {t("Add Task")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
