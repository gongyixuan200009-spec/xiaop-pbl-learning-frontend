# 创建 GitHub 仓库并推送代码 - 完整指南

## 第一步：在 GitHub 创建新仓库（5 分钟）

### 1.1 登录 GitHub

访问 [https://github.com](https://github.com) 并登录你的账号。

### 1.2 创建新仓库

1. 点击右上角的 `+` 号，选择 `New repository`
2. 填写仓库信息：

```
Repository name: xiaop-pbl-learning-frontend
Description: 工小助 PBL 学习平台前端
Visibility: ✓ Private（推荐）或 Public

⚠️ 重要：不要勾选以下选项（保持空白）
  [ ] Add a README file
  [ ] Add .gitignore
  [ ] Choose a license
```

3. 点击 `Create repository` 按钮

### 1.3 获取仓库 URL

创建成功后，你会看到一个页面显示仓库 URL，格式如下：

```
https://github.com/你的用户名/xiaop-pbl-learning-frontend.git
```

或者 SSH 格式：

```
git@github.com:你的用户名/xiaop-pbl-learning-frontend.git
```

**请复制这个 URL，等待下一步使用！**

---

## 第二步：准备本地代码（自动执行）

我会帮你运行以下命令：

### 2.1 提交当前更改

```bash
# 查看当前状态
git status

# 添加所有更改
git add .

# 创建提交
git commit -m "feat: 准备部署到 Zeabur

- 添加部署文档
- 配置前端静态导出
- 更新环境变量配置"
```

### 2.2 添加 GitHub 远程仓库

```bash
# 添加 GitHub 作为新的远程仓库
git remote add github <你的 GitHub 仓库 URL>

# 验证远程仓库
git remote -v
```

### 2.3 推送代码到 GitHub

```bash
# 推送 main 分支到 GitHub
git push github main
```

---

## 第三步：验证推送成功

1. 刷新 GitHub 仓库页面
2. 你应该能看到：
   - 所有代码文件
   - frontend/ 目录
   - backend/ 目录
   - README 等文件

---

## 下一步：连接 Zeabur

一旦代码推送到 GitHub 成功，我会立即帮你：

1. 在 Zeabur 连接 GitHub 仓库
2. 配置构建和部署设置
3. 部署前端应用
4. 获取临时域名进行测试

---

## 准备好了吗？

请按照以下步骤操作：

1. **现在就去 GitHub 创建仓库**（按照上面的步骤）
2. **创建成功后，将仓库 URL 发给我**
3. **我会自动执行剩余的所有步骤**

格式示例：
```
https://github.com/your-username/xiaop-pbl-learning-frontend.git
```

---

## 常见问题

### Q: 仓库应该是 Public 还是 Private？

A: 推荐 **Private**（私有）。理由：
- 包含业务逻辑和配置
- Zeabur 完全支持私有仓库
- 更安全

### Q: 我没有 GitHub 账号怎么办？

A:
1. 访问 [https://github.com/signup](https://github.com/signup)
2. 免费注册一个账号（2 分钟）
3. 然后继续创建仓库

### Q: 推送代码会影响现有的 git-ai.xiaoluxue.cn 仓库吗？

A: **不会！**我们是添加第二个远程仓库，不会影响现有的远程仓库。

你的代码会同时推送到：
- `origin` → git-ai.xiaoluxue.cn（不变）
- `github` → GitHub（新增）

### Q: 如果我以后想同时更新两个仓库怎么办？

A: 每次提交后运行：
```bash
git push origin main   # 推送到私有仓库
git push github main   # 推送到 GitHub
```

或者一次性推送到所有远程仓库：
```bash
git push --all
```

---

## 等待你的 GitHub 仓库 URL！

创建好后，直接把 URL 发给我，格式类似：

```
https://github.com/你的用户名/xiaop-pbl-learning-frontend.git
```

我会立即开始推送代码并部署到 Zeabur！🚀
