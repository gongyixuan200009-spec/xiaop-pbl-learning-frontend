# 小鹿学 PBL Learning 系统部署配置文档

## 📋 文档信息

- **创建时间**: 2026-01-06
- **服务器**: 阿里云 ECS (182.92.239.199)
- **系统**: Ubuntu
- **更新时间**: 2026-01-06

---

## 🌐 域名配置

### 主要域名

| 域名 | 用途 | 协议 | 状态 |
|------|------|------|------|
| pbl-learning.xiaoluxue.com | 前端主站 | HTTPS | ✅ 正常 |
| pbl-learning-bg.xiaoluxue.com | 后端 API | HTTPS | ✅ 正常 |

### 域名解析

- **DNS 解析**: 指向阿里云 SLB (39.105.145.52)
- **SSL 证书**: *.xiaoluxue.com (通配符证书)
- **证书颁发机构**: WoTrus CA Limited
- **证书有效期**: 2025-06-23 至 2026-06-23

---

## 🏗️ 网络架构

### 完整请求链路

```
用户浏览器
    ↓
阿里云 SLB (39.105.145.52:443)
    ↓ [SSL 终止]
    ↓ [HTTP → HTTPS 重定向]
    ↓
ECS 服务器 (182.92.239.199:80)
    ↓
Nginx 反向代理
    ↓
    ├─→ /api/* → 后端服务 (127.0.0.1:8000)
    └─→ /* → 前端服务 (127.0.0.1:8504)
```

### 架构说明

1. **SLB 层**: 
   - 处理 SSL/TLS 加密
   - HTTP 自动重定向到 HTTPS
   - 负载均衡（当前单机）

2. **Nginx 层**:
   - 反向代理
   - 路由分发
   - WebSocket 支持

3. **应用层**:
   - 前端: http-server (静态文件服务)
   - 后端: FastAPI + Uvicorn

---

## ⚙️ Nginx 配置

### 主站配置 (pbl-learning.xiaoluxue.com)

**配置文件**: 

```nginx
server {
    listen 80;
    server_name pbl-learning.xiaoluxue.com;

    # API 代理 - 转发到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 前端代理 - 处理其他所有请求
    location / {
        proxy_pass http://127.0.0.1:8504;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```


### 后台配置 (pbl-learning-bg.xiaoluxue.com)

**配置文件**: 

