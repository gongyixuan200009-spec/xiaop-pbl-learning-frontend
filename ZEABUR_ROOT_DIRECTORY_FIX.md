# Zeabur 部署问题修复 - 完整指南

## 问题诊断

从您的日志分析：

```
service-696750132952d01a4bcd7771-869577f9ff-rmqks
服务名称: xiaop-pbl-learning-frontend
```

**问题**：
1. ❌ Zeabur 部署了整个仓库根目录，而不是 `backend` 目录
2. ❌ 没有找到 Python 应用，使用了默认的 Caddy 服务器
3. ❌ 服务启动后立即被终止（健康检查失败）

## 解决方案

### 方案 1: 在 Zeabur 控制台指定根目录（推荐）

#### 步骤 1: 删除现有服务

1. 登录 Zeabur: https://zeabur.com
2. 进入您的项目
3. 找到 `xiaop-pbl-learning-frontend` 服务
4. 点击服务 → Settings → 滚动到底部
5. 点击 **"Delete Service"** 删除服务

#### 步骤 2: 重新创建后端服务

1. 在项目中点击 **"Add Service"**
2. 选择 **"Git"**
3. 选择仓库: `gongyixuan200009-spec/xiaop-pbl-learning-frontend`
4. 选择分支: `zeabur-version`
5. **重要**：在 "Root Directory" 字段输入: `backend`
   ```
   Root Directory: backend
   ```
6. 点击 **"Deploy"**

#### 步骤 3: 配置环境变量

在服务部署后，添加环境变量：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SECRET_KEY=your_random_secret_key_min_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=*
```

#### 步骤 4: 等待部署完成

查看部署日志，应该看到：
```
Installing dependencies from requirements.txt
Starting uvicorn on port 8080
Application startup complete
```

### 方案 2: 使用 Zeabur 配置文件

如果控制台没有 "Root Directory" 选项，使用配置文件：

#### 创建 `.zeabur/config.yaml`

我已经为您准备好了，现在需要推送到 GitHub：

```bash
# 创建目录
mkdir -p .zeabur

# 创建配置文件
cat > .zeabur/config.yaml << 'EOF'
# Zeabur 配置文件
# 指定后端服务的根目录

services:
  - name: backend
    path: backend
    build:
      command: pip install -r requirements.txt
    start:
      command: uvicorn main:app --host 0.0.0.0 --port 8080
    environment: python
EOF

# 提交并推送
git add .zeabur/config.yaml
git commit -m "feat: Add Zeabur config to specify backend root directory"
git push github zeabur-version
```

然后在 Zeabur 重新部署。

### 方案 3: 创建单独的后端仓库（最可靠）

如果上述方法都不行，创建一个只包含后端代码的仓库：

```bash
# 1. 创建新目录
mkdir xiaop-backend
cd xiaop-backend

