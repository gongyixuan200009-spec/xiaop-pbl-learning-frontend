# 🚀 使用 Zeabur 中国区部署指南

## ⚠️ 重要：使用中国区服务

Zeabur 有两个区域：
- **国际版**: zeabur.com（可能被墙）
- **中国区**: zeabur.cn（国内可访问）✅

---

## 📋 部署步骤（使用中国区）

### 步骤 1：访问 Zeabur 中国区

打开浏览器访问：**https://zeabur.cn**

### 步骤 2：注册/登录

1. 点击右上角 **"登录"**
2. 选择登录方式：
   - 微信登录（推荐）
   - GitHub 登录
   - 邮箱登录

### 步骤 3：创建项目

1. 登录后，点击 **"创建项目"**
2. 输入项目名称：`pbl-learning`
3. 选择区域：
   - **上海** - 推荐，国内访问最快
   - **香港** - 备选
4. 点击 **"创建"**

### 步骤 4：上传代码

Zeabur 中国区支持多种部署方式：

#### 方式 1：使用 Web 界面上传（推荐）

1. 在项目页面，点击 **"添加服务"**
2. 选择 **"上传代码"** 或 **"本地文件"**
3. 将项目文件夹打包成 zip：
   ```bash
   # 在项目目录执行
   zip -r pbl-learning.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"
   ```
4. 上传 `pbl-learning.zip`
5. Zeabur 会自动检测 Next.js 项目并开始构建

#### 方式 2：使用 Git 仓库

如果你有 Gitee（码云）或 GitHub 账号：

1. 点击 **"添加服务"** → **"Git"**
2. 选择 **"Gitee"** 或 **"GitHub"**
3. 授权并选择仓库
4. 自动部署

#### 方式 3：使用 CLI（配置中国区）

```bash
# 设置使用中国区 API
export ZEABUR_API_ENDPOINT=https://gateway.zeabur.cn

# 登录
zeabur auth login

# 部署
zeabur
```

### 步骤 5：配置环境变量

1. 在项目页面，点击你的服务
2. 点击 **"环境变量"** 标签
3. 点击 **"添加变量"**
4. 添加以下变量：

```
NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

可选（AI 功能）：
```
OPENAI_API_KEY=sk-your-api-key
```

5. 点击 **"保存"**
6. Zeabur 会自动重新部署

### 步骤 6：获取部署 URL

1. 点击 **"网络"** 标签
2. 点击 **"生成域名"**
3. 获得免费域名：`https://pbl-learning-xxxx.zeabur.app`

---

## 📦 推荐方式：打包上传

这是最简单的方式，不需要 Git 仓库。

### 1. 打包项目

在项目目录执行：

```bash
# 排除不需要的文件，创建 zip 包
zip -r pbl-learning.zip . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x "*.log" \
  -x ".DS_Store"
```

这会创建 `pbl-learning.zip` 文件（约 1-2MB）。

### 2. 上传到 Zeabur

1. 访问：https://zeabur.cn
2. 登录并创建项目
3. 点击 **"添加服务"** → **"上传代码"**
4. 选择 `pbl-learning.zip` 上传
5. 等待构建完成

### 3. 配置环境变量

按照上面步骤 5 配置环境变量。

---

## 🔧 使用 CLI（中国区）

如果想使用命令行：

```bash
# 1. 设置中国区 API
export ZEABUR_API_ENDPOINT=https://gateway.zeabur.cn

# 2. 登录（会打开 zeabur.cn）
zeabur auth login

# 3. 部署
zeabur

# 4. 配置环境变量
zeabur env set NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000
zeabur env set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

**永久设置中国区：**

在 `~/.bashrc` 或 `~/.zshrc` 添加：
```bash
export ZEABUR_API_ENDPOINT=https://gateway.zeabur.cn
```

然后执行：
```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

---

## ⚠️ 重要：内网地址问题

**当前问题：** `http://10.1.20.75:8000` 是内网地址，在 Zeabur 上无法访问。

### 解决方案

#### 方案 1：使用 frp 内网穿透（国内推荐）

frp 是国内常用的内网穿透工具：

1. **下载 frp**
   - 访问：https://github.com/fatedier/frp/releases
   - 下载适合你系统的版本

2. **配置 frpc.ini**
   ```ini
   [common]
   server_addr = your-frp-server.com
   server_port = 7000

   [supabase]
   type = http
   local_ip = 10.1.20.75
   local_port = 8000
   custom_domains = your-domain.com
   ```

3. **启动 frp 客户端**
   ```bash
   ./frpc -c frpc.ini
   ```

4. **更新环境变量**
   ```bash
   zeabur env set NEXT_PUBLIC_SUPABASE_URL=http://your-domain.com
   ```

#### 方案 2：使用 Supabase 云服务（推荐）

1. 访问：https://supabase.com
2. 创建项目（免费）
3. 运行 `supabase-setup.sql`
4. 获取公网 URL
5. 更新环境变量

---

## 📊 Zeabur 中国区特点

### 优势
- ✅ 国内访问速度快
- ✅ 支持微信登录
- ✅ 中文界面
- ✅ 国内支付方式

### 区域选择
- **上海** - 国内访问最快（推荐）
- **香港** - 国际访问较好
- **新加坡** - 东南亚访问好

---

## 🎯 推荐部署流程

### 最简单的方式（Web 界面）

1. **打包项目**
   ```bash
   zip -r pbl-learning.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"
   ```

2. **访问 Zeabur 中国区**
   - 打开：https://zeabur.cn
   - 登录（微信/GitHub/邮箱）

3. **创建项目并上传**
   - 创建项目：`pbl-learning`
   - 区域：上海
   - 添加服务 → 上传代码
   - 选择 `pbl-learning.zip`

4. **配置环境变量**
   - 添加 Supabase 配置
   - 保存并等待重新部署

5. **获取 URL**
   - 网络 → 生成域名
   - 访问测试

---

## 💰 费用说明

### 免费额度
- ✅ 每月免费额度
- ✅ 适合小型项目
- ✅ 自动 HTTPS
- ✅ CDN 加速

### 付费套餐
- 按使用量计费
- 支持支付宝/微信支付
- 详见：https://zeabur.cn/pricing

---

## 📞 帮助资源

- **官方文档**: https://zeabur.cn/docs
- **社区支持**: https://zeabur.cn/community
- **客服支持**: 在线客服

---

## 🎉 开始部署

现在就访问 **https://zeabur.cn** 开始部署吧！

**推荐流程：**
1. 打包项目（上面的 zip 命令）
2. 访问 zeabur.cn 登录
3. 创建项目并上传 zip
4. 配置环境变量
5. 获取 URL 并测试

祝部署顺利！🚀
