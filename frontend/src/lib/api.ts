const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "请求失败" }));
      // 处理 422 错误 - detail 可能是数组
      let errorMsg = "请求失败";
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          // FastAPI 422 验证错误返回数组格式
          errorMsg = error.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
        } else if (typeof error.detail === 'string') {
          errorMsg = error.detail;
        } else {
          errorMsg = JSON.stringify(error.detail);
        }
      }
      throw new Error(errorMsg);
    }

    const text = await response.text();
    if (!text) {
      throw new Error("服务器返回空响应");
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("[fetchAPI] JSON 解析失败:", parseError, "响应文本:", text.substring(0, 500));
      throw new Error("服务器响应格式错误");
    }
  } catch (error: any) {
    // 捕获网络错误和其他异常
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("网络连接失败，请检查网络或服务器状态");
    }
    throw error;
  }
}

// ========== 认证API ==========
export interface UserProfile {
  grade: string;
  gender: string;
  math_score: string;
  science_feeling: string;
  age_group: string;  // 年龄段: elementary/middle_school/high_school
}

export interface User {
  username: string;
  profile: UserProfile;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authAPI = {
  login: (username: string, password: string) =>
    fetchAPI<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, profile: UserProfile) =>
    fetchAPI<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, profile }),
    }),

  getMe: (token: string) =>
    fetchAPI<User>("/api/auth/me", { token }),
};

// ========== 聊天API ==========
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image_url?: string;  // 图片URL
  timestamp?: string;
}

export interface FormConfig {
  id: number;
  name: string;
  description: string;
  user_description: string;
  fields: string[];
  extraction_prompt: string;
  age_prompts: {
    elementary?: string;
    middle_school?: string;
    high_school?: string;
    [key: string]: string | undefined;
  };  // 不同年龄段的prompt: elementary/middle_school/high_school
  // 测试相关
  test_enabled: boolean;
  test_prompt: string;
  test_pass_pattern: string;
}

export interface ChatResponse {
  reply: string;
  extracted_fields: Record<string, string>;
  is_complete: boolean;
  newly_extracted: string[];
  needs_confirmation: boolean;
}

export interface StepConfirmResponse {
  success: boolean;
  summary: string;
  next_form_id: number | null;
  message: string;
}

export interface UserProgress {
  current_step: number;
  completed_steps: number[];
  step_data: Record<number, {
    extracted_fields: Record<string, string>;
    is_confirmed: boolean;
    summary: string;
  }>;
  current_project_id?: string;
  current_project_name?: string;
}

export interface StepData {
  extracted_fields: Record<string, string>;
  chat_history: ChatMessage[];
  is_confirmed: boolean;
  summary: string;
  // 测试相关
  is_in_test?: boolean;
  test_passed?: boolean;
  test_chat_history?: ChatMessage[];
  test_credential?: string;
}

export interface PreviousSummary {
  form_id: number;
  summary: string;
  extracted_fields: Record<string, string>;
}

// ========== 测试阶段相关 ==========
export interface StartTestResponse {
  success: boolean;
  test_enabled: boolean;
  test_prompt: string;
  message: string;
}

export interface TestStreamDoneEvent {
  type: "done";
  full_reply: string;
  is_passed: boolean;
  pass_credential: string;
}

export interface TestStreamCallbacks {
  onThinking?: (message: string) => void;
  onContent?: (content: string) => void;
  onDone?: (data: { full_reply: string; is_passed: boolean; pass_credential: string }) => void;
  onError?: (error: Error) => void;
}

// ========== 流式响应类型 ==========
export interface StreamThinkingEvent {
  type: "thinking";
  message: string;
  has_image?: boolean;  // 是否包含图片
}

export interface StreamExtractionEvent {
  type: "extraction";
  extracted_fields: Record<string, string>;
  newly_extracted: string[];
  is_complete: boolean;
  needs_confirmation: boolean;
}

export interface StreamContentEvent {
  type: "content";
  content: string;
}

export interface StreamDoneEvent {
  type: "done";
  full_reply: string;
}

export interface StreamTimingEvent {
  type: "timing";
  preprocess_ms: number;
  thinking_sent_ms: number;
  extraction_ms: number;
  first_token_ms: number | null;
  total_reply_ms: number;
  token_count: number;
  total_ms: number;
}

export type StreamEvent = StreamThinkingEvent | StreamExtractionEvent | StreamContentEvent | StreamDoneEvent | StreamTimingEvent;

