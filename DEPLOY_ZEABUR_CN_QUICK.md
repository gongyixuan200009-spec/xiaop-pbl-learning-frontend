# 🚀 Zeabur 中国区快速部署指南

## ✅ 准备完成

- ✅ 项目已打包：`pbl-learning.zip`（109KB）
- ✅ 文件位置：`/Users/shawn/projects/pbl-learning/pbl-learning.zip`

---

## 📋 部署步骤（5 分钟完成）

### 第 1 步：访问 Zeabur 中国区

打开浏览器访问：**https://zeabur.cn**

### 第 2 步：登录

点击右上角 **"登录"**，选择：
- 微信登录（推荐）
- GitHub 登录
- 邮箱登录

### 第 3 步：创建项目

1. 登录后，点击 **"创建项目"**
2. 填写信息：
   - 项目名称：`pbl-learning`
   - 区域：选择 **"上海"**（国内访问最快）
3. 点击 **"创建"**

### 第 4 步：上传代码

1. 在项目页面，点击 **"添加服务"**
2. 选择 **"上传代码"** 或 **"本地文件"**
3. 点击 **"选择文件"**
4. 选择 `pbl-learning.zip` 文件
5. 点击 **"上传"**

Zeabur 会自动：
- 解压文件
- 检测 Next.js 项目
- 安装依赖
- 构建项目
- 启动服务

等待 2-5 分钟完成构建。

### 第 5 步：配置环境变量

构建完成后：

1. 点击你的服务（pbl-learning）
2. 点击 **"环境变量"** 标签
3. 点击 **"添加变量"** 按钮
4. 添加以下变量：

**第一个变量：**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `http://10.1.20.75:8000`
- 点击 **"保存"**

**第二个变量：**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE`
- 点击 **"保存"**

**可选（AI 功能）：**
- Key: `OPENAI_API_KEY`
- Value: `sk-your-api-key`
- 点击 **"保存"**

5. 保存后，Zeabur 会自动重新部署（约 1-2 分钟）

### 第 6 步：获取部署 URL

1. 点击 **"网络"** 标签
2. 点击 **"生成域名"** 按钮
3. Zeabur 会自动生成免费域名：
   ```
   https://pbl-learning-xxxx.zeabur.app
   ```
4. 点击域名即可访问你的应用！

---

## 🎯 部署检查清单

- [ ] 访问 zeabur.cn 并登录
- [ ] 创建项目（名称：pbl-learning，区域：上海）
- [ ] 上传 pbl-learning.zip 文件
- [ ] 等待构建完成（2-5 分钟）
- [ ] 配置环境变量（2 个必需，1 个可选）
- [ ] 等待重新部署（1-2 分钟）
- [ ] 生成域名
- [ ] 访问并测试应用

---

## 🌐 测试部署

访问你的 Zeabur URL，测试以下功能：

1. ✅ 首页正常显示
2. ✅ 点击 "开始使用" 进入登录页
3. ✅ 注册新用户
4. ✅ 登录并查看 Dashboard

---

## ⚠️ 重要：内网地址问题

**当前配置的 Supabase 地址（`http://10.1.20.75:8000`）是内网地址，在 Zeabur 上无法访问！**

### 临时测试方案

如果只是想看看部署效果，可以先部署，但用户注册/登录功能会失败。

### 生产环境解决方案

**推荐：使用 Supabase 云服务**

1. 访问：https://supabase.com
2. 使用 GitHub 登录
3. 创建新项目：
   - Name: `pbl-learning`
   - Database Password: 设置密码
   - Region: `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
4. 等待 2-3 分钟初始化
5. 在 SQL Editor 运行 `supabase-setup.sql`
6. 获取连接信息：
   - Settings → API
   - 复制 Project URL 和 anon public key
7. 在 Zeabur 更新环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 新的 key
8. 保存后自动重新部署

**优点：**
- ✅ 完全免费（500MB 数据库）
- ✅ 全球 CDN 加速
- ✅ 自动备份
- ✅ 适合生产环境

---

## 🔄 更新部署

修改代码后，重新部署：

1. 重新打包项目：
   ```bash
   zip -r pbl-learning.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"
   ```

2. 在 Zeabur 项目页面：
   - 点击服务
   - 点击 **"重新部署"**
   - 或上传新的 zip 文件

---

## 📊 部署日志

在 Zeabur 可以查看：
- **构建日志**：查看构建过程
- **运行日志**：查看应用运行状态
- **错误日志**：排查问题

点击服务 → **"日志"** 标签查看。

---

## 💰 费用说明

### 免费额度
- ✅ 每月免费额度
- ✅ 适合小型项目
- ✅ 自动 HTTPS
- ✅ CDN 加速

### 超出免费额度
- 按使用量计费
- 支持支付宝/微信支付
- 详见：https://zeabur.cn/pricing

---

## 🎉 完成！

现在你的应用已经部署到 Zeabur 中国区了！

**下一步：**
1. 访问你的 Zeabur URL 测试
2. 配置 Supabase 云服务（推荐）
3. 更新环境变量使用公网地址
4. 完整测试所有功能

---

## 📞 需要帮助？

- **官方文档**: https://zeabur.cn/docs
- **社区支持**: https://zeabur.cn/community
- **在线客服**: zeabur.cn 右下角

---

## 💡 提示

- 上传的 zip 文件已经排除了 `node_modules` 和 `.next`，所以很小（109KB）
- Zeabur 会自动安装依赖和构建项目
- 环境变量修改后会自动重新部署
- 可以绑定自定义域名（需要备案）

祝部署顺利！🚀
