#!/bin/bash

# ==========================================
# 工小助学习助手 - 快速部署脚本
# ==========================================
# 用途: 快速设置和部署项目到 Zeabur
# 使用: bash quick_deploy.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 主函数
main() {
    print_header "工小助学习助手 - 快速部署脚本"

    # 步骤 1: 检查依赖
    print_info "检查系统依赖..."

    if ! command_exists git; then
        print_error "Git 未安装,请先安装 Git"
        exit 1
    fi
    print_success "Git 已安装"

    if ! command_exists python3; then
        print_error "Python 3 未安装,请先安装 Python 3"
        exit 1
    fi
    print_success "Python 3 已安装"

    if ! command_exists node; then
        print_warning "Node.js 未安装,前端部署可能需要"
    else
        print_success "Node.js 已安装"
    fi

    # 步骤 2: 检查 Git 仓库状态
    print_header "检查 Git 仓库状态"

    if [ ! -d ".git" ]; then
        print_warning "当前目录不是 Git 仓库"
        read -p "是否初始化 Git 仓库? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git init
            print_success "Git 仓库已初始化"
        else
            print_error "需要 Git 仓库才能部署到 Zeabur"
            exit 1
        fi
    else
        print_success "Git 仓库已存在"
    fi

    # 步骤 3: 检查环境配置
    print_header "检查环境配置"

    if [ ! -f "backend/.env" ]; then
        print_warning "backend/.env 文件不存在"
        if [ -f "backend/.env.example" ]; then
            read -p "是否从 .env.example 创建 .env 文件? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cp backend/.env.example backend/.env
                print_success ".env 文件已创建"
                print_warning "请编辑 backend/.env 文件,填入正确的配置信息"
                read -p "按 Enter 键继续..."
            fi
        else
            print_error "backend/.env.example 文件不存在"
        fi
    else
        print_success "backend/.env 文件已存在"
    fi

    # 步骤 4: 测试后端依赖
    print_header "检查后端依赖"

    if [ -f "backend/requirements.txt" ]; then
        print_info "检查 Python 依赖..."
        # 检查是否在虚拟环境中
        if [ -z "$VIRTUAL_ENV" ]; then
            print_warning "未检测到 Python 虚拟环境"
            print_info "建议创建虚拟环境: python3 -m venv venv && source venv/bin/activate"
        fi
        print_success "requirements.txt 已存在"
    else
        print_error "backend/requirements.txt 不存在"
    fi

    # 步骤 5: 检查 Dockerfile
    print_header "检查 Dockerfile"

    if [ ! -f "backend/Dockerfile" ]; then
        print_error "backend/Dockerfile 不存在"
        exit 1
    fi
    print_success "backend/Dockerfile 已存在"

    if [ ! -f "frontend/Dockerfile" ]; then
        print_error "frontend/Dockerfile 不存在"
        exit 1
    fi
    print_success "frontend/Dockerfile 已存在"

    # 步骤 6: Git 提交
    print_header "准备 Git 提交"

    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        print_info "检测到未提交的更改"
        git status --short
        echo
        read -p "是否提交所有更改? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            read -p "请输入提交信息 (默认: Add Supabase integration and Zeabur deployment): " commit_msg
            commit_msg=${commit_msg:-"Add Supabase integration and Zeabur deployment"}
            git commit -m "$commit_msg"
            print_success "更改已提交"
        fi
    else
        print_success "没有未提交的更改"
    fi

    # 步骤 7: 推送到远程仓库
    print_header "推送到远程仓库"

    # 检查是否有远程仓库
    if git remote | grep -q "origin"; then
        print_info "检测到远程仓库: $(git remote get-url origin)"
        read -p "是否推送到远程仓库? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push
            print_success "已推送到远程仓库"
        fi
    else
        print_warning "未配置远程仓库"
        print_info "请先添加远程仓库:"
        print_info "  git remote add origin <your-repo-url>"
        print_info "  git push -u origin main"
    fi

    # 步骤 8: 显示部署指南
    print_header "部署到 Zeabur"

    echo "接下来请按照以下步骤在 Zeabur 上部署:"
    echo ""
    echo "1. 访问 https://zeabur.com 并登录"
    echo "2. 创建新项目: xiaop-learning-assistant"
    echo "3. 添加后端服务:"
    echo "   - 服务名称: backend"
    echo "   - 根目录: /backend"
    echo "   - 端口: 8504"
    echo "   - 配置环境变量 (参考 backend/.env.example)"
    echo ""
    echo "4. 添加前端服务:"
    echo "   - 服务名称: frontend"
    echo "   - 根目录: /frontend"
    echo "   - 端口: 3000"
    echo "   - 配置 NEXT_PUBLIC_API_URL 为后端服务的 URL"
    echo ""
    echo "5. 详细步骤请参考:"
    echo "   - ZEABUR_DEPLOYMENT_GUIDE.md"
    echo "   - SUPABASE_MIGRATION_GUIDE.md"
    echo ""

    print_success "快速部署脚本执行完成!"
    print_info "查看文档了解更多: MIGRATION_SUMMARY.md"
}

# 运行主函数
main