// ========== 流式消息回调 ==========
export interface StreamCallbacks {
  onThinking?: (message: string) => void;
  onExtraction?: (data: StreamExtractionEvent) => void;
  onContent?: (content: string) => void;
  onDone?: (fullReply: string) => void;
  onTiming?: (timing: StreamTimingEvent) => void;
  onError?: (error: Error) => void;
}

export const chatAPI = {
  getForms: () =>
    fetchAPI<FormConfig[]>("/api/chat/forms"),

  getForm: (formId: number) =>
    fetchAPI<FormConfig>(`/api/chat/form/${formId}`),

  getUserProgress: (token: string) =>
    fetchAPI<UserProgress>("/api/chat/user-progress", { token }),

  getStepData: (token: string, formId: number) =>
    fetchAPI<StepData>(`/api/chat/step-data/${formId}`, { token }),

  getPreviousSummaries: (token: string, formId: number) =>
    fetchAPI<{ summaries: PreviousSummary[] }>(`/api/chat/previous-summaries/${formId}`, { token }),

  // 非流式消息（保留兼容）
  sendMessage: (
    token: string,
    message: string,
    formId: number,
    chatHistory: ChatMessage[],
    extractedFields: Record<string, string>,
    imageUrl?: string
  ) =>
    fetchAPI<ChatResponse>("/api/chat/message", {
      method: "POST",
      token,
      body: JSON.stringify({
        message,
        form_id: formId,
        chat_history: chatHistory,
        extracted_fields: extractedFields,
        image_url: imageUrl,
      }),
    }),

  // 流式消息
  sendMessageStream: async (
    token: string,
    message: string,
    formId: number,
    chatHistory: ChatMessage[],
    extractedFields: Record<string, string>,
    callbacks: StreamCallbacks,
    imageUrl?: string  // 图片URL（可选）
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/chat/message/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        form_id: formId,
        chat_history: chatHistory,
        extracted_fields: extractedFields,
        image_url: imageUrl,  // 添加图片URL
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "请求失败" }));
      // 处理 422 错误 - detail 可能是数组
      let errorMsg = "请求失败";
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          // FastAPI 422 验证错误返回数组格式
          errorMsg = error.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
        } else if (typeof error.detail === 'string') {
          errorMsg = error.detail;
        } else {
          errorMsg = JSON.stringify(error.detail);
        }
      }
      throw new Error(errorMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const event = JSON.parse(data);

                switch (event.type) {
                  case "thinking":
                    callbacks.onThinking?.(event.message);
                    break;
                  case "extraction":
                    callbacks.onExtraction?.(event);
                    break;
                  case "content":
                    // 确保 content 是字符串
                    const contentStr = typeof event.content === 'string' ? event.content : String(event.content || '');
                    callbacks.onContent?.(contentStr);
                    break;
                  case "done":
                    // 确保 full_reply 是字符串
                    const replyStr = typeof event.full_reply === 'string' ? event.full_reply : String(event.full_reply || '');
                    callbacks.onDone?.(replyStr);
                    break;
                  case "timing":
                    // 打印计时信息到控制台
                    console.log(
                      "%c[TIMING]",
                      "color: #0071e3; font-weight: bold",
                      `预处理: ${event.preprocess_ms}ms`,
                      `| 字段提取: ${event.extraction_ms}ms`,
                      `| 首Token: ${event.first_token_ms}ms`,
                      `| 回复生成: ${event.total_reply_ms}ms`,
                      `| Token数: ${event.token_count}`,
                      `| 总计: ${event.total_ms}ms`
                    );
                    callbacks.onTiming?.(event);
                    break;
                }
              } catch (e) {
                console.error("解析SSE数据失败:", e, data);
              }
            }
          }
        }
      }
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      reader.releaseLock();
    }
  },

  confirmStep: (token: string, formId: number) =>
    fetchAPI<StepConfirmResponse>("/api/chat/confirm-step", {
      method: "POST",
      token,
      body: JSON.stringify({ form_id: formId }),
    }),

  // 开始测试
  startTest: (token: string, formId: number) =>
    fetchAPI<StartTestResponse>("/api/chat/start-test", {
      method: "POST",
      token,
      body: JSON.stringify({ form_id: formId }),
    }),

  // 测试消息流式
  sendTestMessageStream: async (
    token: string,
    message: string,
    formId: number,
    testChatHistory: ChatMessage[],
    callbacks: TestStreamCallbacks,
    imageUrl?: string
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/chat/test-message/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        form_id: formId,
        test_chat_history: testChatHistory,
        image_url: imageUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "请求失败" }));
      let errorMsg = "请求失败";
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          errorMsg = error.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
        } else if (typeof error.detail === 'string') {
          errorMsg = error.detail;
        } else {
          errorMsg = JSON.stringify(error.detail);
        }
      }
      throw new Error(errorMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const event = JSON.parse(data);

                switch (event.type) {
                  case "thinking":
                    callbacks.onThinking?.(event.message);
                    break;
                  case "content":
                    const contentStr = typeof event.content === 'string' ? event.content : String(event.content || '');
                    callbacks.onContent?.(contentStr);
                    break;
                  case "done":
                    callbacks.onDone?.({
                      full_reply: typeof event.full_reply === 'string' ? event.full_reply : String(event.full_reply || ''),
                      is_passed: event.is_passed || false,
                      pass_credential: event.pass_credential || '',
                    });
                    break;
                }
              } catch (e) {
                console.error("解析测试SSE数据失败:", e, data);
              }
            }
          }
        }
      }
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      reader.releaseLock();
    }
  },
};

