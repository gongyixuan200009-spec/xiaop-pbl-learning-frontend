#!/bin/bash
# 完整启动脚本 - xiaop-v2-dev 项目
# 服务器: 182.92.239.199

PROJECT_DIR="/root/workspace/xiaop-v2-dev-deploy"

echo "===== 停止所有服务 ====="
# 停止后端
pkill -f "uvicorn.*main:app"
# 停止前端
pkill -f "http-server.*8504"
pkill -f "serve.*8504"

sleep 2

echo "===== 启动后端服务 ====="
cd ${PROJECT_DIR}/backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
echo "后端服务已启动 (端口 8000)"

sleep 3

echo "===== 启动前端服务 ====="
cd ${PROJECT_DIR}/frontend/out
nohup http-server . -p 8504 > /tmp/frontend.log 2>&1 &
echo "前端服务已启动 (端口 8504)"

sleep 2

echo "===== 重启 Nginx ====="
nginx -s reload
echo "Nginx 已重新加载"

echo ""
echo "===== 服务状态检查 ====="
echo "后端 (直接访问): $(curl -s http://127.0.0.1:8000/ | python3 -c 'import sys,json; print(json.load(sys.stdin)["status"])' 2>/dev/null || echo '未响应')"
echo "前端 (直接访问): $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8504/)"
echo "API通过Nginx: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/api/)"

echo ""
echo "===== 所有服务已启动 ====="
echo "访问地址:"
echo "  - 前端首页: https://pbl-learning.xiaoluxue.com/"
echo "  - 聊天页面: https://pbl-learning.xiaoluxue.com/chat/"
echo "  - 管理后台: https://pbl-learning.xiaoluxue.com/admin/"
echo ""
echo "说明: 前端通过相对路径 /api/ 访问后端，Nginx自动转发"
