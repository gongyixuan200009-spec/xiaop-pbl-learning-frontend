# 🚀 快速部署命令清单

## ✅ 已完成
- ✅ Git 仓库已初始化
- ✅ 代码已提交到本地

## 📋 接下来执行这些命令

### 步骤 1：推送到 GitHub

```bash
# 1. 在 GitHub 创建新仓库
# 访问：https://github.com/new
# 仓库名：pbl-learning
# 不要勾选任何选项，直接创建

# 2. 添加远程仓库（替换 your-username 为你的 GitHub 用户名）
git remote add origin https://github.com/your-username/pbl-learning.git

# 3. 推送代码
git branch -M main
git push -u origin main
```

**示例（如果你的用户名是 zhangsan）：**
```bash
git remote add origin https://github.com/zhangsan/pbl-learning.git
git branch -M main
git push -u origin main
```

### 步骤 2：配置 Supabase 云服务（推荐）

**为什么需要？**
- 当前使用的内网地址（`http://10.1.20.75:8000`）在 Zeabur 上无法访问
- 需要使用公网可访问的 Supabase 服务

**操作步骤：**

1. **注册 Supabase**
   - 访问：https://supabase.com
   - 点击 "Start your project"
   - 使用 GitHub 登录

2. **创建项目**
   - 点击 "New Project"
   - Name: `pbl-learning`
   - Database Password: 设置密码（记住它）
   - Region: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
   - 点击 "Create new project"
   - 等待 2-3 分钟

3. **设置数据库**
   - 点击左侧 **SQL Editor** → **New Query**
   - 打开本地 `supabase-setup.sql` 文件
   - 复制全部内容，粘贴到 SQL Editor
   - 点击 **Run** 执行

4. **获取连接信息**
   - 点击左侧 **Settings** → **API**
   - 复制：
     - Project URL: `https://xxxxx.supabase.co`
     - anon public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **保存这些信息！**

### 步骤 3：在 Zeabur 部署

1. **注册 Zeabur**
   - 访问：https://zeabur.com
   - 点击 "Sign in" → "Continue with GitHub"

2. **创建项目**
   - 点击 "Create Project"
   - 项目名：`pbl-learning`
   - 区域：选择 **Hong Kong**（国内访问快）
   - 点击 "Create"

3. **导入仓库**
   - 点击 "Add Service" → "Git" → "GitHub"
   - 选择 `pbl-learning` 仓库
   - 点击 "Import"

4. **配置环境变量**
   - 点击服务 → "Variables" 标签
   - 添加以下变量：

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   可选（AI 功能）：
   ```
   OPENAI_API_KEY=sk-your-api-key
   ```

5. **等待部署**
   - Zeabur 会自动开始部署
   - 查看 "Deployments" 标签了解进度
   - 大约 2-5 分钟完成

6. **获取 URL**
   - 点击 "Networking" 标签
   - 点击 "Generate Domain"
   - 获得：`https://pbl-learning-xxxx.zeabur.app`

7. **配置 Supabase 重定向**
   - 返回 Supabase Dashboard
   - **Authentication** → **URL Configuration**
   - Site URL: `https://pbl-learning-xxxx.zeabur.app`
   - Redirect URLs: `https://pbl-learning-xxxx.zeabur.app/**`
   - 点击 "Save"

### 步骤 4：测试部署

访问你的 Zeabur URL，测试：
- ✅ 首页显示
- ✅ 用户注册
- ✅ 用户登录
- ✅ Dashboard

---

## 🎯 完整流程总结

```
1. GitHub 创建仓库
   ↓
2. 推送代码
   ↓
3. Supabase 云服务创建项目
   ↓
4. 执行数据库脚本
   ↓
5. Zeabur 创建项目
   ↓
6. 导入 GitHub 仓库
   ↓
7. 配置环境变量
   ↓
8. 自动部署
   ↓
9. 配置 Supabase 重定向
   ↓
10. 测试应用
```

---

## 📞 详细文档

查看 `DEPLOY_TO_ZEABUR.md` 了解：
- 详细步骤说明
- 截图指引
- 常见问题解决
- 自定义域名配置

---

## ⚡ 快速链接

| 服务 | 地址 |
|------|------|
| GitHub 新仓库 | https://github.com/new |
| Supabase | https://supabase.com |
| Zeabur | https://zeabur.com |

---

## 💡 提示

- 所有操作都在浏览器中完成
- 不需要额外的命令行操作（除了推送代码）
- 整个过程大约需要 15-20 分钟
- 部署后每次 push 代码都会自动重新部署

开始部署吧！🚀