// ========== 管理API ==========
export interface AdminUserProject {
  id: string;
  name: string;
  current_step: number;
  completed_steps: number[];
  is_current: boolean;
}

export interface AdminUserInfo {
  username: string;
  projects: AdminUserProject[];
  current_project_id: string;
  profile?: UserProfile;
}

export interface AdminProjectDetail {
  id: string;
  name: string;
  current_step: number;
  completed_steps: number[];
  step_data: Record<string, {
    form_id: number;
    extracted_fields: Record<string, string>;
    chat_history: ChatMessage[];
    is_confirmed: boolean;
    summary: string;
    test_state?: {
      is_in_test: boolean;
      test_passed: boolean;
      test_chat_history: ChatMessage[];
      test_credential: string;
      updated_at?: string;
    };
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUserDetail {
  username: string;
  current_project_id: string;
  projects: Record<string, AdminProjectDetail>;
}

export const adminAPI = {
  login: (password: string) =>
    fetchAPI<{ success: boolean }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  getForms: () =>
    fetchAPI<{ forms: FormConfig[] }>("/api/admin/forms"),

  updateForms: (forms: FormConfig[]) =>
    fetchAPI<{ success: boolean }>("/api/admin/forms", {
      method: "PUT",
      body: JSON.stringify({ forms }),
    }),

  getDataFiles: () =>
    fetchAPI<Array<{ name: string; size: number; modified: number }>>("/api/admin/data"),

  getUsers: () =>
    fetchAPI<{ users: AdminUserInfo[] }>("/api/admin/users"),

  getUserDetail: (username: string) =>
    fetchAPI<AdminUserDetail>(`/api/admin/users/${username}`),
};

// ========== Prompt 预览 ==========
// 双Agent模式响应
export interface DualAgentPromptPreviewResponse {
  mode: "dual_agent";
  mode_description: string;
  extraction_prompt: string;
  reply_system_prompt: string;
  reply_messages: Array<{ role: string; content: string }>;
  age_adaptation_rules: string;
  sample_data: {
    chat_history: ChatMessage[];
    user_profile: Record<string, string>;
    extracted_fields: Record<string, string>;
    previous_summaries: Array<{
      form_id: number;
      summary: string;
      extracted_fields: Record<string, string>;
    }>;
  };
}

// 单Agent模式响应
export interface SingleAgentPromptPreviewResponse {
  mode: "single_agent";
  mode_description: string;
  system_prompt: string;
  messages: Array<{ role: string; content: string }>;
  output_format_example: string;
  age_adaptation_rules: string;
  sample_data: {
    chat_history: ChatMessage[];
    user_profile: Record<string, string>;
    extracted_fields: Record<string, string>;
    previous_summaries: Array<{
      form_id: number;
      summary: string;
      extracted_fields: Record<string, string>;
    }>;
  };
}

// 联合类型
export type PromptPreviewResponse = DualAgentPromptPreviewResponse | SingleAgentPromptPreviewResponse;

// 年龄段适配规则
export interface AgeAdaptationRule {
  language_style: string;
  vocabulary_level: string;
  sentence_structure: string;
  examples: string;
  encouragement: string;
  explanation_depth: string;
  prompt_rules: string;
}

export interface AgeAdaptationRulesResponse {
  default_rules: Record<string, AgeAdaptationRule>;
  custom_rules: Record<string, Partial<AgeAdaptationRule>>;
  merged_rules: Record<string, AgeAdaptationRule>;
  description: string;
  grades: Record<string, string[]>;
}

export const previewAPI = {
  getPromptPreview: (
    formConfig: FormConfig,
    includePrevious: boolean = false,
    mode: "single_agent" | "dual_agent" = "dual_agent",
    userProfile?: Record<string, string>
  ) =>
    fetchAPI<PromptPreviewResponse>("/api/admin/prompt-preview", {
      method: "POST",
      body: JSON.stringify({
        form_config: formConfig,
        include_previous: includePrevious,
        mode: mode,
        user_profile: userProfile,
      }),
    }),

  getAgeAdaptationRules: () =>
    fetchAPI<AgeAdaptationRulesResponse>("/api/admin/age-adaptation-rules"),

  updateAgeAdaptationRules: (customRules: Record<string, Partial<AgeAdaptationRule>>) =>
    fetchAPI<{ success: boolean; message: string; custom_rules: Record<string, Partial<AgeAdaptationRule>> }>(
      "/api/admin/age-adaptation-rules",
      {
        method: "PUT",
        body: JSON.stringify({ custom_rules: customRules }),
      }
    ),

  resetAgeAdaptationRules: () =>
    fetchAPI<{ success: boolean; message: string }>("/api/admin/age-adaptation-rules", {
      method: "DELETE",
    }),
};

// ========== 聊天模式API ==========
export interface ChatModeInfo {
  value: string;
  label: string;
  description: string;
}

export interface ChatModeResponse {
  chat_mode: string;
  available_modes: ChatModeInfo[];
}

export const settingsAPI = {
  getChatMode: () =>
    fetchAPI<ChatModeResponse>("/api/admin/chat-mode"),

  updateChatMode: (chatMode: string) =>
    fetchAPI<{ success: boolean; chat_mode: string; message: string }>("/api/admin/chat-mode", {
      method: "PUT",
      body: JSON.stringify({ chat_mode: chatMode }),
    }),
};

// ========== Pipeline API ==========
export interface PipelineStep {
  id: string;
  name: string;
  type: "extract" | "reply" | "extract_and_reply";
  model: "fast" | "default" | "vision";
  prompt_template?: string;
  context_from: string[];
}

export interface PipelineOutput {
  table_from: string[];
  reply_from: string[];
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  output: PipelineOutput;
  is_preset?: boolean;
}

export interface StepTypeInfo {
  value: string;
  label: string;
  description: string;
}

export interface ModelTypeInfo {
  value: string;
  label: string;
  description: string;
}

export interface PipelinesResponse {
  pipelines: Pipeline[];
  active_pipeline: string;
  step_types: StepTypeInfo[];
  model_types: ModelTypeInfo[];
}

export interface ActivePipelineResponse {
  active_pipeline: string;
  pipeline: Pipeline | null;
}

export const pipelineAPI = {
  // 获取所有Pipeline
  getPipelines: () =>
    fetchAPI<PipelinesResponse>("/api/admin/pipelines"),

  // 获取单个Pipeline详情
  getPipeline: (pipelineId: string) =>
    fetchAPI<Pipeline & { is_preset: boolean }>(`/api/admin/pipelines/${pipelineId}`),

  // 创建自定义Pipeline
  createPipeline: (pipeline: Pipeline) =>
    fetchAPI<{ success: boolean; message: string; pipeline: Pipeline }>("/api/admin/pipelines", {
      method: "POST",
      body: JSON.stringify(pipeline),
    }),

  // 更新Pipeline
  updatePipeline: (pipelineId: string, pipeline: Pipeline) =>
    fetchAPI<{ success: boolean; message: string; pipeline: Pipeline }>(`/api/admin/pipelines/${pipelineId}`, {
      method: "PUT",
      body: JSON.stringify(pipeline),
    }),

  // 删除Pipeline
  deletePipeline: (pipelineId: string) =>
    fetchAPI<{ success: boolean; message: string }>(`/api/admin/pipelines/${pipelineId}`, {
      method: "DELETE",
    }),

  // 获取当前激活的Pipeline
  getActivePipeline: () =>
    fetchAPI<ActivePipelineResponse>("/api/admin/pipelines/active"),

  // 设置激活的Pipeline
  setActivePipeline: (pipelineId: string) =>
    fetchAPI<{ success: boolean; message: string; active_pipeline: string }>("/api/admin/pipelines/active", {
      method: "PUT",
      body: JSON.stringify({ pipeline_id: pipelineId }),
    }),

  // 获取所有步骤类型的默认 Prompt
  getDefaultPrompts: () =>
    fetchAPI<{ success: boolean; prompts: Record<string, string> }>("/api/admin/pipelines/default-prompts"),

  // 获取指定步骤类型的默认 Prompt
  getDefaultPrompt: (stepType: string) =>
    fetchAPI<{ success: boolean; step_type: string; prompt: string }>(`/api/admin/pipelines/default-prompts/${stepType}`),

  // 复制 Pipeline 并填充完整的 Prompt 模板
  copyPipelineWithPrompts: async (sourceId: string, newId?: string, newName?: string) => {
    console.log("[pipelineAPI.copyPipelineWithPrompts] 请求参数:", { sourceId, newId, newName });
    console.log("[pipelineAPI.copyPipelineWithPrompts] API_BASE:", API_BASE);

    try {
      const result = await fetchAPI<{ success: boolean; message: string; pipeline: Pipeline }>("/api/admin/pipelines/copy-with-prompts", {
        method: "POST",
        body: JSON.stringify({ source_id: sourceId, new_id: newId, new_name: newName }),
      });

      console.log("[pipelineAPI.copyPipelineWithPrompts] 响应成功:", {
        success: result.success,
        message: result.message,
        hasePipeline: !!result.pipeline,
        pipelineId: result.pipeline?.id,
        stepsCount: result.pipeline?.steps?.length
      });

      return result;
    } catch (error: any) {
      console.error("[pipelineAPI.copyPipelineWithPrompts] 请求失败:", error);
      console.error("[pipelineAPI.copyPipelineWithPrompts] 错误类型:", error?.constructor?.name);
      console.error("[pipelineAPI.copyPipelineWithPrompts] 错误消息:", error?.message);
      console.error("[pipelineAPI.copyPipelineWithPrompts] 错误堆栈:", error?.stack);
      throw error;
    }
  },
};

// ========== Prompt 修改历史 API ==========
export interface PromptHistoryRecord {
  id: number;
  timestamp: string;
  type: "form_config" | "age_adaptation" | "extraction_rules";
  identifier: string;
  content: Record<string, any>;
  description: string;
  operator: string;
}

export interface PromptHistoryResponse {
  records: PromptHistoryRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface PromptHistoryType {
  value: string;
  label: string;
}

export const promptHistoryAPI = {
  // 获取历史记录列表
  getHistory: (
    recordType?: string,
    identifier?: string,
    limit: number = 50,
    offset: number = 0
  ) => {
    const params = new URLSearchParams();
    if (recordType) params.append("record_type", recordType);
    if (identifier) params.append("identifier", identifier);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    return fetchAPI<PromptHistoryResponse>(`/api/admin/prompt-history?${params.toString()}`);
  },

  // 获取历史记录类型
  getTypes: () =>
    fetchAPI<{ types: PromptHistoryType[] }>("/api/admin/prompt-history/types"),

  // 获取单条历史记录详情
  getRecord: (recordId: number) =>
    fetchAPI<PromptHistoryRecord>(`/api/admin/prompt-history/${recordId}`),

  // 清理历史记录
  clearHistory: (beforeDate?: string) =>
    fetchAPI<{ success: boolean; message: string }>("/api/admin/prompt-history", {
      method: "DELETE",
      body: JSON.stringify({ before_date: beforeDate }),
    }),
};

// ========== 项目管理 API ==========
export interface Project {
  id: string;
  name: string;
  current_step: number;
  completed_steps: number[];
  created_at?: string;
  updated_at?: string;
  is_current: boolean;
}

export interface ProjectListResponse {
  projects: Project[];
  current_project_id: string;
}

export interface CreateProjectResponse {
  success: boolean;
  project: Project;
  message: string;
}

export const projectAPI = {
  // 获取项目列表
  listProjects: (token: string) =>
    fetchAPI<ProjectListResponse>("/api/projects/list", { token }),

  // 创建新项目
  createProject: (token: string, name: string) =>
    fetchAPI<CreateProjectResponse>("/api/projects/create", {
      method: "POST",
      token,
      body: JSON.stringify({ name }),
    }),

  // 切换项目
  switchProject: (token: string, projectId: string) =>
    fetchAPI<{ success: boolean; message: string }>("/api/projects/switch", {
      method: "POST",
      token,
      body: JSON.stringify({ project_id: projectId }),
    }),

  // 重命名项目
  renameProject: (token: string, projectId: string, name: string) =>
    fetchAPI<{ success: boolean; message: string }>("/api/projects/rename", {
      method: "POST",
      token,
      body: JSON.stringify({ project_id: projectId, name }),
    }),

  // 删除项目
  deleteProject: (token: string, projectId: string) =>
    fetchAPI<{ success: boolean; message: string }>("/api/projects/delete", {
      method: "POST",
      token,
      body: JSON.stringify({ project_id: projectId }),
    }),
};
