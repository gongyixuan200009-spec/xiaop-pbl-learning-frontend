# 工小助前端部署详细执行指南

## 目录
- [方案对比总结](#方案对比总结)
- [方案 A: 阿里云 Docker 部署（推荐）](#方案-a-阿里云-docker-部署推荐)
- [方案 B: Vercel + Cloudflare 混合部署](#方案-b-vercel--cloudflare-混合部署)
- [方案 C: 纯 Vercel 部署](#方案-c-纯-vercel-部署)
- [方案 D: Zeabur 部署（国人团队，推荐）](#方案-d-zeabur-部署国人团队推荐)

---

## 方案对比总结

### 四套方案快速对比

| 对比项 | 方案A: 阿里云 | 方案B: 混合部署 | 方案C: Vercel | 方案D: Zeabur ⭐ |
|-------|-------------|----------------|--------------|-----------------|
| 国内访问速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 国际访问速度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 稳定性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| GFW 风险 | ❌ 无 | ⚠️ 中等 | ⚠️ 较高 | ❌ 无 |
| 部署难度 | 中 | 高 | 低 | **极低** |
| 运维成本 | 中 | 中高 | 低 | **极低** |
| 月度费用 | 100-300元 | 50-200元 | 0元 | **0-50元** |
| CI/CD | 需配置 | 需配置 | 内置 | **内置** |
| 数据库支持 | ✅ | ✅ | ❌ | **✅** |
| 支付方式 | 国内 | 信用卡 | 信用卡 | **支付宝** |
| 备案要求 | 需要 | 不需要 | 不需要 | **不需要** |

### 推荐指数

1. **🏆 方案 D (Zeabur)** - ⭐⭐⭐⭐⭐
   - 最适合：快速上线，国内外都要访问
   - 零运维，国人团队，国内访问无障碍

2. **🥈 方案 A (阿里云)** - ⭐⭐⭐⭐
   - 最适合：追求完全自主可控
   - 国内访问最快，但需要运维

3. **🥉 方案 B (混合)** - ⭐⭐⭐
   - 最适合：全球均衡访问
   - 架构复杂，适合有经验团队

4. **方案 C (Vercel)** - ⭐⭐
   - 最适合：纯国外用户
   - 国内访问不稳定

---

## 方案 D: Zeabur 部署（国人团队，推荐）

### 📊 方案优势

✅ **国人团队开发**，更符合中国国情
✅ **免费域名不被墙**，国内访问速度快
✅ **支持支付宝付款**，无需信用卡
✅ **全栈 PaaS**，支持前端+后端+数据库
✅ **自带 CI/CD**，代码推送自动部署
✅ **免费额度充足**，每月 $5
✅ **部署超级简单**，3 分钟搞定

### 💰 费用说明

- **免费额度**: 每月 $5
- **计费方式**: 按量计费（内存、CPU、流量）
- **小型项目**: 基本在免费额度内
- **支付方式**: 支付宝、微信、信用卡

### 📝 详细执行步骤

#### 阶段 1: 准备工作（5 分钟）

**步骤 1.1: 注册 Zeabur 账号**

1. 访问 https://zeabur.com
2. 点击右上角 "Sign In"
3. 选择 "GitHub" 登录（推荐）或邮箱注册
4. 授权 GitHub 访问权限

预期结果：
```
✅ 成功登录 Zeabur Dashboard
✅ 看到 "Create Project" 按钮
```

**步骤 1.2: 绑定支付方式（获取免费额度）**

1. 点击右上角头像 → "Billing"
2. 点击 "Add Payment Method"
3. 选择 "支付宝" 或 "微信"
4. 绑定支付方式（不会扣费）

预期结果：
```
✅ 支付方式绑定成功
✅ 获得每月 $5 免费额度
```

---

#### 阶段 2: 准备前端代码（10 分钟）

**步骤 2.1: 检查 package.json**

在本地项目的 `frontend/package.json` 中确认有以下脚本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**步骤 2.2: 创建健康检查端点**

创建 `frontend/pages/api/health.js`（如果没有的话）：

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

**步骤 2.3: 配置环境变量文件**

创建 `frontend/.env.example`（供 Zeabur 参考）：

```bash
# .env.example
NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com
```

**步骤 2.4: 提交代码到 GitHub**

```bash
cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy

# 切换到前端目录
cd frontend

# 添加文件
git add .

# 提交
git commit -m "feat: 准备 Zeabur 部署配置"

# 推送到 GitHub
git push origin main
```

预期结果：
```
✅ 代码成功推送到 GitHub
✅ 健康检查端点已创建
✅ 环境变量示例文件已创建
```

---

#### 阶段 3: 在 Zeabur 创建项目（3 分钟）

**步骤 3.1: 创建新项目**

1. 在 Zeabur Dashboard 点击 "Create Project"
2. 输入项目名称：`xiaop-learning-assistant`
3. 选择区域：
   - 国内用户主要：选择 `Hong Kong` 或 `Singapore`
   - 国际用户主要：选择 `US West`
4. 点击 "Create"

预期结果：
```
✅ 项目创建成功
✅ 进入项目详情页面
```

**步骤 3.2: 连接 GitHub 仓库**

1. 点击 "Add Service"
2. 选择 "Git"
3. 点击 "Configure GitHub"
4. 授权 Zeabur 访问你的 GitHub 仓库
5. 选择仓库：`xiaop-v2-dev-deploy`
6. 选择分支：`main`
7. 选择根目录：`frontend`（如果是 monorepo）
8. 点击 "Deploy"

预期结果：
```
✅ GitHub 仓库连接成功
✅ Zeabur 开始自动构建
✅ 构建日志开始滚动
```

**步骤 3.3: 等待构建完成**

构建过程大约 2-5 分钟，你会看到：

```
Building...
  ├─ Installing dependencies
  ├─ npm install
  ├─ Running build
  ├─ npm run build
  ├─ Creating optimized production build
  └─ Build completed successfully ✓

Deploying...
  ├─ Creating container
  ├─ Starting service
  └─ Service is running ✓
```

预期结果：
```
✅ 构建成功
✅ 服务状态显示为 "Running"
✅ 获得临时域名：xxxx.zeabur.app
```

---

#### 阶段 4: 配置环境变量（2 分钟）

**步骤 4.1: 添加环境变量**

1. 在项目详情页面，点击你的服务
2. 点击 "Variables" 标签
3. 添加以下环境变量：

```
NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com
NODE_ENV=production
```

4. 点击 "Save"

**步骤 4.2: 重新部署**

1. 点击右上角的 "Redeploy" 按钮
2. 等待重新部署完成（约 1-2 分钟）

预期结果：
```
✅ 环境变量配置成功
✅ 服务重新部署完成
✅ 环境变量生效
```

---

#### 阶段 5: 绑定自定义域名（5 分钟）

**步骤 5.1: 在 Zeabur 添加自定义域名**

1. 在服务详情页面，点击 "Networking" 标签
2. 点击 "Add Domain"
3. 选择 "Custom Domain"
4. 输入你的域名：`pbl-learning.xiaoluxue.com`
5. 点击 "Confirm"
6. **记下显示的 CNAME 记录值**，类似：
   ```
   cname.zeabur-dns.com
   ```

**步骤 5.2: 配置域名解析**

登录你的域名服务商（阿里云），添加 DNS 记录：

1. 进入阿里云控制台 → 域名 → 解析设置
2. 添加记录：
   ```
   记录类型: CNAME
   主机记录: pbl-learning
   记录值: cname.zeabur-dns.com
   TTL: 600（10分钟）
   ```
3. 点击 "确认"

**步骤 5.3: 等待 DNS 生效**

```bash
# 检查 DNS 解析（本地终端）
dig pbl-learning.xiaoluxue.com

# 或使用 nslookup
nslookup pbl-learning.xiaoluxue.com
```

预期结果：
```
✅ DNS 解析生效（可能需要 5-10 分钟）
✅ 域名指向 Zeabur
✅ HTTPS 自动配置完成
```

**步骤 5.4: 验证部署**

```bash
# 测试域名访问
curl -I https://pbl-learning.xiaoluxue.com

# 测试健康检查
curl https://pbl-learning.xiaoluxue.com/api/health
```

预期结果：
```
HTTP/2 200
{"status":"ok","timestamp":"2026-01-09T12:00:00.000Z"}
```

---

#### 阶段 6: 配置自动部署（已自动完成）

Zeabur 自动配置了 CI/CD，每次你推送代码到 GitHub，Zeabur 会自动：

1. 检测代码变更
2. 自动构建
3. 自动部署
4. 零停机更新

**测试自动部署：**

```bash
# 修改一个文件
echo "// Updated" >> frontend/pages/index.js

# 提交并推送
git add .
git commit -m "test: 测试自动部署"
git push origin main
```

在 Zeabur Dashboard 中查看：
- 自动触发新的构建
- 构建完成后自动部署
- 服务自动重启

预期结果：
```
✅ 代码推送后自动触发构建
✅ 构建完成后自动部署
✅ 零停机更新
```

---

#### 阶段 7: 监控和日志（2 分钟）

**步骤 7.1: 查看实时日志**

1. 在服务详情页面，点击 "Logs" 标签
2. 查看实时日志输出
3. 可以按级别过滤：Error、Warn、Info

**步骤 7.2: 查看服务指标**

1. 点击 "Metrics" 标签
2. 查看：
   - CPU 使用率
   - 内存使用率
   - 请求数量
   - 响应时间

**步骤 7.3: 设置告警（可选）**

1. 点击 "Alerts"
2. 配置告警规则：
   - CPU > 80%
   - 内存 > 80%
   - 服务不可用
3. 配置通知方式（邮件、Webhook）

---

### 🎯 Zeabur 方案总结

#### ✅ 完成的配置

- ✅ Zeabur 账号注册和支付绑定
- ✅ GitHub 仓库连接
- ✅ 自动构建和部署
- ✅ 环境变量配置
- ✅ 自定义域名绑定
- ✅ HTTPS 自动配置
- ✅ CI/CD 自动化
- ✅ 实时日志和监控

#### 🔧 日常操作

**1. 更新代码**
```bash
git add .
git commit -m "更新说明"
git push origin main
# Zeabur 自动部署
```

**2. 回滚版本**
- 在 Zeabur Dashboard → Deployments
- 选择之前的版本 → 点击 "Rollback"

**3. 查看日志**
- Zeabur Dashboard → Logs

**4. 查看用量**
- Zeabur Dashboard → Billing → Usage

#### 💡 最佳实践

1. **监控用量**: 定期检查 Billing 页面，确保在免费额度内
2. **使用环境变量**: 敏感信息不要写在代码里
3. **健康检查**: 保持 `/api/health` 端点正常响应
4. **日志查看**: 出问题第一时间查看 Logs
5. **备份配置**: 记录所有环境变量和配置

#### 💰 费用优化

- 空闲时自动休眠（节省费用）
- 小型项目基本免费
- 超出部分按量计费，透明可控

---

## 方案 A: 阿里云 Docker 部署（推荐）

### 📊 方案特点

✅ 国内访问速度最快
✅ 完全自主可控
✅ 支持 CDN 加速
✅ 无 GFW 风险
⚠️ 需要运维知识
⚠️ 需要手动配置 CI/CD

### 📝 详细执行步骤

#### 阶段 1: 本地准备（20 分钟）

**步骤 1.1: 创建 Dockerfile**

在本地项目 `frontend/` 目录下创建 `Dockerfile`：

```bash
cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy/frontend
```

创建文件 `Dockerfile`：

```dockerfile
# ============================================
# 第一阶段：构建阶段
# ============================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置环境变量（构建时）
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 复制依赖文件
COPY package.json package-lock.json ./

# 安装依赖（仅生产依赖）
RUN npm ci --only=production --legacy-peer-deps

# 复制源代码
COPY . .

# 构建 Next.js 应用
RUN npm run build

# ============================================
# 第二阶段：运行阶段
# ============================================
FROM node:18-alpine AS runner

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["npm", "start"]
```

预期结果：
```
✅ Dockerfile 创建成功
✅ 文件大小约 1-2KB
```

**步骤 1.2: 创建 .dockerignore**

创建 `frontend/.dockerignore`：

```bash
# 创建 .dockerignore 文件
cat > .dockerignore << 'EOF'
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next
out
build

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode
.idea
*.swp
*.swo

# Git
.git
.gitignore

# 其他
README.md
.DS_Store
EOF
```

**步骤 1.3: 测试本地构建**

```bash
# 构建 Docker 镜像
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com \
  -t xiaop-frontend:test \
  .

# 查看镜像大小
docker images | grep xiaop-frontend
```

预期结果：
```
✅ 构建成功
✅ 镜像大小约 200-300MB
✅ 没有错误信息
```

**步骤 1.4: 测试本地运行**

```bash
# 运行容器
docker run -d \
  --name xiaop-frontend-test \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com \
  xiaop-frontend:test

# 等待启动
sleep 10

# 测试访问
curl http://localhost:3000/api/health

# 查看日志
docker logs xiaop-frontend-test

# 停止并删除测试容器
docker stop xiaop-frontend-test
docker rm xiaop-frontend-test
```

预期结果：
```
✅ 容器成功启动
✅ 健康检查返回 {"status":"ok"}
✅ 日志没有错误
```

---

#### 阶段 2: 创建 Docker Compose 配置（15 分钟）

**步骤 2.1: 创建项目结构**

```bash
# 回到项目根目录
cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy

# 创建 nginx 配置目录
mkdir -p nginx/conf.d
mkdir -p nginx/ssl
```

**步骤 2.2: 创建 docker-compose.yml**

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # ============================================
  # 前端服务
  # ============================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://pbl-learning-bg.xiaoluxue.com
    container_name: xiaop-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - xiaop-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================
  # Nginx 反向代理
  # ============================================
  nginx:
    image: nginx:alpine
    container_name: xiaop-nginx
    restart: unless-stopped
    ports:
      - "8504:80"
      - "8505:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      frontend:
        condition: service_healthy
    networks:
      - xiaop-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  xiaop-network:
    driver: bridge

volumes:
  nginx-logs:
```

**步骤 2.3: 创建 Nginx 主配置**

创建 `nginx/nginx.conf`：

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    # 引入站点配置
    include /etc/nginx/conf.d/*.conf;
}
```

**步骤 2.4: 创建站点配置**

创建 `nginx/conf.d/xiaop.conf`：

```nginx
# 上游服务器
upstream frontend_upstream {
    server frontend:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP 服务器（开发/测试用）
server {
    listen 80;
    server_name pbl-learning.xiaoluxue.com _;

    # 限制请求速率
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
    limit_req zone=one burst=20 nodelay;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Next.js 静态资源（强缓存）
    location /_next/static {
        proxy_pass http://frontend_upstream;
        proxy_cache_valid 200 365d;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Cache-Status $upstream_cache_status;
    }

    # 图片资源（适中缓存）
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        proxy_pass http://frontend_upstream;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
        add_header X-Cache-Status $upstream_cache_status;
    }

    # 字体文件（长缓存）
    location ~* \.(woff|woff2|ttf|otf|eot)$ {
        proxy_pass http://frontend_upstream;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000";
        add_header X-Cache-Status $upstream_cache_status;
    }

    # API 请求（不缓存）
    location /api {
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 默认路由
    location / {
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓存设置（短缓存）
        proxy_cache_valid 200 5m;
        add_header Cache-Control "public, max-age=300";
    }

    # 健康检查端点
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTPS 服务器（生产用）
server {
    listen 443 ssl http2;
    server_name pbl-learning.xiaoluxue.com;

    # SSL 证书（需要配置）
    # ssl_certificate /etc/nginx/ssl/fullchain.pem;
    # ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # 安全头（HTTPS）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 其他配置与 HTTP 相同...
    # （复制上面的 location 配置）
}
```

预期结果：
```
✅ docker-compose.yml 创建成功
✅ Nginx 配置文件创建成功
✅ 目录结构正确
```

---

#### 阶段 3: 服务器部署（30 分钟）

**步骤 3.1: 同步文件到服务器**

```bash
# 在本地执行

# 同步 docker-compose.yml
scp -i ~/.ssh/xiaop_deployment_key \
  docker-compose.yml \
  root@182.92.239.199:/root/workspace/xiaop-v2-dev-deploy/

# 同步 Nginx 配置
scp -i ~/.ssh/xiaop_deployment_key -r \
  nginx/ \
  root@182.92.239.199:/root/workspace/xiaop-v2-dev-deploy/

# 同步前端代码（包括 Dockerfile）
rsync -avz --progress \
  -e "ssh -i ~/.ssh/xiaop_deployment_key" \
  frontend/ \
  root@182.92.239.199:/root/workspace/xiaop-v2-dev-deploy/frontend/
```

预期结果：
```
✅ 文件同步成功
✅ 没有权限错误
✅ Dockerfile 已上传
```

**步骤 3.2: 登录服务器并构建**

```bash
# SSH 登录
ssh -i ~/.ssh/xiaop_deployment_key root@182.92.239.199

# 切换到部署目录
cd /root/workspace/xiaop-v2-dev-deploy

# 检查文件
ls -la
ls -la frontend/
ls -la nginx/

# 停止旧服务（如果有）
docker-compose down frontend nginx || true

# 构建镜像
docker-compose build frontend

# 查看构建结果
docker images | grep xiaop-frontend
```

预期结果：
```
✅ 文件都存在
✅ 镜像构建成功
✅ 镜像大小约 200-300MB
```

**步骤 3.3: 启动服务**

```bash
# 启动服务
docker-compose up -d frontend nginx

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f frontend nginx
```

预期结果：
```
NAME            IMAGE           STATUS         PORTS
xiaop-frontend  ...             Up (healthy)   3000/tcp
xiaop-nginx     nginx:alpine    Up             0.0.0.0:8504->80/tcp
```

**步骤 3.4: 健康检查**

```bash
# 在服务器上执行

# 检查前端容器健康
docker exec xiaop-frontend curl -f http://localhost:3000/api/health

# 检查 Nginx
curl http://localhost:8504/api/health

# 检查 Nginx 健康端点
curl http://localhost:8504/nginx-health

# 从外部测试（在本地执行）
curl http://182.92.239.199:8504/api/health
```

预期结果：
```
{"status":"ok","timestamp":"2026-01-09T..."}
healthy
```

---

#### 阶段 4: 配置 GitHub Actions CI/CD（30 分钟）

**步骤 4.1: 配置 GitHub Secrets**

1. 访问你的 GitHub 仓库
2. 进入 Settings → Secrets and variables → Actions
3. 添加以下 Secrets：

```
Name: ALIYUN_SSH_KEY
Value: (复制 ~/.ssh/xiaop_deployment_key 的内容)

Name: ALIYUN_HOST
Value: 182.92.239.199

Name: NEXT_PUBLIC_API_URL
Value: https://pbl-learning-bg.xiaoluxue.com
```

**步骤 4.2: 创建 GitHub Actions Workflow**

创建 `.github/workflows/deploy-frontend.yml`：

```yaml
name: 部署前端到阿里云

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
      - 'docker-compose.yml'
      - 'nginx/**'
      - '.github/workflows/deploy-frontend.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # ============================================
      # 1. 检出代码
      # ============================================
      - name: 📥 检出代码
        uses: actions/checkout@v4

      # ============================================
      # 2. 设置 Node.js
      # ============================================
      - name: 📦 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      # ============================================
      # 3. 安装依赖
      # ============================================
      - name: 📦 安装依赖
        working-directory: frontend
        run: npm ci

      # ============================================
      # 4. 运行测试（如果有）
      # ============================================
      - name: 🧪 运行测试
        working-directory: frontend
        run: npm test --if-present

      # ============================================
      # 5. 构建应用
      # ============================================
      - name: 🔨 构建应用
        working-directory: frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        run: npm run build

      # ============================================
      # 6. 构建 Docker 镜像
      # ============================================
      - name: 🐳 构建 Docker 镜像
        working-directory: frontend
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }} \
            -t xiaop-frontend:${{ github.sha }} \
            -t xiaop-frontend:latest \
            .

      # ============================================
      # 7. 保存 Docker 镜像
      # ============================================
      - name: 💾 保存 Docker 镜像
        run: |
          docker save xiaop-frontend:latest | gzip > frontend-image.tar.gz
          ls -lh frontend-image.tar.gz

      # ============================================
      # 8. 复制文件到服务器
      # ============================================
      - name: 📤 复制文件到服务器
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.ALIYUN_HOST }}
          username: root
          key: ${{ secrets.ALIYUN_SSH_KEY }}
          source: "frontend-image.tar.gz,docker-compose.yml,nginx/"
          target: /root/xiaop-deploy-temp
          strip_components: 0

      # ============================================
      # 9. 部署到服务器
      # ============================================
      - name: 🚀 部署到服务器
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.ALIYUN_HOST }}
          username: root
          key: ${{ secrets.ALIYUN_SSH_KEY }}
          script: |
            set -e

            echo "======================================"
            echo "  开始部署前端服务"
            echo "======================================"

            # 进入临时目录
            cd /root/xiaop-deploy-temp

            # 加载新镜像
            echo "📦 加载 Docker 镜像..."
            docker load -i frontend-image.tar.gz

            # 进入部署目录
            cd /root/workspace/xiaop-v2-dev-deploy

            # 备份当前状态
            echo "💾 备份当前部署..."
            docker commit xiaop-frontend xiaop-frontend:backup-$(date +%Y%m%d-%H%M%S) || true

            # 复制新配置
            echo "📋 更新配置文件..."
            cp -r /root/xiaop-deploy-temp/docker-compose.yml ./ || true
            cp -r /root/xiaop-deploy-temp/nginx ./

            # 停止旧容器
            echo "⏹️  停止旧容器..."
            docker-compose down frontend nginx

            # 启动新容器
            echo "▶️  启动新容器..."
            docker-compose up -d frontend nginx

            # 等待服务启动
            echo "⏳ 等待服务启动..."
            sleep 15

            # 健康检查
            echo "🏥 健康检查..."
            for i in {1..5}; do
              if docker exec xiaop-frontend curl -f http://localhost:3000/api/health; then
                echo "✅ 健康检查通过！"
                break
              else
                echo "⏳ 重试 $i/5..."
                sleep 5
              fi

              if [ $i -eq 5 ]; then
                echo "❌ 健康检查失败，正在回滚..."
                docker-compose down frontend nginx
                docker tag xiaop-frontend:backup-$(date +%Y%m%d) xiaop-frontend:latest || true
                docker-compose up -d frontend nginx
                exit 1
              fi
            done

            # 清理
            echo "🧹 清理临时文件..."
            rm -rf /root/xiaop-deploy-temp
            docker image prune -f

            echo "======================================"
            echo "  ✅ 部署成功！"
            echo "======================================"

            # 显示状态
            docker-compose ps frontend nginx

      # ============================================
      # 10. 通知部署结果
      # ============================================
      - name: 📢 通知部署结果
        if: always()
        run: |
          if [ "${{ job.status }}" == "success" ]; then
            echo "✅ 前端部署成功！"
            echo "🌐 访问地址: http://182.92.239.199:8504"
            echo "🌐 域名地址: https://pbl-learning.xiaoluxue.com"
          else
            echo "❌ 前端部署失败！"
          fi
```

**步骤 4.3: 提交并测试 CI/CD**

```bash
# 在本地执行

# 添加 GitHub Actions 文件
git add .github/workflows/deploy-frontend.yml
git add docker-compose.yml
git add nginx/
git add frontend/Dockerfile
git add frontend/.dockerignore

# 提交
git commit -m "feat: 添加 Docker 部署和 GitHub Actions CI/CD"

# 推送（触发自动部署）
git push origin main
```

访问 GitHub Actions 查看部署进度：
- https://github.com/你的用户名/xiaop-v2-dev-deploy/actions

预期结果：
```
✅ GitHub Actions 自动触发
✅ 构建成功
✅ 部署成功
✅ 健康检查通过
```

---

#### 阶段 5: 配置 HTTPS（可选，15 分钟）

**步骤 5.1: 安装 Certbot**

```bash
# SSH 登录服务器
ssh -i ~/.ssh/xiaop_deployment_key root@182.92.239.199

# 安装 Certbot
apt update
apt install -y certbot

# 或者使用 Docker 版本
docker pull certbot/certbot
```

**步骤 5.2: 获取 SSL 证书**

```bash
# 停止 Nginx（临时）
docker-compose stop nginx

# 使用 Certbot 获取证书
certbot certonly --standalone \
  -d pbl-learning.xiaoluxue.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 证书位置
ls -la /etc/letsencrypt/live/pbl-learning.xiaoluxue.com/
```

**步骤 5.3: 复制证书到项目**

```bash
# 复制证书
cp /etc/letsencrypt/live/pbl-learning.xiaoluxue.com/fullchain.pem \
   /root/workspace/xiaop-v2-dev-deploy/nginx/ssl/

cp /etc/letsencrypt/live/pbl-learning.xiaoluxue.com/privkey.pem \
   /root/workspace/xiaop-v2-dev-deploy/nginx/ssl/

# 设置权限
chmod 644 /root/workspace/xiaop-v2-dev-deploy/nginx/ssl/fullchain.pem
chmod 600 /root/workspace/xiaop-v2-dev-deploy/nginx/ssl/privkey.pem
```

**步骤 5.4: 启用 HTTPS 配置**

编辑 `nginx/conf.d/xiaop.conf`，取消 HTTPS 部分的注释：

```nginx
# 修改证书路径
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

**步骤 5.5: 重启 Nginx**

```bash
# 重启 Nginx
docker-compose restart nginx

# 测试 HTTPS
curl -I https://pbl-learning.xiaoluxue.com
```

**步骤 5.6: 配置自动续期**

```bash
# 添加 cron 任务
crontab -e

# 添加以下行（每天凌晨 2 点检查续期）
0 2 * * * certbot renew --quiet && docker-compose -f /root/workspace/xiaop-v2-dev-deploy/docker-compose.yml restart nginx
```

---

### 🎯 方案 A 总结

#### ✅ 完成的配置

- ✅ Dockerfile 多阶段构建
- ✅ Docker Compose 编排
- ✅ Nginx 反向代理和缓存
- ✅ 健康检查
- ✅ GitHub Actions CI/CD
- ✅ 自动部署和回滚
- ✅ HTTPS 证书（可选）

#### 🔧 日常操作

**1. 手动部署**
```bash
ssh -i ~/.ssh/xiaop_deployment_key root@182.92.239.199
cd /root/workspace/xiaop-v2-dev-deploy
git pull
docker-compose build frontend
docker-compose up -d frontend nginx
```

**2. 查看日志**
```bash
docker-compose logs -f frontend
docker-compose logs -f nginx
```

**3. 重启服务**
```bash
docker-compose restart frontend nginx
```

**4. 回滚版本**
```bash
# 查看备份镜像
docker images | grep backup

# 恢复备份
docker tag xiaop-frontend:backup-20260109-120000 xiaop-frontend:latest
docker-compose up -d frontend
```

---

## 方案 B: Vercel + Cloudflare 混合部署

### 📊 方案特点

✅ 全球访问均衡
✅ 国内外都优化
✅ Vercel 自动 CI/CD
⚠️ 架构复杂
⚠️ 国内访问不稳定

### 📝 详细执行步骤

#### 阶段 1: 部署到 Vercel（10 分钟）

**步骤 1.1: 安装 Vercel CLI**

```bash
# 在本地执行
npm install -g vercel
```

**步骤 1.2: 登录 Vercel**

```bash
vercel login
# 选择 GitHub 登录
```

**步骤 1.3: 初始化项目**

```bash
cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy/frontend

# 初始化
vercel

# 回答问题：
# ? Set up and deploy "~/projects/xiaop/xiaop-v2-dev-deploy/frontend"? [Y/n] Y
# ? Which scope do you want to deploy to? 选择你的账号
# ? Link to existing project? [y/N] N
# ? What's your project's name? xiaop-learning-assistant
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] N
```

预期结果：
```
✅ 项目部署到 Vercel
✅ 获得预览 URL: https://xiaop-xxx.vercel.app
```

**步骤 1.4: 配置环境变量**

```bash
# 添加环境变量
vercel env add NEXT_PUBLIC_API_URL production
# 输入: https://pbl-learning-bg.xiaoluxue.com

# 重新部署
vercel --prod
```

**步骤 1.5: 绑定自定义域名**

1. 访问 Vercel Dashboard: https://vercel.com/dashboard
2. 选择项目 `xiaop-learning-assistant`
3. 点击 "Settings" → "Domains"
4. 添加域名: `pbl-learning.xiaoluxue.com`
5. 记下 CNAME 记录值

---

#### 阶段 2: 配置 Cloudflare（20 分钟）

**步骤 2.1: 添加网站到 Cloudflare**

1. 登录 Cloudflare: https://dash.cloudflare.com
2. 点击 "Add a Site"
3. 输入域名: `xiaoluxue.com`
4. 选择免费计划
5. 扫描 DNS 记录

**步骤 2.2: 更改 Nameservers**

1. 记下 Cloudflare 提供的 Nameservers
2. 登录阿里云域名控制台
3. 修改 DNS 服务器为 Cloudflare 的 Nameservers
4. 等待生效（可能需要 24-48 小时）

**步骤 2.3: 配置 DNS 记录**

在 Cloudflare DNS 管理中添加：

```
类型: CNAME
名称: pbl-learning
目标: cname.vercel-dns.com
代理状态: 已代理（橙色云朵）
TTL: 自动
```

**步骤 2.4: 配置页面规则（智能路由）**

1. 进入 "Rules" → "Page Rules"
2. 创建新规则:
   ```
   URL: pbl-learning.xiaoluxue.com/*
   设置:
     - 缓存级别: 标准
     - 浏览器缓存 TTL: 4 小时
     - 自动缩小: JavaScript, CSS, HTML
   ```

**步骤 2.5: 配置 Workers（高级，可选）**

创建 Cloudflare Worker 实现智能路由：

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // 检测是否为中国大陆访问
  const country = request.cf.country

  if (country === 'CN') {
    // 中国大陆用户：转发到阿里云
    url.hostname = '182.92.239.199'
    url.port = '8504'
    return fetch(url, request)
  } else {
    // 其他地区：使用 Vercel
    return fetch(request)
  }
}
```

---

#### 阶段 3: 测试和验证（10 分钟）

**步骤 3.1: 测试国内访问**

```bash
# 从国内服务器测试
ssh -i ~/.ssh/xiaop_deployment_key root@182.92.239.199
curl -I https://pbl-learning.xiaoluxue.com
```

**步骤 3.2: 测试国外访问**

使用在线工具测试：
- https://www.whatsmydns.net/
- https://tools.keycdn.com/speed

---

## 方案 C: 纯 Vercel 部署

### 📊 方案特点

✅ 最简单
✅ 零运维
✅ 自动 CI/CD
❌ 国内访问不稳定

### 📝 详细执行步骤

#### 阶段 1: 准备代码（5 分钟）

**步骤 1.1: 安装 Vercel CLI**

```bash
npm install -g vercel
```

**步骤 1.2: 创建 vercel.json**

在 `frontend/` 目录创建 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hkg1", "sin1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://pbl-learning-bg.xiaoluxue.com"
  }
}
```

---

#### 阶段 2: 部署到 Vercel（5 分钟）

**步骤 2.1: 初始化和部署**

```bash
cd frontend
vercel login
vercel --prod
```

**步骤 2.2: 配置自定义域名**

1. Vercel Dashboard → Domains
2. 添加: `pbl-learning.xiaoluxue.com`
3. 使用 Vercel 中国优化 CNAME:
   ```
   类型: CNAME
   主机记录: pbl-learning
   记录值: cname-china.vercel-dns.com
   ```

---

#### 阶段 3: 配置自动部署（2 分钟）

Vercel 自动检测 GitHub 推送，无需额外配置。

---

### 🎯 四套方案快速选择指南

#### 选择 Zeabur (方案 D) 如果：
- ✅ 你想快速上线（3分钟）
- ✅ 国内外用户都要服务
- ✅ 不想维护服务器
- ✅ 预算有限（基本免费）
- ✅ 需要数据库支持

#### 选择阿里云 (方案 A) 如果：
- ✅ 主要服务国内用户
- ✅ 追求完全自主可控
- ✅ 已有服务器和备案域名
- ✅ 有基本 Docker 知识
- ✅ 需要最快的国内访问速度

#### 选择混合部署 (方案 B) 如果：
- ✅ 国内外用户都很重要
- ✅ 预算充足
- ✅ 团队有运维经验
- ✅ 追求全球最优访问

#### 选择 Vercel (方案 C) 如果：
- ✅ 主要服务国外用户
- ✅ 不需要国内访问
- ✅ 追求零运维
- ✅ 完全免费

---

## 附录：常见问题

### Q1: 如何回滚部署？

**Zeabur:**
- Dashboard → Deployments → 选择版本 → Rollback

**阿里云:**
```bash
docker images | grep backup
docker tag xiaop-frontend:backup-YYYYMMDD xiaop-frontend:latest
docker-compose up -d frontend
```

**Vercel:**
- Dashboard → Deployments → 选择版本 → Promote to Production

### Q2: 如何查看日志？

**Zeabur:**
- Dashboard → Logs

**阿里云:**
```bash
docker-compose logs -f frontend
```

**Vercel:**
- Dashboard → Deployments → 点击部署 → Function Logs

### Q3: 如何监控性能？

**Zeabur:**
- 内置 Metrics 面板

**阿里云:**
- 需要自建监控（Prometheus + Grafana）

**Vercel:**
- Dashboard → Analytics

### Q4: 成本对比？

- **Zeabur**: 0-50元/月（小项目免费）
- **阿里云**: 100-300元/月（含CDN）
- **混合**: 50-200元/月
- **Vercel**: 0元（免费版足够）

---

## 总结

### 最推荐方案

1. **🥇 Zeabur (方案 D)** - 快速上线，国内外通吃
2. **🥈 阿里云 (方案 A)** - 完全可控，国内最快
3. **🥉 混合 (方案 B)** - 全球优化，架构复杂
4. **Vercel (方案 C)** - 国外专用，国内受限

根据你的需求选择合适的方案，每个方案都提供了详细的执行步骤！
