import { create } from "zustand";
import { SocraticModule, ModuleProgress, SocraticQuestion, ChatMessage, ModuleListItem } from "@/lib/api";

interface SocraticState {
  // 模块列表
  modules: ModuleListItem[];
  modulesLoading: boolean;
  
  // 当前模块
  currentModule: SocraticModule | null;
  currentProgress: ModuleProgress | null;
  
  // 对话状态
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  
  // 当前问题
  currentQuestionIndex: number;
  
  // Actions
  setModules: (modules: ModuleListItem[]) => void;
  setModulesLoading: (loading: boolean) => void;
  setCurrentModule: (module: SocraticModule | null) => void;
  setCurrentProgress: (progress: ModuleProgress | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (content: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  reset: () => void;
}

export const useSocraticStore = create<SocraticState>((set) => ({
  modules: [],
  modulesLoading: false,
  currentModule: null,
  currentProgress: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  currentQuestionIndex: 0,

  setModules: (modules) => set({ modules }),
  setModulesLoading: (loading) => set({ modulesLoading: loading }),
  setCurrentModule: (module) => set({ currentModule: module }),
  setCurrentProgress: (progress) => set({ currentProgress: progress }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (content) => set((state) => ({ streamingContent: state.streamingContent + content })),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  reset: () => set({
    currentModule: null,
    currentProgress: null,
    messages: [],
    isStreaming: false,
    streamingContent: "",
    currentQuestionIndex: 0,
  }),
}));
