# 🎯 Supabase + Zeabur 部署执行清单

这是一个完整的执行清单，帮助你按步骤完成从 JSON 文件存储到 Supabase + Zeabur 部署的完整迁移。

---

## 📋 第一阶段: 数据库迁移 (预计时间: 30-60分钟)

### ✅ 准备工作

- [ ] 确认 Supabase 服务正常运行
  ```bash
  # 访问 Supabase Dashboard
  浏览器打开: http://10.1.20.75:3000
  用户名: supabase
  密码: supabase-dashboard-2025
  ```

- [ ] 备份现有数据
  ```bash
  cd xiaop-v2-dev-deploy/backend
  tar -czf data_backup_$(date +%Y%m%d).tar.gz data/
  ```

### ✅ 步骤 1: 创建数据库表结构

- [ ] 登录 Supabase Dashboard
- [ ] 进入 SQL Editor
- [ ] 复制 `backend/scripts/supabase_migration.sql` 的内容
- [ ] 在 SQL Editor 中执行脚本
- [ ] 确认所有表创建成功（应该有 9 个表）
  - users
  - form_configs
  - api_configs
  - pipeline_configs
  - user_projects
  - project_step_data
  - prompt_history
  - user_uploads
  - age_adaptation_configs

### ✅ 步骤 2: 配置环境变量

- [ ] 复制环境变量模板
  ```bash
  cd backend
  cp .env.example .env
  ```

- [ ] 编辑 `.env` 文件，填入配置:
  - [ ] `SUPABASE_URL` - Supabase API 地址
  - [ ] `SUPABASE_ANON_KEY` - 匿名密钥（从 Supabase Dashboard 获取）
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - 服务角色密钥（从 Supabase Dashboard 获取）
  - [ ] `SECRET_KEY` - 修改为随机字符串
  - [ ] 其他配置保持默认

### ✅ 步骤 3: 安装依赖并迁移数据

- [ ] 安装 Python 依赖
  ```bash
  cd backend
  pip install -r requirements.txt
  ```

- [ ] 运行数据迁移工具
  ```bash
  python scripts/migrate_to_supabase.py
  ```

- [ ] 确认迁移成功
  - 查看迁移日志，确认无错误
  - 检查各表的数据量

### ✅ 步骤 4: 验证数据库迁移

- [ ] 运行数据库健康检查
  ```bash
  python scripts/check_database.py
  ```

- [ ] 在 Supabase Dashboard 中验证:
  - [ ] 打开 Table Editor
  - [ ] 检查每个表的数据
  - [ ] 确认数据完整性

- [ ] 测试数据库连接
  ```bash
  python -c "from services.supabase_client import get_supabase; print(get_supabase().table('users').select('*').limit(5).execute())"
  ```

---

## 📋 第二阶段: 代码准备 (预计时间: 15-30分钟)

### ✅ 步骤 5: Git 仓库准备

- [ ] 检查 Git 仓库状态
  ```bash
  git status
  ```

- [ ] 如果还没有 Git 仓库，初始化:
  ```bash
  git init
  ```

- [ ] 添加 .gitignore（如果还没有）
  ```bash
  cat >> .gitignore << EOF
  # 环境变量
  .env
  *.env
  !.env.example

  # Python
  __pycache__/
  *.py[cod]
  venv/
  *.log

  # Node
  node_modules/
  .next/
  out/

  # 数据文件
  backend/data/
  backend/uploads/

  # IDE
  .vscode/
  .idea/
  EOF
  ```

- [ ] 提交所有更改
  ```bash
  git add .
  git commit -m "Add Supabase integration and Zeabur deployment configuration"
  ```

### ✅ 步骤 6: 设置远程仓库

- [ ] 在 GitHub/GitLab 创建新仓库（如果还没有）

- [ ] 添加远程仓库
  ```bash
  git remote add origin <你的仓库URL>
  ```

