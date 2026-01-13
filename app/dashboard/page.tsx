'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'

// 动态导入对话式创建组件
const ConversationalProjectCreator = dynamic(
  () => import('@/components/chat/ConversationalProjectCreator'),
  { ssr: false }
)

interface Project {
  id: string
  title: string
  description: string
  current_stage: number
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showConversationalCreator, setShowConversationalCreator] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    fetchProjects()
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStageInfo = (stage: number) => {
    const stages = [
      { name: '问题定义', icon: '🎯', color: 'from-blue-500 to-cyan-500' },
      { name: '背景研究', icon: '📚', color: 'from-cyan-500 to-teal-500' },
      { name: '方案设计', icon: '💡', color: 'from-teal-500 to-green-500' },
      { name: '实施开发', icon: '⚙️', color: 'from-green-500 to-emerald-500' },
      { name: '测试验证', icon: '🧪', color: 'from-emerald-500 to-teal-500' },
      { name: '总结反思', icon: '📝', color: 'from-orange-500 to-amber-500' },
    ]
    return stages[stage - 1] || stages[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-green-50">
      {/* 装饰性渐变背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-green-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                  PBL 学习平台
                </h1>
                <p className="text-xs text-gray-500">基于问题的学习</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full">
                  <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-green-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">{user.email?.split('@')[0]}</span>
                </div>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 hover:bg-white/50 rounded-full"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Hero Section - 创建按钮区域 */}
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent leading-tight">
            开始你的学习之旅
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            通过 AI 助手引导，轻松创建基于问题的学习项目
          </p>

          {/* 创建按钮 - Apple 风格 */}
          <button
            onClick={() => setShowConversationalCreator(true)}
            className="group relative inline-flex items-center gap-4 px-10 py-6 bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 text-white rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            {/* 按钮光泽效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">💬</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">创建新项目</div>
                <div className="text-sm opacity-90">与 AI 对话开始</div>
              </div>
            </div>
          </button>

          {/* 特性标签 */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {['AI 智能引导', '实时反馈', '结构化学习'].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-gray-700 border border-white/20 shadow-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
              <span className="text-6xl opacity-50">📋</span>
            </div>
            <p className="text-gray-500 text-lg">还没有项目，点击上方按钮创建第一个项目</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-900">我的项目</h3>
              <span className="text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
                {projects.length} 个项目
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const stageInfo = getStageInfo(project.current_stage)
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="group relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-white/20 hover:scale-105"
                  >
                    {/* 卡片渐变装饰 */}
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${stageInfo.color}`}></div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
                          {project.title}
                        </h3>
                        <div className="ml-3 text-4xl">{stageInfo.icon}</div>
                      </div>

                      <p className="text-gray-600 text-sm line-clamp-2 mb-6 leading-relaxed">
                        {project.description || '暂无描述'}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r ${stageInfo.color} text-white shadow-sm`}>
                          {stageInfo.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(project.updated_at).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${stageInfo.color} transition-all duration-500`}
                            style={{ width: `${(project.current_stage / 6) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {project.current_stage}/6
                        </span>
                      </div>
                    </div>

                    {/* 悬停效果 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-green-500/0 group-hover:from-teal-500/5 group-hover:to-green-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* 对话式创建组件 */}
      {showConversationalCreator && (
        <ConversationalProjectCreator
          onClose={() => {
            setShowConversationalCreator(false)
            fetchProjects() // 刷新项目列表
          }}
        />
      )}
    </div>
  )
}
