#!/usr/bin/env node

const { readFileSync } = require('fs');
const { Client } = require('pg');

async function setupDatabase() {
  console.log('🚀 开始设置 Supabase 数据库...\n');

  // 数据库连接配置
  const client = new Client({
    host: '10.1.20.75',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'your-super-secret-password-change-this',
  });

  try {
    console.log('📊 连接到数据库: 10.1.20.75:5432/postgres\n');
    await client.connect();
    console.log('✅ 数据库连接成功！\n');

    // 读取 SQL 脚本
    console.log('📝 读取 SQL 脚本...\n');
    const sql = readFileSync('supabase-minimal-setup.sql', 'utf8');

    // 执行 SQL 脚本
    console.log('⚙️  执行 SQL 脚本...\n');
    await client.query(sql);

    console.log('✅ 数据库设置成功！\n');
    console.log('📋 已创建的表:');
    console.log('  - projects (id, title, description, created_by, created_at, updated_at)\n');
    console.log('🔒 RLS 策略已启用\n');

    // 验证表结构
    console.log('🔍 验证表结构...\n');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);

    console.log('表结构:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    console.log('\n🎯 下一步:');
    console.log('  1. 刷新浏览器: http://localhost:3002');
    console.log('  2. 注册/登录账户');
    console.log('  3. 尝试创建项目\n');

  } catch (error) {
    console.error('\n❌ 数据库设置失败:');
    console.error(error.message);
    console.error('\n请检查:');
    console.error('  1. 数据库连接信息是否正确');
    console.error('  2. 数据库密码是否正确');
    console.error('  3. 网络连接是否正常');
    console.error('  4. Supabase 服务是否正在运行\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
