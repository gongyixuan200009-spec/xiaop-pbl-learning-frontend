import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ExtractedFields {
  title?: string
  description?: string
  problem_statement?: string
  target_audience?: string
  expected_outcome?: string
}

// POST /api/chat/project-creation - 对话式项目创建
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户的默认组织
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_organization_id')
      .eq('id', user.id)
      .single()

    let organizationId = profile?.default_organization_id

    // 如果没有默认组织，尝试获取用户的第一个组织
    if (!organizationId) {
      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      organizationId = userOrgs?.organization_id
    }

    // 获取组织的项目创建提示词
    let customPrompt = null
    let customSystemPrompt = null
    let temperature = 0.7

    if (organizationId) {
      const { data: prompts } = await supabase
        .from('organization_prompts')
        .select('prompt_content, system_prompt, temperature')
        .eq('organization_id', organizationId)
        .eq('prompt_type', 'project_creation')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (prompts && prompts.length > 0) {
        customPrompt = prompts[0].prompt_content
        customSystemPrompt = prompts[0].system_prompt
        temperature = prompts[0].temperature || 0.7
        console.log('[Chat API] Using custom organization prompt')
      }
    }

    const body = await request.json()
    const { message, chatHistory, extractedFields } = body as {
      message: string
      chatHistory: Message[]
      extractedFields: ExtractedFields
    }

    // 初始化 OpenAI 客户端（支持 OpenRouter）
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('[Chat API] No API key found')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const isOpenRouter = apiKey.startsWith('sk-or-')
    console.log('[Chat API] API key type:', isOpenRouter ? 'OpenRouter' : 'OpenAI')

    const openai = new OpenAI({
      apiKey,
      baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
    })

    // 构建系统提示词 - 使用组织自定义提示词或默认提示词
    const baseSystemPrompt = customSystemPrompt || '你是一个友好的 PBL（基于问题的学习）项目创建助手。'

    const systemPrompt = `${baseSystemPrompt}

${customPrompt || `你的任务是通过对话引导用户创建一个 PBL 项目。

需要收集的信息：
1. title（项目标题）- 必需
2. problem_statement（问题陈述）- 必需
3. description（项目描述）- 可选
4. target_audience（目标受众）- 可选
5. expected_outcome（预期成果）- 可选

对话指南：
- 用友好、鼓励的语气与用户交流
- 一次只问一个问题
- 根据用户的回答自然地引导到下一个问题
- 当收集到 title 和 problem_statement 后，询问用户是否要添加更多细节
- 如果用户表示完成，总结信息并确认`}

当前已收集的字段：
${JSON.stringify(extractedFields, null, 2)}

重要：你必须以 JSON 格式返回，用 \`\`\`json 代码块包裹：
\`\`\`json
{
  "extracted_fields": { "title": "...", "problem_statement": "..." },
  "reply": "你的回复内容",
  "is_complete": false
}
\`\`\`

注意：
- extracted_fields 只包含本次新提取或更新的字段
- is_complete 为 true 表示已收集足够信息
- reply 是你对用户的自然语言回复`

    // 构建对话历史
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[Chat API] Starting stream...')

          // 根据 API Key 类型选择模型
          const model = isOpenRouter
            ? 'openai/gpt-4o-mini'  // OpenRouter 格式
            : 'gpt-4o-mini'          // OpenAI 格式

          console.log('[Chat API] Using model:', model)
          console.log('[Chat API] Messages count:', messages.length)
          console.log('[Chat API] API baseURL:', openai.baseURL)

          const completion = await openai.chat.completions.create({
            model,
            messages,
            temperature,
            stream: true,
          })

          console.log('[Chat API] Stream created successfully')

          let fullContent = ''
          let jsonBuffer = ''
          let inJsonBlock = false
          let hasJsonBlock = false

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (!content) continue

            fullContent += content

            // 检测 JSON 代码块
            if (content.includes('```json')) {
              console.log('[Chat API] Detected JSON block start')
              inJsonBlock = true
              hasJsonBlock = true
              jsonBuffer = ''
              continue
            }

            if (content.includes('```') && inJsonBlock) {
              console.log('[Chat API] Detected JSON block end')
              console.log('[Chat API] JSON buffer:', jsonBuffer)
              inJsonBlock = false

              // 解析 JSON
              try {
                const parsed = JSON.parse(jsonBuffer)

                // 发送提取的字段
                if (parsed.extracted_fields) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      type: 'extraction',
                      fields: parsed.extracted_fields
                    })}\n\n`)
                  )
                }

                // 发送完成状态
                if (parsed.is_complete !== undefined) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      type: 'complete',
                      isComplete: parsed.is_complete
                    })}\n\n`)
                  )
                }

                // 发送回复内容（逐字发送实现打字效果）
                if (parsed.reply) {
                  for (const char of parsed.reply) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'content',
                        content: char
                      })}\n\n`)
                    )
                  }
                }
              } catch (e) {
                console.error('[Chat API] Failed to parse JSON:', e)
                console.error('[Chat API] JSON buffer was:', jsonBuffer)
              }
              continue
            }

            if (inJsonBlock) {
              jsonBuffer += content
            } else if (!hasJsonBlock) {
              // 如果没有检测到JSON块，直接发送文本内容（逐字发送）
              for (const char of content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'content',
                    content: char
                  })}\n\n`)
                )
              }
            }
          }

          console.log('[Chat API] Stream finished. Full content length:', fullContent.length)
          console.log('[Chat API] Full content:', fullContent)

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

        } catch (error: any) {
          console.error('OpenAI API error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error.message
            })}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
