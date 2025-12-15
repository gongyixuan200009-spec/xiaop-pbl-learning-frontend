#!/bin/bash

# xiaop-v2 服务管理脚本

PROJECT_DIR="/root/workspace/xiaop-v2"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 端口配置
BACKEND_PORT=8505
FRONTEND_PORT=8504

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

case "$1" in
    start)
        echo -e "${GREEN}Starting xiaop-v2 services...${NC}"

        # 启动后端
        echo "Starting backend on port $BACKEND_PORT..."
        cd "$BACKEND_DIR"
        source venv/bin/activate
        nohup python -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT > backend.log 2>&1 &
        echo $! > backend.pid

        # 启动前端
        echo "Starting frontend on port $FRONTEND_PORT..."
        cd "$FRONTEND_DIR"
        nohup npm run start -- -H 0.0.0.0 -p $FRONTEND_PORT > frontend.log 2>&1 &
        echo $! > frontend.pid

        sleep 3

        # 检查服务状态
        if curl -s http://localhost:$BACKEND_PORT/ > /dev/null; then
            echo -e "${GREEN}✓ Backend running on port $BACKEND_PORT${NC}"
        else
            echo -e "${RED}✗ Backend failed to start${NC}"
        fi

        if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null; then
            echo -e "${GREEN}✓ Frontend running on port $FRONTEND_PORT${NC}"
        else
            echo -e "${RED}✗ Frontend failed to start${NC}"
        fi
        ;;

    stop)
        echo -e "${YELLOW}Stopping xiaop-v2 services...${NC}"

        # 停止后端
        if [ -f "$BACKEND_DIR/backend.pid" ]; then
            kill $(cat "$BACKEND_DIR/backend.pid") 2>/dev/null
            rm "$BACKEND_DIR/backend.pid"
            echo "Backend stopped"
        fi
        fuser -k $BACKEND_PORT/tcp 2>/dev/null

        # 停止前端
        if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
            kill $(cat "$FRONTEND_DIR/frontend.pid") 2>/dev/null
            rm "$FRONTEND_DIR/frontend.pid"
            echo "Frontend stopped"
        fi
        fuser -k $FRONTEND_PORT/tcp 2>/dev/null

        echo -e "${GREEN}Services stopped${NC}"
        ;;

    restart)
        $0 stop
        sleep 2
        $0 start
        ;;

    status)
        echo -e "${GREEN}xiaop-v2 Service Status${NC}"
        echo "========================"

        # 检查后端
        if curl -s http://localhost:$BACKEND_PORT/ > /dev/null 2>&1; then
            echo -e "Backend:  ${GREEN}● Running${NC} (port $BACKEND_PORT)"
        else
            echo -e "Backend:  ${RED}○ Stopped${NC}"
        fi

        # 检查前端
        if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null 2>&1; then
            echo -e "Frontend: ${GREEN}● Running${NC} (port $FRONTEND_PORT)"
        else
            echo -e "Frontend: ${RED}○ Stopped${NC}"
        fi
        ;;

    logs)
        case "$2" in
            backend)
                tail -f "$BACKEND_DIR/backend.log"
                ;;
            frontend)
                tail -f "$FRONTEND_DIR/frontend.log"
                ;;
            *)
                echo "Usage: $0 logs [backend|frontend]"
                ;;
        esac
        ;;

    build)
        echo -e "${YELLOW}Building frontend...${NC}"
        cd "$FRONTEND_DIR"
        npm run build
        echo -e "${GREEN}Build complete${NC}"
        ;;

    *)
        echo "Usage: $0 {start|stop|restart|status|logs|build}"
        echo ""
        echo "Commands:"
        echo "  start   - Start backend and frontend services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show service status"
        echo "  logs    - View logs (backend|frontend)"
        echo "  build   - Rebuild frontend"
        echo ""
        echo "Ports:"
        echo "  Frontend: $FRONTEND_PORT"
        echo "  Backend:  $BACKEND_PORT"
        exit 1
        ;;
esac

exit 0
