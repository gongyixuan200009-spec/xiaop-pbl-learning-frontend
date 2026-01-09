# 工小助前端部署方案设计

## 📊 Vercel 国内访问调研结果（2026）

### 主要问题
1. **DNS 污染**: Vercel 在国内存在 DNS 污染，部分地区无法访问
2. **访问速度慢**: 国内大部分地区访问速度较慢
3. **GFW 风险**: 默认的 `.vercel.app` 域名可能被 GFW 屏蔽
4. **不稳定**: 部分省份完全无法访问或响应时间很长

### 可用的优化方案
- 使用自定义域名（✅ 已配置）
- 使用 Vercel 中国优化 CNAME: `cname-china.vercel-dns.com`
- 通过 Cloudflare 代理加速
- 使用国内 CDN（需要 ICP 备案）

---

## 🎯 三套部署方案对比

### 方案 A: 优化版阿里云部署（推荐 ⭐⭐⭐⭐⭐）

**适合场景**: 主要服务国内用户，追求最佳稳定性

#### 架构图
```
用户 → 阿里云 CDN → 阿里云服务器 (Nginx + Docker)
                    ↓
                  Next.js 容器
```

#### 优点
- ✅ 国内访问速度最快
- ✅ 稳定性最高（无 GFW 风险）
- ✅ 完全可控
- ✅ 可以使用阿里云 CDN（已备案）
- ✅ 支持 SSR（服务端渲染）

#### 缺点
- ⚠️ 需要维护服务器
- ⚠️ 全球访问速度不如 Vercel
- ⚠️ 需要手动配置 CI/CD

#### 成本
- 服务器: 已有 ✅
- CDN: ~50-200元/月（根据流量）
- 总成本: **低**

---

### 方案 B: Vercel + Cloudflare 混合部署

**适合场景**: 同时服务国内外用户

#### 架构图
```
国内用户 → Cloudflare CDN → 阿里云服务器
国外用户 → Cloudflare CDN → Vercel
```

#### 优点
- ✅ 国内外访问都优化
- ✅ Cloudflare 智能路由
- ✅ 自动 CI/CD（Vercel）
- ✅ 免运维（Vercel 部分）

#### 缺点
- ⚠️ 架构复杂
- ⚠️ 国内访问可能不稳定
- ⚠️ Cloudflare 也可能被墙

#### 成本
- Vercel: 免费版够用
- Cloudflare: 免费版够用
- 总成本: **免费-低**

---

### 方案 C: 纯 Vercel 部署（国内访问有风险）

**适合场景**: 主要服务国外用户，国内访问为辅

#### 架构图
```
用户 → Vercel + 中国优化 CNAME
```

#### 优点
- ✅ 零运维
- ✅ 自动 CI/CD
- ✅ 全球 CDN
- ✅ 免费额度充足

#### 缺点
- ❌ 国内访问不稳定
- ❌ 可能被 GFW 屏蔽
- ❌ 速度较慢

#### 成本
- 总成本: **免费**

---

## 🏆 推荐方案详解：方案 A（优化版阿里云部署）

### 技术栈
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx（反向代理 + 静态资源）
- **应用服务器**: Next.js (PM2 进程管理)
- **CDN**: 阿里云 CDN
- **CI/CD**: GitHub Actions

### 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户请求                             │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
         ┌──────────────────────────────┐
         │      阿里云 CDN（可选）       │
         │   - 静态资源加速              │
         │   - HTTPS 证书                │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  Nginx (182.92.239.199)      │
         │   - 端口 8504                 │
         │   - 反向代理                  │
         │   - Gzip 压缩                 │
         │   - 缓存控制                  │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │   Next.js Docker 容器         │
         │   - 生产模式构建              │
         │   - PM2 进程管理              │
         │   - 健康检查                  │
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │   后端 API                    │
         │   https://pbl-learning-bg... │
         └──────────────────────────────┘
