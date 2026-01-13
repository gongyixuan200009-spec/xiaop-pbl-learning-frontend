'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Organization {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string
  is_active: boolean
  created_at: string
}

interface Prompt {
  id: string
  prompt_type: string
  stage_number: number | null
  prompt_name: string
  prompt_content: string
  system_prompt: string
  temperature: number
  max_tokens: number
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showEditPrompt, setShowEditPrompt] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)

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
    fetchOrganizations()
  }

  const fetchOrganizations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/organizations', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data.organizations || [])
        if (data.organizations?.length > 0) {
          setSelectedOrg(data.organizations[0])
          fetchPrompts(data.organizations[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPrompts = async (orgId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/organizations/${orgId}/prompts`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    }
  }

  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org)
    fetchPrompts(org.id)
  }

  const handleCreatePrompt = () => {
    setEditingPrompt({
      id: '',
      prompt_type: 'project_creation',
      stage_number: null,
      prompt_name: '',
      prompt_content: '',
      system_prompt: '',
      temperature: 0.7,
      max_tokens: 2000,
      is_active: true,
      created_at: '',
    })
    setShowEditPrompt(true)
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setShowEditPrompt(true)
  }

  const handleSavePrompt = async () => {
    if (!editingPrompt || !selectedOrg) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = `/api/admin/organizations/${selectedOrg.id}/prompts`
      const method = editingPrompt.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPrompt),
      })

      if (res.ok) {
        setShowEditPrompt(false)
        setEditingPrompt(null)
        fetchPrompts(selectedOrg.id)
      }
    } catch (error) {
      console.error('Failed to save prompt:', error)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!selectedOrg || !confirm('确定要删除这个 Prompt 吗？')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `/api/admin/organizations/${selectedOrg.id}/prompts?id=${promptId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      )

      if (res.ok) {
        fetchPrompts(selectedOrg.id)
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 返回主页
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                管理中心
              </h1>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 hover:bg-white/50 rounded-full"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：组织列表 */}
          <div className="col-span-3">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">我的组织</h2>
                <button
                  onClick={() => setShowCreateOrg(true)}
                  className="text-teal-600 hover:text-teal-700 text-2xl"
                >
                  +
                </button>
              </div>
              <div className="space-y-2">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgSelect(org)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedOrg?.id === org.id
                        ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-semibold">{org.name}</div>
                    <div className="text-xs opacity-75">{org.slug}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：Prompt 配置 */}
          <div className="col-span-9">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Prompt 配置
                  {selectedOrg && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({selectedOrg.name})
                    </span>
                  )}
                </h2>
                <button
                  onClick={handleCreatePrompt}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  + 新建 Prompt
                </button>
              </div>

              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {prompt.prompt_name}
                          </h3>
                          <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                            {prompt.prompt_type}
                          </span>
                          {prompt.stage_number && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Stage {prompt.stage_number}
                            </span>
                          )}
                          {!prompt.is_active && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              未激活
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {prompt.prompt_content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>温度: {prompt.temperature}</span>
                          <span>最大 tokens: {prompt.max_tokens}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditPrompt(prompt)}
                          className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded-lg"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {prompts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>还没有配置 Prompt</p>
                    <p className="text-sm">点击上方按钮创建第一个 Prompt</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt 编辑弹窗 */}
      {showEditPrompt && editingPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPrompt.id ? '编辑 Prompt' : '新建 Prompt'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prompt 名称
                </label>
                <input
                  type="text"
                  value={editingPrompt.prompt_name}
                  onChange={(e) =>
                    setEditingPrompt({ ...editingPrompt, prompt_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="例如：项目创建引导"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prompt 类型
                  </label>
                  <select
                    value={editingPrompt.prompt_type}
                    onChange={(e) =>
                      setEditingPrompt({ ...editingPrompt, prompt_type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="project_creation">项目创建</option>
                    <option value="stage_guidance">阶段指导</option>
                    <option value="evaluation">评估反馈</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    阶段编号（可选）
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={editingPrompt.stage_number || ''}
                    onChange={(e) =>
                      setEditingPrompt({
                        ...editingPrompt,
                        stage_number: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="1-6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prompt 内容
                </label>
                <textarea
                  value={editingPrompt.prompt_content}
                  onChange={(e) =>
                    setEditingPrompt({ ...editingPrompt, prompt_content: e.target.value })
                  }
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                  placeholder="输入 prompt 内容..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  系统 Prompt（可选）
                </label>
                <textarea
                  value={editingPrompt.system_prompt}
                  onChange={(e) =>
                    setEditingPrompt({ ...editingPrompt, system_prompt: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                  placeholder="系统级别的 prompt..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    温度 (Temperature)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={editingPrompt.temperature}
                    onChange={(e) =>
                      setEditingPrompt({
                        ...editingPrompt,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    最大 Tokens
                  </label>
                  <input
                    type="number"
                    value={editingPrompt.max_tokens}
                    onChange={(e) =>
                      setEditingPrompt({
                        ...editingPrompt,
                        max_tokens: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    状态
                  </label>
                  <select
                    value={editingPrompt.is_active ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setEditingPrompt({
                        ...editingPrompt,
                        is_active: e.target.value === 'active',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="active">激活</option>
                    <option value="inactive">未激活</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditPrompt(false)
                  setEditingPrompt(null)
                }}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleSavePrompt}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
