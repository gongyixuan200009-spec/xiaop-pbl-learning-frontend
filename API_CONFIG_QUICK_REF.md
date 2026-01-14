# API配置功能 - 快速参考

## ✅ 部署完成

**部署时间**: 2026-01-12 12:38

## 🌐 访问地址

**管理后台**: https://pbl-learning.xiaoluxue.com/admin/

访问路径: 登录 → 系统设置 → API 配置

## 🎯 主要功能

1. **切换API提供商**
   - OpenRouter (多种开源模型)
   - 火山引擎豆包 (字节跳动)

2. **配置模型**
   - 默认模型
   - 快速模型
   - 视觉模型

3. **推理强度** (仅火山引擎)
   - 低强度 (快速)
   - 中等强度 (平衡)
   - 高强度 (深度)

## 📝 当前配置

- **提供商**: 火山引擎豆包
- **模型**: doubao-seed-1-6-lite-251015
- **推理强度**: 中等强度
- **API Key**: 7c51735e-0a71-4e2f-b775-2668f3efb757

## 🔧 服务器管理

### SSH连接
```bash
ssh aliyun
```

### 项目路径
```
/root/workspace/xiaop-v2-dev-deploy/
```

### 重启服务
```bash
ssh aliyun "bash /root/restart-xiaop-service.sh"
```

### 查看日志
```bash
ssh aliyun "tail -f /tmp/backend.log"
ssh aliyun "tail -f /tmp/frontend.log"
```

## 📚 文档

- `API_CONFIG_UI_GUIDE.md` - 详细使用指南
- `DEPLOYMENT_REPORT_API_CONFIG.md` - 部署报告
- `API_CONFIG_UI_IMPLEMENTATION.md` - 技术实现

## 🧪 测试清单

访问管理后台测试以下功能:
- [ ] 查看当前配置
- [ ] 切换API提供商
- [ ] 修改API Key
- [ ] 选择模型
- [ ] 保存配置
- [ ] 验证保存成功

## 💡 提示

- 修改配置后，新对话将使用新模型
- 已有对话不受影响
- API Key会安全保存在服务器
