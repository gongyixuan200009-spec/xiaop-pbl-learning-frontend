import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/projects - List all projects for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get projects created by user (simplified query)
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map name to title for frontend compatibility
    const mappedProjects = (projects || []).map(p => ({
      ...p,
      title: p.name,
      current_stage: 1  // Default stage
    }))

    return NextResponse.json({ projects: mappedProjects })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate slug from title
    // Format: must start with lowercase letter, only lowercase letters, numbers, underscores, 3-30 chars
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')  // Replace non-alphanumeric with underscore
      .replace(/^[^a-z]+/, '')       // Remove leading non-letters
      .replace(/_+/g, '_')           // Collapse multiple underscores
      .replace(/^_+|_+$/g, '')       // Trim underscores

    // Ensure it starts with a letter
    if (!slug || !/^[a-z]/.test(slug)) {
      slug = 'project_' + slug
    }

    // Add timestamp suffix and limit to 30 chars
    const timestamp = Date.now().toString().slice(-6)  // Last 6 digits
    slug = (slug.substring(0, 23) + '_' + timestamp).substring(0, 30)

    // Create project with minimal fields
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: title,  // Map title to name field
        slug: slug,   // Generate unique slug
        description: description || '',
        created_by: user.id,
      })
      .select()
      .single()

    if (projectError) {
      console.error('Error creating project:', projectError)
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }

    // Map name to title for frontend compatibility
    const mappedProject = {
      ...project,
      title: project.name,
      current_stage: 1
    }

    return NextResponse.json({ project: mappedProject }, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
