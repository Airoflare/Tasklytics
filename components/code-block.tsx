"use client"

import React, { useState, useRef } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  className?: string
}

export function CodeBlock({
  code,
  language,
  showLineNumbers = false,
  className
}: CodeBlockProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const { theme } = useTheme()
  const timeoutRef = useRef<NodeJS.Timeout>()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopyStatus('copied')

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)
    } catch (err) {
      setCopyStatus('error')
      timeoutRef.current = setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)
    }
  }

  const getCopyIcon = () => {
    switch (copyStatus) {
      case 'copied':
        return <Check className="w-3.5 h-3.5" />
      case 'error':
        return <Copy className="w-3.5 h-3.5" />
      default:
        return <Copy className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className={cn("relative group my-2 not-prose", className)}>
      {/* Copy button - positioned absolutely */}
      <button
        onClick={copyToClipboard}
        className={cn(
          "absolute top-3 right-4 z-10 p-1.5 rounded-md transition-all duration-200",
          "opacity-0 group-hover:opacity-100 focus:opacity-100",
          "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
          "hover:bg-white/80 dark:hover:bg-gray-800/80",
          "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100",
          copyStatus === 'copied' && "text-green-600 dark:text-green-400",
          copyStatus === 'error' && "text-red-600 dark:text-red-400"
        )}
        aria-label={copyStatus === 'copied' ? 'Copied!' : 'Copy code'}
        title={copyStatus === 'copied' ? 'Copied!' : 'Copy code'}
      >
        {getCopyIcon()}
      </button>

      {/* Code content with proper background */}
      <div className="bg-black/5 dark:bg-white/5 rounded-lg border-0 overflow-hidden">
        <div style={{ padding: '1.1rem' }}>
          <SyntaxHighlighter
            language={language || 'text'}
            style={theme === 'dark' ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              padding: '0 !important',
              fontSize: '0.825rem',
              lineHeight: '1.7',
              background: 'transparent !important',
              border: 'none !important',
              borderRadius: '0 !important',
              boxShadow: 'none !important',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace)',
                color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
              }
            }}
            showLineNumbers={true}
            wrapLines={false}
            wrapLongLines={false}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  )
}