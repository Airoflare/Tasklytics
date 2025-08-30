"use client"

import React, { useRef } from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ChevronsLeft, ChevronUp, ChevronDown, Trash2, Edit3, Eye, Copy, Check, Image } from "lucide-react"
import type { Task, Status, Tag, Priority } from "@/lib/types"
import { saveAttachment, getAttachment, deleteAttachment } from "@/lib/attachment-db"
import { formatDistanceToNow } from "date-fns"
import { toZonedTime } from 'date-fns-tz/toZonedTime'
import { format } from 'date-fns-tz/format'
import { useTimezone } from "@/lib/timezone-context"
import { useLanguage } from "@/lib/language-context"
import TextareaAutosize from "react-textarea-autosize"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './code-block'

interface TaskDetailViewProps {
  task: Task | null | undefined
  tasks: Task[]
  statuses: Status[]
  onClose: () => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  onNavigate: (task: Task) => void
  tags: Tag[]
  priorities: Priority[]
}

export function TaskDetailView({
  task,
  tasks,
  statuses,
  onClose,
  onUpdate,
  onDelete,
  onNavigate,
  tags,
  priorities,
}: TaskDetailViewProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(task || null)
  const [newlyAddedAttachments, setNewlyAddedAttachments] = useState<{ id: string; file: File }[]>([])
  const [loadedExistingAttachmentFiles, setLoadedExistingAttachmentFiles] = useState<{ id: string; file: File }[]>([])
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionMode, setDescriptionMode] = useState<'edit' | 'read'>('read')
  const [showCopyDropdown, setShowCopyDropdown] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')


  const { timezone } = useTimezone();
  const { t } = useLanguage();

  useEffect(() => {
    if (task) {
      setEditedTask(task)
      loadAttachments()
    } else {
      setEditedTask(null)
    }
  }, [task])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCopyDropdown && !(event.target as Element).closest('.copy-dropdown')) {
        setShowCopyDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCopyDropdown])

  const loadAttachments = async () => {
    if (!task) return
    const loadedFiles: { id: string; file: File }[] = []
    for (const attachmentId of task.attachments) {
      const file = await getAttachment(attachmentId)
      if (file) {
        loadedFiles.push({ id: attachmentId, file })
      }
    }
    setLoadedExistingAttachmentFiles(loadedFiles)
  }

  const handleUpdate = async (updates: Partial<Task>) => {
    if (!editedTask) return
    const updatedTask = { ...editedTask, ...updates }
    setEditedTask(updatedTask)
    onUpdate(editedTask.id, updates)
  }

  const handleDelete = async () => {
    if (!task) return

    const confirmed = window.confirm(t("Are you sure you want to delete this task? This action cannot be undone."))
    if (confirmed) {
      onDelete(task.id)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 1000)
    } catch (err) {
    }
  }

  const copyAsMarkdown = () => {
    if (!editedTask?.description) return
    copyToClipboard(editedTask.description)
    setShowCopyDropdown(false)
  }

  const copyAsText = () => {
    if (!editedTask?.description) return
    // Simple markdown to text conversion
    const text = editedTask.description
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim()
    copyToClipboard(text)
    setShowCopyDropdown(false)
  }

  const copyCodeBlock = async (code: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      // Update state to show copied
      setCodeBlockCopyStatuses(prev => {
        const newMap = new Map(prev)
        newMap.set(blockId, 'copied')
        return newMap
      })

      // Reset after 2 seconds
      setTimeout(() => {
        setCodeBlockCopyStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(blockId, 'idle')
          return newMap
        })
      }, 800)
    } catch (err) {
    }
  }

  const markdownComponents = {
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');

      return !inline && match ? (
        <CodeBlock
          code={codeContent}
          language={match[1]}
          className="my-4"
        />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editedTask) return

    const newFiles = Array.from(e.target.files)
    const currentAttachmentIds = new Set(editedTask.attachments)
    const newAttachmentNames = new Set(newlyAddedAttachments.map(({ file }) => file.name))

    const filesToAdd: { id: string; file: File }[] = []
    const idsToAddToTask: string[] = []

    for (const file of newFiles) {
      if (!newAttachmentNames.has(file.name)) {
        const id = await saveAttachment(file)
        filesToAdd.push({ id, file })
        idsToAddToTask.push(id)
      }
    }

    setNewlyAddedAttachments((prev) => [...prev, ...filesToAdd])
    handleUpdate({ attachments: [...editedTask.attachments, ...idsToAddToTask] })
  }

  const handleRemoveAttachment = async (attachmentId: string, isNew: boolean) => {
    if (isNew) {
      setNewlyAddedAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
    } else {
      if (!editedTask) return
      await deleteAttachment(attachmentId)
      handleUpdate({ attachments: editedTask.attachments.filter((id) => id !== attachmentId) })
      setLoadedExistingAttachmentFiles((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
    }
  }

  const getCurrentTaskIndex = (currentTask: Task | null | undefined) => {
    if (!currentTask) return -1 // Return -1 if no task is provided
    return tasks.findIndex((t) => t.id === currentTask.id)
  }

  const handlePreviousTask = () => {
    const currentIndex = getCurrentTaskIndex(editedTask)
    if (currentIndex > 0) {
      const previousTask = tasks[currentIndex - 1]
      onNavigate(previousTask)
    }
  }

  const handleNextTask = () => {
    const currentIndex = getCurrentTaskIndex(editedTask)
    if (currentIndex < tasks.length - 1) {
      const nextTask = tasks[currentIndex + 1]
      onNavigate(nextTask)
    }
  }

  const allAttachmentsForDisplay = [
    ...newlyAddedAttachments.map((attachment) => ({
      type: "new",
      name: attachment.file.name,
      url: URL.createObjectURL(attachment.file),
      id: attachment.id,
    })),
    ...loadedExistingAttachmentFiles.map((attachment) => ({
      type: "existing",
      name: attachment.file.name,
      url: URL.createObjectURL(attachment.file),
      id: attachment.id,
    })),
  ]

  const uniqueAttachmentsForDisplay = Array.from(
    new Map(allAttachmentsForDisplay.map((item) => [item.id, item])).values(),
  )

  if (!editedTask) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">{t("Loading task...")}</p>
          <p className="text-sm text-gray-500">{t("Please wait while we fetch the details.")}</p>
        </div>
      </div>
    )
  }

  const currentIndex = getCurrentTaskIndex(editedTask)
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < tasks.length - 1

  return (
    <div className="flex-1 flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 dark:bg-black border-black/5 dark:border-white/5 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose} className="h-8 w-8 p-0 bg-transparent hover:bg-black/10 dark:hover:bg-white/10">
                <ChevronsLeft className="w-6 h-6 text-[#737373] dark:text-white/90" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousTask}
                disabled={!canGoPrevious}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="w-4 h-4 text-[#737373] dark:text-white/90" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNextTask} disabled={!canGoNext} className="h-8 w-8 p-0">
                <ChevronDown className="w-4 h-4 text-[#737373] dark:text-white/90" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-transparent hover:bg-black/10 dark:hover:bg-white/10"
                onClick={() => document.getElementById("task-attachments-input")?.click()}
              >
                <Image className="w-4 h-4 text-[#737373] dark:text-white/90" />
              </Button>
              <div className="relative copy-dropdown">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCopyDropdown(!showCopyDropdown)}
                  className="h-8 w-8 p-0 bg-transparent hover:bg-black/10 dark:hover:bg-white/10"
                >
                  {copyStatus === 'copied' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#737373] dark:text-white/90" />
                  )}
                </Button>
                {showCopyDropdown && (
                  <div className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <button
                      onClick={copyAsMarkdown}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg text-[#737373] dark:text-white/90"
                    >
                      Copy as Markdown
                    </button>
                    <button
                      onClick={copyAsText}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-b-lg text-[#737373] dark:text-white/90"
                    >
                      Copy as Text
                    </button>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleDelete} className="h-8 w-8 p-0 bg-transparent hover:bg-black/10 dark:hover:bg-white/10">
                <Trash2 className="w-4 h-4  text-[#737373] dark:text-white/90" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 mt-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Task Title */}
            <TextareaAutosize
              readOnly={!isEditingTitle}
              value={editedTask.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              onFocus={() => setIsEditingTitle(true)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setIsEditingTitle(false)
                  e.preventDefault()
                }
              }}
              className="w-full resize-none appearance-none bg-transparent p-0 text-xl font-medium dark:bg-black  text-[#737373] dark:text-[#E8E7EA] placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none"
              placeholder={t("Task title...")}
            />

            {/* Task Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDescriptionMode(descriptionMode === 'edit' ? 'read' : 'edit')}
                    className="h-8 w-8 p-0 hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    {descriptionMode === 'edit' ? (
                      <Eye className="w-4 h-4 text-[#737373] dark:text-white/90" />
                    ) : (
                      <Edit3 className="w-4 h-4 text-[#737373] dark:text-white/90" />
                    )}
                  </Button>
                  <span className="text-xs text-[#737373]/50 dark:text-[#AEAFB1]/50">
                    {descriptionMode === 'edit' ? t('Edit Mode') : t('Read Mode')}
                  </span>
                </div>
              </div>

              {descriptionMode === 'edit' ? (
                <TextareaAutosize
                  readOnly={!isEditingDescription}
                  value={editedTask.description}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  onFocus={() => setIsEditingDescription(true)}
                  onBlur={() => setIsEditingDescription(false)}
                  className="w-full resize-none appearance-none bg-transparent p-0 text-base dark:bg-black text-[#737373]/70 dark:text-[#AEAFB1] placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none"
                  placeholder={t("Add a description...")}
                />
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {editedTask.description ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {editedTask.description}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-[#737373]/50 dark:text-[#AEAFB1]/50 italic">
                      {t("No description added yet. Switch to edit mode to add one.")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Attachments */}
            {uniqueAttachmentsForDisplay.length > 0 && (
              <div>
                <h3 className="text-md font-normal mb-4 mt-16 text-[#737373]/50 dark:text-[#AEAFB1]/50">{t("Attachments")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {uniqueAttachmentsForDisplay.map((attachment, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={attachment.url || "/placeholder.svg"}
                        alt={attachment.name}
                        className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                        onClick={() => setFullscreenImage(attachment.url)}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0 bg-black/50 hover:bg-black/70"
                          onClick={() => handleRemoveAttachment(attachment.id, attachment.type === "new")}
                        >
                          <Trash2 className="w-9 h-9" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden file input for attachments */}
            <input
              id="task-attachments-input"
              type="file"
              multiple
              accept="image/*, application/pdf, text/plain, application/zip"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l dark:bg-black border-r border-gray-200 dark:border-gray-900 dark:border-white/10 flex flex-col p-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[#737373] dark:text-[#9E9E9E] mb-3 mt-12">{t("Details")}</h3>
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] block mb-1">{t("Status")}</label>
              <Select value={editedTask.statusId} onValueChange={(value) => handleUpdate({ statusId: value }) }>
                <SelectTrigger className="border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626]">
                  <SelectValue />
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

            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] block mb-1">{t("Priority")}</label>
              <Select value={editedTask.priorityId || ""} onValueChange={(value) => handleUpdate({ priorityId: value || undefined }) }>
                <SelectTrigger className="border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626]">
                  <SelectValue placeholder={t("Select priority")} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black/90 rounded-lg border-black/10 dark:border-white/10">
                  {priorities && priorities.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id} className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#000]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priority.color }} />
                        {priority.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] block mb-1">{t("Tags")}</label>
              <Select
                value={editedTask.tags[0] || ""}
                onValueChange={(value) => {
                  const newTags = value ? [value] : []
                  handleUpdate({ tags: newTags })
                }}
              >
                <SelectTrigger className="border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626]">
                  <SelectValue placeholder={t("Select a tag")} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black/90 rounded-lg border-black/10 dark:border-white/10">
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id} className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#000]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
            </div>
            
            
            {/* Deadline */}
            <div>
              <label className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] block mb-1">{t("Deadline")}</label>
              <div className="relative">
                <Input
                  type="datetime-local"
                  value={editedTask.deadline ? format(toZonedTime(new Date(editedTask.deadline), timezone), "yyyy-MM-dd'T'HH:mm") : ""}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} 
                  onChange={(e) => {
                    const newDeadline = e.target.value
                      ? toZonedTime(new Date(e.target.value), timezone).toISOString()
                      : undefined;
                    handleUpdate({ deadline: newDeadline });
                  }}
                  className="border-black/5 text-black dark:text-white/90 text-sm bg-black/5 dark:bg-black dark:border-[#262626] appearance-none pr-8" // Add padding-right for the icon
                  style={{appearance: 'none'}} 
                />
                <ChevronDown className="h-4 w-4 shrink-0 mr-1 absolute top-1/2 right-2 transform -translate-y-1/2 text-[#737373] dark:text-[#9E9E9E] transition-transform duration-200" />
              </div>
            </div>

            
            {/* Deadline Date */}
            {editedTask.deadline && (
              <div>
                <label className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] block mb-1">{t("Time Left")}</label>
                <div
                  className="text-sm text-[#737373] dark:text-[#E8E7EA]"
                  title={new Date(editedTask.deadline).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: timezone,
                  })}
                >
                  {formatDistanceToNow(toZonedTime(new Date(editedTask.deadline), timezone), { addSuffix: true })}
                </div>
              </div>
            )}

            {/* Created Date */}
            <div>
              <label className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] block mb-1">{t("Created")}</label>
              <div
                className="text-sm text-[#737373] dark:text-[#E8E7EA]"
                title={new Date(editedTask.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: timezone,
                })}
              >
                {formatDistanceToNow(toZonedTime(new Date(editedTask.createdAt), timezone), { addSuffix: true })}
              </div>
            </div>            
            
            {/* Updated Date */}
            <div>
              <label className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] block mb-1">{t("Last Modified")}</label>
              <div
                className="text-sm text-[#737373] dark:text-[#E8E7EA]"
                title={new Date(editedTask.updatedAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: timezone,
                })}
              >
                {formatDistanceToNow(toZonedTime(new Date(editedTask.updatedAt), timezone), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 text-white bg-gray-700 hover:bg-gray-600 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={fullscreenImage || "/placeholder.svg"}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
