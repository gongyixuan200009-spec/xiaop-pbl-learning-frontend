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

  return response.json();
}

// ========== 认证API ==========
export interface UserProfile {
  grade: string;
  gender: string;
  math_score: string;
  science_feeling: string;
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

export interface SocraticQuestionConfig {
  id: number;
  question: string;
  answer_points: string;
}

export interface CustomPrompts {
  generation?: string;    // Prompt 1 - 问题生成
  guidance?: string;      // Prompt 2 - 引导对话
  evaluation?: string;    // Prompt 3 - 判断完成
}

export interface FormConfig {
  id: number;
  name: string;
  description: string;
  user_description: string;
  fields: string[];
  extraction_prompt: string;
  // Socratic mode fields
  type?: "traditional" | "socratic";
  teaching_content?: string;
  questions?: SocraticQuestionConfig[];
  custom_prompts?: CustomPrompts;
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
}

export interface StepData {
  extracted_fields: Record<string, string>;
  chat_history: ChatMessage[];
  is_confirmed: boolean;
  summary: string;
}

export interface PreviousSummary {
  form_id: number;
  summary: string;
  extracted_fields: Record<string, string>;
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
};

// ========== 管理API ==========
export interface AdminUserInfo {
  username: string;
  current_step: number;
  completed_steps: number[];
  profile?: UserProfile;
  step_data: Record<string, {
    form_id: number;
    extracted_fields: Record<string, string>;
    is_confirmed: boolean;
    summary: string;
  }>;
}

export interface AdminUserDetail {
  username: string;
  current_step: number;
  completed_steps: number[];
  step_data: Record<string, {
    form_id: number;
    extracted_fields: Record<string, string>;
    chat_history: ChatMessage[];
    is_confirmed: boolean;
    summary: string;
  }>;
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

  // 导出所有聊天记录
  exportAllChats: async () => {
    const response = await fetch(`${API_BASE}/api/admin/export-all-chats`);
    if (!response.ok) {
      throw new Error('导出失败');
    }
    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'all_chat_records.csv';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=(.+)/);
      if (match) {
        filename = match[1];
      }
    }
    // 下载文件
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // 生成苏格拉底问题
  generateQuestions: (teachingContent: string, customPrompt?: string) =>
    fetchAPI<{ success: boolean; questions: SocraticQuestionConfig[]; count: number }>(
      "/api/admin/generate-questions",
      {
        method: "POST",
        body: JSON.stringify({
          teaching_content: teachingContent,
          custom_prompt: customPrompt,
        }),
      }
    ),

  // 获取默认Prompt模板
  getDefaultPrompts: () =>
    fetchAPI<{ generation: string; guidance: string; evaluation: string }>(
      "/api/admin/default-prompts"
    ),
};

// ========== Prompt 预览 ==========
export interface PromptPreviewResponse {
  extraction_prompt: string;
  reply_system_prompt: string;
  reply_messages: Array<{ role: string; content: string }>;
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

export const previewAPI = {
  getPromptPreview: (formConfig: FormConfig, includePrevious: boolean = false) =>
    fetchAPI<PromptPreviewResponse>("/api/admin/prompt-preview", {
      method: "POST",
      body: JSON.stringify({
        form_config: formConfig,
        include_previous: includePrevious,
      }),
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

// ========== Socratic 苏格拉底教学 API ==========
export interface SocraticQuestion {
  id: number;
  question: string;
  answer_points: string;
}

export interface SocraticModule {
  id: string;
  name: string;
  description: string;
  teaching_content: string;
  questions: SocraticQuestion[];
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface ModuleListItem {
  id: string;
  name: string;
  description: string;
  question_count: number;
  status: string;
}

export interface QuestionStatus {
  completed: boolean;
  completed_at?: string;
  attempts: number;
}

export interface ModuleProgress {
  module_id: string;
  current_question_index: number;
  questions_completed: number[];
  questions_status: Record<string, QuestionStatus>;
  chat_history: ChatMessage[];
  is_completed: boolean;
  started_at?: string;
  updated_at?: string;
}

export interface SocraticStreamCallbacks {
  onThinking?: (message: string) => void;
  onContent?: (content: string) => void;
  onQuestionCompleted?: (questionId: number, nextQuestion?: SocraticQuestion) => void;
  onModuleCompleted?: (message: string) => void;
  onDone?: (fullReply: string) => void;
  onError?: (error: Error) => void;
}

export const socraticAPI = {
  // 获取所有模块列表
  getModules: (token: string) =>
    fetchAPI<ModuleListItem[]>("/api/socratic/modules", { token }),

  // 获取模块详情
  getModule: (token: string, moduleId: string) =>
    fetchAPI<SocraticModule>(`/api/socratic/module/${moduleId}`, { token }),

  // 创建新模块
  createModule: (token: string, data: { teaching_content: string; name: string; description?: string }) =>
    fetchAPI<{ module_id: string; questions: SocraticQuestion[]; success: boolean; message: string }>(
      "/api/socratic/module",
      { method: "POST", body: JSON.stringify(data), token }
    ),

  // 获取用户所有进度
  getUserProgress: (token: string) =>
    fetchAPI<{ username: string; module_progress: Record<string, ModuleProgress> }>(
      "/api/socratic/user-progress",
      { token }
    ),

  // 获取用户某模块进度
  getModuleProgress: (token: string, moduleId: string) =>
    fetchAPI<{ success: boolean; progress?: ModuleProgress; module?: SocraticModule }>(
      `/api/socratic/module-progress/${moduleId}`,
      { token }
    ),

  // 开始学习模块
  startModule: (token: string, moduleId: string) =>
    fetchAPI<{ success: boolean; module?: SocraticModule; progress?: ModuleProgress; welcome_message: string }>(
      `/api/socratic/start-module/${moduleId}`,
      { method: "POST", token }
    ),

  // 重置模块进度
  resetModule: (token: string, moduleId: string) =>
    fetchAPI<{ success: boolean; message: string }>(
      `/api/socratic/reset-module/${moduleId}`,
      { method: "POST", token }
    ),

  // 发送消息（流式）
  sendMessageStream: async (
    token: string,
    moduleId: string,
    message: string,
    chatHistory: ChatMessage[],
    callbacks: SocraticStreamCallbacks
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/socratic/message/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        module_id: moduleId,
        message,
        chat_history: chatHistory,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "请求失败" }));
      callbacks.onError?.(new Error(error.detail || "请求失败"));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError?.(new Error("无法读取响应流"));
      return;
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
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              switch (event.type) {
                case "thinking":
                  callbacks.onThinking?.(event.message || "思考中...");
                  break;
                case "content":
                  callbacks.onContent?.(event.content || "");
                  break;
                case "question_completed":
                  callbacks.onQuestionCompleted?.(event.question_id, event.next_question);
                  break;
                case "module_completed":
                  callbacks.onModuleCompleted?.(event.message || "恭喜完成学习!");
                  break;
                case "done":
                  callbacks.onDone?.(event.full_reply || "");
                  break;
                case "error":
                  callbacks.onError?.(new Error(event.message || "发生错误"));
                  break;
              }
            } catch (e) {
              console.error("解析SSE事件失败:", e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