# 2. 复制后端代码
cp -r /path/to/xiaop-v2-dev-deploy/backend/* .

# 3. 初始化 Git
git init
git add .
git commit -m "Initial commit: Backend only"

# 4. 推送到 GitHub
git remote add origin https://github.com/YOUR_USERNAME/xiaop-backend.git
git push -u origin main

# 5. 在 Zeabur 部署这个新仓库
```

## Zeabur 服务配置检查清单

在 Zeabur 控制台检查以下配置：

### 1. 服务设置 (Settings)

```
✅ Repository: gongyixuan200009-spec/xiaop-pbl-learning-frontend
✅ Branch: zeabur-version
✅ Root Directory: backend  ← 最重要！
✅ Build Command: (自动检测或使用 zbpack.json)
✅ Start Command: (自动检测或使用 zbpack.json)
```

### 2. 环境变量 (Environment Variables)

```
✅ SUPABASE_URL
✅ SUPABASE_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SECRET_KEY
✅ ALGORITHM
✅ ACCESS_TOKEN_EXPIRE_MINUTES
✅ CORS_ORIGINS
```

### 3. 网络设置 (Networking)

```
✅ Port: 8080 (自动检测)
✅ Domain: project-based-learning.zeabur.app
```

## 验证部署成功

### 1. 检查部署日志

在 Zeabur 控制台查看 "Logs" 标签，应该看到：

```
✅ Detected Python application
✅ Installing dependencies from requirements.txt
✅ Successfully installed fastapi uvicorn ...
✅ Starting application...
✅ INFO:     Uvicorn running on http://0.0.0.0:8080
✅ INFO:     Application startup complete.
```

### 2. 测试 API 端点

```bash
# 健康检查
curl https://project-based-learning.zeabur.app/health
# 预期: {"status":"ok"}

# API 文档
curl https://project-based-learning.zeabur.app/docs
# 预期: HTML 页面

# 根路径
curl https://project-based-learning.zeabur.app/
# 预期: API 信息
```

### 3. 检查服务状态

在 Zeabur 控制台：
- 服务状态应该是 **"Running"** (绿色)
- CPU/内存使用正常
- 没有错误日志

## 常见错误和解决方案

### 错误 1: "No buildpack detected"

**原因**: Zeabur 没有找到 `requirements.txt`

**解决方案**:
- 确认 Root Directory 设置为 `backend`
- 检查 `backend/requirements.txt` 文件存在

### 错误 2: "Port 8080 is not listening"

**原因**: 应用没有监听正确的端口

**解决方案**:
- 检查 `backend/zbpack.json` 中的端口配置
- 确认是 `--port 8080`

### 错误 3: "Application crashed"

**原因**: 依赖安装失败或代码错误

**解决方案**:
- 查看完整的部署日志
- 检查 Python 版本兼容性
- 确认所有依赖都在 `requirements.txt` 中

### 错误 4: "Health check failed"

**原因**: 应用启动时间过长或崩溃

**解决方案**:
- 增加健康检查超时时间
- 检查应用启动日志
- 确认数据库连接正常

## 推荐的部署流程

### 第一步：准备工作

```bash
# 1. 确认代码在 GitHub 上是最新的
cd /Users/shawn/projects/xiaop-pbl-online/xiaop-v2-dev-deploy
git status
git log --oneline -3

# 2. 确认 backend 目录结构正确
ls -la backend/
# 应该看到: main.py, requirements.txt, zbpack.json
```

### 第二步：在 Zeabur 部署

1. **删除旧服务**（如果存在）
2. **创建新服务**
   - Repository: `xiaop-pbl-learning-frontend`
   - Branch: `zeabur-version`
   - **Root Directory: `backend`** ← 关键！
3. **配置环境变量**
4. **等待部署完成**

### 第三步：验证和测试

1. 查看部署日志
2. 测试 API 端点
3. 检查服务状态

## 截图指南

在 Zeabur 控制台应该这样配置：

```
┌─────────────────────────────────────────┐
│ Service Settings                         │
├─────────────────────────────────────────┤
│ Repository:                              │
│ gongyixuan200009-spec/                   │
│ xiaop-pbl-learning-frontend              │
│                                          │
│ Branch: zeabur-version                   │
│                                          │
│ Root Directory: backend      ← 填这里！   │
│                                          │
│ Build Command: (auto)                    │
│ Start Command: (auto)                    │
└─────────────────────────────────────────┘
```

## 如果还是不行

### 最后的解决方案：使用 Dockerfile

创建 `backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

然后在 Zeabur：
1. 删除旧服务
2. 创建新服务
3. Root Directory: `backend`
4. Zeabur 会自动检测 Dockerfile 并使用它

## 需要帮助？

如果问题仍然存在：

1. **截图分享**：
   - Zeabur 服务设置页面
   - 部署日志（完整的）
   - 错误信息

2. **检查清单**：
   - [ ] Root Directory 设置为 `backend`
   - [ ] 环境变量已配置
   - [ ] GitHub 代码是最新的
   - [ ] `backend/zbpack.json` 存在且正确

3. **联系支持**：
   - Zeabur Discord: https://discord.gg/zeabur
   - Zeabur 论坛: https://forum.zeabur.com

---

**关键点总结**：
1. ⭐ 在 Zeabur 服务设置中，**Root Directory 必须设置为 `backend`**
2. ⭐ 确认 `backend/zbpack.json` 中端口是 8080
3. ⭐ 配置所有必需的环境变量
4. ⭐ 查看完整的部署日志找出具体错误

现在去 Zeabur 控制台，删除旧服务，重新创建并**指定 Root Directory 为 backend**！
