import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, FormConfig, PreviousSummary } from "@/lib/api";

interface StepProgress {
  extractedFields: Record<string, string>;
  chatHistory: ChatMessage[];
  isConfirmed: boolean;
  summary: string;
  // 测试阶段相关
  isInTest: boolean;
  testPassed: boolean;
  testChatHistory: ChatMessage[];
  testCredential: string;
}

interface ChatState {
  currentFormId: number;
  forms: FormConfig[];
  chatHistory: ChatMessage[];
  extractedFields: Record<string, string>;
  isLoading: boolean;

  // 新增：阶段管理
  currentStep: number;  // 当前可访问的最高阶段
  completedSteps: number[];  // 已完成并确认的阶段
  stepProgress: Record<number, StepProgress>;  // 每个阶段的进度
  previousSummaries: PreviousSummary[];  // 前面阶段的总结
  needsConfirmation: boolean;  // 是否需要确认

  // 新增：测试阶段相关
  isInTest: boolean;  // 是否在测试阶段
  testPassed: boolean;  // 测试是否通过
  testChatHistory: ChatMessage[];  // 测试对话历史
  testCredential: string;  // 测试通过凭证

  setForms: (forms: FormConfig[]) => void;
  setCurrentForm: (formId: number) => void;
  addMessage: (message: ChatMessage) => void;
  setExtractedFields: (fields: Record<string, string>) => void;
  updateExtractedFields: (fields: Record<string, string>) => void;
  setLoading: (loading: boolean) => void;
  resetChat: () => void;

  // 新增：阶段管理方法
  setUserProgress: (currentStep: number, completedSteps: number[], stepData: Record<number, any>) => void;
  setStepData: (formId: number, data: StepProgress) => void;
  setPreviousSummaries: (summaries: PreviousSummary[]) => void;
  setNeedsConfirmation: (needs: boolean) => void;
  confirmCurrentStep: (summary: string, nextFormId: number | null) => void;
  canAccessStep: (formId: number) => boolean;
  isStepConfirmed: (formId: number) => boolean;
  loadStepProgress: (formId: number) => void;

  // 新增：测试阶段方法
  startTest: () => void;  // 开始测试
  addTestMessage: (message: ChatMessage) => void;  // 添加测试消息
  setTestPassed: (passed: boolean, credential: string) => void;  // 设置测试通过
  resetTest: () => void;  // 重置测试状态
  setTestState: (isInTest: boolean, testPassed: boolean, testChatHistory: ChatMessage[], testCredential: string) => void;

  // 项目切换相关
  resetAllProgress: () => void;  // 重置所有进度（切换项目时使用）

  // 硬性容错：清理无效消息
  cleanInvalidMessages: () => void;

  getCurrentForm: () => FormConfig | undefined;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentFormId: 1,
      forms: [],
      chatHistory: [],
      extractedFields: {},
      isLoading: false,
      currentStep: 1,
      completedSteps: [],
      stepProgress: {},
      previousSummaries: [],
      needsConfirmation: false,
      // 测试阶段初始状态
      isInTest: false,
      testPassed: false,
      testChatHistory: [],
      testCredential: "",

      setForms: (forms) => set({ forms }),

      setCurrentForm: (formId) => {
        const state = get();
        // 检查是否可以访问该阶段
        if (!state.canAccessStep(formId)) {
          return; // 不允许访问
        }

        // 加载该阶段的进度
        const progress = state.stepProgress[formId];
        set({
          currentFormId: formId,
          chatHistory: progress?.chatHistory || [],
          extractedFields: progress?.extractedFields || {},
          needsConfirmation: false,
          // 加载测试状态
          isInTest: progress?.isInTest || false,
          testPassed: progress?.testPassed || false,
          testChatHistory: progress?.testChatHistory || [],
          testCredential: progress?.testCredential || "",
        });
      },

