# 备份脚本使用说明

## 快速开始

### 1. 运行备份脚本

```bash
cd /Users/shawn/projects/xiaop
./xiaop-v2-dev-deploy/scripts/backup-current-service.sh
```

### 2. 查看备份结果

备份完成后，会在 `$HOME/xiaop-backups/backup_<时间戳>/` 目录下生成以下文件：

```
backup_20260109_HHMMSS/
├── code/              # 代码仓库备份
├── docker/            # Docker 备份说明（需手动执行）
├── config/            # 配置文件备份
├── dns/               # DNS 记录备份
└── BACKUP-SUMMARY.md  # 备份总结文档
```

### 3. 完成 Docker 备份（可选但推荐）

```bash
# 1. 查看 Docker 备份说明
cat ~/xiaop-backups/backup_*/docker/instructions.txt

# 2. SSH 到阿里云服务器
ssh root@182.92.239.199

# 3. 按照说明执行备份命令
```

## 备份内容

### ✅ 自动备份
- Git 仓库完整状态
- 所有配置文件 (.env, next.config.js 等)
- 当前 DNS 记录
- 回滚步骤说明

### ⚠️ 需要手动备份（在阿里云服务器上）
- Docker 镜像
- Docker Compose 配置
- Nginx 配置（如果有）

## 验证备份

```bash
# 查看备份目录
ls -lh ~/xiaop-backups/backup_*/

# 查看备份总结
cat ~/xiaop-backups/backup_*/BACKUP-SUMMARY.md
```

## 如何回滚

如果 Zeabur 部署后需要回滚到阿里云：

### 方法 1: DNS 回滚（最快，5-30分钟）
```bash
# 查看回滚步骤
cat ~/xiaop-backups/backup_*/dns/dns-recovery-steps.txt

# 然后在 DNS 管理后台修改记录
```

### 方法 2: 完整恢复
```bash
# 1. 恢复代码
git clone ~/xiaop-backups/backup_*/code/repo-backup.bundle recovered-repo

# 2. 恢复配置
cp ~/xiaop-backups/backup_*/config/.env ./

# 3. 在阿里云服务器上重启 Docker 服务
ssh root@182.92.239.199 "cd /path/to/project && docker-compose up -d"
```

## 常见问题

### Q: 备份需要多久？
A: 通常 1-2 分钟，主要取决于 Git 仓库大小。

### Q: 备份会影响当前服务吗？
A: 不会，备份脚本只读取本地文件，不会修改任何内容。

### Q: 备份文件可以删除吗？
A: 建议在 Zeabur 稳定运行 30 天后再删除备份。

### Q: Docker 备份必须做吗？
A: 不是必须的，但强烈建议。如果你的代码都在 Git 仓库中，重新部署即可恢复。

---

**下一步**: 运行备份脚本后，就可以安全地开始 Zeabur 部署了！
