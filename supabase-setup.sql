-- ============================================
-- PBL Learning Platform - Supabase 数据库设置
-- ============================================
--
-- 这个文件包含了项目所需的数据库表结构和安全策略
-- 在 Supabase SQL Editor 中运行此文件
--

-- ============================================
-- 1. 用户资料表
-- ============================================

-- 创建用户资料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用 Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以查看自己的资料
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 创建策略：用户可以更新自己的资料
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 创建策略：用户可以插入自己的资料
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. 聊天会话表
-- ============================================

-- 创建聊天会话表
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '新对话',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx ON public.chat_sessions(created_at DESC);

-- 启用 Row Level Security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以查看自己的会话
CREATE POLICY "Users can view own sessions"
  ON public.chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 创建策略：用户可以创建自己的会话
CREATE POLICY "Users can create own sessions"
  ON public.chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建策略：用户可以更新自己的会话
CREATE POLICY "Users can update own sessions"
  ON public.chat_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建策略：用户可以删除自己的会话
CREATE POLICY "Users can delete own sessions"
  ON public.chat_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. 消息表
-- ============================================

-- 创建消息表
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS messages_session_id_idx ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- 启用 Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以查看自己会话的消息
CREATE POLICY "Users can view own messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- 创建策略：用户可以创建自己会话的消息
CREATE POLICY "Users can create own messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- 创建策略：用户可以删除自己会话的消息
CREATE POLICY "Users can delete own messages"
  ON public.messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. 学习记录表（可选）
-- ============================================

-- 创建学习记录表
CREATE TABLE IF NOT EXISTS public.learning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'chat', 'read', 'practice', etc.
  duration_minutes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS learning_records_user_id_idx ON public.learning_records(user_id);
CREATE INDEX IF NOT EXISTS learning_records_created_at_idx ON public.learning_records(created_at DESC);

-- 启用 Row Level Security
ALTER TABLE public.learning_records ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own learning records"
  ON public.learning_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning records"
  ON public.learning_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. 触发器：自动创建用户资料
-- ============================================

-- 创建函数：当新用户注册时自动创建资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. 触发器：自动更新 updated_at
-- ============================================

-- 创建函数：更新 updated_at 字段
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表创建触发器
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 为 chat_sessions 表创建触发器
DROP TRIGGER IF EXISTS set_updated_at ON public.chat_sessions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 7. 视图：用户统计信息
-- ============================================

-- 创建视图：用户统计
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  p.id AS user_id,
  p.email,
  p.full_name,
  COUNT(DISTINCT cs.id) AS total_sessions,
  COUNT(m.id) AS total_messages,
  COALESCE(SUM(lr.duration_minutes), 0) AS total_learning_minutes,
  MAX(cs.created_at) AS last_chat_at
FROM public.profiles p
LEFT JOIN public.chat_sessions cs ON cs.user_id = p.id
LEFT JOIN public.messages m ON m.session_id = cs.id
LEFT JOIN public.learning_records lr ON lr.user_id = p.id
GROUP BY p.id, p.email, p.full_name;

-- ============================================
-- 8. 函数：获取用户的聊天历史
-- ============================================

-- 创建函数：获取用户的最近聊天会话
CREATE OR REPLACE FUNCTION public.get_recent_sessions(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message_count BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.title,
    COUNT(m.id) AS message_count,
    MAX(m.created_at) AS last_message_at,
    cs.created_at
  FROM public.chat_sessions cs
  LEFT JOIN public.messages m ON m.session_id = cs.id
  WHERE cs.user_id = user_uuid
  GROUP BY cs.id, cs.title, cs.created_at
  ORDER BY MAX(m.created_at) DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. 存储桶配置（用于文件上传）
-- ============================================

-- 注意：这部分需要在 Supabase Storage 界面手动创建
-- 或使用 Supabase CLI

-- 创建存储桶：avatars
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true);

-- 创建策略：允许用户上传自己的头像
-- CREATE POLICY "Users can upload own avatar"
--   ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     bucket_id = 'avatars' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- ============================================
-- 10. 示例数据（可选，用于测试）
-- ============================================

-- 取消注释以插入示例数据
-- INSERT INTO public.chat_sessions (user_id, title)
-- VALUES (auth.uid(), '我的第一个对话');

-- ============================================
-- 完成！
-- ============================================

-- 验证表是否创建成功
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 查看所有策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
