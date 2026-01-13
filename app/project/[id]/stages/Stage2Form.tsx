'use client'

import { useState, useEffect } from 'react'

interface Stage2FormProps {
  projectId: string
  onComplete: () => void
}

interface Stage2Data {
  research_sources: string
  key_findings: string
  existing_solutions: string
  gaps_identified: string
}

export default function Stage2Form({ projectId, onComplete }: Stage2FormProps) {
  const [data, setData] = useState<Stage2Data>({
    research_sources: '',
    key_findings: '',
    existing_solutions: '',
    gaps_identified: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stages/2`)
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
      const res = await fetch(`/api/projects/${projectId}/stages/2`, {
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
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-900 mb-2">📚 阶段目标</h3>
        <p className="text-orange-800 text-sm">
          收集和分析与问题相关的背景信息，了解现有解决方案，识别知识空白和改进机会。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          研究来源 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.research_sources}
          onChange={(e) => setData({ ...data, research_sources: e.target.value })}
          placeholder="列出你查阅的资料来源（书籍、论文、网站、专家访谈等）"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          提示：包括学术文献、行业报告、用户调研、竞品分析等
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          关键发现 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.key_findings}
          onChange={(e) => setData({ ...data, key_findings: e.target.value })}
          placeholder="总结研究中的重要发现和洞察"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          现有解决方案 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.existing_solutions}
          onChange={(e) => setData({ ...data, existing_solutions: e.target.value })}
          placeholder="描述目前已有的解决方案及其优缺点"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          识别的空白 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.gaps_identified}
          onChange={(e) => setData({ ...data, gaps_identified: e.target.value })}
          placeholder="现有方案有哪些不足？你的方案可以如何改进？"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            !data.research_sources.trim() ||
            !data.key_findings.trim() ||
            !data.existing_solutions.trim() ||
            !data.gaps_identified.trim()
          }
          className="flex-1 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          完成并进入下一阶段 →
        </button>
      </div>
    </div>
  )
}
