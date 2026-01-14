# GitHub 认证设置指南（快速）

## 问题

推送代码到 GitHub 时需要认证。我们有两个选项：

---

## 🚀 选项 1：使用 Personal Access Token（推荐，3 分钟）

### 步骤 1：创建 GitHub Personal Access Token

1. 访问 [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. 点击 `Generate new token` → 选择 `Generate new token (classic)`
3. 填写信息：
   ```
   Note: Zeabur Deployment Token
   Expiration: 90 days（或选择 No expiration）

   勾选权限：
   ✓ repo（完整权限）
   ```
4. 点击 `Generate token`
5. **重要：复制生成的 token（类似 ghp_xxxxxxxxxxxx）**
   - 只显示一次，请保存好！

### 步骤 2：使用 Token 推送代码

把下面的 token 发给我，我会自动推送代码：

```
ghp_your_token_here
```

---

## 🔐 选项 2：使用 SSH（需要 5 分钟配置）

如果你想使用 SSH（更安全，但需要配置），按照以下步骤：

### 步骤 1：生成 SSH 密钥

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# 连续按回车，使用默认设置
```

### 步骤 2：复制公钥

```bash
cat ~/.ssh/id_ed25519.pub
```

### 步骤 3：添加到 GitHub

1. 访问 [https://github.com/settings/ssh/new](https://github.com/settings/ssh/new)
2. Title: `Zeabur Deployment`
3. Key: 粘贴刚才复制的公钥
4. 点击 `Add SSH key`

### 步骤 4：告诉我

告诉我 "SSH 已配置"，我会自动推送代码。

---

## 💡 我的推荐

**使用选项 1（Personal Access Token）**，因为：
- 只需 3 分钟
- 配置简单
- 立即可用
- 可以随时撤销

创建好 Token 后，直接把 token 发给我（格式：ghp_xxxxxxxxxxxx），我会立即推送代码！

---

## 安全说明

- Token 只给我一次，推送完成后我不会保存
- 你随时可以在 GitHub 撤销 token
- Token 只用于推送代码，不会做其他操作
