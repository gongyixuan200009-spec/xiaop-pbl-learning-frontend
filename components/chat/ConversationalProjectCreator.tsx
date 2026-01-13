'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ExtractedFields {
  title?: string
  description?: string
  problem_statement?: string
  target_audience?: string
  expected_outcome?: string
}

export default function ConversationalProjectCreator({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [extractedFields, setExtractedFields] = useState<ExtractedFields>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [showJsonView, setShowJsonView] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: '你好！我是你的 PBL 项目助手。\n\n让我们一起创建一个基于问题的学习项目。首先，请告诉我：\n\n你想要解决什么问题？或者你对什么主题感兴趣？'
    }
    setMessages([welcomeMessage])
  }, [])

  // 发送消息
  const handleSend = async (message: string) => {
    // 添加用户消息
    const userMessage: Message = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      console.log('[Frontend] Sending message to API...')
      console.log('[Frontend] Message:', message)
      console.log('[Frontend] Chat history length:', messages.length)

      // 调用 API
      const response = await fetch('/api/chat/project-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message,
          chatHistory: messages,
          extractedFields,
        }),
      })

      console.log('[Frontend] Response status:', response.status)
      console.log('[Frontend] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Frontend] Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      console.log('[Frontend] Starting to read stream...')
      setIsStreaming(true)
      let fullContent = ''
      let buffer = ''
      let chunkCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('[Frontend] Stream complete. Total chunks:', chunkCount)
          break
        }

        chunkCount++
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.log('[Frontend] Received [DONE] signal')
              continue
            }

            try {
              const parsed = JSON.parse(data)
              console.log('[Frontend] Parsed SSE data:', parsed.type)

              if (parsed.type === 'content') {
                fullContent += parsed.content
                setStreamingContent(fullContent)
              } else if (parsed.type === 'extraction') {
                console.log('[Frontend] Extracted fields:', parsed.fields)
                setExtractedFields(prev => ({ ...prev, ...parsed.fields }))
              } else if (parsed.type === 'complete') {
                console.log('[Frontend] Is complete:', parsed.isComplete)
                setIsComplete(parsed.isComplete)
              } else if (parsed.type === 'error') {
                console.error('API Error:', parsed.error)
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: `抱歉，发生了错误：${parsed.error}\n\n请检查 API 配置或稍后重试。`
                }])
                setStreamingContent('')
                setIsStreaming(false)
                setIsLoading(false)
                return
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e, 'Line:', line)
            }
          }
        }
      }

      // 流式传输完成后，先清空流式内容，再添加完整消息
      setIsStreaming(false)
      setStreamingContent('')

      if (fullContent) {
        // 使用 setTimeout 确保状态更新顺序正确
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: fullContent }])
        }, 0)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，发生了错误。请重试。'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // 确认创建项目
  const handleConfirmCreate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: extractedFields.title || '未命名项目',
          description: extractedFields.description || '',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/project/${data.project.id}`)
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('创建项目失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 计算完成进度
  const requiredFields = ['title', 'problem_statement']
  const completedFields = requiredFields.filter(field => extractedFields[field as keyof ExtractedFields])
  const progress = (completedFields.length / requiredFields.length) * 100

  // PBL 步骤
  const steps = [
    { id: 1, name: '问题定义', icon: '🎯', description: '明确要解决的问题' },
    { id: 2, name: '背景研究', icon: '📚', description: '收集相关信息' },
    { id: 3, name: '方案设计', icon: '💡', description: '设计解决方案' },
    { id: 4, name: '实施开发', icon: '⚙️', description: '执行计划' },
    { id: 5, name: '测试验证', icon: '🧪', description: '验证效果' },
  ]

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 z-50 flex">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-green-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* 左侧信息面板 */}
      <div className="relative w-96 bg-white/80 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-2xl">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-teal-500 to-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <h2 className="text-xl font-bold text-white">创建 PBL 项目</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 进度条 */}
          {progress > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/90">收集进度</span>
                <span className="text-white font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2.5 rounded-full transition-all duration-500 shadow-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* 已收集信息 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* JSON 数据视图切换 */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">📋 项目信息</h3>
              <button
                onClick={() => setShowJsonView(!showJsonView)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {showJsonView ? '📋 卡片视图' : '{ } JSON 视图'}
              </button>
            </div>

            {/* JSON 视图 */}
            {showJsonView ? (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 overflow-x-auto shadow-lg border border-gray-700">
                <pre className="text-xs text-teal-400 font-mono">
                  {JSON.stringify({
                    extracted_fields: extractedFields,
                    is_complete: isComplete,
                    progress: `${Math.round(progress)}%`,
                    required_fields: requiredFields,
                    completed_fields: completedFields
                  }, null, 2)}
                </pre>
              </div>
            ) : (
              /* 卡片视图 */
              <div className="space-y-3">
                {extractedFields.title && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                    <div className="text-xs text-blue-600 font-semibold mb-1.5 flex items-center gap-1">
                      <span>📌</span> 项目标题
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{extractedFields.title}</div>
                  </div>
                )}
                {extractedFields.problem_statement && (
                  <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-4 shadow-sm border border-teal-100 hover:shadow-md transition-shadow">
                    <div className="text-xs text-teal-600 font-semibold mb-1.5 flex items-center gap-1">
                      <span>🎯</span> 问题陈述
                    </div>
                    <div className="text-sm text-gray-900">{extractedFields.problem_statement}</div>
                  </div>
                )}
                {extractedFields.description && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                    <div className="text-xs text-green-600 font-semibold mb-1.5 flex items-center gap-1">
                      <span>📝</span> 项目描述
                    </div>
                    <div className="text-sm text-gray-900">{extractedFields.description}</div>
                  </div>
                )}
                {extractedFields.target_audience && (
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-4 shadow-sm border border-cyan-100 hover:shadow-md transition-shadow">
                    <div className="text-xs text-cyan-600 font-semibold mb-1.5 flex items-center gap-1">
                      <span>👥</span> 目标受众
                    </div>
                    <div className="text-sm text-gray-900">{extractedFields.target_audience}</div>
                  </div>
                )}
                {extractedFields.expected_outcome && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                    <div className="text-xs text-orange-600 font-semibold mb-1.5 flex items-center gap-1">
                      <span>🎁</span> 预期成果
                    </div>
                    <div className="text-sm text-gray-900">{extractedFields.expected_outcome}</div>
                  </div>
                )}
                {Object.keys(extractedFields).length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8 bg-white/50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="text-3xl mb-2">💭</div>
                    <div>暂无收集信息</div>
                    <div className="text-xs mt-1">开始对话收集项目信息</div>
                  </div>
                )}
              </div>
            )}

            {/* PBL 步骤 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">🎓 PBL 学习步骤</h3>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all flex items-start gap-3"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{step.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">
                        Step {step.id}: {step.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 确认创建按钮 */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 border-t border-white/20"
            >
              <button
                onClick={handleConfirmCreate}
                disabled={isLoading}
                className="w-full bg-white text-green-600 py-4 rounded-xl font-bold text-base hover:bg-green-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    创建中...
                  </>
                ) : (
                  <>
                    <span className="text-xl">✓</span>
                    确认创建项目
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 右侧对话区域 */}
      <div className="relative flex-1 flex flex-col">
        {/* 对话头部 */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-8 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">与 AI 助手对话</h3>
              <p className="text-sm text-gray-600">通过对话方式收集项目信息</p>
            </div>
          </div>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} role={msg.role} content={msg.content} />
            ))}
            {isStreaming && streamingContent && (
              <MessageBubble role="assistant" content={streamingContent} isStreaming />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入区域 */}
        {!isComplete && (
          <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 px-8 py-6 shadow-lg">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSend={handleSend}
                disabled={isLoading || isStreaming}
                placeholder={isLoading ? 'AI 正在思考...' : '输入你的回答...'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
