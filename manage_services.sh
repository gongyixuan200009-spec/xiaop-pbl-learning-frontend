#!/bin/bash

# xiaop-v2-dev 服务管理脚本

BACKEND_DIR="/root/workspace/xiaop-v2-dev/backend"
FRONTEND_DIR="/root/workspace/xiaop-v2-dev/frontend"

start_backend() {
    echo "启动后端服务 (8705)..."
    cd $BACKEND_DIR
    source venv/bin/activate
    nohup python -m uvicorn main:app --host 0.0.0.0 --port 8705 > backend.log 2>&1 &
    echo $! > backend.pid
    echo "后端已启动 (PID: $(cat backend.pid))"
}

start_frontend() {
    echo "启动前端服务 (8704)..."
    cd $FRONTEND_DIR
    nohup npm run start -- -p 8704 > frontend.log 2>&1 &
    sleep 2
    PID=$(ps aux | grep 'next-server.*8704' | grep -v grep | awk '{print $2}')
    echo $PID > frontend.pid
    echo "前端已启动 (PID: $PID)"
}

stop_backend() {
    echo "停止后端服务..."
    if [ -f "$BACKEND_DIR/backend.pid" ]; then
        kill $(cat $BACKEND_DIR/backend.pid) 2>/dev/null && echo "后端已停止"
        rm $BACKEND_DIR/backend.pid
    else
        echo "后端未运行"
    fi
}

stop_frontend() {
    echo "停止前端服务..."
    if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
        # 杀死整个进程树
        PPID=$(cat $FRONTEND_DIR/frontend.pid)
        pkill -P $PPID 2>/dev/null
        kill $PPID 2>/dev/null && echo "前端已停止"
        rm $FRONTEND_DIR/frontend.pid
    else
        echo "前端未运行"
    fi
}

status() {
    echo "=== xiaop-v2-dev 服务状态 ==="
    echo ""
    echo "后端 (8705):"
    if [ -f "$BACKEND_DIR/backend.pid" ] && kill -0 $(cat $BACKEND_DIR/backend.pid) 2>/dev/null; then
        echo "  状态: 运行中"
        echo "  PID: $(cat $BACKEND_DIR/backend.pid)"
    else
        echo "  状态: 未运行"
    fi
    
    echo ""
    echo "前端 (8704):"
    if [ -f "$FRONTEND_DIR/frontend.pid" ] && kill -0 $(cat $FRONTEND_DIR/frontend.pid) 2>/dev/null; then
        echo "  状态: 运行中"
        echo "  PID: $(cat $FRONTEND_DIR/frontend.pid)"
    else
        echo "  状态: 未运行"
    fi
    
    echo ""
    echo "端口监听:"
    netstat -tlnp | grep -E ':(8704|8705)' || echo "  无监听端口"
}

case "$1" in
    start)
        start_backend
        start_frontend
        echo ""
        echo "所有服务已启动！"
        echo "前端访问: http://182.92.239.199:8704"
        echo "后端API: http://182.92.239.199:8705"
        ;;
    stop)
        stop_backend
        stop_frontend
        ;;
    restart)
        stop_backend
        stop_frontend
        sleep 2
        start_backend
        start_frontend
        ;;
    status)
        status
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|backend|frontend}"
        exit 1
        ;;
esac
