# Zeabur 部署操作指南（分步执行）

## 🎯 部署概览

**GitHub 仓库**: https://github.com/gongyixuan200009-spec/xiaop-pbl-learning-frontend

**前端路径**: `/frontend`（monorepo 结构）

**环境变量**: `NEXT_PUBLIC_API_URL=https://pbl-learning-bg.xiaoluxue.com`

---

## 第 1 步：在 Zeabur 创建项目（2 分钟）

### 1.1 登录 Zeabur

访问 [https://zeabur.com](https://zeabur.com) 并登录你的账号。

### 1.2 创建新项目

1. 点击右上角的 `New Project` 按钮
2. 选择区域：
   ```
   推荐：Hong Kong（香港）
   原因：离中国大陆最近，访问速度最快
   ```
3. 输入项目名称：
   ```
   xiaop-pbl-learning
   ```
4. 点击 `Create` 创建项目

---

## 第 2 步：连接 GitHub 仓库（3 分钟）

### 2.1 添加服务

1. 在项目页面，点击 `Add Service` 按钮
2. 选择 `Git`（从 Git 仓库部署）

### 2.2 授权 GitHub

如果是第一次使用：
1. 点击 `Connect GitHub`
2. 在弹出窗口中授权 Zeabur 访问你的 GitHub
3. 选择授权范围：
   - 推荐：`Only select repositories`（只选择特定仓库）
   - 选择：`xiaop-pbl-learning-frontend`
4. 点击 `Install & Authorize`

### 2.3 选择仓库

1. 在仓库列表中找到 `gongyixuan200009-spec/xiaop-pbl-learning-frontend`
2. 点击选择该仓库
3. 选择分支：`main`
4. 点击 `Deploy`

---

## 第 3 步：配置构建设置（重要！）

### 3.1 检测到 Monorepo

Zeabur 会自动检测到这是一个 monorepo 项目。

### 3.2 配置根目录

⚠️ **关键步骤**：

1. 在服务设置中，找到 `Root Directory` 或 `Working Directory`
2. 设置为：
   ```
   frontend
   ```

### 3.3 配置构建命令（可选）

Zeabur 会自动检测 Next.js 项目，但如果需要手动配置：

```
Build Command: npm run build
Install Command: npm install
Start Command: 不需要（静态导出）
```

---

## 第 4 步：配置环境变量（1 分钟）

### 4.1 打开环境变量设置

1. 在服务页面，点击 `Variables` 或 `Environment Variables` 标签
2. 点击 `Add Variable` 添加变量

### 4.2 添加环境变量

添加以下变量：

```
Key: NEXT_PUBLIC_API_URL
Value: https://pbl-learning-bg.xiaoluxue.com
```

### 4.3 保存并重新部署

1. 点击 `Save` 保存
2. Zeabur 会自动触发重新部署

---

## 第 5 步：等待部署完成（3-5 分钟）

### 5.1 查看部署日志

1. 在服务页面，点击 `Logs` 或 `Deployments` 标签
2. 观察部署进度

### 5.2 部署成功标志

看到以下信息表示成功：
```
✓ Build completed
✓ Deployment successful
✓ Service is running
```

---

## 第 6 步：获取临时域名并测试（1 分钟）

### 6.1 获取域名

1. 部署成功后，在服务页面顶部会显示一个临时域名
2. 格式类似：`https://your-service.zeabur.app`

### 6.2 测试访问

1. 点击域名或复制到浏览器
2. 验证网站是否正常运行
3. 检查功能是否正常

---

## 第 7 步：绑定自定义域名（5 分钟）

### 7.1 在 Zeabur 添加域名

1. 在服务页面，点击 `Domains` 标签
2. 点击 `Add Domain`
3. 输入你的域名：
   ```
   pbl-learning.xiaoluxue.com
   ```
4. 点击 `Add`

### 7.2 获取 CNAME 记录

Zeabur 会显示一个 CNAME 目标，格式类似：
```
cname.zeabur.app
```

**请记下这个 CNAME 值！**

---

## 第 8 步：配置 DNS（10-30 分钟生效）

### 8.1 登录 DNS 管理后台

登录你的域名 DNS 管理后台（阿里云 DNS 或其他）。

### 8.2 修改 DNS 记录

找到域名 `xiaoluxue.com` 的 DNS 记录：

**删除或修改现有记录**：
```
类型: A
主机记录: pbl-learning
记录值: 182.92.239.199
```

**改为 CNAME 记录**：
```
类型: CNAME
主机记录: pbl-learning
记录值: <Zeabur 提供的 CNAME>
TTL: 600
```

### 8.3 保存并等待生效

1. 保存 DNS 记录
2. 等待 5-30 分钟（取决于 TTL 设置）
3. DNS 生效后，访问 `https://pbl-learning.xiaoluxue.com` 应该指向 Zeabur

---

## 第 9 步：验证部署（2 分钟）

### 9.1 验证域名解析

```bash
# 检查 DNS 是否生效
dig pbl-learning.xiaoluxue.com

# 应该看到 CNAME 记录指向 Zeabur
```

### 9.2 访问网站

1. 访问 `https://pbl-learning.xiaoluxue.com`
2. 验证：
   - 网站正常加载
   - 功能正常工作
   - API 调用正常（后端连接正常）

---

## 完成！🎉

恭喜！你的前端应用已成功部署到 Zeabur！

### 后续操作

1. **保留阿里云服务器作为备份**（至少 30 天）
2. **监控 Zeabur 服务状态**
3. **如有问题，可以随时回滚 DNS**

### 自动部署

现在每次你推送代码到 GitHub 的 `main` 分支，Zeabur 会自动：
1. 检测到更新
2. 自动构建
3. 自动部署
4. 零停机更新

---

## 需要帮助？

如果在任何步骤遇到问题，请告诉我具体在哪一步，我会帮你解决！