- [ ] 推送代码
  ```bash
  git branch -M main
  git push -u origin main
  ```

---

## 📋 第三阶段: Zeabur 部署 (预计时间: 30-45分钟)

### ✅ 步骤 7: 准备 Zeabur 账号

- [ ] 访问 https://zeabur.com
- [ ] 注册或登录账号
- [ ] 连接 GitHub/GitLab 账号（如果需要）

### ✅ 步骤 8: 部署后端服务

- [ ] 在 Zeabur Dashboard 点击 "Create Project"
- [ ] 项目名称: `xiaop-learning-assistant`
- [ ] 选择区域（建议选择离 Supabase 服务器近的区域）

- [ ] 添加后端服务:
  - [ ] 点击 "Add Service"
  - [ ] 选择 "Git" 作为来源
  - [ ] 选择你的仓库
  - [ ] 服务名称: `backend`
  - [ ] 根目录: `/backend`
  - [ ] 端口: `8504`

- [ ] 配置后端环境变量（在 Environment Variables 中添加）:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SECRET_KEY`
  - [ ] `ALGORITHM=HS256`
  - [ ] `ACCESS_TOKEN_EXPIRE_MINUTES=10080`
  - [ ] `ENVIRONMENT=production`
  - [ ] `DEBUG=false`
  - [ ] `STORAGE_MODE=supabase`

- [ ] 点击 "Deploy" 开始部署

- [ ] 等待部署完成（2-5分钟）

- [ ] 记录后端域名: `_________________.zeabur.app`

### ✅ 步骤 9: 部署前端服务

- [ ] 在同一项目中添加前端服务:
  - [ ] 点击 "Add Service"
  - [ ] 选择 "Git" 作为来源
  - [ ] 选择同一个仓库
  - [ ] 服务名称: `frontend`
  - [ ] 根目录: `/frontend`
  - [ ] 端口: `3000`

- [ ] 配置前端环境变量:
  - [ ] `NEXT_PUBLIC_API_URL=https://你的后端域名.zeabur.app`

- [ ] 点击 "Deploy" 开始部署

- [ ] 等待部署完成（3-7分钟）

- [ ] 记录前端域名: `_________________.zeabur.app`

### ✅ 步骤 10: 更新后端 CORS 配置

- [ ] 在后端服务的环境变量中添加:
  ```
  CORS_ORIGINS=https://你的前端域名.zeabur.app
  ```

- [ ] 重新部署后端服务

---

## 📋 第四阶段: 验证和测试 (预计时间: 20-30分钟)

### ✅ 步骤 11: 验证后端部署

- [ ] 测试健康检查接口
  ```bash
  curl https://你的后端域名.zeabur.app/health
  # 预期响应: {"status":"ok"}
  ```

- [ ] 测试根路径
  ```bash
  curl https://你的后端域名.zeabur.app/
  # 预期响应: {"name":"工小助学习助手 API","version":"3.0.0","status":"running"}
  ```

- [ ] 在 Zeabur Dashboard 查看后端日志
  - [ ] 确认没有错误
  - [ ] 确认 Supabase 连接成功

### ✅ 步骤 12: 验证前端部署

- [ ] 在浏览器中访问前端域名

- [ ] 测试基本功能:
  - [ ] 页面正常加载
  - [ ] UI 显示正常
  - [ ] 可以打开登录页面

### ✅ 步骤 13: 端到端功能测试

- [ ] 测试用户登录
  - [ ] 使用测试账号登录
  - [ ] 确认登录成功
  - [ ] 确认获取到 JWT Token

- [ ] 测试核心功能
  - [ ] 创建新项目
  - [ ] 测试聊天功能
  - [ ] 测试文件上传（如果有）
  - [ ] 测试配置管理

- [ ] 检查数据持久化
  - [ ] 在 Supabase Dashboard 中查看新创建的数据
  - [ ] 确认数据正确保存

---

## 📋 第五阶段: 域名和优化 (可选，预计时间: 30-60分钟)