      addMessage: (message) => set((state) => {
        const newHistory = [...state.chatHistory, message];
        // 同时更新stepProgress
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          extractedFields: state.extractedFields,
          chatHistory: newHistory,
          isConfirmed: newStepProgress[state.currentFormId]?.isConfirmed || false,
          summary: newStepProgress[state.currentFormId]?.summary || "",
          isInTest: newStepProgress[state.currentFormId]?.isInTest || false,
          testPassed: newStepProgress[state.currentFormId]?.testPassed || false,
          testChatHistory: newStepProgress[state.currentFormId]?.testChatHistory || [],
          testCredential: newStepProgress[state.currentFormId]?.testCredential || "",
        };
        return {
          chatHistory: newHistory,
          stepProgress: newStepProgress,
        };
      }),

      setExtractedFields: (fields) => set((state) => {
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          extractedFields: fields,
          chatHistory: state.chatHistory,
          isConfirmed: newStepProgress[state.currentFormId]?.isConfirmed || false,
          summary: newStepProgress[state.currentFormId]?.summary || "",
          isInTest: newStepProgress[state.currentFormId]?.isInTest || false,
          testPassed: newStepProgress[state.currentFormId]?.testPassed || false,
          testChatHistory: newStepProgress[state.currentFormId]?.testChatHistory || [],
          testCredential: newStepProgress[state.currentFormId]?.testCredential || "",
        };
        return {
          extractedFields: fields,
          stepProgress: newStepProgress,
        };
      }),

      updateExtractedFields: (fields) => set((state) => {
        const newFields = { ...state.extractedFields, ...fields };
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          extractedFields: newFields,
          chatHistory: state.chatHistory,
          isConfirmed: newStepProgress[state.currentFormId]?.isConfirmed || false,
          summary: newStepProgress[state.currentFormId]?.summary || "",
          isInTest: newStepProgress[state.currentFormId]?.isInTest || false,
          testPassed: newStepProgress[state.currentFormId]?.testPassed || false,
          testChatHistory: newStepProgress[state.currentFormId]?.testChatHistory || [],
          testCredential: newStepProgress[state.currentFormId]?.testCredential || "",
        };
        return {
          extractedFields: newFields,
          stepProgress: newStepProgress,
        };
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      resetChat: () => set({
        chatHistory: [],
        extractedFields: {},
        needsConfirmation: false,
      }),

      setUserProgress: (currentStep, completedSteps, stepData) => {
        const stepProgress: Record<number, StepProgress> = {};
        for (const [formId, data] of Object.entries(stepData)) {
          // 处理后端返回的 snake_case 和前端的 camelCase
          stepProgress[Number(formId)] = {
            extractedFields: data.extracted_fields || data.extractedFields || {},
            chatHistory: data.chat_history || data.chatHistory || [],
            isConfirmed: data.is_confirmed ?? data.isConfirmed ?? false,
            summary: data.summary || "",
            // 测试相关状态
            isInTest: data.is_in_test ?? data.isInTest ?? false,
            testPassed: data.test_passed ?? data.testPassed ?? false,
            testChatHistory: data.test_chat_history || data.testChatHistory || [],
            testCredential: data.test_credential || data.testCredential || "",
          };
        }
        set({ currentStep, completedSteps, stepProgress });
      },

      setStepData: (formId, data) => set((state) => {
        // 处理后端返回的 snake_case 和前端的 camelCase
        const normalizedData: StepProgress = {
          extractedFields: (data as any).extracted_fields || data.extractedFields || {},
          chatHistory: (data as any).chat_history || data.chatHistory || [],
          isConfirmed: (data as any).is_confirmed ?? data.isConfirmed ?? false,
          summary: data.summary || "",
          // 测试相关状态
          isInTest: (data as any).is_in_test ?? data.isInTest ?? false,
          testPassed: (data as any).test_passed ?? data.testPassed ?? false,
          testChatHistory: (data as any).test_chat_history || data.testChatHistory || [],
          testCredential: (data as any).test_credential || data.testCredential || "",
        };

        return {
          stepProgress: {
            ...state.stepProgress,
            [formId]: normalizedData,
          },
          // 如果是当前阶段，同步更新
          ...(formId === state.currentFormId ? {
            chatHistory: normalizedData.chatHistory,
            extractedFields: normalizedData.extractedFields,
            isInTest: normalizedData.isInTest,
            testPassed: normalizedData.testPassed,
            testChatHistory: normalizedData.testChatHistory,
            testCredential: normalizedData.testCredential,
          } : {}),
        };
      }),

      setPreviousSummaries: (summaries) => set({ previousSummaries: summaries }),

      setNeedsConfirmation: (needs) => set({ needsConfirmation: needs }),

      confirmCurrentStep: (summary, nextFormId) => set((state) => {
        const newCompletedSteps = [...state.completedSteps];
        if (!newCompletedSteps.includes(state.currentFormId)) {
          newCompletedSteps.push(state.currentFormId);
        }

        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          isConfirmed: true,
          summary,
        };

        const newCurrentStep = nextFormId ? Math.max(state.currentStep, nextFormId) : state.currentStep;

        return {
          completedSteps: newCompletedSteps,
          stepProgress: newStepProgress,
          currentStep: newCurrentStep,
          needsConfirmation: false,
        };
      }),

      canAccessStep: (formId) => {
        const state = get();
        return formId <= state.currentStep;
      },

      isStepConfirmed: (formId) => {
        const state = get();
        return state.stepProgress[formId]?.isConfirmed || false;
      },

      loadStepProgress: (formId) => {
        const state = get();
        const progress = state.stepProgress[formId];
        if (progress) {
          set({
            chatHistory: progress.chatHistory,
            extractedFields: progress.extractedFields,
            isInTest: progress.isInTest || false,
            testPassed: progress.testPassed || false,
            testChatHistory: progress.testChatHistory || [],
            testCredential: progress.testCredential || "",
          });
        }
      },

      // 测试阶段方法
      startTest: () => set((state) => {
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          isInTest: true,
          testPassed: false,
          testChatHistory: [],
          testCredential: "",
        };
        return {
          isInTest: true,
          testPassed: false,
          testChatHistory: [],
          testCredential: "",
          stepProgress: newStepProgress,
        };
      }),

      addTestMessage: (message) => set((state) => {
        const newTestHistory = [...state.testChatHistory, message];
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          testChatHistory: newTestHistory,
        };
        return {
          testChatHistory: newTestHistory,
          stepProgress: newStepProgress,
        };
      }),

      setTestPassed: (passed, credential) => set((state) => {
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          testPassed: passed,
          testCredential: credential,
        };
        return {
          testPassed: passed,
          testCredential: credential,
          stepProgress: newStepProgress,
        };
      }),

      resetTest: () => set((state) => {
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          isInTest: false,
          testPassed: false,
          testChatHistory: [],
          testCredential: "",
        };
        return {
          isInTest: false,
          testPassed: false,
          testChatHistory: [],
          testCredential: "",
          stepProgress: newStepProgress,
        };
      }),

      setTestState: (isInTest, testPassed, testChatHistory, testCredential) => set((state) => {
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          isInTest,
          testPassed,
          testChatHistory,
          testCredential,
        };
        return {
          isInTest,
          testPassed,
          testChatHistory,
          testCredential,
          stepProgress: newStepProgress,
        };
      }),

      // 重置所有进度（切换项目时使用）
      resetAllProgress: () => set({
        currentFormId: 1,
        chatHistory: [],
        extractedFields: {},
        currentStep: 1,
        completedSteps: [],
        stepProgress: {},
        previousSummaries: [],
        needsConfirmation: false,
        isInTest: false,
        testPassed: false,
        testChatHistory: [],
        testCredential: "",
      }),

      // 硬性容错：清理无效消息
      cleanInvalidMessages: () => set((state) => {
        // 清理主聊天历史
        const cleanedHistory = state.chatHistory.filter(msg => {
          if (!msg || typeof msg !== 'object') return false;
          if (!msg.role || typeof msg.role !== 'string') return false;
          if (msg.content === null || msg.content === undefined) return false;
          if (typeof msg.content !== 'string') return false;
          if (msg.content.trim() === '') return false;
          return true;
        });

        // 清理测试聊天历史
        const cleanedTestHistory = state.testChatHistory.filter(msg => {
          if (!msg || typeof msg !== 'object') return false;
          if (!msg.role || typeof msg.role !== 'string') return false;
          if (msg.content === null || msg.content === undefined) return false;
          if (typeof msg.content !== 'string') return false;
          if (msg.content.trim() === '') return false;
          return true;
        });

        const removedCount = (state.chatHistory.length - cleanedHistory.length) +
                            (state.testChatHistory.length - cleanedTestHistory.length);

        if (removedCount > 0) {
          console.warn(`[硬性容错] 从历史记录中移除了 ${removedCount} 条无效消息`);
        }

        // 更新 stepProgress
        const newStepProgress = { ...state.stepProgress };
        newStepProgress[state.currentFormId] = {
          ...newStepProgress[state.currentFormId],
          chatHistory: cleanedHistory,
          testChatHistory: cleanedTestHistory,
        };

        return {
          chatHistory: cleanedHistory,
          testChatHistory: cleanedTestHistory,
          stepProgress: newStepProgress,
        };
      }),

      getCurrentForm: () => {
        const { forms, currentFormId } = get();
        return forms.find((f) => f.id === currentFormId);
      },
    }),
    {
      name: "xiaop-chat-storage",
      partialize: (state) => ({
        currentFormId: state.currentFormId,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        stepProgress: state.stepProgress,
        needsConfirmation: state.needsConfirmation,
      }),
    }
  )
);
