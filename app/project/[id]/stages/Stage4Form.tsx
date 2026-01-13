'use client'

import { useState, useEffect } from 'react'

interface Stage4FormProps {
  projectId: string
  onComplete: () => void
}

interface Stage4Data {
  implementation_progress: string
  code_repository: string
  challenges_faced: string
  solutions_applied: string
}

export default function Stage4Form({ projectId, onComplete }: Stage4FormProps) {
  const [data, setData] = useState<Stage4Data>({
    implementation_progress: '',
    code_repository: '',
    challenges_faced: '',
    solutions_applied: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stages/4`)
      if (res.ok) {
        const stageData = await res.json()
        if (stageData.fields) {
          setData(stageData.fields)
        }
      }
    } catch (error) {
      console.error('Failed to fetch stage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/stages/4`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: data }),
      })

      if (res.ok) {
        alert('保存成功！')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    await handleSave()
    onComplete()
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">⚙️ 阶段目标</h3>
        <p className="text-green-800 text-sm">
          按照设计方案进行实际开发，记录实施过程中遇到的问题和解决方法。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          实施进度 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.implementation_progress}
          onChange={(e) => setData({ ...data, implementation_progress: e.target.value })}
          placeholder="描述当前的实施进度和已完成的功能模块"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">代码仓库</label>
        <input
          type="text"
          value={data.code_repository}
          onChange={(e) => setData({ ...data, code_repository: e.target.value })}
          placeholder="GitHub/GitLab 仓库链接（如有）"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          遇到的挑战 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.challenges_faced}
          onChange={(e) => setData({ ...data, challenges_faced: e.target.value })}
          placeholder="实施过程中遇到了哪些技术难题或其他挑战？"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          解决方法 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.solutions_applied}
          onChange={(e) => setData({ ...data, solutions_applied: e.target.value })}
          placeholder="你是如何解决这些挑战的？采用了什么方法？"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存草稿'}
        </button>
        <button
          onClick={handleComplete}
          disabled={
            saving ||
            !data.implementation_progress.trim() ||
            !data.challenges_faced.trim() ||
            !data.solutions_applied.trim()
          }
          className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          完成并进入下一阶段 →
        </button>
      </div>
    </div>
  )
}
