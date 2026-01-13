'use client'

import { useState, useEffect } from 'react'

interface Stage1FormProps {
  projectId: string
  onComplete: () => void
}

interface Stage1Data {
  problem_statement: string
  target_users: string
  success_criteria: string
  constraints: string
}

export default function Stage1Form({ projectId, onComplete }: Stage1FormProps) {
  const [data, setData] = useState<Stage1Data>({
    problem_statement: '',
    target_users: '',
    success_criteria: '',
    constraints: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stages/1`)
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
      const res = await fetch(`/api/projects/${projectId}/stages/1`, {
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 阶段目标</h3>
        <p className="text-blue-800 text-sm">
          在这个阶段，你需要清晰地定义要解决的问题。明确问题的本质、目标用户、成功标准和限制条件。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          问题陈述 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.problem_statement}
          onChange={(e) => setData({ ...data, problem_statement: e.target.value })}
          placeholder="清晰地描述你要解决的问题是什么..."
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          提示：使用 5W1H 方法（What, Who, When, Where, Why, How）来描述问题
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          目标用户 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.target_users}
          onChange={(e) => setData({ ...data, target_users: e.target.value })}
          placeholder="这个问题影响哪些人？他们的特征是什么？"
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          成功标准 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.success_criteria}
          onChange={(e) => setData({ ...data, success_criteria: e.target.value })}
          placeholder="如何判断问题被成功解决？具体的衡量标准是什么？"
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">限制条件</label>
        <textarea
          value={data.constraints}
          onChange={(e) => setData({ ...data, constraints: e.target.value })}
          placeholder="有哪些限制条件？（时间、资源、技术等）"
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            !data.problem_statement.trim() ||
            !data.target_users.trim() ||
            !data.success_criteria.trim()
          }
          className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          完成并进入下一阶段 →
        </button>
      </div>
    </div>
  )
}
