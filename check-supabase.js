#!/usr/bin/env node

const fs = require('fs');

async function setupDatabase() {
  console.log('🚀 开始设置 Supabase 数据库...\n');

  const SUPABASE_URL = 'http://10.1.20.75:8000';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

  console.log('📊 连接到 Supabase: ' + SUPABASE_URL + '\n');

  // 测试连接
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/', {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY
      }
    });

    if (!response.ok) {
      throw new Error('无法连接到 Supabase API');
    }

    console.log('✅ Supabase API 连接成功！\n');
  } catch (error) {
    console.error('❌ 无法连接到 Supabase API:', error.message);
    console.error('\n请检查:');
    console.error('  1. Supabase 服务是否正在运行');
    console.error('  2. 网络连接是否正常');
    console.error('  3. URL 是否正确: ' + SUPABASE_URL + '\n');
    process.exit(1);
  }

  console.log('⚠️  注意: Supabase REST API 不支持直接执行 DDL 语句\n');
  console.log('由于数据库端口 5432 无法直接访问，请使用以下方法：\n');
  console.log('方法 1: 使用 Supabase Studio (推荐) ✨\n');
  console.log('  1. 打开浏览器访问: http://10.1.20.75:4000');
  console.log('  2. 使用凭据登录:');
  console.log('     用户名: supabase');
  console.log('     密码: supabase-dashboard-2025');
  console.log('  3. 点击左侧的 "SQL Editor"');
  console.log('  4. 点击 "New Query"');
  console.log('  5. 复制 supabase-minimal-setup.sql 的全部内容');
  console.log('  6. 粘贴到编辑器');
  console.log('  7. 点击 "Run" 或按 Cmd+Enter\n');
  console.log('方法 2: 在服务器上执行 (需要 SSH 访问)\n');
  console.log('  ssh root@10.1.20.75');
  console.log('  cd /root/supabase/docker');
  console.log('  docker compose exec -T db psql -U postgres -d postgres < /path/to/supabase-minimal-setup.sql\n');
  console.log('📋 SQL 脚本位置: supabase-minimal-setup.sql\n');
  console.log('执行完成后，刷新浏览器 http://localhost:3002 并尝试创建项目！\n');
}

setupDatabase();
