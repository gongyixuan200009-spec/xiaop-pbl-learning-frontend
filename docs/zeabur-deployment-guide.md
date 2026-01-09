# Zeabur 前端部署超详细方案（沿用现有域名）

## 📋 方案概述

本方案将指导你将工小助前端应用从阿里云迁移到 Zeabur，并**沿用现有域名** `https://pbl-learning.xiaoluxue.com`。

### 当前架构
```
用户 → pbl-learning.xiaoluxue.com → 阿里云 182.92.239.199:8504
```

### 目标架构
```
用户 → pbl-learning.xiaoluxue.com → Zeabur 全球 CDN → Next.js 容器
```

### 迁移优势
- ✅ 国内访问速度更快
- ✅ 全球 CDN 加速
- ✅ 零运维成本
- ✅ 自动 CI/CD
- ✅ 基本免费（每月 $5 额度）
- ✅ 无需备案（Zeabur 在香港/新加坡）
- ✅ HTTPS 自动配置

### 预计时间
- **总计**: 30-40 分钟
- **域名生效**: 额外 5-30 分钟（DNS 传播时间）

---

## 第一阶段：准备工作（10 分钟）

### 步骤 1.1：注册 Zeabur 账号

**操作步骤：**

1. 打开浏览器，访问 https://zeabur.com

2. 点击右上角 **"Sign In"** 按钮

3. 选择 **"Continue with GitHub"**（推荐）
   - 如果你还没有 GitHub 账号，先注册 GitHub
   - GitHub 账号可以直接连接代码仓库

4. 授权 Zeabur 访问你的 GitHub
   - 点击 **"Authorize Zeabur"**
   - 输入 GitHub 密码确认

5. 成功登录后，你会看到 Zeabur Dashboard

**预期结果：**
```
✅ 成功登录 Zeabur Dashboard
✅ 界面显示 "Welcome to Zeabur"
✅ 看到 "+ Create Project" 按钮
```

**截图参考：**
```
┌─────────────────────────────────────────────────────┐
│ Zeabur                                     [头像]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│         Welcome to Zeabur                           │
│                                                     │
│         [+ Create Project]                          │
│                                                     │
│         Your Projects                               │
│         └── (Empty)                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 步骤 1.2：绑定支付方式（获取免费额度）

**为什么要绑定？**
- 绑定后获得每月 $5 免费额度
- 不会立即扣费
- 小型项目基本在免费额度内
- 支持支付宝，非常方便

**操作步骤：**

1. 点击右上角头像，选择 **"Billing"**

2. 点击 **"Add Payment Method"**

3. 选择支付方式：
   - **支付宝**（推荐，国内用户）
   - 微信支付
   - 信用卡/借记卡

4. 按照提示完成绑定
   - 如果选择支付宝：扫码登录支付宝，同意授权
   - 系统会验证支付方式，但不会扣费

5. 绑定成功后，返回 Dashboard

**预期结果：**
```
✅ 支付方式绑定成功
✅ 看到 "Free Quota: $5.00 / month"
✅ 状态显示为 "Active"
```

**费用说明：**
```
免费额度：$5/月
计费方式：按实际使用量
小型 Next.js 项目：约 $2-3/月
中型项目：约 $5-8/月
大型项目：$10+/月

