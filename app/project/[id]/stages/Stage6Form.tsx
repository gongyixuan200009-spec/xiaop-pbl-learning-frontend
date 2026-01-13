'use client'

import { useState, useEffect } from 'react'

interface Stage6FormProps {
  projectId: string
  onComplete: () => void
}

interface Stage6Data {
  achievements: string
  lessons_learned: string
  future_improvements: string
  personal_growth: string
}

export default function Stage6Form({ projectId, onComplete }: Stage6FormProps) {
  const [data, setData] = useState<Stage6Data>({
    achievements: '',
    lessons_learned: '',
    future_improvements: '',
    personal_growth: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stages/6`)
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
      const res = await fetch(`/api/projects/${projectId}/stages/6`, {
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-2">📝 阶段目标</h3>
        <p className="text-purple-800 text-sm">
          回顾整个项目过程，总结成果和经验教训，思考未来的改进方向和个人成长。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          项目成果 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.achievements}
          onChange={(e) => setData({ ...data, achievements: e.target.value })}
          placeholder="总结项目取得的成果，是否达到了预期目标？"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          经验教训 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.lessons_learned}
          onChange={(e) => setData({ ...data, lessons_learned: e.target.value })}
          placeholder="在项目过程中学到了什么？有哪些值得注意的经验教训？"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          未来改进 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.future_improvements}
          onChange={(e) => setData({ ...data, future_improvements: e.target.value })}
          placeholder="如果有机会重新做这个项目，你会如何改进？"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          个人成长 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.personal_growth}
          onChange={(e) => setData({ ...data, personal_growth: e.target.value })}
          placeholder="这个项目对你的个人成长有什么帮助？技能、思维方式等方面"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">🎉 恭喜！</h3>
        <p className="text-green-800 text-sm">
          完成这个阶段后，你将完成整个 PBL 学习流程。这是一个重要的里程碑！
        </p>
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
            !data.achievements.trim() ||
            !data.lessons_learned.trim() ||
            !data.future_improvements.trim() ||
            !data.personal_growth.trim()
          }
          className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          完成项目 🎉
        </button>
      </div>
    </div>
  )
}