### ✅ 步骤 14: 配置自定义域名（可选）

如果你有自己的域名:

- [ ] 后端域名配置:
  - [ ] 在 Zeabur 后端服务中添加域名: `api.yourdomain.com`
  - [ ] 在 DNS 提供商添加 CNAME 记录
  - [ ] 等待 DNS 生效（可能需要几分钟到几小时）

- [ ] 前端域名配置:
  - [ ] 在 Zeabur 前端服务中添加域名: `app.yourdomain.com`
  - [ ] 在 DNS 提供商添加 CNAME 记录
  - [ ] 等待 DNS 生效

- [ ] 更新前端环境变量:
  - [ ] 将 `NEXT_PUBLIC_API_URL` 更新为自定义后端域名
  - [ ] 重新部署前端服务

### ✅ 步骤 15: 性能优化

- [ ] 启用 Zeabur CDN（如果可用）
- [ ] 配置缓存策略
- [ ] 优化数据库查询（添加索引）
- [ ] 配置静态资源压缩

### ✅ 步骤 16: 监控和告警

- [ ] 设置 Zeabur 监控
- [ ] 配置告警规则
- [ ] 设置日志保留策略

---

## 📋 第六阶段: 备份和文档 (预计时间: 15-30分钟)

### ✅ 步骤 17: 设置自动备份

- [ ] Supabase 数据库备份
  - [ ] 在 Supabase Dashboard 中配置自动备份
  - [ ] 或创建定时备份脚本

- [ ] 代码备份
  - [ ] 确保代码已推送到 Git 仓库
  - [ ] 考虑创建 Git Tag 标记当前版本

### ✅ 步骤 18: 更新文档

- [ ] 记录部署配置
  - [ ] 后端域名
  - [ ] 前端域名
  - [ ] Supabase URL
  - [ ] 环境变量配置

- [ ] 创建运维文档
  - [ ] 如何重新部署
  - [ ] 如何回滚
  - [ ] 常见问题处理

---

## ✅ 部署完成检查清单

完成所有步骤后，请确认:

- [ ] ✅ Supabase 数据库正常运行，所有表已创建
- [ ] ✅ 数据已成功迁移，数据完整性验证通过
- [ ] ✅ 后端服务在 Zeabur 上正常运行
- [ ] ✅ 前端服务在 Zeabur 上正常运行
- [ ] ✅ 前后端可以正常通信
- [ ] ✅ 核心功能测试通过
- [ ] ✅ HTTPS 证书已自动配置（Zeabur 自动处理）
- [ ] ✅ 环境变量已正确配置
- [ ] ✅ CORS 配置正确
- [ ] ✅ 日志输出正常
- [ ] ✅ 备份策略已设置

---

## 🎉 恭喜！

如果所有清单项都已完成，你的工小助学习助手现在已经成功部署到 Zeabur + Supabase！

### 下一步建议:

1. **性能优化**: 根据实际使用情况优化数据库查询和 API 性能
2. **安全加固**: 定期更新依赖，检查安全漏洞
3. **用户测试**: 邀请用户测试，收集反馈
4. **监控告警**: 持续监控应用状态，及时发现问题
5. **功能迭代**: 基于用户反馈持续改进

---

## 📞 需要帮助？

遇到问题时，参考:

1. **文档**:
   - [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) - 完整部署指南
   - [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) - 数据库迁移指南
   - [ZEABUR_DEPLOYMENT_GUIDE.md](./ZEABUR_DEPLOYMENT_GUIDE.md) - Zeabur 部署指南

2. **日志**:
   - Zeabur Dashboard → Logs
   - Supabase Dashboard → Database → Logs

3. **健康检查**:
   ```bash
   python backend/scripts/check_database.py
   ```

4. **快速部署脚本**:
   ```bash
   bash quick_deploy.sh
   ```

---

**祝你部署顺利！🚀**
