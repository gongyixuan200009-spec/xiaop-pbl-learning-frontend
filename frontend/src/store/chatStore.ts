import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, FormConfig, PreviousSummary } from "@/lib/api";

interface StepProgress {
  extractedFields: Record<string, string>;
  chatHistory: ChatMessage[];
  isConfirmed: boolean;
  summary: string;
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
          });
        }
      },

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
      }),
    }
  )
);
