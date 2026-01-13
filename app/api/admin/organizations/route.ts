import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

// GET - 获取用户的组织列表
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户拥有的组织
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        *,
        user_organizations!inner(role)
      `)
      .eq('user_organizations.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ organizations })
  } catch (error: any) {
    console.error('Error in GET /api/admin/organizations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - 创建新组织
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, logo_url } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // 创建组织
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        description,
        logo_url,
        owner_id: user.id,
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    // 添加创建者为组织成员
    await supabase
      .from('user_organizations')
      .insert({
        user_id: user.id,
        organization_id: organization.id,
        role: 'owner',
      })

    return NextResponse.json({ organization }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/organizations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
