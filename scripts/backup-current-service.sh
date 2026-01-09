#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 工小助前端服务备份脚本
# 用途: 在迁移到 Zeabur 之前，备份当前阿里云上的所有配置和数据
# 作者: Claude Code
# 日期: 2026-01-09
# ═══════════════════════════════════════════════════════════════════════════

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="$HOME/xiaop-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
ALIYUN_SERVER="182.92.239.199"
ALIYUN_PORT="8504"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                     工小助前端服务备份工具                                ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# 创建备份目录
echo -e "${YELLOW}[步骤 1/6] 创建备份目录...${NC}"
mkdir -p "$BACKUP_PATH"/{code,docker,config,dns,docs}
echo -e "${GREEN}✓ 备份目录已创建: $BACKUP_PATH${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 1. 备份代码仓库
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[步骤 2/6] 备份代码仓库...${NC}"

# 检查是否在 Git 仓库中
if git rev-parse --git-dir > /dev/null 2>&1; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    CURRENT_COMMIT=$(git rev-parse HEAD)

    echo -e "  ${BLUE}仓库路径:${NC} $REPO_ROOT"
    echo -e "  ${BLUE}当前分支:${NC} $CURRENT_BRANCH"
    echo -e "  ${BLUE}当前提交:${NC} $CURRENT_COMMIT"

    # 保存 Git 信息
    cat > "$BACKUP_PATH/code/git-info.txt" << EOF
Git 仓库信息
============
备份时间: $(date)
仓库路径: $REPO_ROOT
当前分支: $CURRENT_BRANCH
当前提交: $CURRENT_COMMIT

分支列表:
$(git branch -a)

最近10次提交:
$(git log --oneline -10)

未提交的更改:
$(git status --porcelain)
EOF

    # 备份当前工作目录的 Git 状态
    cd "$REPO_ROOT"
    git log --oneline -50 > "$BACKUP_PATH/code/git-log.txt"
    git diff > "$BACKUP_PATH/code/git-diff.txt"
    git status > "$BACKUP_PATH/code/git-status.txt"

    # 创建 Git bundle（完整备份）
    echo -e "  ${BLUE}创建 Git bundle...${NC}"
    git bundle create "$BACKUP_PATH/code/repo-backup.bundle" --all

    echo -e "${GREEN}✓ 代码仓库已备份${NC}"
else
    echo -e "${RED}✗ 当前目录不是 Git 仓库${NC}"
    echo -e "${YELLOW}⚠ 请在项目根目录运行此脚本${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 2. 备份 Docker 配置和镜像（需要 SSH 到阿里云服务器）
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[步骤 3/6] 备份 Docker 配置...${NC}"

cat > "$BACKUP_PATH/docker/instructions.txt" << 'EOF'
Docker 备份说明
===============

⚠️ 此步骤需要手动在阿里云服务器上执行

请 SSH 到阿里云服务器，然后执行以下命令：

1. 查看当前运行的容器
   docker ps

2. 导出 Docker Compose 配置（如果使用）
   cp docker-compose.yml ~/docker-compose-backup.yml

3. 导出环境变量文件
   cp .env ~/env-backup.txt
   # 或
   cp .env.production ~/env-production-backup.txt

4. 查看容器使用的镜像
   docker images | grep xiaop

5. 导出 Docker 镜像（替换 IMAGE_NAME 为实际镜像名）
   docker save IMAGE_NAME:TAG -o ~/xiaop-frontend-image.tar

