'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Stage1Form from './stages/Stage1Form'
import Stage2Form from './stages/Stage2Form'
import Stage3Form from './stages/Stage3Form'
import Stage4Form from './stages/Stage4Form'
import Stage5Form from './stages/Stage5Form'
import Stage6Form from './stages/Stage6Form'

interface Project {
  id: string
  title: string
  description: string
  current_stage: number
  created_at: string
  updated_at: string
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStage, setCurrentStage] = useState(1)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
        setCurrentStage(data.current_stage)
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStageInfo = (stage: number) => {
    const stages = [
      { name: '问题定义', icon: '🎯', color: 'bg-red-100 text-red-700', description: '明确要解决的问题' },
      { name: '背景研究', icon: '📚', color: 'bg-orange-100 text-orange-700', description: '收集相关资料和信息' },
      { name: '方案设计', icon: '💡', color: 'bg-yellow-100 text-yellow-700', description: '设计解决方案' },
      { name: '实施开发', icon: '⚙️', color: 'bg-green-100 text-green-700', description: '实现你的方案' },
      { name: '测试验证', icon: '🧪', color: 'bg-blue-100 text-blue-700', description: '测试和验证方案' },
      { name: '总结反思', icon: '📝', color: 'bg-purple-100 text-purple-700', description: '总结经验和反思' },
    ]
    return stages[stage - 1] || stages[0]
  }

  const handleStageComplete = async () => {
    if (!project) return

    const nextStage = Math.min(currentStage + 1, 6)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_stage: nextStage }),
      })

      if (res.ok) {
        setCurrentStage(nextStage)
        setProject({ ...project, current_stage: nextStage })
      }
    } catch (error) {
      console.error('Failed to update stage:', error)
    }
  }

  const renderStageForm = () => {
    const commonProps = {
      projectId,
      onComplete: handleStageComplete,
    }

    switch (currentStage) {
      case 1:
        return <Stage1Form {...commonProps} />
      case 2:
        return <Stage2Form {...commonProps} />
      case 3:
        return <Stage3Form {...commonProps} />
      case 4:
        return <Stage4Form {...commonProps} />
      case 5:
        return <Stage5Form {...commonProps} />
      case 6:
        return <Stage6Form {...commonProps} />
      default:
        return <Stage1Form {...commonProps} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">项目不存在</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:underline"
          >
            返回看板
          </button>
        </div>
      </div>
    )
  }

  const stageInfo = getStageInfo(currentStage)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 返回
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${stageInfo.color} flex items-center gap-2`}>
              <span className="text-2xl">{stageInfo.icon}</span>
              <div>
                <div className="text-xs font-medium">当前阶段</div>
                <div className="text-sm font-bold">{stageInfo.name}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stage Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((stage) => {
              const info = getStageInfo(stage)
              const isActive = stage === currentStage
              const isCompleted = stage < currentStage
              const isLocked = stage > project.current_stage

              return (
                <div key={stage} className="flex items-center">
                  <button
                    onClick={() => !isLocked && setCurrentStage(stage)}
                    disabled={isLocked}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-50 ring-2 ring-blue-500'
                        : isCompleted
                        ? 'hover:bg-gray-50 cursor-pointer'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200'
                      }`}
                    >
                      {isCompleted ? '✓' : info.icon}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600">阶段 {stage}</div>
                      <div className="text-xs font-semibold">{info.name}</div>
                    </div>
                  </button>
                  {stage < 6 && (
                    <div
                      className={`w-8 h-1 mx-2 ${
                        stage < currentStage ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{stageInfo.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">{stageInfo.name}</h2>
                <p className="text-gray-600">{stageInfo.description}</p>
              </div>
            </div>
          </div>

          {renderStageForm()}
        </div>
      </main>
    </div>
  )
}
