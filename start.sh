#\!/bin/bash

# 工小助学习助手 v2 启动脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# 颜色定义
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

start_backend() {
    log_info "启动后端服务..."
    cd "$BACKEND_DIR"
    
    # 检查虚拟环境
    if [ \! -d "venv" ]; then
        log_info "创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install -r requirements.txt -q
    
    # 启动后端
    nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
    echo $\! > backend.pid
    log_info "后端已启动 (PID: $(cat backend.pid)) - http://localhost:8000"
}

start_frontend() {
    log_info "启动前端服务..."
    cd "$FRONTEND_DIR"
    
    # 安装依赖
    if [ \! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    # 启动前端
    cd frontend/out && nohup http-server . -p 8504 > /tmp/frontend.log 2>&1 &
    echo $\! > frontend.pid
    log_info "前端已启动 (PID: $(cat frontend.pid)) - http://localhost:3000"
}

stop_services() {
    log_info "停止服务..."
    
    if [ -f "$BACKEND_DIR/backend.pid" ]; then
        kill $(cat "$BACKEND_DIR/backend.pid") 2>/dev/null
        rm "$BACKEND_DIR/backend.pid"
        log_info "后端已停止"
    fi
    
    if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
        kill $(cat "$FRONTEND_DIR/frontend.pid") 2>/dev/null
        rm "$FRONTEND_DIR/frontend.pid"
        log_info "前端已停止"
    fi
}

status() {
    log_info "服务状态:"
    
    if [ -f "$BACKEND_DIR/backend.pid" ] && kill -0 $(cat "$BACKEND_DIR/backend.pid") 2>/dev/null; then
        echo -e "  后端: ${GREEN}运行中${NC} (PID: $(cat $BACKEND_DIR/backend.pid))"
    else
        echo -e "  后端: ${RED}未运行${NC}"
    fi
    
    if [ -f "$FRONTEND_DIR/frontend.pid" ] && kill -0 $(cat "$FRONTEND_DIR/frontend.pid") 2>/dev/null; then
        echo -e "  前端: ${GREEN}运行中${NC} (PID: $(cat $FRONTEND_DIR/frontend.pid))"
    else
        echo -e "  前端: ${RED}未运行${NC}"
    fi
}

case "$1" in
    start)
        start_backend
        start_frontend
        log_info "所有服务已启动！"
        log_info "前端访问: http://localhost:3000"
        log_info "后端API: http://localhost:8000"
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
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
