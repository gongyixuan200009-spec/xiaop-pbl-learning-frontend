'use client'

import { useState, useEffect } from 'react'

interface Stage3FormProps {
  projectId: string
  onComplete: () => void
}

interface Stage3Data {
  solution_overview: string
  technical_approach: string
  architecture_design: string
  implementation_plan: string
}

export default function Stage3Form({ projectId, onComplete }: Stage3FormProps) {
  const [data, setData] = useState<Stage3Data>({
    solution_overview: '',
    technical_approach: '',
    architecture_design: '',
    implementation_plan: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stages/3`)
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
      const res = await fetch(`/api/projects/${projectId}/stages/3`, {
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 阶段目标</h3>
        <p className="text-yellow-800 text-sm">
          基于前期研究，设计具体的解决方案。包括技术选型、架构设计和实施计划。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          方案概述 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.solution_overview}
          onChange={(e) => setData({ ...data, solution_overview: e.target.value })}
          placeholder="简要描述你的解决方案的核心思路和创新点"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          技术方案 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.technical_approach}
          onChange={(e) => setData({ ...data, technical_approach: e.target.value })}
          placeholder="描述技术选型、工具和框架的选择及理由"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          提示：说明为什么选择这些技术，它们如何帮助解决问题
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          架构设计 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.architecture_design}
          onChange={(e) => setData({ ...data, architecture_design: e.target.value })}
          placeholder="描述系统架构、模块划分和数据流"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          实施计划 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.implementation_plan}
          onChange={(e) => setData({ ...data, implementation_plan: e.target.value })}
          placeholder="列出实施步骤和里程碑"
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
            !data.solution_overview.trim() ||
            !data.technical_approach.trim() ||
            !data.architecture_design.trim() ||
            !data.implementation_plan.trim()
          }
          className="flex-1 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          完成并进入下一阶段 →
        </button>
      </div>
    </div>
  )
}
