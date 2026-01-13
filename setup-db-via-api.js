const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const supabaseUrl = 'http://10.1.20.75:8000';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('连接到 Supabase...');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'supabase-minimal-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '');

    console.log(`准备执行 ${statements.length} 条 SQL 语句...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n执行语句 ${i + 1}/${statements.length}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          console.error(`❌ 错误:`, error.message);
          // Try alternative method
          console.log('尝试使用 REST API...');
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ sql_query: statement })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ REST API 错误: ${errorText}`);
          } else {
            console.log('✅ 成功');
          }
        } else {
          console.log('✅ 成功');
        }
      } catch (err) {
        console.error(`❌ 执行失败:`, err.message);
      }
    }

    console.log('\n✅ 数据库设置完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

setupDatabase();
