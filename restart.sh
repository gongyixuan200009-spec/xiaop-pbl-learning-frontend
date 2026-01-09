#!/bin/bash
# 服务重启脚本
# 最后更新: 2026-01-05 23:25
# 用途: 重启前后端服务

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="/root/workspace/xiaop-v2-dev-deploy"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend/out"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   工小助学习助手 - 服务重启脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 1. 停止旧服务
echo -e "${YELLOW}[1/5] 停止旧服务...${NC}"
pkill -f 'uvicorn.*8000' || true
pkill -f 'http-server.*8504' || true
pkill -f 'serve.*8504' || true
sleep 2
echo -e "${GREEN}✅ 旧服务已停止${NC}"
echo ""

# 2. 启动后端服务
echo -e "${YELLOW}[2/5] 启动后端服务...${NC}"
cd "$BACKEND_DIR"
nohup venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 >> /tmp/backend.log 2>&1 &
sleep 3
echo -e "${GREEN}✅ 后端服务已启动${NC}"
echo ""

# 3. 验证后端服务
echo -e "${YELLOW}[3/5] 验证后端服务...${NC}"
if curl -s http://127.0.0.1:8000/ | grep -q "工小助学习助手 API"; then
    echo -e "${GREEN}✅ 后端服务验证成功${NC}"
else
    echo -e "${RED}❌ 后端服务验证失败${NC}"
    echo "后端日志:"
    tail -20 /tmp/backend.log
    exit 1
fi
echo ""

# 4. 启动前端服务
echo -e "${YELLOW}[4/5] 启动前端服务...${NC}"
cd "$FRONTEND_DIR"
nohup http-server . -p 8504 >> /tmp/frontend.log 2>&1 &
sleep 3
echo -e "${GREEN}✅ 前端服务已启动${NC}"
echo ""

# 5. 验证前端服务
echo -e "${YELLOW}[5/5] 验证前端服务...${NC}"
ROOT_CHECK=$(curl -s http://127.0.0.1:8504/ | grep -o "嗨！我是工小助")
ADMIN_CHECK=$(curl -s http://127.0.0.1:8504/admin/ | grep -o "工小助 管理后台")

if [ -n "$ROOT_CHECK" ] && [ -n "$ADMIN_CHECK" ]; then
    echo -e "${GREEN}✅ 前端服务验证成功${NC}"
else
    echo -e "${RED}❌ 前端服务验证失败${NC}"
    echo "前端日志:"
    tail -20 /tmp/frontend.log
    exit 1
fi
echo ""

# 6. 显示服务状态
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   服务状态${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
netstat -tlnp | grep -E ":8000|:8504|:80 " | awk '{print $4, $7}' | column -t
echo ""

# 7. 显示访问地址
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   访问地址${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  主站:      http://pbl-learning.xiaoluxue.com/"
echo "  聊天:      http://pbl-learning.xiaoluxue.com/chat/"
echo "  管理后台:  http://pbl-learning.xiaoluxue.com/admin/"
echo "  API:       http://182.92.239.199:8000/api/"
echo "  API文档:   http://182.92.239.199:8000/docs"
echo ""

echo -e "${GREEN}✅ 所有服务重启成功！${NC}"
