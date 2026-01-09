# 工小助学习助手系统 - 完整架构文档

> 本文档面向架构师，详细记录整个项目的技术架构、业务逻辑、代码实现和部署方案。

**文档版本**: v1.0
**项目版本**: v3.0.0
**最后更新**: 2026-01-09

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构](#2-系统架构)
3. [技术栈](#3-技术栈)
4. [前端架构](#4-前端架构)
5. [后端架构](#5-后端架构)
6. [数据库设计](#6-数据库设计)
7. [核心业务流程](#7-核心业务流程)
8. [关键技术实现](#8-关键技术实现)
9. [部署架构](#9-部署架构)
10. [数据流图](#10-数据流图)
11. [API接口文档](#11-api接口文档)
12. [性能优化策略](#12-性能优化策略)

---

## 1. 项目概述

### 1.1 项目定位

**工小助学习助手** 是一个面向中小学生的AI驱动的项目制学习（PBL）辅助系统。通过对话式交互、渐进式学习和测试验证机制，帮助学生完成工程设计项目的多个阶段任务。

### 1.2 核心特性

- **对话式学习**: AI助手通过自然对话引导学生思考和完成任务
- **渐进式解锁**: 学生必须完成当前阶段才能进入下一阶段
- **关卡测试**: 每个阶段结束时通过测试验证学习效果
- **年龄适配**: 根据学生年级自动调整AI语言风格和难度
- **多项目支持**: 学生可以创建多个独立的学习项目
- **实时流式输出**: AI回复采用流式传输，提升用户体验
- **多模态支持**: 支持图片上传和视觉理解
- **可视化管理**: 管理员可通过Web界面配置表单、工作流和Prompt

### 1.3 用户角色

1. **学生用户**: 注册后进行对话式学习，完成各阶段任务
2. **管理员**: 配置学习流程、管理用户数据、查看学习进度

### 1.4 典型学习流程

```
注册 → 填写个人信息 → 创建项目 → 阶段1任务 → 测试 → 确认完成
→ 阶段2任务 → 测试 → 确认完成 → ... → 完成所有阶段
```

---

## 2. 系统架构

### 2.1 总体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  学生Web   │  │  管理后台  │  │  移动端    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/WSS
┌───────────────────────▼─────────────────────────────────────┐
│                      前端层 (Next.js)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ App Router │ React Components │ Zustand Store        │   │
│  │ SSE Client │ API Client       │ Framer Motion        │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API / SSE
┌───────────────────────▼─────────────────────────────────────┐
│                    API网关层 (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CORS Middleware │ JWT Auth │ Exception Handler       │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     后端业务层 (Python)                       │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │ 认证服务   │ 聊天服务   │ 进度服务   │ 管理服务   │     │
│  ├────────────┼────────────┼────────────┼────────────┤     │
│  │ LLM服务    │ Pipeline   │ 存储服务   │ 配置服务   │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌─────────▼──────────┐
│  数据存储层    │            │   外部服务层       │
│                │            │                    │
│ ┌────────────┐ │            │ ┌────────────┐    │
│ │ Supabase   │ │            │ │ LLM API    │    │
│ │ PostgreSQL │ │            │ │ (OpenAI    │    │
│ │            │ │            │ │  兼容)     │    │
│ └────────────┘ │            │ └────────────┘    │
│                │            │                    │
│ ┌────────────┐ │            │ ┌────────────┐    │
│ │ Supabase   │ │            │ │ 图片处理   │    │
│ │ Storage    │ │            │ │ Vision API │    │
│ └────────────┘ │            │ └────────────┘    │
│                │            │                    │
│ ┌────────────┐ │            └────────────────────┘
│ │ JSON Files │ │
│ │ (向后兼容) │ │
│ └────────────┘ │
└────────────────┘
```

### 2.2 架构特点

1. **前后端分离**: 前端Next.js + 后端FastAPI，通过RESTful API通信
2. **分层设计**: Router → Service → Database 三层架构
3. **流式传输**: 使用SSE实现AI回复的实时流式输出
4. **双存储模式**: JSON文件存储 + Supabase数据库，支持平滑迁移
5. **微服务化**: 服务层按功能模块拆分，职责清晰
6. **状态管理**: 前端使用Zustand进行轻量级状态管理
7. **Pipeline编排**: 可配置的多Agent流程编排系统

---

## 3. 技术栈

### 3.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.0.8 | React应用框架，App Router模式 |
| React | 19.2.1 | UI框架 |
| TypeScript | 5.x | 类型安全的开发语言 |
| Tailwind CSS | 4.x | 原子化CSS框架 |
| Zustand | 5.0.9 | 轻量级状态管理 |
| Framer Motion | 12.23.25 | 动画库 |
| TanStack Query | 5.90.12 | 服务端状态管理（已安装待用） |
| Lucide React | 0.556.0 | 图标库 |
| @xyflow/react | 12.10.0 | 工作流可视化编辑器 |

### 3.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 后端开发语言 |
| FastAPI | 0.104.0+ | 高性能Web框架 |
| Uvicorn | 0.24.0+ | ASGI服务器 |
| Pydantic | 2.0+ | 数据验证和序列化 |
| Python-Jose | 3.3.0+ | JWT认证 |
| Supabase | 2.0+ | 数据库和存储 |
| Requests | 2.31.0+ | HTTP客户端（调用LLM） |

### 3.3 基础设施

| 技术 | 用途 |
|------|------|
| Supabase | PostgreSQL数据库 + 对象存储 + 认证 |
| Docker | 容器化部署 |
| Nginx | 反向代理和负载均衡 |
| Git | 版本控制 |
| Zeabur | PaaS部署平台（可选） |

---

## 4. 前端架构

### 4.1 目录结构

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx             # 首页（登录/注册）
│   │   ├── chat/page.tsx        # 聊天主界面
│   │   ├── admin/page.tsx       # 管理后台
│   │   ├── layout.tsx           # 根布局
│   │   └── globals.css          # 全局样式
│   │
│   ├── components/              # React组件
│   │   ├── auth/               # 认证组件
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterWizard.tsx
│   │   │
│   │   ├── chat/               # 聊天组件
│   │   │   ├── ChatContainer.tsx      # 聊天容器（核心）
│   │   │   ├── ChatInput.tsx          # 输入框
│   │   │   ├── MessageBubble.tsx      # 消息气泡
│   │   │   └── TaskProgress.tsx       # 任务进度
│   │   │
│   │   ├── layout/             # 布局组件
│   │   │   └── Sidebar.tsx     # 侧边栏
│   │   │
│   │   └── admin/              # 管理后台组件
│   │       ├── FormEditor.tsx
│   │       ├── WorkflowEditor.tsx
│   │       ├── PipelineEditor.tsx
│   │       └── ...
│   │
│   ├── store/                   # Zustand状态管理
│   │   ├── authStore.ts        # 认证状态
│   │   ├── chatStore.ts        # 聊天状态
│   │   └── adminStore.ts       # 管理后台状态
│   │
│   ├── lib/                     # 工具库
│   │   ├── api.ts              # API调用封装
│   │   ├── utils.ts            # 通用工具
│   │   └── workflow-utils.ts   # 工作流工具
│   │
│   └── hooks/                   # 自定义Hooks
│       └── useTypewriter.ts    # 打字机效果
│
├── public/                      # 静态资源
│   ├── avatar.png              # AI头像
│   └── *.svg                   # 图标
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.js
```

### 4.2 状态管理架构

#### authStore（认证状态）
```typescript
{
  token: string | null              // JWT Token
  user: {
    username: string
    profile: {
      grade: string                 // 年级
      gender: string                // 性别
      math_score: string            // 数学成绩
      science_feeling: string       // 理科感受
      age_group: string             // 年龄段（自动推断）
    }
  } | null
  isAuthenticated: boolean

  // 方法
  login(token, user)
  logout()
  updateUser(user)
}
```

#### chatStore（聊天和进度状态）
```typescript
{
  // 当前项目信息
  currentProjectId: string
  currentProjectName: string

  // 阶段管理
  currentFormId: number              // 当前阶段ID
  currentStep: number                // 当前可访问的最高阶段
  completedSteps: number[]           // 已完成的阶段列表

  // 阶段数据
  forms: FormConfig[]                // 所有表单配置
  chatHistory: ChatMessage[]         // 当前聊天历史
  extractedFields: Record<string, string>  // 已提取的字段
  stepProgress: Record<number, StepProgress>  // 各阶段进度
  previousSummaries: PreviousSummary[]        // 前面阶段总结

  // 测试状态
  isInTest: boolean
  testPassed: boolean
  testChatHistory: ChatMessage[]
  testCredential: string

  // UI状态
  isLoading: boolean
  needsConfirmation: boolean

  // 方法
  setCurrentForm(formId)
  addMessage(message)
  confirmCurrentStep(summary, nextFormId)
  canAccessStep(formId)
  startTest()
  setTestPassed(passed, credential)
  resetAllProgress()
  // ...更多方法
}
```

### 4.3 路由架构

| 路由 | 组件 | 功能 | 认证要求 |
|------|------|------|----------|
| `/` | `app/page.tsx` | 登录/注册页面 | 否 |
| `/chat` | `app/chat/page.tsx` | 聊天学习界面 | 是 |
| `/admin` | `app/admin/page.tsx` | 管理后台 | 管理员认证 |

### 4.4 组件设计模式

#### 容器组件与展示组件分离
- **容器组件**: 如`ChatContainer`，负责业务逻辑和状态管理
- **展示组件**: 如`MessageBubble`，只负责UI渲染

#### 性能优化模式
- 使用`React.memo`避免不必要的重渲染
- 用户消息组件使用自定义比较函数
- CSS Containment隔离布局计算
- 流式滚动使用节流（200ms）

#### 响应式设计模式
- CSS变量 + clamp实现流畅缩放
- 移动端优先设计
- iOS Safe Area适配
- 触摸优化

---

## 5. 后端架构

### 5.1 目录结构

```
backend/
├── main.py                       # FastAPI应用入口
├── config.py / config_v3.py     # 配置文件
├── requirements.txt             # Python依赖
├── Dockerfile                   # 容器化配置
├── .env / .env.example         # 环境变量
│
├── routers/                     # 路由层（API端点）
│   ├── __init__.py
│   ├── auth.py                 # 认证路由
│   ├── chat.py                 # 聊天路由（核心）
│   ├── admin.py                # 管理路由
│   ├── project.py              # 项目管理路由
│   ├── upload.py               # 文件上传路由
│   └── debug.py                # 调试工具路由
│
├── models/                      # 数据模型层
│   └── schemas.py              # Pydantic模型定义
│
├── services/                    # 业务逻辑层
│   ├── auth_service.py         # 认证服务
│   ├── llm_service.py          # LLM调用服务（核心）
│   ├── pipeline_service.py     # Pipeline编排服务
│   ├── progress_service.py     # 进度管理服务
│   ├── database_service.py     # Supabase数据库服务
│   ├── storage_service.py      # Supabase存储服务
│   ├── supabase_client.py      # Supabase客户端
│   ├── user_service.py         # 用户服务
│   ├── project_service.py      # 项目服务
│   ├── config_service.py       # 配置服务
│   ├── prompt_history.py       # Prompt历史服务
│   ├── prompt_preview.py       # Prompt预览服务
│   └── debug_service.py        # 调试服务
│
├── scripts/                     # 工具脚本
│   ├── migrate_to_supabase.py  # 数据迁移工具
│   ├── check_database.py       # 数据库检查
│   └── supabase_migration.sql  # SQL迁移脚本
│
└── data/                        # 本地数据存储
    ├── users.json              # 用户数据
    ├── form_config.json        # 表单配置
    ├── api_key_config.json     # API配置
    ├── pipelines.json          # Pipeline配置
    ├── prompt_history.json     # Prompt历史
    ├── user_progress/          # 用户进度文件
    ├── form_data/              # 导出的CSV数据
    └── uploads/                # 上传文件
```

### 5.2 三层架构设计

```
┌─────────────────────────────────────────┐
│            Router Layer                  │
│  (路由层 - API端点定义)                  │
│                                          │
│  - 请求验证（Pydantic）                  │
│  - JWT认证检查                           │
│  - 参数解析                              │
│  - 响应格式化                            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Service Layer                  │
│  (服务层 - 业务逻辑处理)                 │
│                                          │
│  - 业务逻辑实现                          │
│  - 数据转换                              │
│  - 外部API调用（LLM）                    │
│  - 事务处理                              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Data Access Layer                │
│  (数据访问层 - 数据持久化)               │
│                                          │
│  - JSON文件读写                          │
│  - Supabase数据库操作                    │
│  - 文件存储管理                          │
│  - 缓存管理                              │
└──────────────────────────────────────────┘
```

### 5.3 核心服务模块

#### LLM服务（llm_service.py）- 800+行
**职责**: 调用大语言模型API，处理流式响应

**核心功能**:
- `call_llm_fast()`: 快速模型调用（提取任务）
- `call_llm_stream()`: 流式调用（生成回复）
- `call_llm_vision_stream()`: 视觉模型流式调用
- `extract_fields()`: 字段提取逻辑
- `generate_reply_stream()`: 生成流式回复
- `generate_summary()`: 生成阶段总结

**设计特点**:
- 支持多种模型配置（fast/default/vision）
- 详细的性能计时（HTTP连接时间、首Token时间、总时间）
- 智能JSON清理和解析
- 图片转base64支持
- 完善的错误处理

#### Pipeline服务（pipeline_service.py）- 700+行
**职责**: Agent流程编排和执行

**核心概念**:
- **Pipeline**: 包含多个步骤的完整流程
- **Step**: 单个Agent步骤（extract/reply/extract_and_reply）
- **Output**: 输出配置（指定数据来源）

**预置Pipeline**:
1. `single_agent`: 单Agent模式（提取+回复一体）
2. `dual_agent`: 双Agent模式（分离提取和回复）
3. `triple_agent`: 三Agent深度分析模式

**执行器（PipelineExecutor）**:
- 按顺序执行步骤
- 流式yield事件（step_start, extraction, content, step_done）
- 步骤间上下文传递
- 输出合并

#### 进度服务（progress_service.py）- 349行
**职责**: 用户学习进度管理

**核心功能**:
- 多项目管理（创建、切换、删除、重命名）
- 阶段进度管理（获取、保存、确认）
- 访问权限检查（canAccessStep）
- 测试状态管理
- 前置总结获取
- 数据迁移（单项目→多项目）

**数据结构**:
```python
{
  "username": "张三",
  "current_project_id": "abc123",
  "projects": {
    "abc123": {
      "id": "abc123",
      "name": "我的项目",
      "current_step": 2,
      "completed_steps": [1],
      "step_data": {
        "1": {
          "form_id": 1,
          "extracted_fields": {...},
          "chat_history": [...],
          "is_confirmed": true,
          "summary": "...",
          "test_state": {...}
        }
      }
    }
  }
}
```

---

## 6. 数据库设计

### 6.1 存储演进

**当前状态**: JSON文件存储（开发/小规模部署）
**迁移目标**: Supabase PostgreSQL（生产环境）
**迁移策略**: 双模式支持，通过环境变量切换

### 6.2 核心表结构

#### users（用户表）
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    grade TEXT,                    -- 年级
    gender TEXT,                   -- 性别
    math_score TEXT,               -- 数学成绩
    science_feeling TEXT,          -- 理科感受
    age_group TEXT,                -- 年龄段（elementary/middle_school/high_school）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### user_projects（用户项目表）
```sql
CREATE TABLE user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,      -- 前端生成的项目ID
    name TEXT NOT NULL,            -- 项目名称
    current_step INT DEFAULT 1,    -- 当前可访问的最高阶段
    completed_steps INT[],         -- 已完成的阶段列表
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);
```

#### project_step_data（项目步骤数据表）
```sql
CREATE TABLE project_step_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_uuid UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    form_id INT NOT NULL,
    extracted_fields JSONB,        -- 提取的字段
    chat_history JSONB,            -- 聊天历史
    is_confirmed BOOLEAN DEFAULT FALSE,
    summary TEXT,                  -- 阶段总结
    test_state JSONB,              -- 测试状态
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_uuid, step_number)
);
```

#### form_configs（表单配置表）
```sql
CREATE TABLE form_configs (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,              -- 导师Prompt
    user_description TEXT,         -- 用户看到的描述
    fields JSONB,                  -- 字段列表
    extraction_prompt TEXT,        -- 提取Prompt
    age_prompts JSONB,            -- 年龄适配Prompt
    test_enabled BOOLEAN,          -- 是否启用测试
    test_prompt TEXT,              -- 测试Prompt
    test_pass_pattern TEXT,        -- 通过模式
    sort_order INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### pipeline_configs（Pipeline配置表）
```sql
CREATE TABLE pipeline_configs (
    pipeline_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,         -- Pipeline完整配置
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### prompt_history（Prompt历史表）
```sql
CREATE TABLE prompt_history (
    id SERIAL PRIMARY KEY,
    history_type TEXT NOT NULL,    -- form_config/test_config/age_adaptation/pipeline
    identifier TEXT,               -- 标识符（如form_id）
    content JSONB NOT NULL,        -- 完整配置内容
    description TEXT,              -- 修改描述
    operator TEXT,                 -- 操作者
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.3 数据迁移方案

**迁移工具**: `backend/scripts/migrate_to_supabase.py`

**迁移内容**:
1. 用户数据（users.json → users表）
2. 表单配置（form_config.json → form_configs表）
3. API配置（api_key_config.json → api_configs表）
4. Pipeline配置（pipelines.json → pipeline_configs表）
5. 用户进度（user_progress/*.json → user_projects + project_step_data表）
6. Prompt历史（prompt_history.json → prompt_history表）

**迁移特点**:
- 使用SERVICE_ROLE_KEY绕过RLS
- Upsert操作避免重复
- 保留原有时间戳
- 处理多项目结构
- 完整错误处理

---

## 7. 核心业务流程

### 7.1 用户注册流程

```
┌──────────┐
│ 开始注册 │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Step 1: 设置账号 │
│ - 用户名          │
│ - 密码            │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Step 2: 选择年级 │
│ - 自动推断年龄段  │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Step 3: 选择性别 │
└────┬─────────────┘
     │
     ▼
┌──────────────────────┐
│ Step 4: 选择数学成绩 │
└────┬─────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Step 5: 选择理科/科学    │
│         学习感受         │
└────┬────────────────────┘
     │
     ▼
┌──────────────────┐
│ 发送注册请求      │
│ POST /api/auth/  │
│      register    │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ 后端验证          │
│ - 用户名唯一性    │
│ - 密码强度        │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ 创建用户          │
│ - 保存用户信息    │
│ - 哈希密码        │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ 生成JWT Token    │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ 返回用户信息+Token│
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ 前端存储Token    │
│ 跳转到聊天页面    │
└──────────────────┘
```

### 7.2 聊天学习流程

```
┌────────────┐
│ 进入聊天页 │
└─────┬──────┘
      │
      ▼
┌───────────────────────┐
│ 1. 加载初始数据        │
│ - getForms()          │
│ - getUserProgress()   │
│ - getStepData()       │
│ - getPreviousSummaries()│
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 2. 显示欢迎消息       │
│ - 工小助主动打招呼     │
│ - 显示任务说明        │
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 3. 用户发送消息       │
│ - 文本 or 文本+图片   │
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 4. 后端处理           │
│ - 权限检查            │
│ - Pipeline执行        │
│ - 字段提取            │
│ - 生成回复            │
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 5. SSE流式返回        │
│ - thinking事件        │
│ - extraction事件      │
│ - content事件（流式） │
│ - done事件            │
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 6. 前端更新UI         │
│ - 更新聊天历史        │
│ - 更新提取字段        │
│ - 更新进度条          │
└─────┬─────────────────┘
      │
      ▼
    ┌─┴─┐
    │是│ 所有字段完成？
    └─┬─┘
      │ 否 → 回到步骤3
      │
      │ 是
      ▼
┌───────────────────────┐
│ 7. 显示"开始测试"按钮  │
└─────┬─────────────────┘
      │
      ▼
    ┌─┴─┐
    │是│ 测试启用？
    └─┬─┘
      │ 否 → 跳到步骤12
      │
      │ 是
      ▼
┌───────────────────────┐
│ 8. 用户点击"开始测试"  │
│ - startTest()         │
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 9. 测试对话           │
│ - 发送测试消息        │
│ - AI出题并判断        │
└─────┬─────────────────┘
      │
      ▼
    ┌─┴─┐
    │是│ 测试通过？
    └─┬─┘
      │ 否 → 回到步骤9
      │
      │ 是
      ▼
┌───────────────────────┐
│ 10. 显示通过勋章      │
│ - 显示test_credential │
│ - 按钮变为"确认完成"  │
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 11. 用户点击"确认完成"│
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 12. 后端确认阶段      │
│ - confirmStep()       │
│ - 生成summary         │
│ - 标记is_confirmed    │
│ - 解锁下一阶段        │
│ - 保存CSV             │
└─────┬─────────────────┘
      │
      ▼
┌───────────────────────┐
│ 13. 前端切换到下一阶段│
│ - 清空聊天历史        │
│ - 加载新阶段数据      │
│ - 显示欢迎消息        │
└─────┬─────────────────┘
      │
      ▼
    回到步骤3
```

### 7.3 Pipeline执行流程

```
Pipeline定义:
steps:
  - id: "extract"
    type: "extract"
    model: "fast"
  - id: "reply"
    type: "reply"
    model: "default"
    context_from: ["extract"]
output:
  table_from: ["extract"]
  reply_from: ["reply"]

执行流程:
┌────────────────┐
│ 接收用户消息    │
└────┬───────────┘
     │
     ▼
┌────────────────────────┐
│ 获取Pipeline配置       │
│ - 从配置文件加载        │
│ - 或使用预置Pipeline   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ 初始化PipelineExecutor │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ 执行Step 1: extract    │
│ ┌────────────────────┐ │
│ │ yield step_start   │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ call_llm_fast()    │ │
│ │ - 提取字段          │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ yield extraction   │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ yield step_done    │ │
│ └────────────────────┘ │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ 执行Step 2: reply      │
│ ┌────────────────────┐ │
│ │ yield step_start   │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ 获取context_from   │ │
│ │ - extract的结果    │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ call_llm_stream()  │ │
│ │ - 生成回复          │ │
│ │ - 流式输出          │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ yield content*N    │ │
│ │ (流式逐字输出)      │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ yield step_done    │ │
│ └────────────────────┘ │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ 合并输出               │
│ - table_from: extract  │
│ - reply_from: reply    │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ yield pipeline_done    │
└────────────────────────┘
```

---

## 8. 关键技术实现

### 8.1 SSE流式传输

**实现原理**:
```python
# 后端：使用生成器函数yield事件
def generate_events():
    yield f"data: {json.dumps({'type': 'thinking'})}\n\n"
    # ... 执行Pipeline
    for chunk in llm_stream:
        yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"

return StreamingResponse(
    generate_events(),
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"  # 禁用nginx缓冲
    }
)
```

```typescript
// 前端：使用fetch + ReadableStream读取
const response = await fetch(url, {...});
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const event = JSON.parse(line.slice(6));
      handleEvent(event);
    }
  }
}
```

**事件类型**:
- `thinking`: 思考中（含图片处理提示）
- `step_start`: 步骤开始
- `extraction`: 字段提取结果
- `content`: 流式内容（逐字）
- `step_done`: 步骤完成
- `done`: 全部完成（含完整消息）
- `timing`: 性能计时

### 8.2 字段提取算法

**提取规则**:
```
1. 只提取用户明确表达的内容，不推测或补充
2. 内容必须与字段名要求严格匹配
3. 主题相关性检查：内容必须与当前讨论主题相关
4. 拒绝提取的情况（填null）：
   - 用户只是询问或不确定
   - 内容模糊、不完整
   - 内容与字段要求不匹配
   - 数量不足（如要求2条但只有1条）
5. 只提取实质性内容，不提取"好的"等无意义回复
```

**Prompt结构**:
```
系统消息:
- 你是字段提取专家
- 提取规则
- 字段列表和要求
- 已提取的字段（避免重复）

用户消息:
- 对话历史（最近N轮）
- 当前用户输入

期望输出:
JSON格式 {"字段名": "提取值或null"}
```

**实现代码**:
```python
def extract_fields(form_config, conversation_text, already_extracted):
    system_prompt = f"""
你是一个专业的字段提取专家...
{SIMPLE_EXTRACTION_RULES}

需要提取的字段:
{json.dumps(form_config["fields"], ensure_ascii=False)}

已提取的字段:
{json.dumps(already_extracted, ensure_ascii=False)}
"""

    response = call_llm_fast(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": conversation_text}
        ],
        temperature=0  # 确定性输出
    )

    # 清理和解析JSON
    cleaned = clean_json_string(response)
    extracted = json.loads(cleaned)

    # 只返回新提取的字段
    newly_extracted = {
        k: v for k, v in extracted.items()
        if v is not None and k not in already_extracted
    }

    return newly_extracted
```

### 8.3 年龄适配系统

**适配维度**:
```python
AGE_ADAPTATION_RULES = {
    "小学生": {
        "tone": "活泼、鼓励性、使用emoji",
        "vocabulary": "简单词汇、口语化",
        "sentence_structure": "短句子、简单结构",
        "examples": "日常生活场景",
        "encouragement": "多用鼓励和夸奖"
    },
    "初中生": {
        "tone": "友善、启发式",
        "vocabulary": "适度专业术语",
        "sentence_structure": "中等长度、因果逻辑",
        "examples": "学校和家庭场景",
        "encouragement": "引导思考"
    },
    "高中生": {
        "tone": "专业、引导性",
        "vocabulary": "学术词汇",
        "sentence_structure": "复杂句式、逻辑严密",
        "examples": "实际工程案例",
        "encouragement": "挑战性问题"
    }
}
```

**应用方式**:
```python
def build_system_prompt(form_config, user_profile):
    # 获取年龄段
    age_group = user_profile.get("age_group", "middle_school")

    # 获取适配的Prompt
    if age_group in form_config.get("age_prompts", {}):
        description = form_config["age_prompts"][age_group]
    else:
        description = form_config["description"]  # 默认Prompt

    # 添加适配规则
    adaptation = AGE_ADAPTATION_RULES.get(age_group, {})

    system_prompt = f"""
{description}

【语言风格适配】
- 语气: {adaptation.get("tone")}
- 词汇: {adaptation.get("vocabulary")}
- 句子结构: {adaptation.get("sentence_structure")}
- 举例方式: {adaptation.get("examples")}
- 鼓励方式: {adaptation.get("encouragement")}
"""

    return system_prompt
```

### 8.4 关卡测试机制

**测试配置**:
```typescript
interface FormConfig {
  test_enabled: boolean          // 是否启用测试
  test_prompt: string            // 测试Prompt（AI如何出题）
  test_pass_pattern: string      // 通过模式（正则或描述）
}
```

**测试Prompt示例**:
```
你是一位严谨但友善的测试官。请根据学生之前提取的以下内容：

【学生的工作】
{extracted_fields}

向学生提出1-2个问题，测试他们是否真正理解了：
1. 问题是什么
2. 为什么这是一个需要解决的问题
3. 解决方案的关键点

如果学生回答正确，请在回复末尾包含: STEP1_OK
如果回答不完整，请给予提示并继续引导
```

**通过判断逻辑**:
```python
def check_test_passed(ai_response, test_pass_pattern):
    # 方式1: 简单字符串匹配
    if test_pass_pattern in ai_response:
        return True, test_pass_pattern

    # 方式2: 正则匹配（支持更复杂的模式）
    import re
    match = re.search(test_pass_pattern, ai_response)
    if match:
        return True, match.group(0)

    return False, None
```

**测试流程时序图**:
```
用户               前端                后端              LLM
 │                 │                   │                 │
 │ 点击"开始测试"   │                   │                 │
 ├────────────────>│                   │                 │
 │                 │ startTest()       │                 │
 │                 ├──────────────────>│                 │
 │                 │                   │ 保存测试状态     │
 │                 │                   │ (is_in_test=true)│
 │                 │<──────────────────┤                 │
 │                 │ {success, message}│                 │
 │<────────────────┤                   │                 │
 │ 显示引导语       │                   │                 │
 │ "开始测试吧！"   │                   │                 │
 │                 │                   │                 │
 │ 输入："好的"     │                   │                 │
 ├────────────────>│                   │                 │
 │                 │ sendTestMessage() │                 │
 │                 ├──────────────────>│                 │
 │                 │                   │ 构建测试Prompt   │
 │                 │                   ├────────────────>│
 │                 │                   │                 │ 生成测试题
 │                 │<─────────────SSE流式传输─────────────┤
 │<─────流式显示────┤ content事件*N     │                 │
 │ "请说说..."     │                   │                 │
 │                 │                   │                 │
 │ 输入答案         │                   │                 │
 ├────────────────>│                   │                 │
 │                 │ sendTestMessage() │                 │
 │                 ├──────────────────>│                 │
 │                 │                   │ AI判断答案       │
 │                 │                   ├────────────────>│
 │                 │                   │                 │ 回复包含STEP1_OK
 │                 │<─────────────SSE流式传输─────────────┤
 │                 │ done事件          │                 │
 │                 │ {is_passed: true, │                 │
 │                 │  pass_credential} │                 │
 │<────────────────┤                   │                 │
 │ 显示绿色勋章     │                   │                 │
 │ "通过测试！"     │                   │                 │
 │                 │                   │                 │
 │ 点击"确认完成"   │                   │                 │
 ├────────────────>│                   │                 │
 │                 │ confirmStep()     │                 │
 │                 ├──────────────────>│                 │
 │                 │                   │ 标记is_confirmed │
 │                 │                   │ 解锁下一阶段     │
 │                 │<──────────────────┤                 │
 │<────────────────┤                   │                 │
 │ 切换到下一阶段   │                   │                 │
```

### 8.5 图片处理流程

**上传和存储**:
```
用户选择图片
    ↓
前端预览（FileReader）
    ↓
点击发送
    ↓
POST /api/upload/image
    ↓
后端保存到 data/uploads/
    ↓
返回URL: http://server:8504/data/uploads/xxx.jpg
    ↓
前端发送消息时附带imageUrl
```

**LLM处理**:
```python
def call_llm_vision_stream(messages, image_url):
    # 检测图片URL
    if image_url:
        # 转换为base64
        base64_image = image_url_to_base64(image_url)

        # 构建视觉消息
        vision_message = {
            "role": "user",
            "content": [
                {"type": "text", "text": text_content},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
        }

        # 调用视觉模型
        model = get_vision_model()  # 如gpt-4o
        response = call_llm_api(model, vision_message)

    return response
```

**优化点**:
- 本地图片直接读取文件（避免HTTP请求）
- 自动检测MIME类型
- 支持jpg/png/gif/webp
- 前端提示："包含图片的消息可能需要较长处理时间"

### 8.6 性能优化技术

#### 前端优化
```typescript
// 1. React.memo避免不必要的重渲染
const MessageBubble = React.memo((props) => {
  // ...
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.content === nextProps.content &&
         prevProps.role === nextProps.role;
});

// 2. CSS Containment隔离布局
<div style={{ contain: "content" }}>
  {historyMessages}
</div>

// 3. 滚动节流
let lastScrollTime = 0;
const throttledScroll = () => {
  const now = Date.now();
  if (now - lastScrollTime > 200) {
    scrollToBottom();
    lastScrollTime = now;
  }
};

// 4. 分离流式内容和历史消息
<div className="history-messages">
  {chatHistory.map(msg => <MessageBubble />)}
</div>
<div className="streaming-message">
  {isStreaming && <MessageBubble content={streamingContent} />}
</div>
```

#### 后端优化
```python
# 1. 模型选择策略
def extract_fields():
    # 使用快速模型（便宜、快速）
    return call_llm_fast(messages, temperature=0)

def generate_reply():
    # 使用标准模型（平衡质量和速度）
    return call_llm_stream(messages)

# 2. 超时控制
response = requests.post(
    url,
    json=payload,
    timeout=30,  # 30秒超时
    stream=True
)

# 3. 性能计时
import time
start_time = time.time()
# ... 执行操作
elapsed = time.time() - start_time
logger.info(f"操作耗时: {elapsed:.2f}秒")

# 4. 增量保存
def save_step_data():
    # 只保存必要字段，不保存完整聊天历史（除非需要）
    minimal_data = {
        "extracted_fields": extracted_fields,
        "is_confirmed": is_confirmed,
        "summary": summary
    }
    save_to_file(minimal_data)
```

---

## 9. 部署架构

### 9.1 部署拓扑图

```
                    ┌─────────────┐
                    │   用户设备   │
                    │  (浏览器)   │
                    └──────┬──────┘
                           │ HTTPS
                    ┌──────▼──────┐
                    │   域名CDN    │
                    │  (可选加速)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
┌───────▼────────┐                  ┌─────────▼────────┐
│  前端服务      │                  │   后端服务       │
│  Next.js       │                  │   FastAPI        │
│  Port: 3000    │<────REST API─────│   Port: 8504     │
│                │      SSE         │                  │
│ ┌────────────┐ │                  │ ┌──────────────┐ │
│ │Static Files│ │                  │ │ API Routes   │ │
│ │Components  │ │                  │ │ Services     │ │
│ │Assets      │ │                  │ │ Middleware   │ │
│ └────────────┘ │                  │ └──────────────┘ │
└────────────────┘                  └─────────┬────────┘
                                              │
                    ┌─────────────────────────┴─────────────────┐
                    │                                             │
          ┌─────────▼─────────┐                        ┌─────────▼─────────┐
          │  Supabase服务     │                        │  LLM API服务      │
          │  Port: 8000       │                        │  (OpenAI兼容)     │
          │                   │                        │                   │
          │ ┌───────────────┐ │                        │ ┌───────────────┐ │
          │ │ PostgreSQL    │ │                        │ │ 模型推理      │ │
          │ │ Database      │ │                        │ │ API Gateway   │ │
          │ └───────────────┘ │                        │ └───────────────┘ │
          │                   │                        │                   │
          │ ┌───────────────┐ │                        └───────────────────┘
          │ │ Object        │ │
          │ │ Storage       │ │
          │ └───────────────┘ │
          │                   │
          │ ┌───────────────┐ │
          │ │ Auth Service  │ │
          │ └───────────────┘ │
          └───────────────────┘
```

### 9.2 Docker部署方案

#### 后端Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 创建数据目录
RUN mkdir -p data/user_progress data/form_data data/uploads

# 暴露端口
EXPOSE 8504

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8504"]
```

#### 前端Dockerfile
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 构建
COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/out ./out
COPY --from=builder /app/package.json ./

# 使用serve提供静态文件
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "out", "-l", "3000"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8504:8504"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - ./backend/data:/app/data
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8504
    depends_on:
      - backend
    restart: unless-stopped

  supabase:
    # 使用官方Supabase镜像或自建
    image: supabase/postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - supabase_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  supabase_data:
```

### 9.3 Zeabur部署方案

#### 前置准备
1. 代码推送到Git仓库（GitHub/GitLab）
2. 注册Zeabur账号
3. 准备Supabase连接信息

#### 部署步骤

**1. 创建项目**
- 登录Zeabur Dashboard
- 创建新项目：`xiaop-learning-assistant`

**2. 部署后端**
- 添加服务 → 从Git导入
- 选择仓库和分支
- 根目录：`/backend`
- 构建命令：自动检测（Dockerfile或Python）
- 端口：8504
- 环境变量：
  ```
  SUPABASE_URL=http://10.1.20.75:8000
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  SECRET_KEY=xiaop-v3-secret-key
  STORAGE_MODE=supabase
  CORS_ORIGINS=https://your-frontend-domain.zeabur.app
  ```

**3. 部署前端**
- 添加服务 → 从Git导入
- 选择仓库和分支
- 根目录：`/frontend`
- 构建命令：`npm run build`
- 端口：3000
- 环境变量：
  ```
  NEXT_PUBLIC_API_URL=https://your-backend-domain.zeabur.app
  ```

**4. 配置域名（可选）**
- 后端：`api.xiaoluxue.com`
- 前端：`pbl-learning.xiaoluxue.com`

**5. 验证部署**
- 访问前端URL
- 测试注册/登录
- 测试聊天功能
- 查看部署日志

### 9.4 环境变量配置

#### 后端环境变量
```bash
# Supabase配置
SUPABASE_URL=http://10.1.20.75:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 存储模式
STORAGE_MODE=json  # 或 supabase

# JWT配置
SECRET_KEY=xiaop-v3-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7天

# 环境配置
ENVIRONMENT=production
DEBUG=false

# CORS配置
CORS_ORIGINS=https://pbl-learning.xiaoluxue.com,https://your-domain.com

# 文件上传
MAX_UPLOAD_SIZE=10485760  # 10MB
```

#### 前端环境变量
```bash
# API端点
NEXT_PUBLIC_API_URL=https://api.xiaoluxue.com
```

---

## 10. 数据流图

### 10.1 用户认证数据流

```
┌─────────┐
│ 用户输入 │
│ 用户名   │
│ 密码     │
└────┬────┘
     │
     ▼
┌──────────────────┐
│ 前端LoginForm    │
│ - 验证表单       │
│ - 准备请求       │
└────┬─────────────┘
     │
     │ POST /api/auth/login
     │ {username, password}
     ▼
┌──────────────────┐
│ 后端auth_router  │
│ - 接收请求       │
│ - 参数验证       │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ AuthService      │
│ - 加载用户数据   │
│ - 哈希密码验证   │
└────┬─────────────┘
     │
    是/否 密码正确？
     │
  ┌──┴──┐
  否     是
  │     │
  │     ▼
  │ ┌──────────────────┐
  │ │ 生成JWT Token    │
  │ │ - 用户ID         │
  │ │ - 过期时间       │
  │ └────┬─────────────┘
  │      │
  │      ▼
  │ ┌──────────────────┐
  │ │ 返回响应         │
  │ │ {token, user}    │
  │ └────┬─────────────┘
  │      │
  ▼      ▼
401错误  200成功
  │      │
  └──┬───┘
     │
     ▼
┌──────────────────┐
│ 前端处理响应     │
│ - 存储token      │
│ - 更新authStore  │
│ - 路由跳转       │
└──────────────────┘
```

### 10.2 聊天消息数据流

```
用户输入消息
     │
     ▼
ChatInput组件
     │
     │ 是否有图片？
     ├───────┬────────┐
     否       是       │
     │       │        │
     │       ▼        │
     │   上传图片     │
     │   POST /api/upload
     │       │        │
     │       ▼        │
     │   获取imageUrl │
     │       │        │
     └───────┴────────┘
             │
             ▼
    调用sendMessageStream()
             │
             │ POST /api/chat/message/stream
             │ {message, formId, chatHistory,
             │  extractedFields, imageUrl}
             ▼
    后端chat_router
             │
       ┌─────┴─────┐
       │ 权限检查   │
       │ - JWT验证  │
       │ - 阶段访问 │
       └─────┬─────┘
             │
             ▼
    获取配置和上下文
       ┌─────────────┐
       │ 表单配置     │
       │ 用户画像     │
       │ 前置总结     │
       └─────┬───────┘
             │
             ▼
    PipelineExecutor.execute_stream()
             │
      ┌──────┴──────┐
      │ Step 1:     │
      │ Extract     │
      ├─────────────┤
      │ LLM Service │
      │ call_llm_fast()
      │             │
      │ yield       │
      │ extraction  │
      └──────┬──────┘
             │
      ┌──────▼──────┐
      │ Step 2:     │
      │ Reply       │
      ├─────────────┤
      │ LLM Service │
      │ call_llm_stream()
      │             │
      │ yield       │
      │ content*N   │
      └──────┬──────┘
             │
             │ SSE Stream
             │ data: {...}\n\n
             ▼
    前端SSE Client
             │
       ┌─────┴─────┐
       │ 解析事件   │
       │ - thinking │
       │ - extraction
       │ - content  │
       │ - done     │
       └─────┬─────┘
             │
             ▼
    更新UI状态
       ┌─────────────┐
       │ chatStore    │
       │ - addMessage │
       │ - updateFields
       └─────┬───────┘
             │
             ▼
    React重渲染
       ┌─────────────┐
       │ MessageBubble│
       │ TaskProgress │
       └──────────────┘
```

### 10.3 阶段确认数据流

```
用户点击"确认完成"
        │
        ▼
前端chatStore
        │
        │ confirmCurrentStep()
        │ POST /api/chat/confirm-step
        │ {formId}
        ▼
后端chat_router
        │
   ┌────┴────┐
   │ 验证检查 │
   ├─────────┤
   │ JWT     │
   │ 字段完整 │
   │ 测试通过 │
   └────┬────┘
        │
        ▼
ProgressService
        │
   ┌────┴─────────────┐
   │ 1. 生成总结       │
   │    (LLM)         │
   └────┬─────────────┘
        │
   ┌────▼─────────────┐
   │ 2. 标记已确认     │
   │    is_confirmed   │
   │    = true        │
   └────┬─────────────┘
        │
   ┌────▼─────────────┐
   │ 3. 添加到已完成   │
   │    completed_steps│
   │    .append(formId)│
   └────┬─────────────┘
        │
   ┌────▼─────────────┐
   │ 4. 解锁下一阶段   │
   │    current_step   │
   │    += 1          │
   └────┬─────────────┘
        │
   ┌────▼─────────────┐
   │ 5. 保存到JSON/DB │
   └────┬─────────────┘
        │
   ┌────▼─────────────┐
   │ 6. 导出CSV       │
   └────┬─────────────┘
        │
        │ 返回响应
        │ {success, nextFormId}
        ▼
前端处理响应
        │
   ┌────┴─────────────┐
   │ 1. 更新状态       │
   │    currentStep++ │
   │    completedSteps│
   └────┬─────────────┘
        │
   ┌────▼─────────────┐
   │ 2. 切换阶段       │
   │    setCurrentForm│
   └────┬─────────────┘
        │
   ┌────▼─────────────┐
   │ 3. 清空聊天历史   │
   │    chatHistory=[]│
   └────┬─────────────┘
        │
   ┌────▼─────────────┐
   │ 4. 加载新阶段数据 │
   │    getStepData() │
   │    getPrevious   │
   │    Summaries()   │
   └────┬─────────────┘
        │
        ▼
显示新阶段欢迎消息
```

---

## 11. API接口文档

### 11.1 认证接口

#### POST /api/auth/register
注册新用户

**请求体**:
```json
{
  "username": "zhangsan",
  "password": "password123",
  "profile": {
    "grade": "高一",
    "gender": "女生",
    "math_score": "90-110分",
    "science_feeling": "基础尚可，偶尔吃力"
  }
}
```

**响应**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "username": "zhangsan",
    "profile": {...}
  }
}
```

#### POST /api/auth/login
用户登录

**请求体**:
```json
{
  "username": "zhangsan",
  "password": "password123"
}
```

**响应**: 同注册

#### GET /api/auth/me
获取当前用户信息

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "username": "zhangsan",
  "profile": {...}
}
```

### 11.2 聊天接口

#### GET /api/chat/forms
获取所有表单配置

**响应**:
```json
{
  "forms": [
    {
      "id": 1,
      "name": "Step 1: 明确和界定问题",
      "description": "导师Prompt...",
      "user_description": "欢迎语...",
      "fields": ["问题、困扰或需求", "工程问题陈述"],
      "extraction_prompt": "...",
      "age_prompts": {
        "elementary": "...",
        "middle_school": "...",
        "high_school": "..."
      },
      "test_enabled": true,
      "test_prompt": "...",
      "test_pass_pattern": "STEP1_OK"
    }
  ]
}
```

#### GET /api/chat/user-progress
获取用户整体进度

**请求头**: `Authorization: Bearer <token>`

**响应**:
```json
{
  "username": "zhangsan",
  "current_project_id": "abc123",
  "current_project_name": "我的项目",
  "current_step": 2,
  "completed_steps": [1]
}
```

#### POST /api/chat/message/stream
发送消息（SSE流式）

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "message": "我想设计一个降低教室噪音的装置",
  "form_id": 1,
  "chat_history": [...],
  "extracted_fields": {},
  "image_url": "http://server/uploads/image.jpg"  // 可选
}
```

**响应流** (text/event-stream):
```
data: {"type":"thinking","message":"正在思考..."}

data: {"type":"step_start","step_id":"extract","step_name":"字段提取"}

data: {"type":"extraction","newly_extracted":{"问题、困扰或需求":"教室噪音问题"}}

data: {"type":"step_done","step_id":"extract"}

data: {"type":"step_start","step_id":"reply","step_name":"生成回复"}

data: {"type":"content","content":"很"}

data: {"type":"content","content":"好"}

data: {"type":"content","content":"！"}

data: {"type":"step_done","step_id":"reply"}

data: {"type":"done","message":"很好！你关注到了教室噪音问题...","newly_extracted":{...}}

data: {"type":"timing","timings":{...}}
```

#### POST /api/chat/confirm-step
确认完成阶段

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "form_id": 1
}
```

**响应**:
```json
{
  "success": true,
  "message": "阶段已确认",
  "next_form_id": 2,
  "summary": "学生明确了教室噪音问题..."
}
```

#### POST /api/chat/start-test
开始关卡测试

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "form_id": 1
}
```

**响应**:
```json
{
  "success": true,
  "message": "接下来让我们做一个小测试，看看你是否真正理解了这个阶段的内容。准备好了吗？"
}
```

### 11.3 项目管理接口

#### GET /api/projects/list
获取项目列表

**请求头**: `Authorization: Bearer <token>`

**响应**:
```json
{
  "current_project_id": "abc123",
  "projects": [
    {
      "id": "abc123",
      "name": "我的项目",
      "current_step": 2,
      "completed_steps": [1],
      "created_at": "2025-01-01 10:00:00"
    }
  ]
}
```

#### POST /api/projects/create
创建新项目

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "name": "新项目"
}
```

**响应**:
```json
{
  "success": true,
  "project": {
    "id": "xyz789",
    "name": "新项目",
    "current_step": 1,
    "completed_steps": []
  }
}
```

### 11.4 管理后台接口

#### POST /api/admin/login
管理员登录

**请求体**:
```json
{
  "password": "admin_password"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功"
}
```

#### GET /api/admin/users
获取所有用户列表

**响应**:
```json
{
  "users": [
    {
      "username": "zhangsan",
      "profile": {...},
      "projects": [
        {
          "id": "abc123",
          "name": "我的项目",
          "current_step": 2,
          "step_data": {
            "1": {
              "extracted_fields": {...},
              "chat_history": [...],
              "test_state": {...}
            }
          }
        }
      ]
    }
  ]
}
```

#### PUT /api/admin/forms
更新表单配置

**请求体**:
```json
{
  "forms": [...]
}
```

**响应**:
```json
{
  "success": true,
  "message": "配置已更新"
}
```

---

## 12. 性能优化策略

### 12.1 前端性能优化

#### 代码分割和懒加载
```typescript
// 动态导入管理后台组件（按需加载）
const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

// 路由级代码分割（Next.js App Router自动）
// /chat 和 /admin 分别打包
```

#### 图片优化
```typescript
import Image from 'next/image';

<Image
  src="/avatar.png"
  width={40}
  height={40}
  alt="工小助"
  priority  // 首屏关键图片
  quality={85}
/>
```

#### React性能优化
```typescript
// 1. useMemo缓存计算结果
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}, [messages]);

// 2. useCallback缓存回调函数
const handleSend = useCallback((message: string) => {
  sendMessage(message);
}, [sendMessage]);

// 3. React.memo避免重渲染
const TaskProgress = React.memo(({ fields, extracted }) => {
  // ...
});
```

#### 状态更新优化
```typescript
// Zustand部分持久化
persist(
  (set, get) => ({
    // ... 状态
  }),
  {
    name: 'chat-storage',
    partialize: (state) => ({
      // 只持久化关键数据，不持久化大数据量的chatHistory
      currentFormId: state.currentFormId,
      currentStep: state.currentStep,
      stepProgress: state.stepProgress,
      // chatHistory: state.chatHistory  // 不持久化
    })
  }
)
```

### 12.2 后端性能优化

#### 模型选择策略
```python
# 快速任务使用便宜的快速模型
FAST_MODEL = "gpt-4o-mini"  # 或其他快速模型
FAST_MODEL_TIMEOUT = 15

# 生成任务使用标准模型
DEFAULT_MODEL = "gpt-4o"
DEFAULT_MODEL_TIMEOUT = 30

# 视觉任务使用视觉模型
VISION_MODEL = "gpt-4o"
VISION_MODEL_TIMEOUT = 60
```

#### 并发处理
```python
import asyncio

# 异步处理多个独立任务
async def load_user_data(username):
    progress, config, summaries = await asyncio.gather(
        get_user_progress(username),
        get_form_config(),
        get_previous_summaries(username)
    )
    return progress, config, summaries
```

#### 缓存策略
```python
from functools import lru_cache

# 缓存表单配置（不常变化）
@lru_cache(maxsize=1)
def get_form_config():
    return load_form_config()

# 定期清理缓存
def clear_form_config_cache():
    get_form_config.cache_clear()
```

#### 数据库查询优化
```python
# 批量查询减少往返
users = supabase.table('users')\
    .select('*, user_projects(*, project_step_data(*)))\
    .execute()

# 只查询需要的字段
user = supabase.table('users')\
    .select('username, grade, gender')\
    .eq('username', username)\
    .single()\
    .execute()

# 使用索引
# CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
# CREATE INDEX idx_step_data_project_uuid ON project_step_data(project_uuid);
```

#### 流式响应优化
```python
def generate_sse():
    """生成器函数，避免一次性加载大量数据到内存"""
    for chunk in llm_stream:
        # 立即yield，不缓冲
        yield f"data: {json.dumps(chunk)}\n\n"

# 禁用响应缓冲
return StreamingResponse(
    generate_sse(),
    headers={
        "X-Accel-Buffering": "no",  # Nginx
        "Cache-Control": "no-cache"
    }
)
```

### 12.3 数据库性能优化

#### 索引设计
```sql
-- 用户查询
CREATE INDEX idx_users_username ON users(username);

-- 项目查询
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_project_id ON user_projects(project_id);

-- 步骤数据查询
CREATE INDEX idx_step_data_project_uuid ON project_step_data(project_uuid);
CREATE INDEX idx_step_data_form_id ON project_step_data(form_id);

-- 复合索引
CREATE INDEX idx_user_projects_user_project ON user_projects(user_id, project_id);
```

#### JSONB优化
```sql
-- 为JSONB字段创建GIN索引
CREATE INDEX idx_step_data_extracted_fields
ON project_step_data USING gin(extracted_fields);

-- 高效查询JSONB
SELECT * FROM project_step_data
WHERE extracted_fields @> '{"问题、困扰或需求": "噪音"}';
```

#### 分页查询
```python
# 避免一次性加载所有数据
def get_chat_history(project_uuid, limit=50, offset=0):
    return supabase.table('project_step_data')\
        .select('chat_history')\
        .eq('project_uuid', project_uuid)\
        .range(offset, offset + limit - 1)\
        .execute()
```

### 12.4 网络性能优化

#### CDN加速
- 静态资源（JS/CSS/图片）通过CDN分发
- 使用地理位置就近的CDN节点
- 设置合理的缓存策略

#### HTTP/2
- 使用HTTP/2多路复用
- 减少TCP连接数
- 并行传输多个资源

#### 压缩
```python
# Gzip压缩响应
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

```nginx
# Nginx配置
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### 12.5 监控和日志

#### 性能监控
```python
import time

class PerformanceMiddleware:
    async def __call__(self, request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        logger.info(f"{request.method} {request.url.path} - {duration:.2f}s")
        response.headers["X-Process-Time"] = str(duration)

        return response
```

#### LLM调用监控
```python
def call_llm_with_timing(messages):
    timings = {}

    # HTTP连接时间
    start = time.time()
    response = requests.post(url, ...)
    timings['http_connect'] = time.time() - start

    # 首Token时间
    first_token_time = None
    start = time.time()

    for chunk in response.iter_lines():
        if first_token_time is None:
            first_token_time = time.time() - start
            timings['ttft'] = first_token_time

        # 处理chunk...

    timings['total'] = time.time() - start

    logger.info(f"LLM Timings: {timings}")
    return result, timings
```

---

## 总结

### 项目亮点

1. **现代化技术栈**: Next.js 16 + FastAPI + Supabase + TypeScript
2. **用户体验优秀**: 流式输出、流畅动画、响应式设计
3. **架构清晰**: 分层设计、职责明确、易于维护
4. **灵活可配置**: Pipeline编排、年龄适配、可视化管理
5. **性能优化**: 多层次优化策略，响应迅速
6. **部署友好**: Docker化、环境变量配置、多种部署方案

### 技术债务和改进方向

1. **完成Supabase迁移**: 从JSON文件全面切换到数据库
2. **测试覆盖**: 增加单元测试和集成测试
3. **错误监控**: 接入Sentry等错误追踪服务
4. **性能监控**: 接入APM（如New Relic）
5. **安全加固**:
   - SQL注入防护
   - XSS防护
   - CSRF Token
   - 速率限制
6. **国际化**: 支持多语言
7. **离线支持**: PWA + Service Worker
8. **实时协作**: WebSocket多用户同时编辑

---

**文档编写者**: Claude Sonnet 4.5
**审核建议**: 由项目架构师审核技术细节的准确性
