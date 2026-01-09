# SSH 密钥配置指南

## 📋 需要配置的服务器

### 服务器 1: Supabase 数据库服务器
- **地址**: `10.1.20.75`
- **用途**: 执行数据库迁移
- **用户名**: 需要你提供（通常是 `root`, `ubuntu`, `admin` 等）

### 服务器 2: Git 服务器（可选，如果需要推送代码）
- **地址**: `git-ai.xiaoluxue.cn`
- **用途**: 推送代码到远程仓库

---

## 🔑 SSH 公钥（请复制到服务器）

**格式**: RSA 4096 位

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCk5q23gLpfUNhL3jAzzQK4UqsnuHuw9U8j1F5whojqQ6neauavttRhk9n1iTk8O6Sbd6yXAC/sZd6FWjL8bGNOpe6mWU04Z/hgdMjXIHtlBU2YWsIvr2IZF3bjnUrUI0Ur04KAp/vQpsVK4YYCV1dW7sV58lbGjVLq1RN6P1s41iWn6C6soytBm8brcyLdwybBf5sJR2Y7sawdDLI08ndB11w9bLtQcaxIgfvea/vKlXt2qxgE4KYDB9bg5KV2rwKGKhMscUrcOfbDl81Kao6G7OjRl+ErUjxZZAr/qkJsWwjpJo8SY+MTfd12lpZdZE3WZ/1lZ43yGNj8Pm1fSUlEVhqAJZvBniqZ1jrLr5yT9hiyEfdXZKIobIQSJJ+uSZkVcoHMRrGVI7ku8+lcaUGUZoNmp+eJbBcWL/grUBvUNxw4pnq6r/WC34hHoACYN9v64iTwRylRu0ctSPGUErc3UW7eM8DxMvPnavZ7YGQT2A9AnnXTDD2MQ7RV7KpeWOrQrkJV/K0goC9xlPjOtBd5ay76YX8uwQTNrbRMm70f5a2D//5q/FKawBAmx7GeOrMZ2nrRmeDc4wwiw7fVIZkRV6sYVleX6NAB06bAM5ioanI6xxh9tfvYaDeCCUOExxfz6u+iq/sXYg1/5wXGPxUZ8QuLrhGUSojKxIPyQXME6Q== xiaop-deployment-20260109
```

---

## 📝 在服务器上配置 SSH 公钥的步骤

### 方法 1: 如果你有服务器的 root 或 sudo 权限

```bash
# 1. SSH 到服务器（使用现有的登录方式，如密码）
ssh your_username@10.1.20.75

# 2. 创建 .ssh 目录（如果不存在）
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 3. 添加公钥到 authorized_keys
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCk5q23gLpfUNhL3jAzzQK4UqsnuHuw9U8j1F5whojqQ6neauavttRhk9n1iTk8O6Sbd6yXAC/sZd6FWjL8bGNOpe6mWU04Z/hgdMjXIHtlBU2YWsIvr2IZF3bjnUrUI0Ur04KAp/vQpsVK4YYCV1dW7sV58lbGjVLq1RN6P1s41iWn6C6soytBm8brcyLdwybBf5sJR2Y7sawdDLI08ndB11w9bLtQcaxIgfvea/vKlXt2qxgE4KYDB9bg5KV2rwKGKhMscUrcOfbDl81Kao6G7OjRl+ErUjxZZAr/qkJsWwjpJo8SY+MTfd12lpZdZE3WZ/1lZ43yGNj8Pm1fSUlEVhqAJZvBniqZ1jrLr5yT9hiyEfdXZKIobIQSJJ+uSZkVcoHMRrGVI7ku8+lcaUGUZoNmp+eJbBcWL/grUBvUNxw4pnq6r/WC34hHoACYN9v64iTwRylRu0ctSPGUErc3UW7eM8DxMvPnavZ7YGQT2A9AnnXTDD2MQ7RV7KpeWOrQrkJV/K0goC9xlPjOtBd5ay76YX8uwQTNrbRMm70f5a2D//5q/FKawBAmx7GeOrMZ2nrRmeDc4wwiw7fVIZkRV6sYVleX6NAB06bAM5ioanI6xxh9tfvYaDeCCUOExxfz6u+iq/sXYg1/5wXGPxUZ8QuLrhGUSojKxIPyQXME6Q== xiaop-deployment-20260109" >> ~/.ssh/authorized_keys

# 4. 设置正确的权限
chmod 600 ~/.ssh/authorized_keys

# 5. 验证文件内容
cat ~/.ssh/authorized_keys

# 6. 退出服务器
exit
```

### 方法 2: 如果你使用的是云服务器控制台

1. 登录到云服务器管理控制台
2. 找到 SSH 密钥管理或安全组设置
3. 添加新的 SSH 公钥
4. 粘贴上面的公钥内容
5. 保存并应用

---

## ✅ 配置完成后的验证步骤

配置完成后，请告诉我，我会运行以下命令测试连接：

```bash
# 测试 SSH 连接
ssh -i ~/.ssh/xiaop_deployment_key your_username@10.1.20.75 "echo '✅ SSH 连接成功'"
```

---

## 📌 重要信息

- **私钥位置**: `/Users/shawn/.ssh/xiaop_deployment_key`
- **公钥位置**: `/Users/shawn/.ssh/xiaop_deployment_key.pub`
- **密钥类型**: ED25519（现代、安全、快速）
- **生成时间**: 2026-01-09

⚠️ **安全提示**:
- 私钥已保存在本地，请勿分享
- 只需要将公钥添加到服务器
- 公钥可以安全地分享和存储

---

## 🎯 下一步

1. ✅ 将上面的公钥添加到服务器 `10.1.20.75`
2. ⏳ 告诉我服务器的用户名（如 root, ubuntu, admin 等）
3. ⏳ 我会测试 SSH 连接
4. ⏳ 连接成功后，执行数据库迁移
