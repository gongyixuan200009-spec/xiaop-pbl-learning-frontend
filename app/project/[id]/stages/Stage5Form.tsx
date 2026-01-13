'use client'

import { useState, useEffect } from 'react'

interface Stage5FormProps {
  projectId: string
  onComplete: () => void
}

interface Stage5Data {
  test_plan: string
  test_results: string
  user_feedback: string
  improvements_made: string
}

export default function Stage5Form({ projectId, onComplete }: Stage5FormProps) {
  const [data, setData] = useState<Stage5Data>({
    test_plan: '',
    test_results: '',
    user_feedback: '',
    improvements_made: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stages/5`)
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
      const res = await fetch(`/api/projects/${projectId}/stages/5`, {
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
        <h3 className="font-semibold text-blue-900 mb-2">🧪 阶段目标</h3>
        <p className="text-blue-800 text-sm">
          对实现的方案进行全面测试和验证，收集用户反馈，并根据测试结果进行改进。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          测试计划 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.test_plan}
          onChange={(e) => setData({ ...data, test_plan: e.target.value })}
          placeholder="描述你的测试策略和测试用例"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          提示：包括功能测试、性能测试、用户测试等
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          测试结果 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.test_results}
          onChange={(e) => setData({ ...data, test_results: e.target.value })}
          placeholder="记录测试的结果，包括成功和失败的案例"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          用户反馈 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.user_feedback}
          onChange={(e) => setData({ ...data, user_feedback: e.target.value })}
          placeholder="收集目标用户的反馈和建议"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          改进措施 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.improvements_made}
          onChange={(e) => setData({ ...data, improvements_made: e.target.value })}
          placeholder="基于测试和反馈，你做了哪些改进？"
          rows={4}
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
            !data.test_plan.trim() ||
            !data.test_results.trim() ||
            !data.user_feedback.trim() ||
            !data.improvements_made.trim()
          }
          className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          完成并进入下一阶段 →
        </button>
      </div>
    </div>
  )
}
