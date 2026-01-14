# LLM API 提供商切换说明

本系统支持两种LLM API提供商：

## 1. OpenRouter (当前使用)
- 使用 requests 库直接调用
- 支持多种模型：DeepSeek, GPT-4o-mini 等
- 配置文件示例：`api_key_config.openrouter.example.json`

## 2. 火山引擎豆包 (Volcengine Doubao)
- 使用 OpenAI SDK 调用
- 支持推理模式 (reasoning_effort)
- 配置文件示例：`api_key_config.volcengine.example.json`

## 如何切换API提供商

### 方法1：修改配置文件
编辑 `backend/data/api_key_config.json`，修改 `api_provider` 字段：

**切换到火山引擎：**
```json
{
    "api_provider": "volcengine",
    "api_key": "你的火山引擎API Key",
    "api_endpoint": "https://ark.cn-beijing.volces.com/api/v3",
    "default_model": "doubao-seed-1-6-lite-251015",
    "fast_model": "doubao-seed-1-6-lite-251015",
    "vision_model": "doubao-seed-1-6-lite-251015",
    "reasoning_effort": "medium"
}
```

**切换回OpenRouter：**
```json
{
    "api_provider": "openrouter",
    "api_key": "你的OpenRouter API Key",
    "api_endpoint": "https://openrouter.ai/api/v1",
    "default_model": "deepseek/deepseek-chat",
    "fast_model": "deepseek/deepseek-chat",
    "vision_model": "openai/gpt-4o-mini"
}
```

### 方法2：使用示例配置文件
```bash
# 切换到火山引擎
cp backend/data/api_key_config.volcengine.example.json backend/data/api_key_config.json

# 切换回OpenRouter
cp backend/data/api_key_config.openrouter.example.json backend/data/api_key_config.json
```

## 配置参数说明

### 通用参数
- `api_provider`: API提供商，可选值：`openrouter` 或 `volcengine`
- `api_key`: API密钥
- `api_endpoint`: API端点URL
- `default_model`: 默认模型（用于对话生成）
- `fast_model`: 快速模型（用于字段提取）
- `vision_model`: 视觉模型（用于图片识别）
- `vision_model_enabled`: 是否启用视觉模型
- `chat_mode`: 聊天模式，可选值：`single_agent` 或 `dual_agent`
- `debug_mode`: 是否启用调试模式

### 火山引擎特有参数
- `reasoning_effort`: 推理强度，可选值：`low`, `medium`, `high`
  - `low`: 快速推理，适合简单任务
  - `medium`: 中等推理，平衡速度和质量
  - `high`: 深度推理，适合复杂任务

## 依赖安装

### OpenRouter
无需额外依赖，使用标准的 requests 库。

### 火山引擎
需要安装 OpenAI SDK：
```bash
pip install --upgrade "openai>=1.0"
```

## 重启服务
修改配置后需要重启后端服务：
```bash
# 本地开发
# 重启 uvicorn 进程

# 服务器部署
systemctl restart xiaop-backend.service
```

## 备份说明
在切换API提供商之前，系统已自动创建备份：
- 备份位置：`backend/backups/before_volcengine_YYYYMMDD_HHMMSS/`
- 如需回滚，可从备份目录恢复文件

## 代码修改位置
所有LLM调用相关的代码都在 `backend/services/llm_service.py` 文件中。
该文件已添加详细注释，说明如何支持多个API提供商。

## 注意事项
1. 火山引擎的模型名称格式与OpenRouter不同
2. 火山引擎支持推理模式，可以获取模型的推理过程
3. 两种API的计费方式可能不同，请注意成本控制
4. 切换后建议先在测试环境验证功能正常
