import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - 获取组织的 prompts
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = params

    // 验证用户是否是组织成员
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 获取组织的所有 prompts
    const { data: prompts, error } = await supabase
      .from('organization_prompts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('prompt_type')
      .order('stage_number')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching prompts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompts })
  } catch (error: any) {
    console.error('Error in GET /api/admin/organizations/[id]/prompts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - 创建或更新 prompt
export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = params

    // 验证用户是否是组织管理员
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      prompt_type,
      stage_number,
      prompt_name,
      prompt_content,
      system_prompt,
      temperature,
      max_tokens,
    } = body

    if (!prompt_type || !prompt_name || !prompt_content) {
      return NextResponse.json(
        { error: 'prompt_type, prompt_name, and prompt_content are required' },
        { status: 400 }
      )
    }

    // 创建新 prompt
    const { data: prompt, error } = await supabase
      .from('organization_prompts')
      .insert({
        organization_id: organizationId,
        prompt_type,
        stage_number,
        prompt_name,
        prompt_content,
        system_prompt,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2000,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating prompt:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompt }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/organizations/[id]/prompts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - 更新 prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = params

    // 验证用户是否是组织管理员
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
      prompt_name,
      prompt_content,
      system_prompt,
      temperature,
      max_tokens,
      is_active,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    // 更新 prompt
    const { data: prompt, error } = await supabase
      .from('organization_prompts')
      .update({
        prompt_name,
        prompt_content,
        system_prompt,
        temperature,
        max_tokens,
        is_active,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating prompt:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompt })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/organizations/[id]/prompts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - 删除 prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = params
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('id')

    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    // 验证用户是否是组织管理员
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 删除 prompt
    const { error } = await supabase
      .from('organization_prompts')
      .delete()
      .eq('id', promptId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting prompt:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/organizations/[id]/prompts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
