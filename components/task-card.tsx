"use client"

import React, { memo, useState, useEffect, useRef } from "react"
import type { Task, Status, ViewType, Priority } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { format } from 'date-fns-tz/format'
import { toZonedTime } from 'date-fns-tz/toZonedTime'
import { useTimezone } from "@/lib/timezone-context"
import { Paperclip, Timer, Edit3, Eye, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface TaskCardProps {
  task: Task
  status?: Status
  priorities: Priority[]
  onClick: () => void
  viewType: ViewType
}

export const TaskCard = memo(({
  task,
  status,
  priorities,
  onClick,
  viewType,
}: TaskCardProps) => {
  const { timezone } = useTimezone();
  const { t } = useLanguage();
  const [descriptionMode, setDescriptionMode] = useState<'edit' | 'read'>('read');
  const [showCopyDropdown, setShowCopyDropdown] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [codeBlockCopyStatuses, setCodeBlockCopyStatuses] = useState<Map<string, 'idle' | 'copied'>>(new Map());
  const codeBlockIdsRef = useRef<Map<string, string>>(new Map());

  const formatDate = (date: string) => {
    const zonedDate = toZonedTime(new Date(date), timezone);
    return formatDistanceToNow(zonedDate, { addSuffix: true });
  };

  const formatDateShort = (date: string) => {
    const zonedDate = toZonedTime(new Date(date), timezone);
    return format(zonedDate, "MMM d", { timeZone: timezone });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyAsMarkdown = () => {
    if (!task.description) return;
    copyToClipboard(task.description);
    setShowCopyDropdown(false);
  };

  const copyAsText = () => {
    if (!task.description) return;
    // Simple markdown to text conversion
    const text = task.description
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim();
    copyToClipboard(text);
    setShowCopyDropdown(false);
  };

  const copyCodeBlock = async (code: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeBlockCopyStatuses(prev => new Map(prev.set(blockId, 'copied')));
      setTimeout(() => {
        setCodeBlockCopyStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(blockId, 'idle');
          return newMap;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const markdownComponents = {
    pre({ children, ...props }: any) {
      // Get the text content from the pre element
      const getTextContent = (node: any): string => {
        if (typeof node === 'string') return node
        if (Array.isArray(node)) return node.map(getTextContent).join('')
        if (node?.props?.children) return getTextContent(node.props.children)
        if (node?.value) return node.value
        return ''
      }

      const codeContent = getTextContent(children).trim()

      // Generate stable ID based on code content
      let blockId = codeBlockIdsRef.current.get(codeContent)
      if (!blockId) {
        blockId = `codeblock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
        codeBlockIdsRef.current.set(codeContent, blockId)
      }

      const copyStatus = codeBlockCopyStatuses.get(blockId) || 'idle'

      return (
        <div style={{ position: 'relative' }}>
          <pre {...props}>{children}</pre>
          {codeContent && (
            <button
              onClick={() => copyCodeBlock(codeContent, blockId)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: copyStatus === 'copied' ? '#10b981' : 'rgba(0, 0, 0, 0.5)',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.25rem 0.5rem',
                color: 'white',
                fontSize: '0.75rem',
                cursor: 'pointer',
                opacity: copyStatus === 'copied' ? 1 : 0,
                transition: 'all 0.2s ease',
                transform: copyStatus === 'copied' ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (copyStatus !== 'copied') {
                  e.currentTarget.style.opacity = '1'
                }
              }}
              onMouseLeave={(e) => {
                if (copyStatus !== 'copied') {
                  e.currentTarget.style.opacity = '0'
                }
              }}
            >
              {copyStatus === 'copied' ? '✓ Copied!' : 'Copy'}
            </button>
          )}
        </div>
      )
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCopyDropdown && !(event.target as Element).closest('.copy-dropdown')) {
        setShowCopyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCopyDropdown]);

  if (viewType === "cards") {
    return (
      <div
        className="group  dark:border-[#262626] rounded-md p-3 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700 flex flex-col h-full"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {status && (
            <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: status.color }} />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white mb-2 line-clamp-2">{task.title}</h3>
            {task.description && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDescriptionMode(descriptionMode === 'edit' ? 'read' : 'edit');
                    }}
                    className="flex items-center gap-1 text-xs text-[#737373]/70 dark:text-[#9E9E9E]/70 hover:text-[#737373] dark:hover:text-[#9E9E9E] transition-colors"
                  >
                    {descriptionMode === 'edit' ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Read</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                  <div className="relative copy-dropdown">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCopyDropdown(!showCopyDropdown);
                      }}
                      className="flex items-center gap-1 text-xs text-[#737373]/70 dark:text-[#9E9E9E]/70 hover:text-[#737373] dark:hover:text-[#9E9E9E] transition-colors"
                    >
                      {copyStatus === 'copied' ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    {showCopyDropdown && (
                      <div className="absolute left-0 top-6 z-50 w-40 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAsMarkdown();
                          }}
                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg text-[#737373] dark:text-white/90"
                        >
                          Copy as Markdown
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAsText();
                          }}
                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded-b-lg text-[#737373] dark:text-white/90"
                        >
                          Copy as Text
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {descriptionMode === 'edit' ? (
                  <p className="text-[#737373] dark:text-[#9E9E9E] text-sm line-clamp-3 whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <div className="prose prose-xs max-w-none dark:prose-invert prose-p:my-0 prose-p:text-[#737373] dark:prose-p:text-[#9E9E9E] prose-headings:text-white prose-strong:text-white prose-code:text-[#737373] dark:prose-code:text-[#9E9E9E]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={markdownComponents}
                    >
                      {task.description}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-700 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-[#737373] dark:text-[#9E9E9E]">
            {task.priorityId && (
              <Badge
                className="flex items-center gap-2 px-1 py-0 rounded-sm text-xs w-fit"
                style={{
                  color: priorities.find(p => p.id === task.priorityId)?.color || '#6b7280',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: priorities.find(p => p.id === task.priorityId)?.color || '#6b7280' }}
                />
                {priorities.find(p => p.id === task.priorityId)?.name}
              </Badge>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                <span>{formatDate(task.deadline)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors group text-[#737373] bg-black/5 dark:bg-[#090909] hover:text-black dark:hover:bg-white/5  dark:border-[#262626]/50"
      onClick={onClick}
    >
      {/* Status icon */}
      {status && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />}

      {/* Task title */}
      <div className="flex-1 min-w-0">
        <h3 className="dark:hover:text-white text-[#737373] dark:text-[#E8E7EA] text-sm font-normal transition-colors truncate">{task.title}</h3>
      </div>

      {/* Date */}
      {task.deadline && (
        <div className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#9E9E9E] whitespace-nowrap">
          <Timer className="w-4 h-4" />
          <span>{formatDate(task.deadline)}</span>
        </div>
      )}
      <div className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#9E9E9E] whitespace-nowrap">
          {task.priorityId && (
            <Badge
              className="flex items-center gap-2 px-1 py-0 rounded-sm text-xs w-fit"
              style={{
                color: priorities.find(p => p.id === task.priorityId)?.color || '#6b7280',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: priorities.find(p => p.id === task.priorityId)?.color || '#6b7280' }}
              />
              {priorities.find(p => p.id === task.priorityId)?.name}
            </Badge>
          )}
        </div>
      <div className="flex items-center gap-3 text-xs text-[#737373] dark:text-[#9E9E9E]">
        {/* Attachment count */}
        {task.attachments.length > 0 && (
          <div className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            <span>{task.attachments.length}</span>
          </div>
        )}
      </div>
    </div>
  )
})