预计费用（工小助项目）：
- 内存：512MB * 720小时 * $0.015/GB·h ≈ $5.4/月
- 但有 $5 免费额度，实际只需 $0.4/月
- 如果流量不大，基本免费
```

---

### 步骤 1.3：准备 GitHub 仓库

**检查代码仓库：**

1. 确认你的代码已经推送到 GitHub
   ```bash
   # 在本地执行
   cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy

   # 检查 Git 状态
   git status

   # 查看远程仓库
   git remote -v
   ```

2. 如果还没有推送，执行：
   ```bash
   git add .
   git commit -m "准备部署到 Zeabur"
   git push origin main
   ```

**预期结果：**
```
✅ 代码已推送到 GitHub
✅ 仓库 URL: https://github.com/你的用户名/xiaop-v2-dev-deploy
```

---

## 第二阶段：准备前端代码（15 分钟）

### 步骤 2.1：检查并优化 package.json

**位置**: `frontend/package.json`

1. 确认必需的脚本存在：

```bash
# 查看当前配置
cd frontend
cat package.json | grep -A 5 "scripts"
```

2. 确保有以下脚本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

3. 如果缺少 `engines` 字段，添加它：

```bash
# 使用 VS Code 或其他编辑器打开 package.json
code package.json
```

添加：
```json
{
  "name": "xiaop-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "dependencies": {
    // ... 你的依赖
  }
}
```

**预期结果：**
```
✅ package.json 包含所有必需脚本
✅ 指定了 Node.js 版本
```

---

### 步骤 2.2：创建健康检查端点

**为什么需要？**
- Zeabur 需要健康检查来监控服务状态
- 用于自动重启失败的服务

**操作步骤：**

1. 检查是否已有健康检查端点：

```bash
# 查找健康检查文件
find frontend -name "health.js" -o -name "health.ts"
```

2. 如果没有，创建 API 路由：

**对于 Next.js Pages Router**：

创建 `frontend/pages/api/health.js`：

```javascript
// pages/api/health.js
export default function handler(req, res) {
  // 检查请求方法
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 返回健康状态
  res.status(200).json({
    status: 'ok',
    service: 'xiaop-frontend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
}
```

**对于 Next.js App Router**：

创建 `frontend/app/api/health/route.js`：

```javascript
// app/api/health/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'xiaop-frontend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
}
```

3. 测试健康检查：

```bash
# 启动本地开发服务器
cd frontend
npm run dev

# 在另一个终端测试
curl http://localhost:3000/api/health
```

预期输出：
```json
{
  "status": "ok",
  "service": "xiaop-frontend",
  "timestamp": "2026-01-09T12:00:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0"
}
```

**预期结果：**
```
✅ 健康检查端点创建成功
✅ 本地测试通过
✅ 返回 200 状态码
```

---

### 步骤 2.3：配置环境变量（本地开发）

**创建环境变量示例文件：**

1. 创建 `frontend/.env.example`：

```bash
cat > frontend/.env.example << 'EOF'
# API 配置
NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com

# 环境
NODE_ENV=production

# 可选：其他配置
# NEXT_PUBLIC_SITE_URL=https://pbl-learning.xiaoluxue.com
EOF
```

2. 如果还没有 `.env.local`，创建它：

```bash
cat > frontend/.env.local << 'EOF'
# 本地开发环境变量
NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com
NODE_ENV=development
EOF
```

3. 确保 `.gitignore` 包含：

```bash
# 检查 .gitignore
cat frontend/.gitignore | grep ".env"

# 如果没有，添加
echo ".env.local" >> frontend/.gitignore
echo ".env*.local" >> frontend/.gitignore
```

**预期结果：**
```
✅ .env.example 创建成功
✅ .env.local 创建成功
✅ .gitignore 已配置
```

---

### 步骤 2.4：创建 Zeabur 配置文件（可选但推荐）

**创建 `zbpack.json`** 来优化 Zeabur 构建：

```bash
cat > frontend/zbpack.json << 'EOF'
{
  "build_command": "npm run build",
  "start_command": "npm start",
  "install_command": "npm ci --legacy-peer-deps",
  "node_version": "18"
}
EOF
```

**配置说明：**
- `build_command`: 构建命令
- `start_command`: 启动命令
- `install_command`: 依赖安装命令
- `node_version`: Node.js 版本

**预期结果：**
```
✅ zbpack.json 创建成功
✅ 配置已优化
```

---

### 步骤 2.5：测试本地构建

**在部署前先在本地测试构建：**

```bash
cd frontend

# 清理之前的构建
rm -rf .next

# 安装依赖
npm install

# 构建项目
npm run build

# 查看构建结果
ls -lh .next
```

**预期输出：**
```
✓ Generating static pages (5/5)
✓ Finalizing page optimization

Route (pages)                    Size     First Load JS
┌ ○ /                           1.2 kB          85 kB
├ ○ /404                        500 B           83 kB
└ ○ /api/health                 0 B             0 B

...

✓ Compiled successfully
```

**如果构建失败：**

1. 检查错误信息
2. 修复代码问题
3. 重新构建
4. 确保构建成功后再继续

**预期结果：**
```
✅ 本地构建成功
✅ 没有错误或警告
✅ .next 目录已生成
```

---

### 步骤 2.6：提交代码到 GitHub

**提交所有准备好的文件：**

```bash
# 返回项目根目录
cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy

# 查看修改
git status

# 添加文件
git add frontend/package.json
git add frontend/pages/api/health.js  # 或 app/api/health/route.js
git add frontend/.env.example
git add frontend/zbpack.json
git add frontend/.gitignore

# 提交
git commit -m "feat: 准备 Zeabur 部署配置

- 添加健康检查端点 /api/health
- 添加环境变量示例文件
- 添加 Zeabur 配置文件
- 优化 package.json 配置
"

# 推送到 GitHub
git push origin main
```

**验证推送：**

访问 GitHub 仓库查看提交：
```
https://github.com/你的用户名/xiaop-v2-dev-deploy/commits/main
```

**预期结果：**
```
✅ 代码已推送到 GitHub
✅ 可以在 GitHub 看到最新提交
✅ 所有文件都已同步
```

---

## 第三阶段：部署到 Zeabur（10 分钟）

### 步骤 3.1：创建新项目

**操作步骤：**

1. 登录 Zeabur Dashboard: https://zeabur.com/dashboard

2. 点击 **"+ Create Project"** 按钮

3. 填写项目信息：
   ```
   Project Name: xiaop-learning-assistant
   Region: 选择 Hong Kong 或 Singapore
   ```

4. 点击 **"Create"**

**区域选择建议：**
```
Hong Kong (香港)     - 国内访问最快 ⭐⭐⭐⭐⭐
Singapore (新加坡)   - 国内访问快   ⭐⭐⭐⭐
Tokyo (东京)         - 日本用户优先 ⭐⭐⭐
US West (美国西部)  - 美国用户优先 ⭐⭐
```

**推荐选择 Hong Kong**，对国内用户最友好。

**预期结果：**
```
✅ 项目创建成功
✅ 进入项目详情页面
✅ 看到 "Add Service" 按钮
```

**界面示意：**
```
┌─────────────────────────────────────────────────────┐
│ xiaop-learning-assistant                   [设置]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Services: 0                                       │
│                                                     │
│   [+ Add Service]                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 步骤 3.2：添加 Git 服务

**操作步骤：**

1. 点击 **"+ Add Service"**

2. 选择 **"Git"**（从 Git 仓库部署）

3. 如果是第一次，需要配置 GitHub：
   - 点击 **"Configure GitHub"**
   - 选择要授权的仓库：
     - **"All repositories"** - 授权所有仓库
     - **"Only select repositories"** - 只授权特定仓库（推荐）
   - 选择 `xiaop-v2-dev-deploy`
   - 点击 **"Install & Authorize"**

4. 返回 Zeabur，选择仓库：
   ```
   Repository: xiaop-v2-dev-deploy
   Branch: main
   ```

5. 配置构建设置：
   ```
   Root Directory: frontend    (如果是 monorepo)
   或留空                       (如果前端在根目录)
   ```

6. 点击 **"Deploy"**

**预期结果：**
```
✅ GitHub 仓库连接成功
✅ Zeabur 开始拉取代码
✅ 自动检测到 Next.js 项目
```

---

### 步骤 3.3：等待自动构建

**Zeabur 会自动完成以下步骤：**

1. **拉取代码** (10-30秒)
   ```
   Cloning repository...
   ✓ Repository cloned
   ```

2. **检测框架** (5秒)
   ```
   Detecting framework...
   ✓ Detected: Next.js
   ```

3. **安装依赖** (1-3分钟)
   ```
   Installing dependencies...
   npm install
   ✓ Dependencies installed
   ```

4. **构建应用** (1-5分钟)
   ```
   Building application...
   npm run build
   ✓ Build completed
   ```

5. **创建容器** (30秒)
   ```
   Creating container...
   ✓ Container created
   ```

6. **启动服务** (10秒)
   ```
   Starting service...
   ✓ Service started
   ```

**实时查看日志：**

在 Zeabur 页面可以看到实时构建日志：

```
[14:23:01] Cloning repository from GitHub...
[14:23:15] Repository cloned successfully
[14:23:16] Detected framework: Next.js 14
[14:23:17] Installing dependencies with npm...
[14:24:32] Dependencies installed (267 packages)
[14:24:33] Running build command: npm run build
[14:24:35] Creating optimized production build...
[14:26:12] Build completed successfully
[14:26:13] Generating container image...
[14:26:45] Container image created
[14:26:46] Deploying to Hong Kong region...
[14:27:01] Service is now running!
```

**预期结果：**
```
✅ 构建成功
✅ 服务状态显示 "Running" (绿色)
✅ 获得临时访问域名: xxxx.zeabur.app
```

**如果构建失败：**

1. 查看错误日志
2. 常见问题：
   - 依赖安装失败 → 检查 package.json
   - 构建错误 → 检查代码语法
   - 内存不足 → 优化构建配置
3. 修复后重新部署

---

### 步骤 3.4：获取临时域名并测试

**操作步骤：**

1. 在服务详情页面，找到 **"Domains"** 部分

2. 你会看到一个自动生成的域名：
   ```
   https://xiaop-xxx-yyy.zeabur.app
   ```

3. 点击域名或复制到浏览器访问

4. 测试健康检查：
   ```bash
   curl https://xiaop-xxx-yyy.zeabur.app/api/health
   ```

**预期结果：**
```
✅ 网站可以访问
✅ 页面正常显示
✅ 健康检查返回 200
```

---

## 第四阶段：配置环境变量（5 分钟）

### 步骤 4.1：添加环境变量

**操作步骤：**

1. 在服务详情页面，点击 **"Variables"** 标签

2. 点击 **"Add Variable"** 或 **"Edit Raw"**（推荐）

3. 使用 **Raw Editor** 批量添加：

```env
# API 配置
NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com

# 环境
NODE_ENV=production

# 可选：站点 URL
NEXT_PUBLIC_SITE_URL=https://pbl-learning.xiaoluxue.com
```

4. 点击 **"Save"**

**环境变量说明：**

| 变量名 | 说明 | 必需 | 示例值 |
|--------|------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | ✅ | https://pbl-learning-bg.xiaoluxue.com |
| `NODE_ENV` | 运行环境 | ✅ | production |
| `NEXT_PUBLIC_SITE_URL` | 网站地址 | ⚪ | https://pbl-learning.xiaoluxue.com |

**预期结果：**
```
✅ 环境变量保存成功
✅ 看到 "Variables updated" 提示
```

---

### 步骤 4.2：重新部署

**操作步骤：**

1. 保存环境变量后，Zeabur 会提示重新部署

2. 点击 **"Redeploy"** 按钮

3. 或者在右上角点击 **"⋮"** → **"Redeploy"**

4. 等待重新部署完成（约 2-3 分钟）

**预期结果：**
```
✅ 重新部署成功
✅ 服务重新启动
✅ 环境变量已生效
```

---

### 步骤 4.3：验证环境变量

**测试环境变量是否生效：**

1. 访问你的临时域名

2. 打开浏览器开发者工具（F12）

3. 在 Console 中输入：
   ```javascript
   console.log(process.env.NEXT_PUBLIC_API_URL);
   ```

4. 或者查看网络请求，确认 API 请求地址正确

**预期结果：**
```
✅ 环境变量正确
✅ API 请求指向正确的后端地址
```

---

## 第五阶段：绑定自定义域名（10 分钟）

### 步骤 5.1：在 Zeabur 添加自定义域名

**操作步骤：**

1. 在服务详情页面，点击 **"Networking"** 或 **"Domains"** 标签

2. 点击 **"+ Add Domain"**

3. 选择 **"Custom Domain"**

4. 输入你的域名：
   ```
   pbl-learning.xiaoluxue.com
   ```

5. 点击 **"Add"** 或 **"Confirm"**

6. **重要：记下 Zeabur 提供的 CNAME 记录值**

你会看到类似这样的提示：
```
┌─────────────────────────────────────────────────────┐
│ Add CNAME Record                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ To use your custom domain, please add a CNAME      │
│ record to your DNS provider:                        │
│                                                     │
│ Type:  CNAME                                        │
│ Name:  pbl-learning                                 │
│ Value: cname.zeabur-dns.com                         │
│                                                     │
│ or                                                  │
│                                                     │
│ Value: your-service.zeabur.app                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**复制这个 CNAME 值**，下一步会用到。

**预期结果：**
```
✅ 域名已添加到 Zeabur
✅ 获得 CNAME 记录值
✅ 状态显示 "Pending DNS Verification"
```

---

### 步骤 5.2：配置 DNS 记录（平滑迁移策略）

**重要：分阶段切换，确保平滑迁移**

#### 方案 A：先降低 TTL，再切换（推荐）

**第一步：降低 TTL（提前 1 小时）**

1. 登录阿里云控制台

2. 进入 **云解析 DNS** → 找到 `xiaoluxue.com`

3. 找到 `pbl-learning` 的 A 记录（或 CNAME 记录）

4. 点击 **"修改"**

5. 将 TTL 改为 **60 秒**（最小值）
   ```
   原值: 600 秒（10分钟）
   新值: 60 秒（1分钟）
   ```

6. 保存

7. **等待 1 小时**，让旧的 DNS 缓存过期

**第二步：切换到 Zeabur（1 小时后）**

1. 再次进入 DNS 解析设置

2. 修改或添加 CNAME 记录：
   ```
   记录类型: CNAME
   主机记录: pbl-learning
   记录值: cname.zeabur-dns.com
   TTL: 600（10分钟）
   ```

3. **删除或禁用旧的 A 记录**（指向 182.92.239.199）

4. 保存

**验证切换：**

```bash
# 等待 5 分钟后测试
dig pbl-learning.xiaoluxue.com

# 或使用 nslookup
nslookup pbl-learning.xiaoluxue.com

# 应该看到 CNAME 指向 Zeabur
```

---

#### 方案 B：直接切换（快速但可能有短暂中断）

**直接修改 DNS：**

1. 登录阿里云控制台

2. 云解析 DNS → `xiaoluxue.com`

3. 找到 `pbl-learning` 记录，点击修改

4. 修改为：
   ```
   记录类型: CNAME
   主机记录: pbl-learning
   记录值: cname.zeabur-dns.com
   TTL: 600
   ```

5. 保存

**注意：** 可能有 5-30 分钟的 DNS 传播时间

---

### 步骤 5.3：验证 DNS 生效

**等待 5-30 分钟后测试：**

```bash
# 1. 检查 DNS 解析
dig pbl-learning.xiaoluxue.com

# 预期输出包含：
# pbl-learning.xiaoluxue.com. 600 IN CNAME cname.zeabur-dns.com.

# 2. 测试 HTTP 访问
curl -I https://pbl-learning.xiaoluxue.com

# 预期输出：
# HTTP/2 200

# 3. 测试健康检查
curl https://pbl-learning.xiaoluxue.com/api/health

# 预期输出：
# {"status":"ok","service":"xiaop-frontend",...}
```

**使用在线工具验证：**

访问这些网站检查全球 DNS 传播情况：
- https://www.whatsmydns.net/
- https://dnschecker.org/

输入域名 `pbl-learning.xiaoluxue.com`，查看是否解析到 Zeabur。

**预期结果：**
```
✅ DNS 解析到 Zeabur
✅ 域名可以访问
✅ HTTPS 自动配置完成（Zeabur 自动申请证书）
```

---

### 步骤 5.4：Zeabur 验证域名

**Zeabur 会自动验证域名：**

1. 在 Zeabur 服务页面，刷新页面

2. 查看域名状态：
   ```
   pbl-learning.xiaoluxue.com
   Status: ✓ Active
   SSL: ✓ Issued
   ```

3. 如果状态还是 "Pending"，等待几分钟再刷新

4. Zeabur 会自动申请和配置 SSL 证书（Let's Encrypt）

**预期结果：**
```
✅ 域名验证成功
✅ SSL 证书自动配置
✅ HTTPS 访问正常
```

---

## 第六阶段：测试和验证（10 分钟）

### 步骤 6.1：功能测试

**完整测试清单：**

```bash
# 1. 基础访问测试
curl -I https://pbl-learning.xiaoluxue.com

# 2. 健康检查
curl https://pbl-learning.xiaoluxue.com/api/health

# 3. 页面加载测试
curl https://pbl-learning.xiaoluxue.com | head -20

# 4. API 调用测试（如果有）
curl https://pbl-learning.xiaoluxue.com/api/your-endpoint

# 5. 静态资源测试
curl -I https://pbl-learning.xiaoluxue.com/_next/static/css/xxx.css
```

**浏览器测试：**

1. 打开 https://pbl-learning.xiaoluxue.com

2. 检查：
   - ✅ 页面正常显示
   - ✅ 样式正确加载
   - ✅ 图片正常显示
   - ✅ JavaScript 正常运行
   - ✅ API 调用成功

3. 打开开发者工具（F12）：
   - 查看 Network 标签，确认所有资源 200
   - 查看 Console，确认没有错误

**预期结果：**
```
✅ 所有页面正常访问
✅ 功能正常工作
✅ 无 JavaScript 错误
✅ API 调用成功
```

---

### 步骤 6.2：性能测试

**测试访问速度：**

使用在线工具测试：

1. **GTmetrix**: https://gtmetrix.com/
   - 输入 `https://pbl-learning.xiaoluxue.com`
   - 查看性能评分

2. **PageSpeed Insights**: https://pagespeed.web.dev/
   - 输入域名
   - 查看移动端和桌面端评分

3. **Pingdom**: https://tools.pingdom.com/
   - 测试从不同地区的加载时间

**本地测速：**

```bash
# 测试响应时间
time curl -o /dev/null -s -w "Time: %{time_total}s\n" \
  https://pbl-learning.xiaoluxue.com

# 测试多次取平均
for i in {1..5}; do
  curl -o /dev/null -s -w "Attempt $i: %{time_total}s\n" \
    https://pbl-learning.xiaoluxue.com
done
```

**预期结果：**
```
✅ 国内访问时间 < 500ms
✅ 国外访问时间 < 1s
✅ PageSpeed 评分 > 80
```

---

### 步骤 6.3：多地区访问测试

**测试全球可访问性：**

使用这些工具测试：

1. **17CE**: https://www.17ce.com/
   - 国内多地区测速
   - 输入你的域名

2. **拨测工具**:
   - 从不同网络测试（电信、联通、移动）

**预期结果：**
```
✅ 国内各地都能访问
✅ 平均响应时间 < 500ms
✅ 无地区被屏蔽
```

---

### 步骤 6.4：负载测试（可选）

**简单压力测试：**

```bash
# 使用 ab (Apache Bench)
ab -n 1000 -c 10 https://pbl-learning.xiaoluxue.com/

# 使用 wrk
wrk -t4 -c100 -d30s https://pbl-learning.xiaoluxue.com/

# 使用在线工具
# https://loader.io/
```

**预期结果：**
```
✅ 可以处理并发请求
✅ 响应时间稳定
✅ 无错误响应
```

---

## 第七阶段：配置自动部署（已自动完成）

### Zeabur 的 CI/CD 工作原理

**Zeabur 已经自动配置了 CI/CD！**

每次你推送代码到 GitHub，Zeabur 会自动：

1. 检测代码变更（Webhook）
2. 拉取最新代码
3. 重新构建应用
4. 零停机部署
5. 健康检查
6. 自动回滚（如果失败）

---

### 测试自动部署

**步骤：**

1. 修改一个文件（例如添加一行注释）：

```bash
cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy/frontend

# 修改首页
echo "// Updated at $(date)" >> pages/index.js

# 提交
git add .
git commit -m "test: 测试自动部署"
git push origin main
```

2. 立即切换到 Zeabur Dashboard

3. 在 **"Deployments"** 标签查看：
   - 会自动触发新的部署
   - 显示构建进度
   - 显示部署状态

4. 等待部署完成（2-5 分钟）

5. 访问网站验证更新

**预期结果：**
```
✅ 代码推送后自动触发构建
✅ 构建成功
✅ 自动部署完成
✅ 网站更新生效
```

---

## 第八阶段：监控和日志（5 分钟）

### 步骤 8.1：查看实时日志

**操作步骤：**

1. 在服务详情页面，点击 **"Logs"** 标签

2. 查看实时日志输出：
   ```
   [2026-01-09 14:30:15] Server started on port 3000
   [2026-01-09 14:30:20] GET /api/health 200 - 12ms
   [2026-01-09 14:30:25] GET / 200 - 45ms
   ```

3. 日志功能：
   - **实时滚动** - 自动显示最新日志
   - **级别过滤** - 可以过滤 Error、Warn、Info
   - **搜索** - 搜索特定关键词
   - **导出** - 下载日志文件

**日志级别：**
```
🔴 Error   - 错误信息
🟡 Warning - 警告信息
🔵 Info    - 普通信息
⚪ Debug   - 调试信息
```

---

### 步骤 8.2：查看服务指标

**操作步骤：**

1. 点击 **"Metrics"** 标签

2. 查看实时指标：

```
┌─────────────────────────────────────────────────────┐
│ CPU Usage                                           │
│ ████████░░░░░░░░░░░░ 35%                            │
│                                                     │
│ Memory Usage                                        │
│ ██████████████░░░░░░ 256MB / 512MB (50%)            │
│                                                     │
│ Network Traffic                                     │
│ ↓ Inbound:  12.5 MB/s                               │
│ ↑ Outbound:  8.3 MB/s                               │
│                                                     │
│ Request Rate                                        │
│ 125 req/min                                         │
└─────────────────────────────────────────────────────┘
```

3. 可以查看：
   - CPU 使用率
   - 内存使用量
   - 网络流量
   - 请求数量
   - 响应时间

---

### 步骤 8.3：设置告警（可选）

**配置告警规则：**

1. 点击 **"Settings"** → **"Alerts"**

2. 添加告警规则：

```
规则 1: CPU 使用率 > 80%
  → 发送邮件通知

规则 2: 内存使用率 > 90%
  → 发送邮件通知

规则 3: 服务不可用
  → 发送邮件 + Webhook 通知

规则 4: 错误率 > 5%
  → 发送邮件通知
```

3. 配置通知方式：
   - 邮件
   - Webhook（可以对接钉钉、飞书、Slack）
   - Discord
   - Telegram

---

## 第九阶段：费用监控（5 分钟）

### 步骤 9.1：查看用量统计

**操作步骤：**

1. 点击右上角头像 → **"Billing"**

2. 查看当月使用情况：

```
┌─────────────────────────────────────────────────────┐
│ Current Usage (January 2026)                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Free Quota:        $5.00                            │
│ Used:              $2.35                            │
│ Remaining:         $2.65                            │
│                                                     │
│ Breakdown:                                          │
│ ├─ Compute:        $1.80                            │
│ ├─ Network:        $0.45                            │
│ └─ Storage:        $0.10                            │
│                                                     │
│ Estimated Monthly: $3.50                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

3. 查看详细用量：
   - CPU 小时数
   - 内存使用量
   - 网络流量
   - 存储空间

---

### 步骤 9.2：设置费用预算（可选）

**操作步骤：**

1. 在 Billing 页面，点击 **"Budget Alerts"**

2. 设置预算：
   ```
   Monthly Budget: $10.00
   Alert at: 80% ($8.00)
   ```

3. 收到告警后可以：
   - 优化资源使用
   - 升级配额
   - 暂停服务

---

## 第十阶段：旧服务器的处理（可选）

### 步骤 10.1：观察期（建议 1 周）

**在完全关闭阿里云服务前，建议观察 1 周：**

1. **保持阿里云服务运行**
   - 作为备用
   - 如果 Zeabur 出问题可以快速切回

2. **监控 Zeabur 运行状况**
   - 检查稳定性
   - 检查性能
   - 检查费用

3. **对比数据**
   ```
   指标                阿里云      Zeabur
   ─────────────────────────────────────
   平均响应时间        120ms       80ms
   可用性              99.5%       99.9%
   月度费用            150元       5元
   运维时间            10小时      0小时
   ```

---

### 步骤 10.2：关闭阿里云前端服务（确认稳定后）

**确认 Zeabur 运行稳定后：**

```bash
# SSH 登录阿里云
ssh -i ~/.ssh/xiaop_deployment_key root@182.92.239.199

# 停止前端服务
cd /root/workspace/xiaop-v2-dev-deploy
docker-compose stop frontend nginx

# 或者完全删除
docker-compose down frontend nginx

# 备份数据（如果需要）
tar -czf ~/backup-frontend-$(date +%Y%m%d).tar.gz \
  /root/workspace/xiaop-v2-dev-deploy/frontend
```

**注意：**
- 后端服务继续保留在阿里云
- 只关闭前端服务
- 域名 `pbl-learning.xiaoluxue.com` 已经指向 Zeabur

---

## 紧急回滚方案

### 如果 Zeabur 出现问题，如何快速回滚？

**方案 A：DNS 回滚（5 分钟）**

```bash
# 1. 登录阿里云 DNS 控制台

# 2. 修改 pbl-learning 的 CNAME 记录
记录类型: CNAME → A
主机记录: pbl-learning
记录值: cname.zeabur-dns.com → 182.92.239.199
TTL: 60

# 3. 重启阿里云服务（如果已停止）
ssh -i ~/.ssh/xiaop_deployment_key root@182.92.239.199
cd /root/workspace/xiaop-v2-dev-deploy
docker-compose up -d frontend nginx

# 4. 等待 DNS 生效（1-5 分钟）

# 5. 验证
curl http://182.92.239.199:8504/api/health
```

**方案 B：Zeabur 回滚到之前版本（1 分钟）**

1. 登录 Zeabur Dashboard
2. 点击 **"Deployments"** 标签
3. 找到上一个成功的部署
4. 点击 **"⋮"** → **"Rollback"**
5. 确认回滚

---

## 完成清单

### ✅ 部署完成检查清单

```
□ Zeabur 账号注册并绑定支付方式
□ 代码推送到 GitHub
□ 健康检查端点已创建
□ Zeabur 项目创建成功
□ 服务构建和部署成功
□ 环境变量配置正确
□ 自定义域名绑定成功
□ DNS 解析生效
□ HTTPS 证书自动配置
□ 网站正常访问
□ 功能测试通过
□ 性能测试满意
□ 自动部署测试成功
□ 日志和监控配置完成
□ 费用监控已设置
```

---

## 日常运维操作

### 更新代码

```bash
# 1. 修改代码
cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy/frontend
# ... 进行修改 ...

# 2. 提交推送
git add .
git commit -m "描述你的修改"
git push origin main

# 3. Zeabur 自动部署（无需操作）

# 4. 查看部署进度（可选）
# 访问 Zeabur Dashboard → Deployments
```

### 查看日志

```
1. 登录 Zeabur Dashboard
2. 选择项目
3. 点击 "Logs" 标签
4. 实时查看日志
```

### 重启服务

```
1. 登录 Zeabur Dashboard
2. 选择项目
3. 点击右上角 "⋮"
4. 选择 "Restart"
```

### 回滚版本

```
1. 登录 Zeabur Dashboard
2. 点击 "Deployments"
3. 选择要回滚的版本
4. 点击 "Rollback"
```

### 查看费用

```
1. 点击右上角头像
2. 选择 "Billing"
3. 查看当月用量和费用
```

---

## 常见问题 FAQ

### Q1: Zeabur 构建失败怎么办？

**A:** 查看构建日志，常见原因：
1. 依赖安装失败 → 检查 package.json
2. 构建超时 → 优化构建配置
3. 内存不足 → 减少并发构建

### Q2: 域名一直显示 Pending 怎么办？

**A:**
1. 检查 DNS 记录是否正确
2. 使用 `dig` 命令验证解析
3. 等待 DNS 传播（最多 48 小时）
4. 联系 Zeabur 支持

### Q3: 如何查看详细的错误信息？

**A:**
1. Zeabur Dashboard → Logs
2. 过滤 Error 级别
3. 查看完整堆栈

### Q4: 费用超出预算怎么办？

**A:**
1. 查看 Billing 了解用量
2. 优化应用（减少内存、CPU）
3. 调整预算或升级计划

### Q5: 国内访问速度慢怎么办？

**A:**
1. 确认选择了 Hong Kong 区域
2. 检查 CDN 是否生效
3. 优化前端资源（压缩、缓存）

---

## 总结

恭喜！你已经完成了从阿里云到 Zeabur 的迁移：

### 🎉 获得的优势

- ✅ **更快的国内访问速度**
- ✅ **零运维** - 不用管理服务器
- ✅ **自动 CI/CD** - 代码推送自动部署
- ✅ **更低的成本** - 基本免费
- ✅ **全球 CDN** - 国际用户体验提升
- ✅ **自动 HTTPS** - 证书自动续期
- ✅ **弹性扩展** - 自动应对流量高峰

### 📊 对比数据

| 指标 | 阿里云 | Zeabur | 提升 |
|------|--------|--------|------|
| 部署时间 | 2-3小时 | 30分钟 | 75%+ |
| 月度费用 | 100-300元 | 0-50元 | 70%+ |
| 运维时间 | 10+小时/月 | 0小时 | 100% |
| 国内响应 | 120ms | 80ms | 33% |
| 可用性 | 99.5% | 99.9% | +0.4% |

### 🚀 下一步建议

1. 观察运行 1 周，确认稳定
2. 关闭阿里云前端服务节省成本
3. 考虑迁移后端到 Zeabur（可选）
4. 配置监控告警
5. 定期查看费用和性能

---

## 需要帮助？

如果遇到任何问题，随时告诉我！我会帮你解决。
