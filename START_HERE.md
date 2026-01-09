# 🚀 快速开始 - Supabase + Zeabur 部署

> 这是一个快速开始指南，帮助你在 15 分钟内了解如何将项目迁移到 Supabase 并部署到 Zeabur。

---

## 📖 文档导航

### 🎯 我应该从哪里开始？

根据你的情况，选择合适的入口：

| 场景 | 推荐文档 | 说明 |
|------|---------|------|
| **首次部署** | [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | 完整的分步骤清单，适合首次部署 |
| **快速了解** | 本文档 | 5分钟快速了解整体方案 |
| **数据库迁移** | [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) | Supabase 数据库迁移详细指南 |
| **Zeabur 部署** | [ZEABUR_DEPLOYMENT_GUIDE.md](./ZEABUR_DEPLOYMENT_GUIDE.md) | Zeabur 平台部署详细指南 |
| **完整参考** | [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) | 完整的部署文档和参考 |
| **总体概览** | [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) | 迁移工作总结 |

---

## 🎯 三步快速开始

### 第一步: 数据库迁移 (30分钟)

```bash
# 1. 配置环境变量
cd backend
cp .env.example .env
# 编辑 .env 文件，填入 Supabase 配置

# 2. 执行数据库迁移
# 在 Supabase Dashboard (http://10.1.20.75:3000) 中
# 执行 backend/scripts/supabase_migration.sql

# 3. 迁移数据
pip install -r requirements.txt
python scripts/migrate_to_supabase.py

# 4. 验证迁移
python scripts/check_database.py
```

**详细步骤**: [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md)

---

### 第二步: 推送代码 (5分钟)

```bash
# 使用快速部署脚本（推荐）
bash quick_deploy.sh

# 或手动执行
git add .
git commit -m "Add Supabase integration and Zeabur deployment"
git push
```

---

### 第三步: Zeabur 部署 (30分钟)

1. **访问**: https://zeabur.com
2. **创建项目**: `xiaop-learning-assistant`
3. **部署后端**:
   - 根目录: `/backend`
   - 端口: `8504`
   - 配置环境变量（参考 backend/.env）
4. **部署前端**:
   - 根目录: `/frontend`
   - 端口: `3000`
   - 配置 `NEXT_PUBLIC_API_URL`

**详细步骤**: [ZEABUR_DEPLOYMENT_GUIDE.md](./ZEABUR_DEPLOYMENT_GUIDE.md)

---

## 📁 项目结构

```
xiaop-v2-dev-deploy/
├── backend/
│   ├── scripts/
│   │   ├── supabase_migration.sql      # 数据库表结构
│   │   ├── migrate_to_supabase.py      # 数据迁移工具
│   │   └── check_database.py           # 数据库健康检查
│   ├── services/
│   │   ├── supabase_client.py          # Supabase 客户端
│   │   ├── user_service.py             # 用户服务
│   │   ├── project_service.py          # 项目服务
│   │   └── config_service.py           # 配置服务
│   ├── .env.example                    # 环境变量模板
│   ├── config_v3.py                    # 更新的配置文件
│   ├── requirements.txt                # Python 依赖
│   └── Dockerfile                      # 后端容器化
├── frontend/
│   └── Dockerfile                      # 前端容器化
├── DEPLOYMENT_CHECKLIST.md             # ✅ 部署清单（推荐从这里开始）
├── README_DEPLOYMENT.md                # 完整部署文档
├── SUPABASE_MIGRATION_GUIDE.md         # Supabase 迁移指南
├── ZEABUR_DEPLOYMENT_GUIDE.md          # Zeabur 部署指南
├── MIGRATION_SUMMARY.md                # 迁移总结
├── quick_deploy.sh                     # 快速部署脚本
└── START_HERE.md                       # 本文档
```

---

## 🎯 核心概念

### 为什么要迁移到 Supabase？

- ✅ **可靠性**: 专业的数据库服务，数据更安全
- ✅ **性能**: PostgreSQL 性能优于 JSON 文件
- ✅ **扩展性**: 支持复杂查询和大数据量
- ✅ **功能丰富**: 内置认证、存储、实时订阅等功能

### 为什么选择 Zeabur？

- ✅ **简单**: Git 推送即部署
- ✅ **快速**: 自动构建和部署
- ✅ **免费**: 提供免费套餐
- ✅ **可靠**: 自动 HTTPS、CDN 加速

---

## 📊 数据迁移内容

以下数据会从 JSON 文件迁移到 Supabase：

| JSON 文件 | Supabase 表 | 说明 |
|-----------|-------------|------|
| `users.json` | `users` | 用户账号信息 |
| `form_config.json` | `form_configs` | 表单配置 |
| `api_key_config.json` | `api_configs` | API 配置 |
| `pipelines.json` | `pipeline_configs` | Pipeline 配置 |
| `user_progress/*.json` | `user_projects` + `project_step_data` | 用户项目和进度 |
| `prompt_history.json` | `prompt_history` | 提示词历史 |

---

## 🛠️ 工具和脚本

### 快速部署脚本

```bash
bash quick_deploy.sh
```

自动检查环境、准备 Git、引导部署。

### 数据库健康检查

```bash
python backend/scripts/check_database.py
```

验证数据库连接、表结构、数据完整性。

### 数据迁移工具

```bash
python backend/scripts/migrate_to_supabase.py
```

自动将 JSON 数据迁移到 Supabase。

---

## ✅ 部署前检查清单

在开始部署前，确认：

- [ ] Supabase 服务正常运行 (http://10.1.20.75:3000)
- [ ] 已备份现有数据
- [ ] 代码已推送到 Git 仓库
- [ ] 已注册 Zeabur 账号
- [ ] 已阅读相关文档

---

## 🎯 推荐部署流程

### 方式一：使用部署清单（推荐新手）

适合首次部署，提供详细的分步骤指导。

1. 打开 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
2. 按照清单逐项完成
3. 遇到问题查阅对应的详细文档

### 方式二：快速部署（推荐有经验的用户）

适合熟悉部署流程的用户。

1. **数据库迁移**:
   ```bash
   cd backend
   cp .env.example .env
   # 编辑 .env
   # 执行 SQL: scripts/supabase_migration.sql
   python scripts/migrate_to_supabase.py
   ```

2. **代码推送**:
   ```bash
   bash quick_deploy.sh
   ```

3. **Zeabur 部署**:
   - 创建项目
   - 部署后端（/backend, 8504）
   - 部署前端（/frontend, 3000）

---

## 📚 深入学习

### 详细文档

1. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**
   - 完整的分步骤部署清单
   - 适合首次部署
   - 包含所有验证步骤

2. **[README_DEPLOYMENT.md](./README_DEPLOYMENT.md)**
   - 完整的部署文档
   - 开发环境设置
   - 常见问题解答
   - 最佳实践

3. **[SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md)**
   - 数据库架构设计
   - 迁移脚本使用
   - 数据验证方法
   - RLS 策略配置

4. **[ZEABUR_DEPLOYMENT_GUIDE.md](./ZEABUR_DEPLOYMENT_GUIDE.md)**
   - Zeabur 部署详细步骤
   - 环境变量配置
   - 域名配置
   - 监控和维护

5. **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)**
   - 迁移工作总结
   - 文件清单
   - 技术栈说明

### 外部资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Zeabur 官方文档](https://zeabur.com/docs)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Next.js 文档](https://nextjs.org/docs)

---

## 🆘 遇到问题？

### 常见问题快速解决

| 问题 | 解决方法 |
|------|---------|
| 数据库连接失败 | 检查 Supabase URL 和密钥，运行 `check_database.py` |
| Zeabur 部署失败 | 查看部署日志，检查 Dockerfile 和环境变量 |
| 前端无法连接后端 | 检查 `NEXT_PUBLIC_API_URL`，更新 CORS 配置 |
| 数据迁移失败 | 检查 JSON 文件格式，查看迁移日志 |

### 获取帮助

1. 查看对应文档的"常见问题"部分
2. 检查应用日志（Zeabur Dashboard → Logs）
3. 运行健康检查脚本: `python backend/scripts/check_database.py`
4. 查看 Supabase 数据库日志

---

## 🎉 开始你的部署之旅

### 建议阅读顺序

1. ✅ **阅读本文档** (5分钟) - 了解整体方案
2. ✅ **打开部署清单** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) (2分钟) - 了解具体步骤
3. ✅ **执行数据库迁移** [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) (30分钟)
4. ✅ **部署到 Zeabur** [ZEABUR_DEPLOYMENT_GUIDE.md](./ZEABUR_DEPLOYMENT_GUIDE.md) (30分钟)
5. ✅ **验证和优化** [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) (30分钟)

### 预计总时间

- **快速部署**: 1-2 小时
- **完整部署（含优化）**: 2-3 小时
- **学习和理解**: 额外 1-2 小时

---

## 💡 最后的建议

1. **不要着急**: 按步骤来，确保每一步都成功
2. **多做备份**: 迁移前备份所有数据
3. **多看文档**: 遇到问题先查文档
4. **多做测试**: 部署后全面测试所有功能
5. **持续优化**: 部署只是开始，持续优化才能更好

---

**准备好了吗？从这里开始：** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

**祝你部署顺利！🚀🎉**