```

### 实施步骤

#### 阶段 1: Docker 化（1-2小时）
1. 创建 Dockerfile 和 docker-compose.yml
2. 配置生产环境构建
3. 本地测试 Docker 镜像

#### 阶段 2: Nginx 优化（30分钟）
1. 配置反向代理
2. 启用 Gzip 压缩
3. 配置静态资源缓存
4. HTTPS 证书配置

#### 阶段 3: CI/CD 自动化（1小时）
1. 配置 GitHub Actions
2. 自动构建 Docker 镜像
3. 自动部署到服务器
4. 健康检查和回滚

#### 阶段 4: CDN 加速（可选，30分钟）
1. 配置阿里云 CDN
2. 域名 CNAME 解析
3. 缓存规则配置

---

## 📝 方案 A 详细实施指南

### 1. Docker 配置文件

#### Dockerfile (前端)
```dockerfile
# 第一阶段：构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 第二阶段：运行
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# 复制必要文件
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# 安装 PM2
RUN npm install -g pm2

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["pm2-runtime", "start", "npm", "--", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: xiaop-frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - xiaop-network

  nginx:
    image: nginx:alpine
    container_name: xiaop-nginx
    restart: always
    ports:
      - "8504:80"
      - "8505:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
    networks:
      - xiaop-network

networks:
  xiaop-network:
    driver: bridge
```

### 2. Nginx 配置

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # 上游服务器
    upstream frontend_upstream {
        server frontend:3000 max_fails=3 fail_timeout=30s;
    }

    # HTTP 服务器（重定向到 HTTPS）
    server {
        listen 80;
        server_name pbl-learning.xiaoluxue.com;

        # ACME 验证（Let's Encrypt）
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # 重定向到 HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS 服务器
    server {
        listen 443 ssl http2;
        server_name pbl-learning.xiaoluxue.com;

        # SSL 证书
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL 配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # 静态资源缓存
        location /_next/static {
            proxy_pass http://frontend_upstream;
            proxy_cache_valid 200 365d;
            add_header Cache-Control "public, immutable";
        }

        # 图片资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
            proxy_pass http://frontend_upstream;
            proxy_cache_valid 200 30d;
            add_header Cache-Control "public, max-age=2592000";
        }

        # API 请求（不缓存）
        location /api {
            proxy_pass http://frontend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 默认路由
        location / {
            proxy_pass http://frontend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
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

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 3. GitHub Actions CI/CD

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend to Aliyun

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install dependencies
      working-directory: frontend
      run: npm ci

    - name: Run tests
      working-directory: frontend
      run: npm test --if-present

    - name: Build application
      working-directory: frontend
      env:
        NEXT_PUBLIC_API_URL: https://pbl-learning-bg.xiaoluxue.com
      run: npm run build

    - name: Build Docker image
      working-directory: frontend
      run: |
        docker build -t xiaop-frontend:${{ github.sha }} .
        docker tag xiaop-frontend:${{ github.sha }} xiaop-frontend:latest

    - name: Save Docker image
      run: |
        docker save xiaop-frontend:latest | gzip > frontend-image.tar.gz

    - name: Copy files to server
      uses: appleboy/scp-action@master
      with:
        host: 182.92.239.199
        username: root
        key: ${{ secrets.ALIYUN_SSH_KEY }}
        source: "frontend-image.tar.gz,docker-compose.yml,nginx/"
        target: /root/xiaop-deploy-temp

    - name: Deploy on server
      uses: appleboy/ssh-action@master
      with:
        host: 182.92.239.199
        username: root
        key: ${{ secrets.ALIYUN_SSH_KEY }}
        script: |
          set -e

          cd /root/xiaop-deploy-temp

          # 加载新镜像
          docker load -i frontend-image.tar.gz

          # 备份当前部署
          cd /root/workspace/xiaop-v2-dev-deploy
          docker-compose ps > /tmp/xiaop-backup-$(date +%Y%m%d-%H%M%S).txt

          # 复制新配置
          cp -r /root/xiaop-deploy-temp/* /root/workspace/xiaop-v2-dev-deploy/

          # 重启服务
          docker-compose down frontend nginx
          docker-compose up -d frontend nginx

          # 健康检查
          sleep 10
          if ! curl -f http://localhost:3000/health; then
            echo "Health check failed! Rolling back..."
            docker-compose down frontend nginx
            docker-compose up -d frontend nginx
            exit 1
          fi

          # 清理
          rm -rf /root/xiaop-deploy-temp
          docker image prune -f

          echo "Deployment successful!"

    - name: Notify deployment status
      if: always()
      run: |
        if [ "${{ job.status }}" == "success" ]; then
          echo "✅ Deployment successful!"
        else
          echo "❌ Deployment failed!"
        fi
```

### 4. 部署脚本

```bash
#!/bin/bash
# deploy-frontend.sh

set -e

echo "======================================"
echo "  工小助前端部署脚本"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
DEPLOY_DIR="/root/workspace/xiaop-v2-dev-deploy"
BACKUP_DIR="/root/backups/xiaop-frontend"
CONTAINER_NAME="xiaop-frontend"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 1. 备份当前部署
echo -e "${YELLOW}[1/7] 备份当前部署...${NC}"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
if docker ps -a | grep -q $CONTAINER_NAME; then
    docker commit $CONTAINER_NAME xiaop-frontend:backup
    docker save xiaop-frontend:backup | gzip > $BACKUP_FILE
    echo -e "${GREEN}✅ 备份完成: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  未找到运行中的容器，跳过备份${NC}"
fi

# 2. 拉取最新代码
echo -e "${YELLOW}[2/7] 拉取最新代码...${NC}"
cd $DEPLOY_DIR
git pull origin main
echo -e "${GREEN}✅ 代码更新完成${NC}"

# 3. 构建 Docker 镜像
echo -e "${YELLOW}[3/7] 构建 Docker 镜像...${NC}"
cd $DEPLOY_DIR/frontend
docker build -t xiaop-frontend:latest .
echo -e "${GREEN}✅ 镜像构建完成${NC}"

# 4. 停止旧容器
echo -e "${YELLOW}[4/7] 停止旧容器...${NC}"
cd $DEPLOY_DIR
docker-compose down frontend nginx || true
echo -e "${GREEN}✅ 旧容器已停止${NC}"

# 5. 启动新容器
echo -e "${YELLOW}[5/7] 启动新容器...${NC}"
docker-compose up -d frontend nginx
echo -e "${GREEN}✅ 新容器已启动${NC}"

# 6. 等待服务启动
echo -e "${YELLOW}[6/7] 等待服务启动...${NC}"
sleep 15

# 7. 健康检查
echo -e "${YELLOW}[7/7] 健康检查...${NC}"
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 健康检查通过！${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -e "${YELLOW}⏳ 重试 $RETRY_COUNT/$MAX_RETRIES...${NC}"
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ 健康检查失败！正在回滚...${NC}"
    docker-compose down frontend nginx
    docker load -i $BACKUP_FILE
    docker-compose up -d frontend nginx
    echo -e "${RED}❌ 已回滚到之前版本${NC}"
    exit 1
fi

# 清理旧镜像
echo -e "${YELLOW}清理旧镜像...${NC}"
docker image prune -f

# 显示状态
echo ""
echo "======================================"
echo -e "${GREEN}🎉 部署成功！${NC}"
echo "======================================"
echo ""
docker-compose ps frontend nginx
echo ""
echo "访问地址:"
echo "  - HTTP:  http://182.92.239.199:8504"
echo "  - HTTPS: https://pbl-learning.xiaoluxue.com"
echo ""
