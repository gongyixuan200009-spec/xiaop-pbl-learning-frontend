# 组织管理系统使用指南

## 概述

PBL 学习平台现在支持组织管理功能，允许管理员创建组织并配置自定义的 AI Prompts 和内容模板。

## 数据库迁移

首先需要运行数据库迁移来创建新的表结构：

```bash
# 在 Supabase Dashboard 的 SQL Editor 中执行
# 文件: supabase-organizations.sql
```

这将创建以下表：
- `organizations` - 组织信息
- `organization_prompts` - 组织的 AI prompt 配置
- `organization_templates` - 组织的内容模板
- `user_organizations` - 用户与组织的关联
- `user_profiles` - 用户扩展信息

## 功能说明

### 1. 组织管理

**创建组织：**
- 访问 `/admin` 页面
- 点击"我的组织"旁边的 `+` 按钮
- 填写组织名称、slug（唯一标识符）、描述等信息

**组织角色：**
- `owner` - 组织所有者，拥有所有权限
- `admin` - 管理员，可以管理 prompts 和模板
- `member` - 普通成员，只能查看

### 2. Prompt 配置

**Prompt 类型：**
- `project_creation` - 项目创建时使用的 prompt
- `stage_guidance` - 各阶段指导的 prompt
- `evaluation` - 评估反馈的 prompt

**配置项：**
- **Prompt 名称** - 便于识别的名称
- **Prompt 类型** - 选择用途
- **阶段编号** - 1-6，指定用于哪个学习阶段（可选）
- **Prompt 内容** - 主要的 prompt 文本
- **系统 Prompt** - 系统级别的指令（可选）
- **温度 (Temperature)** - 0-2，控制输出的随机性
- **最大 Tokens** - 限制输出长度
- **状态** - 激活/未激活

**示例 Prompt：**

```
你是一个专业的 PBL（基于问题的学习）项目助手。你的任务是通过对话方式帮助用户创建一个结构化的学习项目。

请按照以下步骤引导用户：

1. 首先询问用户想要解决什么问题或学习什么主题
2. 帮助用户明确问题陈述（problem statement）
3. 询问项目标题
4. 可选：询问目标受众、预期成果等补充信息

在对话过程中：
- 保持友好和鼓励的语气
- 提出引导性问题帮助用户思考
- 确保收集到的信息清晰明确
- 当收集到标题和问题陈述后，告知用户可以创建项目了

请用中文回复。
```

### 3. 用户组织关联

**注册时选择组织：**
- 用户注册时可以选择加入某个组织
- 也可以在用户设置中更改默认组织

**用户设置：**
- 访问用户设置页面
- 选择默认组织
- 系统将使用该组织的配置来创建项目和提供指导

## API 端点

### 组织管理

```typescript
// 获取用户的组织列表
GET /api/admin/organizations
Headers: Authorization: Bearer <token>

// 创建新组织
POST /api/admin/organizations
Headers: Authorization: Bearer <token>
Body: {
  name: string
  slug: string
  description?: string
  logo_url?: string
}
```

### Prompt 管理

```typescript
// 获取组织的所有 prompts
GET /api/admin/organizations/[organizationId]/prompts
Headers: Authorization: Bearer <token>

// 创建新 prompt
POST /api/admin/organizations/[organizationId]/prompts
Headers: Authorization: Bearer <token>
Body: {
  prompt_type: string
  stage_number?: number
  prompt_name: string
  prompt_content: string
  system_prompt?: string
  temperature?: number
  max_tokens?: number
}

// 更新 prompt
PUT /api/admin/organizations/[organizationId]/prompts
Headers: Authorization: Bearer <token>
Body: {
  id: string
  prompt_name?: string
  prompt_content?: string
  system_prompt?: string
  temperature?: number
  max_tokens?: number
  is_active?: boolean
}

// 删除 prompt
DELETE /api/admin/organizations/[organizationId]/prompts?id=<promptId>
Headers: Authorization: Bearer <token>
```

## 使用流程

### 管理员流程

1. **创建组织**
   - 登录后访问 `/admin`
   - 创建新组织
   - 设置组织信息

2. **配置 Prompts**
   - 选择组织
   - 创建项目创建 prompt
   - 为每个学习阶段创建指导 prompt
   - 配置评估反馈 prompt

3. **邀请成员**
   - 分享组织 slug
   - 用户注册时可以选择加入

### 用户流程

1. **注册/登录**
   - 注册时选择组织
   - 或在设置中选择默认组织

2. **创建项目**
   - 系统自动使用所属组织的 prompt 配置
   - AI 助手按照组织定制的方式引导

3. **学习过程**
   - 每个阶段使用组织配置的指导 prompt
   - 获得定制化的学习体验

## 下一步开发

以下功能还需要实现：

1. ✅ 数据库结构设计
2. ✅ 管理 API 路由
3. ✅ 管理页面 UI
4. ⏳ 修改注册页面添加组织选择
5. ⏳ 创建用户设置页面
6. ⏳ 修改项目创建 API 使用组织配置
7. ⏳ 修改对话 API 使用组织的 prompt

## 注意事项

- 每个组织可以有多个 prompt 配置
- 同一类型和阶段的 prompt 可以有多个版本
- 系统会使用最新版本的激活 prompt
- 用户可以随时更改默认组织
- 组织所有者可以管理所有配置
