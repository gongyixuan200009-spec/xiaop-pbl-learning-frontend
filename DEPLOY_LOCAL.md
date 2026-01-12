# 🚀 本地上传部署到 Zeabur - 完整指南

## ✅ 已完成准备

- ✅ Zeabur CLI 已安装
- ✅ 代码已提交到本地 Git
- ✅ 所有配置文件已准备

---

## 📋 部署步骤（无需 GitHub）

### 步骤 1：登录 Zeabur

在项目目录执行：

```bash
zeabur auth login
```

这会打开浏览器，让你登录 Zeabur：
1. 选择登录方式（GitHub、Google 或邮箱）
2. 授权 CLI 访问
3. 看到 "Login successful" 表示成功

### 步骤 2：创建 Zeabur 项目（首次部署）

```bash
zeabur
```

按照提示操作：

1. **选择操作**：选择 `Deploy to Zeabur`
2. **选择区域**：
   - 推荐选择 `Hong Kong`（香港，国内访问快）
   - 或 `Tokyo`（东京）
   - 或 `Singapore`（新加坡）
3. **项目名称**：输入 `pbl-learning`
4. **服务名称**：输入 `pbl-learning` 或直接回车使用默认

CLI 会自动：
- 检测到 Next.js 项目
- 打包代码
- 上传到 Zeabur
- 开始构建和部署

### 步骤 3：配置环境变量

部署完成后，需要配置环境变量。

#### 方式 1：使用 CLI 配置

```bash
# 配置 Supabase URL
zeabur env set NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000

# 配置 Supabase Key
zeabur env set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

# 可选：配置 OpenAI API Key（如果需要 AI 功能）
zeabur env set OPENAI_API_KEY=sk-your-api-key
```

#### 方式 2：在 Zeabur Dashboard 配置

1. 访问：https://dash.zeabur.com
2. 找到你的项目 `pbl-learning`
3. 点击服务
4. 点击 **Variables** 标签
5. 添加环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   OPENAI_API_KEY=sk-your-api-key（可选）
   ```

### 步骤 4：获取部署 URL

配置环境变量后，Zeabur 会自动重新部署。

**获取 URL：**

1. 在终端查看部署信息
2. 或访问 Zeabur Dashboard
3. 点击 **Networking** 标签
4. 点击 **Generate Domain**
5. 获得免费域名：`https://pbl-learning-xxxx.zeabur.app`

### 步骤 5：测试部署

访问你的 Zeabur URL，测试：
- ✅ 首页显示
- ✅ 用户注册
- ✅ 用户登录
- ✅ Dashboard

---

## ⚠️ 重要：内网地址问题

**当前问题：** 你使用的 Supabase 地址是内网地址（`http://10.1.20.75:8000`），这个地址在 Zeabur 上**无法访问**。

### 解决方案

#### 方案 1：使用内网穿透（临时测试）

使用 ngrok 将本地 Supabase 暴露到公网：

```bash
# 安装 ngrok
brew install ngrok  # macOS

# 启动隧道
ngrok http 10.1.20.75:8000
```

ngrok 会显示公网地址，例如：
```
Forwarding  https://abc123.ngrok.io -> http://10.1.20.75:8000
```

然后更新环境变量：
```bash
zeabur env set NEXT_PUBLIC_SUPABASE_URL=https://abc123.ngrok.io
```

**缺点：**
- ⚠️ 免费版 URL 每次重启会变化
- ⚠️ 需要保持 ngrok 运行
- ⚠️ 不适合生产环境

#### 方案 2：使用 Supabase 云服务（推荐）

1. 访问：https://supabase.com
2. 创建新项目（免费）
3. 在 SQL Editor 运行 `supabase-setup.sql`
4. 获取公网 URL 和 Key
5. 更新环境变量：
   ```bash
   zeabur env set NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   zeabur env set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-cloud-key
   ```

**优点：**
- ✅ 完全免费（500MB 数据库）
- ✅ 全球 CDN 加速
- ✅ 自动备份
- ✅ 适合生产环境

---

## 🔄 更新部署

修改代码后，重新部署：

```bash
# 1. 提交代码
git add .
git commit -m "Update feature"

# 2. 重新部署
zeabur
```

选择 `Deploy to existing service`，选择你的项目和服务。

---

## 📊 常用命令

```bash
# 登录
zeabur auth login

# 部署
zeabur

# 查看环境变量
zeabur env list

# 设置环境变量
zeabur env set KEY=VALUE

# 删除环境变量
zeabur env delete KEY

# 查看日志
zeabur logs

# 查看服务状态
zeabur status
```

---

## 🎯 完整部署流程

```bash
# 1. 登录 Zeabur
zeabur auth login

# 2. 部署项目
zeabur
# 按提示选择：Deploy to Zeabur
# 选择区域：Hong Kong
# 输入项目名：pbl-learning

# 3. 配置环境变量
zeabur env set NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000
zeabur env set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

# 4. 访问 Zeabur Dashboard 获取 URL
# https://dash.zeabur.com
```

---

## 📝 部署检查清单

- [ ] Zeabur CLI 已安装
- [ ] 已登录 Zeabur
- [ ] 代码已提交到本地 Git
- [ ] 执行 `zeabur` 命令部署
- [ ] 环境变量已配置
- [ ] 获得部署 URL
- [ ] 应用可以访问
- [ ] （可选）配置内网穿透或云服务

---

## ⚡ 快速开始

现在就执行以下命令开始部署：

```bash
# 1. 登录
zeabur auth login

# 2. 部署
zeabur
```

按照提示操作即可！

---

## 🆘 常见问题

### 问题 1：zeabur 命令找不到

**解决：**
```bash
# 重新安装
npm install -g @zeabur/cli

# 或使用 npx
npx @zeabur/cli
```

### 问题 2：登录失败

**解决：**
- 检查网络连接
- 尝试使用不同的登录方式
- 清除缓存：`rm -rf ~/.zeabur`

### 问题 3：部署后无法访问

**解决：**
1. 检查环境变量是否配置
2. 查看部署日志：`zeabur logs`
3. 确认 Supabase 地址可访问

### 问题 4：内网地址无法连接

**解决：**
- 使用 ngrok 内网穿透
- 或切换到 Supabase 云服务

---

## 💡 提示

1. **首次部署**
   - 选择 `Deploy to Zeabur`
   - 创建新项目

2. **更新部署**
   - 选择 `Deploy to existing service`
   - 选择已有项目

3. **环境变量**
   - 修改后会自动重新部署
   - 可以在 Dashboard 查看

4. **日志查看**
   - 使用 `zeabur logs` 查看实时日志
   - 或在 Dashboard 查看

---

## 🎉 优势

使用本地上传的优势：
- ✅ 不需要 GitHub 账号
- ✅ 不需要推送代码到远程
- ✅ 部署速度更快
- ✅ 适合私有项目

---

## 📞 需要帮助？

- [Zeabur CLI 文档](https://zeabur.com/docs/cli)
- [Zeabur 文档](https://zeabur.com/docs)

开始部署吧！🚀