6. 备份 Nginx 配置（如果有）
   cp /etc/nginx/nginx.conf ~/nginx-backup.conf
   cp /etc/nginx/conf.d/* ~/nginx-conf-d-backup/

7. 下载备份文件到本地
   在本地执行:
   scp root@182.92.239.199:~/*-backup* ./

已保存的信息：
- 阿里云服务器: 182.92.239.199
- 前端端口: 8504
- 域名: pbl-learning.xiaoluxue.com
EOF

echo -e "${GREEN}✓ Docker 备份说明已保存到: $BACKUP_PATH/docker/instructions.txt${NC}"
echo -e "${YELLOW}⚠ 请按照说明文件手动执行 Docker 备份${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 3. 备份配置文件（本地）
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[步骤 4/6] 备份本地配置文件...${NC}"

# 查找并备份常见配置文件
CONFIG_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.development"
    "next.config.js"
    "next.config.mjs"
    "package.json"
    "package-lock.json"
    "pnpm-lock.yaml"
    "yarn.lock"
    "tsconfig.json"
    "tailwind.config.js"
    "tailwind.config.ts"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_PATH/config/"
        echo -e "  ${GREEN}✓${NC} 已备份: $file"
    fi
done

echo -e "${GREEN}✓ 配置文件已备份${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 4. 记录 DNS 信息
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[步骤 5/6] 记录当前 DNS 配置...${NC}"

DOMAIN="pbl-learning.xiaoluxue.com"

# 获取当前 DNS 记录
cat > "$BACKUP_PATH/dns/current-dns.txt" << EOF
DNS 配置信息
============
备份时间: $(date)
域名: $DOMAIN

当前 DNS 记录（dig 查询结果）：
$(dig $DOMAIN +short)

完整 DNS 记录：
$(dig $DOMAIN)

WHOIS 信息：
$(whois $DOMAIN 2>/dev/null || echo "WHOIS 查询失败")
EOF

cat > "$BACKUP_PATH/dns/dns-recovery-steps.txt" << EOF
DNS 回滚步骤
============

如果需要回滚到阿里云服务器：

1. 登录你的 DNS 管理后台（阿里云 DNS 或 Cloudflare）

2. 找到域名: $DOMAIN

3. 将 CNAME 记录改回 A 记录：
   类型: A
   主机记录: pbl-learning
   记录值: $ALIYUN_SERVER
   TTL: 600

4. 等待 DNS 生效（5-30 分钟）

5. 验证：
   dig $DOMAIN +short
   # 应该返回: $ALIYUN_SERVER

6. 访问网站验证：
   curl -I https://$DOMAIN
EOF

echo -e "${GREEN}✓ DNS 信息已记录${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 5. 生成备份文档
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[步骤 6/6] 生成备份文档...${NC}"

cat > "$BACKUP_PATH/BACKUP-SUMMARY.md" << EOF
# 工小助前端服务备份总结

## 备份信息
- **备份时间**: $(date)
- **备份路径**: $BACKUP_PATH
- **阿里云服务器**: $ALIYUN_SERVER
- **前端端口**: $ALIYUN_PORT
- **域名**: $DOMAIN

## 备份内容

### 1. 代码仓库 (/code)
- Git 仓库完整备份（bundle 格式）
- 当前分支状态
- 未提交的更改
- Git 提交历史

### 2. Docker 配置 (/docker)
- Docker 备份说明（需要手动执行）
- 需要备份的内容：
  - Docker Compose 配置
  - 环境变量文件
  - Docker 镜像
  - Nginx 配置（如果有）

### 3. 配置文件 (/config)
- .env 文件
- next.config.js
- package.json
- 其他配置文件

### 4. DNS 记录 (/dns)
- 当前 DNS 配置
- DNS 回滚步骤

## 恢复步骤

### 如何恢复代码
\`\`\`bash
# 从 bundle 恢复 Git 仓库
git clone repo-backup.bundle recovered-repo
cd recovered-repo
git checkout <branch-name>
\`\`\`

### 如何恢复 Docker 服务
1. 将备份文件传回阿里云服务器
2. 恢复 docker-compose.yml 和 .env 文件
3. 加载 Docker 镜像：\`docker load -i xiaop-frontend-image.tar\`
4. 启动服务：\`docker-compose up -d\`

### 如何恢复 DNS
参见 \`dns/dns-recovery-steps.txt\`

## 快速回滚到阿里云

如果 Zeabur 部署后出现问题，可以立即回滚：

1. **DNS 回滚**（最快）
   - 登录 DNS 管理后台
   - 将 CNAME 记录改回 A 记录指向 $ALIYUN_SERVER
   - 5-30 分钟生效

2. **服务验证**
   - 确认阿里云服务器上的 Docker 容器仍在运行
   - 访问 http://$ALIYUN_SERVER:$ALIYUN_PORT 验证

3. **如果容器已停止**
   - SSH 到服务器
   - \`docker-compose up -d\` 重启服务

## 安全建议

1. **保留备份至少 30 天**
   - Zeabur 稳定运行 30 天后可以删除备份

2. **阿里云服务器暂时保留**
   - 作为应急备份
   - Zeabur 稳定后再关闭

3. **定期验证备份**
   - 确保备份文件完整可用

## 备份文件清单
\`\`\`
$BACKUP_PATH/
├── code/
│   ├── repo-backup.bundle          # Git 仓库完整备份
│   ├── git-info.txt                # Git 仓库信息
│   ├── git-log.txt                 # Git 提交历史
│   ├── git-diff.txt                # 未提交的更改
│   └── git-status.txt              # Git 状态
├── docker/
│   └── instructions.txt            # Docker 备份说明
├── config/
│   ├── .env                        # 环境变量（如果有）
│   ├── next.config.js              # Next.js 配置
│   └── package.json                # 依赖配置
├── dns/
│   ├── current-dns.txt             # 当前 DNS 记录
│   └── dns-recovery-steps.txt     # DNS 回滚步骤
└── BACKUP-SUMMARY.md               # 本文档
\`\`\`

---
生成时间: $(date)
备份脚本: backup-current-service.sh
EOF

echo -e "${GREEN}✓ 备份文档已生成${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 完成
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 备份完成！${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}备份位置:${NC} $BACKUP_PATH"
echo ""
echo -e "${YELLOW}下一步操作:${NC}"
echo -e "  1. 查看备份总结:"
echo -e "     ${BLUE}cat $BACKUP_PATH/BACKUP-SUMMARY.md${NC}"
echo ""
echo -e "  2. 执行 Docker 备份（需要 SSH 到阿里云）:"
echo -e "     ${BLUE}cat $BACKUP_PATH/docker/instructions.txt${NC}"
echo ""
echo -e "  3. 验证备份完整性:"
echo -e "     ${BLUE}ls -lh $BACKUP_PATH/*/\${NC}"
echo ""
echo -e "  4. 打包备份文件（可选）:"
echo -e "     ${BLUE}tar -czf xiaop-backup-$TIMESTAMP.tar.gz -C $BACKUP_DIR backup_$TIMESTAMP${NC}"
echo ""
echo -e "${GREEN}✓ 备份脚本执行完成，你可以安全地继续 Zeabur 部署了！${NC}"
echo ""
