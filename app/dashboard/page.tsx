'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">PBL Learning Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/chat"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                AI 对话
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">用户信息</h2>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  用户 ID
                </label>
                <p className="mt-1 text-lg">{user?.id}</p>
              </div>

              <div className="border-b pb-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  邮箱
                </label>
                <p className="mt-1 text-lg">{user?.email}</p>
              </div>

              <div className="border-b pb-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  注册时间
                </label>
                <p className="mt-1 text-lg">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleString('zh-CN')
                    : '未知'}
                </p>
              </div>

              <div className="border-b pb-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  最后登录
                </label>
                <p className="mt-1 text-lg">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString('zh-CN')
                    : '未知'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">快速操作</h3>
              <div className="space-y-3">
                <a
                  href="/chat"
                  className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  开始 AI 对话
                </a>
                <button className="block w-full text-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  查看学习历史
                </button>
                <button className="block w-full text-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  设置偏好
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">使用统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    对话次数
                  </span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    学习时长
                  </span>
                  <span className="text-2xl font-bold">0h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    完成任务
                  </span>
                  <span className="text-2xl font-bold">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