```nginx
server {
    listen 80;
    server_name pbl-learning-bg.xiaoluxue.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Nginx 配置说明

- **配置目录**: 
- **启用目录**: 
- **Nginx 版本**: nginx/1.24.0 (Ubuntu)
- **配置测试**: 
- **重载配置**: 


### 后台配置 (pbl-learning-bg.xiaoluxue.com)

**配置文件**: /etc/nginx/sites-available/pbl-learning-bg.xiaoluxue.com

```nginx
server {
    listen 80;
    server_name pbl-learning-bg.xiaoluxue.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## 🚀 服务配置

### 后端服务 (FastAPI)

- **端口**: 8000
- **进程**: uvicorn main:app --host 0.0.0.0 --port 8000
- **工作目录**: /root/workspace/xiaop-v2-dev-deploy/backend/
- **Python 环境**: /root/workspace/xiaop-v2-dev-deploy/backend/venv/
- **主文件**: main.py
- **状态**: ✅ 运行中


### 前端服务 (http-server)

- **端口**: 8504
- **进程**: http-server -p 8504
- **工作目录**: /root/workspace/xiaop-v2-dev-deploy/frontend/out/
- **状态**: ✅ 运行中
- **说明**: 静态文件服务器，仅支持 GET/HEAD 方法

### 服务管理命令

**查看服务状态**:
```bash
# 查看后端服务
ps aux | grep uvicorn | grep -v grep

# 查看前端服务
ps aux | grep http-server | grep -v grep

# 查看端口占用
netstat -tlnp | grep -E '(8000|8504)'
```


**重启服务**:
```bash
# 重启后端服务
cd /root/workspace/xiaop-v2-dev-deploy/backend
pkill -f "uvicorn main:app"
nohup venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# 重启前端服务
pkill -f "http-server"
cd /root/workspace/xiaop-v2-dev-deploy/frontend/out
nohup http-server -p 8504 > /dev/null 2>&1 &
```

---

## 🔧 环境变量配置

### 前端环境变量

**文件**: `/root/workspace/xiaop-v2-dev-deploy/frontend/.env.production`

```bash
NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com
```


**说明**:
- 前端构建时会读取此环境变量
- API 请求会发送到 `https://pbl-learning-bg.xiaoluxue.com`
- 修改后需要重新构建前端: `npm run build`

### 后端环境变量

**文件**: `/root/workspace/xiaop-v2-dev-deploy/backend/config.py`

主要配置项:
- `CORS_ORIGINS`: CORS 允许的来源
- `DATA_DIR`: 数据存储目录
- 数据库配置等

---

## 📊 端口使用情况

| 端口 | 服务 | 协议 | 说明 |
|------|------|------|------|
| 80 | Nginx | HTTP | 反向代理入口 |
| 8000 | FastAPI | HTTP | 后端 API 服务 |
| 8504 | http-server | HTTP | 前端静态文件服务 |


**外部端口**:
- 443 (HTTPS): 由阿里云 SLB 处理
- 80 (HTTP): 由阿里云 SLB 重定向到 HTTPS

---

## 🔍 故障排查

### 常见问题

#### 1. 405 Method Not Allowed 错误

**原因**: 
- 前端环境变量配置错误（使用了 HTTP 而非 HTTPS）
- http-server 不支持 POST/PUT/DELETE 方法
- 阿里云 SLB 配置问题

**解决方案**:
- 确保前端环境变量使用 HTTPS: `NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com`
- 重新构建前端: `cd frontend && npm run build`
- 重启前端服务


#### 2. Nginx 服务无法启动

**原因**: 
- 80 端口被占用
- 配置文件语法错误

**解决方案**:
```bash
# 检查端口占用
netstat -tlnp | grep :80

# 测试配置文件
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log
```


#### 3. 前端页面无法访问

**检查步骤**:
```bash
# 1. 检查前端服务是否运行
ps aux | grep http-server

# 2. 检查端口是否监听
netstat -tlnp | grep 8504

# 3. 测试本地访问
curl -I http://127.0.0.1:8504

# 4. 检查 Nginx 代理
curl -I http://127.0.0.1/
```


#### 4. API 请求失败

**检查步骤**:
```bash
# 1. 检查后端服务
ps aux | grep uvicorn

# 2. 测试后端 API
curl -X POST http://127.0.0.1:8000/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"test"}'

# 3. 查看后端日志
tail -f /root/workspace/xiaop-v2-dev-deploy/backend/backend.log
```

---

## 📝 部署流程

### 前端部署

```bash
cd /root/workspace/xiaop-v2-dev-deploy/frontend

# 1. 更新代码
git pull

# 2. 安装依赖（如有新依赖）
npm install

# 3. 构建
npm run build

# 4. 重启服务
pkill -f "http-server"
cd out
nohup http-server -p 8504 > /dev/null 2>&1 &
```


### 后端部署

```bash
cd /root/workspace/xiaop-v2-dev-deploy/backend

# 1. 更新代码
git pull

# 2. 激活虚拟环境
source venv/bin/activate

# 3. 安装依赖（如有新依赖）
pip install -r requirements.txt

# 4. 重启服务
pkill -f "uvicorn main:app"
nohup venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# 5. 查看日志
tail -f backend.log
```


---

## 🔐 安全配置

### SSL/TLS

- **证书管理**: 由阿里云 SLB 统一管理
- **证书类型**: 通配符证书 (*.xiaoluxue.com)
- **协议版本**: TLS 1.2+
- **加密套件**: ECDHE-RSA-AES128-GCM-SHA256

### CORS 配置

后端已配置 CORS，允许跨域请求：
- 允许的来源: 配置在 `config.py` 中
- 允许的方法: GET, POST, PUT, DELETE, OPTIONS
- 允许凭证: True


---

## 📌 重要注意事项

### 1. 前端 API 配置

⚠️ **关键配置**: 前端必须使用 HTTPS 协议访问后端 API

```bash
# 正确配置
NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com

# 错误配置（会导致 405 错误）
NEXT_PUBLIC_API_URL=http://pbl-learning-bg.xiaoluxue.com
```

### 2. http-server 限制

- http-server 是静态文件服务器
- 仅支持 GET 和 HEAD 方法
- 不支持 POST/PUT/DELETE 等方法
- API 请求必须通过 Nginx 代理到后端


### 3. Nginx 进程管理

当前 Nginx 存在问题：
- systemd 管理的 Nginx 服务状态为 failed
- 实际运行的是手动启动的 Nginx 进程
- 建议修复：停止手动进程，使用 systemd 管理

### 4. 服务器重启后的恢复

服务器重启后需要手动启动服务：
```bash
# 启动后端
cd /root/workspace/xiaop-v2-dev-deploy/backend
nohup venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# 启动前端
cd /root/workspace/xiaop-v2-dev-deploy/frontend/out
nohup http-server -p 8504 > /dev/null 2>&1 &
```

建议配置 systemd 服务实现自动启动。


---

## 🧪 测试命令

### 测试域名访问

```bash
# 测试主站 HTTPS
curl -I https://pbl-learning.xiaoluxue.com

# 测试后台 API
curl -X POST https://pbl-learning-bg.xiaoluxue.com/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"test"}'

# 测试本地 Nginx
curl -I http://127.0.0.1/

# 测试后端服务
curl http://127.0.0.1:8000/health

# 测试前端服务
curl -I http://127.0.0.1:8504/
```


### 测试网络连通性

```bash
# 测试 DNS 解析
nslookup pbl-learning.xiaoluxue.com
nslookup pbl-learning-bg.xiaoluxue.com

# 测试 SLB 连接
curl -I https://pbl-learning.xiaoluxue.com

# 测试端口连通性
telnet 127.0.0.1 8000
telnet 127.0.0.1 8504
```

---

## 📚 相关文档

- Nginx 官方文档: https://nginx.org/en/docs/
- FastAPI 文档: https://fastapi.tiangolo.com/
- Next.js 文档: https://nextjs.org/docs

---

## 📞 联系信息

- **维护人员**: [待填写]
- **更新日期**: 2026-01-06
- **文档版本**: v1.0

