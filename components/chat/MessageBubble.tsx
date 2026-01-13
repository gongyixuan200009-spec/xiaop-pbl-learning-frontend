'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export default function MessageBubble({ role, content, isStreaming = false }: MessageBubbleProps) {
  const [displayedContent, setDisplayedContent] = useState('')

  // 流式内容直接显示，历史消息也直接显示（不需要二次打字效果）
  useEffect(() => {
    setDisplayedContent(content)
  }, [content])

  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 头像 */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-gray-300'
        }`}>
          <span className="text-white text-sm font-medium">
            {isUser ? '我' : 'AI'}
          </span>
        </div>

        {/* 消息内容 */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}>
          <div className="whitespace-pre-wrap break-words">
            {displayedContent}
            {isStreaming && <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
