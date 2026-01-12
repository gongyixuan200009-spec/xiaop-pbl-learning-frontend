# 🚀 本地部署快速命令

## ✅ Zeabur CLI 已安装

现在只需 3 个命令即可完成部署！

---

## 📋 快速部署（3 步）

### 第 1 步：登录 Zeabur

```bash
zeabur auth login
```

这会打开浏览器，选择登录方式（GitHub/Google/邮箱）并授权。

### 第 2 步：部署项目

```bash
zeabur
```

按提示操作：
1. 选择：`Deploy to Zeabur`
2. 区域：选择 `Hong Kong`（推荐）
3. 项目名：`pbl-learning`
4. 服务名：直接回车使用默认

等待部署完成（约 2-5 分钟）。

### 第 3 步：配置环境变量

```bash
# 配置 Supabase URL
zeabur env set NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000

# 配置 Supabase Key
zeabur env set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

可选（AI 功能）：
```bash
zeabur env set OPENAI_API_KEY=sk-your-api-key
```

---

## 🌐 获取部署 URL

访问 Zeabur Dashboard：https://dash.zeabur.com

1. 找到你的项目 `pbl-learning`
2. 点击服务
3. 点击 **Networking** → **Generate Domain**
4. 获得 URL：`https://pbl-learning-xxxx.zeabur.app`

---

## ⚠️ 重要提醒

**内网地址问题：** `http://10.1.20.75:8000` 在 Zeabur 上无法访问！

### 临时解决方案：使用 ngrok

```bash
# 安装 ngrok
brew install ngrok

# 启动隧道
ngrok http 10.1.20.75:8000
```

获得公网地址后，更新环境变量：
```bash
zeabur env set NEXT_PUBLIC_SUPABASE_URL=https://abc123.ngrok.io
```

### 推荐方案：使用 Supabase 云服务

1. 访问：https://supabase.com
2. 创建项目（免费）
3. 运行 `supabase-setup.sql`
4. 获取公网 URL
5. 更新环境变量

---

## 🔄 更新部署

修改代码后：

```bash
# 提交代码
git add .
git commit -m "Update"

# 重新部署
zeabur
# 选择：Deploy to existing service
```

---

## 📊 常用命令

```bash
# 查看日志
zeabur logs

# 查看环境变量
zeabur env list

# 查看状态
zeabur status
```

---

## 🎯 完整命令流程

```bash
# 1. 登录
zeabur auth login

# 2. 部署
zeabur

# 3. 配置环境变量
zeabur env set NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000
zeabur env set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

# 4. 访问 Dashboard 获取 URL
# https://dash.zeabur.com
```

---

## 💡 提示

- 所有命令在项目目录执行
- 环境变量修改后会自动重新部署
- 详细文档查看 `DEPLOY_LOCAL.md`

---

## 🚀 现在就开始

执行第一个命令：

```bash
zeabur auth login
```

祝部署顺利！🎉
