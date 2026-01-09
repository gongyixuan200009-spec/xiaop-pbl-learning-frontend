import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FormConfig, adminAPI } from "@/lib/api";

interface AdminState {
  isAuthenticated: boolean;
  forms: FormConfig[];
  selectedFormId: number | null;
  isLoading: boolean;
  error: string | null;

  login: (password: string) => Promise<boolean>;
  logout: () => void;
  loadForms: () => Promise<void>;
  updateForm: (form: FormConfig) => void;
  saveForms: () => Promise<boolean>;
  setSelectedForm: (id: number | null) => void;
  addForm: () => void;
  deleteForm: (id: number) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      forms: [],
      selectedFormId: null,
      isLoading: false,
      error: null,

      login: async (password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await adminAPI.login(password);
          if (response.success) {
            set({ isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ error: "密码错误", isLoading: false });
          return false;
        } catch (error) {
          set({ error: "登录失败", isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ isAuthenticated: false, forms: [], selectedFormId: null });
      },

      loadForms: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await adminAPI.getForms();
          set({ forms: response.forms, isLoading: false });
        } catch (error) {
          set({ error: "加载表单失败", isLoading: false });
        }
      },

      updateForm: (updatedForm: FormConfig) => {
        set((state) => ({
          forms: state.forms.map((f) =>
            f.id === updatedForm.id ? updatedForm : f
          ),
        }));
      },

      saveForms: async () => {
        const { forms } = get();
        set({ isLoading: true, error: null });
        try {
          await adminAPI.updateForms(forms);
          set({ isLoading: false });
          return true;
        } catch (error) {
          set({ error: "保存失败", isLoading: false });
          return false;
        }
      },

      setSelectedForm: (id: number | null) => {
        set({ selectedFormId: id });
      },

      addForm: () => {
        const { forms } = get();
        const maxId = forms.reduce((max, f) => Math.max(max, f.id), 0);
        const newForm: FormConfig = {
          id: maxId + 1,
          name: "新表单",
          description: "请输入角色描述",
          user_description: "请输入用户看到的描述",
          fields: ["字段1"],
          extraction_prompt: "",
          age_prompts: {},
          test_enabled: false,
          test_prompt: "",
          test_pass_pattern: "",
        };
        set({ forms: [...forms, newForm], selectedFormId: newForm.id });
      },

      deleteForm: (id: number) => {
        set((state) => ({
          forms: state.forms.filter((f) => f.id !== id),
          selectedFormId:
            state.selectedFormId === id ? null : state.selectedFormId,
        }));
      },
    }),
    {
      name: "admin-storage",
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
);
