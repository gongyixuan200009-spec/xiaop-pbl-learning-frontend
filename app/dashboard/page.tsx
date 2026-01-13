'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({ title: '', description: '' })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!newProject.title.trim()) return

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      })

      if (res.ok) {
        const project = await res.json()
        setProjects([project, ...projects])
        setShowCreateModal(false)
        setNewProject({ title: '', description: '' })
        router.push(`/project/${project.id}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const getStageInfo = (stage: number) => {
    const stages = [
      { name: '问题定义', icon: '🎯', color: 'bg-red-100 text-red-700' },
      { name: '背景研究', icon: '📚', color: 'bg-orange-100 text-orange-700' },
      { name: '方案设计', icon: '💡', color: 'bg-yellow-100 text-yellow-700' },
      { name: '实施开发', icon: '⚙️', color: 'bg-green-100 text-green-700' },
      { name: '测试验证', icon: '🧪', color: 'bg-blue-100 text-blue-700' },
      { name: '总结反思', icon: '📝', color: 'bg-purple-100 text-purple-700' },
    ]
    return stages[stage - 1] || stages[0]
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">项目看板</h1>
              <p className="text-sm text-gray-600 mt-1">基于问题的学习 (PBL) 平台</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              创建新项目
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stage Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">PBL 六阶段流程</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((stage) => {
              const info = getStageInfo(stage)
              return (
                <div key={stage} className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl mb-2">{info.icon}</div>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${info.color}`}>
                    阶段 {stage}
                  </div>
                  <div className="text-sm mt-2 font-medium">{info.name}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">还没有项目</h3>
            <p className="text-gray-600 mb-6">创建你的第一个 PBL 项目，开始学习之旅</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建项目
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const stageInfo = getStageInfo(project.current_stage)
              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold line-clamp-1">{project.title}</h3>
                      <span className="text-2xl">{stageInfo.icon}</span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {project.description || '暂无描述'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${stageInfo.color}`}>
                        {stageInfo.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(project.updated_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6].map((stage) => (
                          <div
                            key={stage}
                            className={`w-2 h-2 rounded-full ${
                              stage <= project.current_stage ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">
                        {project.current_stage}/6
                      </span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">查看详情 →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">创建新项目</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">项目标题</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="例如：智能垃圾分类系统"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">项目描述</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="简要描述你的项目..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={createProject}
                disabled={!newProject.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
