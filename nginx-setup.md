# Nginx 配置文档 - xiaop-v2-dev (最终版)
## 服务器信息
- 服务器IP: 182.92.239.199
- 前端域名: pbl-learning.xiaoluxue.com
- 后端域名: pbl-learning-bg.xiaoluxue.com (独立使用)

## 架构说明（解决Mixed Content问题）

### 关键改动
前端使用 **相对路径** 访问API，nginx统一处理路由：

```
用户访问: https://pbl-learning.xiaoluxue.com/
    ↓
前端请求: /api/auth/login (相对路径，自动使用HTTPS)
    ↓
Nginx (pbl-learning.xiaoluxue.com:80)
    ├─ /api/*    → 后端 uvicorn:8000
    └─ /*        → 前端 http-server:8504
```

## 前端Nginx配置
位置: /etc/nginx/sites-available/pbl-learning.xiaoluxue.com
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
        proxy_set_header Connection "upgrade";

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
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## 后端Nginx配置（保留，独立使用）
位置: /etc/nginx/sites-available/pbl-learning-bg.xiaoluxue.com
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

## 前端环境变量
位置: /Users/yixuangong/projects/xiao-p/frontend/.env.local
```bash
# 使用相对路径，nginx会转发到后端
NEXT_PUBLIC_API_URL=
```

## 为什么这样配置？

### 问题
- 用户通过HTTPS访问: `https://pbl-learning.xiaoluxue.com/`
- 如果API_URL配置为 `http://pbl-learning-bg.xiaoluxue.com/`
- 浏览器会阻止Mixed Content请求

### 解决方案
- API_URL留空，使用相对路径 `/api/`
- 浏览器会自动使用当前页面的协议(HTTPS)
- Nginx在同一个域名下处理前端和API路由
- 避免跨域和Mixed Content问题

## 服务端口
| 服务 | 端口 | 说明 |
|------|------|------|
| nginx | 80 | 反向代理（前端统一入口） |
| http-server | 8504 | 前端静态文件 |
| uvicorn | 8000 | 后端API |

## 访问地址
- 前端: http://pbl-learning.xiaoluxue.com/
- 聊天: http://pbl-learning.xiaoluxue.com/chat/
- 管理后台: http://pbl-learning.xiaoluxue.com/admin/
- API: 通过前端自动路由到后端
