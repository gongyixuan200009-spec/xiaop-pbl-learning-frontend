'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [createOrganization, setCreateOrganization] = useState(false)
  const [organizationName, setOrganizationName] = useState('')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // Sign up with display name in metadata
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0]
            }
          }
        })

        if (signUpError) throw signUpError

        if (!authData.user) {
          throw new Error('注册失败：未返回用户信息')
        }

        // 手动创建用户配置文件和组织
        try {
          const userName = displayName || email.split('@')[0]

          // 1. 创建用户配置文件
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              display_name: userName
            })

          if (profileError) {
            console.error('创建用户配置文件失败:', profileError)
          }

          // 2. 创建默认组织
          const { data: defaultOrg, error: defaultOrgError } = await supabase
            .from('organizations')
            .insert({
              name: `${userName} 的组织`,
              slug: `user-${authData.user.id}`,
              description: '个人默认组织',
              owner_id: authData.user.id,
              settings: { is_default: true }
            })
            .select()
            .single()

          if (defaultOrgError) {
            console.error('创建默认组织失败:', defaultOrgError)
          } else if (defaultOrg) {
            // 3. 添加用户到默认组织
            await supabase.from('user_organizations').insert({
              user_id: authData.user.id,
              organization_id: defaultOrg.id,
              role: 'owner',
              is_active: true
            })

            // 4. 设置默认组织
            await supabase
              .from('user_profiles')
              .update({ default_organization_id: defaultOrg.id })
              .eq('id', authData.user.id)

            // 5. 创建默认提示词
            await supabase.from('organization_prompts').insert({
              organization_id: defaultOrg.id,
              prompt_type: 'project_creation',
              prompt_name: '默认项目创建提示词',
              prompt_content: '你是一个专业的 PBL（基于问题的学习）项目助手。你的任务是通过对话方式帮助用户创建一个结构化的学习项目。\n\n请按照以下步骤引导用户：\n\n1. 首先询问用户想要解决什么问题或学习什么主题\n2. 帮助用户明确问题陈述（problem statement）\n3. 询问项目标题\n4. 可选：询问目标受众、预期成果等补充信息\n\n在对话过程中：\n- 保持友好和鼓励的语气\n- 提出引导性问题帮助用户思考\n- 确保收集到的信息清晰明确\n- 当收集到标题和问题陈述后，告知用户可以创建项目了\n\n请用中文回复。',
              system_prompt: '你是一个专业的教育助手，擅长引导学生进行基于问题的学习。',
              is_active: true
            })
          }

          // 如果用户选择创建组织
          if (createOrganization && organizationName) {
            const { data: org, error: orgError } = await supabase
              .from('organizations')
              .insert({
                name: organizationName,
                slug: organizationName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
                description: `${organizationName} 组织`,
                owner_id: authData.user.id,
                settings: { is_default: false }
              })
              .select()
              .single()

            if (orgError) {
              console.error('创建组织失败:', orgError)
            } else if (org) {
              // 添加用户到新组织
              await supabase.from('user_organizations').insert({
                user_id: authData.user.id,
                organization_id: org.id,
                role: 'owner',
                is_active: true
              })

              // 创建默认提示词
              await supabase.from('organization_prompts').insert({
                organization_id: org.id,
                prompt_type: 'project_creation',
                prompt_name: '默认项目创建提示词',
                prompt_content: '你是一个专业的 PBL（基于问题的学习）项目助手。你的任务是通过对话方式帮助用户创建一个结构化的学习项目。\n\n请按照以下步骤引导用户：\n\n1. 首先询问用户想要解决什么问题或学习什么主题\n2. 帮助用户明确问题陈述（problem statement）\n3. 询问项目标题\n4. 可选：询问目标受众、预期成果等补充信息\n\n在对话过程中：\n- 保持友好和鼓励的语气\n- 提出引导性问题帮助用户思考\n- 确保收集到的信息清晰明确\n- 当收集到标题和问题陈述后，告知用户可以创建项目了\n\n请用中文回复。',
                system_prompt: '你是一个专业的教育助手，擅长引导学生进行基于问题的学习。',
                is_active: true
              })
            }
          }
        } catch (setupError: any) {
          console.error('设置用户数据失败:', setupError)
          // 不抛出错误，因为用户已经注册成功
        }

        alert('注册成功！请检查您的邮箱以验证账户。')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
            {isSignUp ? '创建新账户' : '登录您的账户'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  显示名称
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="您的名称"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isSignUp && (
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="createOrganization"
                    name="createOrganization"
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    checked={createOrganization}
                    onChange={(e) => setCreateOrganization(e.target.checked)}
                  />
                  <label htmlFor="createOrganization" className="ml-2 block text-sm text-gray-900">
                    注册为组织（可配置自定义提示词和任务）
                  </label>
                </div>

                {createOrganization && (
                  <div>
                    <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                      组织名称
                    </label>
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                      placeholder="例如：XX学校、XX培训机构"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      注册为组织后，您可以在管理页面配置自定义的 AI 提示词和学习任务
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-all"
            >
              {loading ? '处理中...' : isSignUp ? '注册' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-teal-600 hover:text-teal-500 font-medium"
            >
              {isSignUp ? '已有账户？点击登录' : '没有账户？点击注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
