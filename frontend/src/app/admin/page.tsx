"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminStore } from "@/store/adminStore";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import FormEditor from "@/components/admin/FormEditor";
import { adminAPI, AdminUserInfo, AdminUserDetail, AdminProjectDetail } from "@/lib/api";
import WorkflowEditor from "@/components/admin/WorkflowEditor";
import AgeAdaptationConfig from "@/components/admin/AgeAdaptationConfig";
import PromptHistory from "@/components/admin/PromptHistory";

type TabType = "forms" | "users" | "settings";

export default function AdminPage() {
  const {
    isAuthenticated,
    forms,
    selectedFormId,
    isLoading,
    loadForms,
    saveForms,
    setSelectedForm,
    updateForm,
    addForm,
    deleteForm,
    logout,
  } = useAdminStore();

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeTab, setActiveTab] = useState<TabType>("forms");
  const [users, setUsers] = useState<AdminUserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadForms();
    }
  }, [isAuthenticated, loadForms]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "users") {
      loadUsers();
    }
  }, [isAuthenticated, activeTab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminAPI.getUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error("加载用户列表失败:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserDetail = async (username: string) => {
    try {
      const data = await adminAPI.getUserDetail(username);
      setSelectedUser(data);
      // 默认选中当前项目或第一个项目
      const projectIds = Object.keys(data.projects || {});
      if (data.current_project_id && data.projects[data.current_project_id]) {
        setSelectedProjectId(data.current_project_id);
      } else if (projectIds.length > 0) {
        setSelectedProjectId(projectIds[0]);
      } else {
        setSelectedProjectId(null);
      }
    } catch (error) {
      console.error("加载用户详情失败:", error);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    const success = await saveForms();
    setSaveStatus(success ? "saved" : "error");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const selectedForm = forms.find((f) => f.id === selectedFormId);

  // 获取当前选中的项目详情
  const selectedProject: AdminProjectDetail | null = selectedUser && selectedProjectId
    ? selectedUser.projects[selectedProjectId] || null
    : null;

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Apple-style Header */}
      <header className="bg-[rgba(255,255,255,0.8)] backdrop-blur-xl border-b border-[#d2d2d7] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight">
            工小助 管理后台
          </h1>

          <div className="flex items-center gap-3">
            {activeTab === "forms" && (
              <motion.button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                whileTap={{ scale: 0.97 }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  saveStatus === "saved"
                    ? "bg-[#34c759] text-white"
                    : saveStatus === "error"
                    ? "bg-[#ff3b30] text-white"
                    : "bg-[#0071e3] text-white hover:bg-[#0077ed]"
                }`}
              >
                {saveStatus === "saving" ? "保存中..." : saveStatus === "saved" ? "已保存" : "保存配置"}
              </motion.button>
            )}

            <motion.button
              onClick={logout}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-[#0071e3] hover:bg-[#0071e3]/10 transition-colors"
            >
              退出
            </motion.button>
          </div>
        </div>
      </header>

      {/* Apple-style Tab Navigation */}
      <div className="bg-[rgba(255,255,255,0.8)] backdrop-blur-xl border-b border-[#d2d2d7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("forms")}
              className={`relative py-3 text-sm font-medium transition-colors ${
                activeTab === "forms" ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              表单配置
              {activeTab === "forms" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0071e3]"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`relative py-3 text-sm font-medium transition-colors ${
                activeTab === "users" ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              用户数据
              {activeTab === "users" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0071e3]"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`relative py-3 text-sm font-medium transition-colors ${
                activeTab === "settings" ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              系统设置
              {activeTab === "settings" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0071e3]"
                />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "forms" ? (
            <motion.div
              key="forms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* Form List */}
              <div className="col-span-4">
                <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 overflow-hidden">
                  <div className="p-4 border-b border-[#d2d2d7]/50 flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[#1d1d1f]">表单列表</h2>
                    <motion.button
                      onClick={addForm}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-7 h-7 flex items-center justify-center bg-[#0071e3] text-white rounded-full text-lg font-light"
                    >
                      +
                    </motion.button>
                  </div>

                  <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                    {isLoading ? (
                      <div className="p-8 text-center text-[#86868b]">
                        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        加载中...
                      </div>
                    ) : forms.length === 0 ? (
                      <div className="p-8 text-center text-[#86868b] text-sm">
                        暂无表单
                      </div>
                    ) : (
                      <div className="p-2">
                        {forms.map((form) => (
                          <motion.button
                            key={form.id}
                            onClick={() => setSelectedForm(form.id)}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full p-3 rounded-xl text-left transition-all mb-1 ${
                              selectedFormId === form.id
                                ? "bg-[#0071e3] text-white"
                                : "hover:bg-[#f5f5f7]"
                            }`}
                          >
                            <div className={`text-[15px] font-medium mb-0.5 ${
                              selectedFormId === form.id ? "text-white" : "text-[#1d1d1f]"
                            }`}>
                              {form.name}
                            </div>
                            <div className={`text-xs truncate ${
                              selectedFormId === form.id ? "text-white/70" : "text-[#86868b]"
                            }`}>
                              {form.user_description}
                            </div>
                            <div className={`mt-2 text-xs ${
                              selectedFormId === form.id ? "text-white/60" : "text-[#86868b]"
                            }`}>
                              {form.fields.length} 个字段
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Editor */}
              <div className="col-span-8">
                {selectedForm ? (
                  <motion.div
                    key={selectedForm.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 p-6"
                  >
                    <h2 className="text-xl font-semibold text-[#1d1d1f] mb-6">
                      编辑: {selectedForm.name}
                    </h2>
                    <FormEditor
                      form={selectedForm}
                      onUpdate={updateForm}
                      onDelete={() => {
                        if (confirm("确定要删除此表单吗？")) {
                          deleteForm(selectedForm.id);
                        }
                      }}
                    />
                  </motion.div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-[#86868b]">
                    <div className="text-center">
                      <div className="text-4xl mb-3 opacity-30">📝</div>
                      <p className="text-sm">选择一个表单进行编辑</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === "users" ? (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* User List */}
              <div className="col-span-4">
                <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 overflow-hidden">
                  <div className="p-4 border-b border-[#d2d2d7]/50 flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[#1d1d1f]">用户列表</h2>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
                          window.open(`${apiUrl}/api/admin/export-users`, "_blank");
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 text-xs font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-full transition-colors"
                        title="导出用户CSV"
                      >
                        导出CSV
                      </motion.button>
                      <motion.button
                        onClick={loadUsers}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-7 h-7 flex items-center justify-center text-[#0071e3] hover:bg-[#0071e3]/10 rounded-full transition-colors"
                      >
                        ↻
                      </motion.button>
                    </div>
                  </div>

                  <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-8 text-center text-[#86868b]">
                        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        加载中...
                      </div>
                    ) : !users || users.length === 0 ? (
                      <div className="p-8 text-center text-[#86868b] text-sm">
                        暂无用户数据
                      </div>
                    ) : (
                      <div className="p-2">
                        {users.map((user) => (
                          <motion.button
                            key={user.username}
                            onClick={() => loadUserDetail(user.username)}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full p-3 rounded-xl text-left transition-all mb-1 ${
                              selectedUser?.username === user.username
                                ? "bg-[#0071e3] text-white"
                                : "hover:bg-[#f5f5f7]"
                            }`}
                          >
                            <div className={`text-[15px] font-medium mb-1 ${
                              selectedUser?.username === user.username ? "text-white" : "text-[#1d1d1f]"
                            }`}>
                              {user.username}
                            </div>
                            {user.profile && (
                              <div className={`text-xs mb-1 ${
                                selectedUser?.username === user.username ? "text-white/70" : "text-[#86868b]"
                              }`}>
                                {user.profile.grade} | {user.profile.gender} | {user.profile.math_score}
                              </div>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                selectedUser?.username === user.username
                                  ? "bg-white/20 text-white"
                                  : "bg-[#ff9500]/10 text-[#ff9500]"
                              }`}>
                                {user.projects.length} 个项目
                              </span>
                              {user.projects.filter(p => p.is_current).map(p => (
                                <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full ${
                                  selectedUser?.username === user.username
                                    ? "bg-white/20 text-white"
                                    : "bg-[#0071e3]/10 text-[#0071e3]"
                                }`}>
                                  当前: {p.name}
                                </span>
                              ))}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Detail */}
              <div className="col-span-8">
                {selectedUser ? (
                  <motion.div
                    key={selectedUser.username}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 p-6"
                  >
                    <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">
                      {selectedUser.username}
                    </h2>

                    {/* Project Tabs */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                      {Object.entries(selectedUser.projects).map(([projectId, project]) => (
                        <motion.button
                          key={projectId}
                          onClick={() => setSelectedProjectId(projectId)}
                          whileTap={{ scale: 0.98 }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedProjectId === projectId
                              ? "bg-[#0071e3] text-white"
                              : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                          }`}
                        >
                          {project.name || "未命名项目"}
                          {projectId === selectedUser.current_project_id && (
                            <span className="ml-2 text-xs opacity-70">(当前)</span>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {selectedProject ? (
                      <>
                        {/* Progress Overview */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-[#f5f5f7] rounded-xl p-4 text-center">
                            <div className="text-3xl font-semibold text-[#0071e3]">{selectedProject.current_step}</div>
                            <div className="text-xs text-[#86868b] mt-1">当前阶段</div>
                          </div>
                          <div className="bg-[#f5f5f7] rounded-xl p-4 text-center">
                            <div className="text-3xl font-semibold text-[#34c759]">{selectedProject.completed_steps?.length || 0}</div>
                            <div className="text-xs text-[#86868b] mt-1">已完成</div>
                          </div>
                        </div>

                        {/* Step Data */}
                        <div className="space-y-4">
                          <h3 className="text-[15px] font-semibold text-[#1d1d1f]">各阶段数据</h3>
                          {Object.entries(selectedProject.step_data || {}).length > 0 ? (
                            Object.entries(selectedProject.step_data || {}).map(([stepId, stepData]) => (
                              <div key={stepId} className="bg-[#f5f5f7] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[15px] font-medium text-[#1d1d1f]">阶段 {stepId}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    stepData.is_confirmed
                                      ? "bg-[#34c759]/10 text-[#34c759]"
                                      : "bg-[#ff9500]/10 text-[#ff9500]"
                                  }`}>
                                    {stepData.is_confirmed ? "已确认" : "进行中"}
                                  </span>
                                </div>

                                {Object.keys(stepData.extracted_fields || {}).length > 0 && (
                                  <div className="space-y-2 mb-3">
                                    {Object.entries(stepData.extracted_fields || {}).map(([field, value]) => (
                                      <div key={field} className="bg-white rounded-lg p-3">
                                        <div className="text-xs text-[#0071e3] mb-1">{field}</div>
                                        <div className="text-sm text-[#1d1d1f]">{value}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {stepData.summary && (
                                  <div className="pt-3 border-t border-[#d2d2d7]/50">
                                    <div className="text-xs text-[#86868b] mb-1">总结</div>
                                    <div className="text-sm text-[#1d1d1f]">{stepData.summary}</div>
                                  </div>
                                )}

                                {stepData.chat_history && stepData.chat_history.length > 0 && (
                                  <div className="pt-3 mt-3 border-t border-[#d2d2d7]/50">
                                    <div className="text-xs text-[#86868b] mb-2">聊天记录</div>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                      {stepData.chat_history.map((msg, idx) => (
                                        <div key={idx} className={`text-sm p-2 rounded-lg ${
                                          msg.role === "user"
                                            ? "bg-[#0071e3]/10 text-[#1d1d1f]"
                                            : "bg-white text-[#1d1d1f]"
                                        }`}>
                                          <span className="text-xs font-medium text-[#86868b]">
                                            {msg.role === "user" ? "用户: " : "工小助: "}
                                          </span>
                                          {msg.content}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 关卡测试记录 */}
                                {stepData.test_state && (
                                  <div className="pt-3 mt-3 border-t border-[#d2d2d7]/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs text-[#86868b]">关卡测试</div>
                                      <div className="flex items-center gap-2">
                                        {stepData.test_state.test_credential && (
                                          <span className="text-xs font-mono text-[#34c759]">
                                            {stepData.test_state.test_credential}
                                          </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          stepData.test_state.test_passed
                                            ? "bg-[#34c759]/10 text-[#34c759]"
                                            : stepData.test_state.is_in_test
                                            ? "bg-[#ff9500]/10 text-[#ff9500]"
                                            : "bg-[#86868b]/10 text-[#86868b]"
                                        }`}>
                                          {stepData.test_state.test_passed ? "已通过" : stepData.test_state.is_in_test ? "进行中" : "未开始"}
                                        </span>
                                      </div>
                                    </div>
                                    {stepData.test_state.test_chat_history && stepData.test_state.test_chat_history.length > 0 && (
                                      <div className="max-h-60 overflow-y-auto space-y-2">
                                        {stepData.test_state.test_chat_history.map((msg: {role: string; content: string}, idx: number) => (
                                          <div key={idx} className={`text-sm p-2 rounded-lg ${
                                            msg.role === "user"
                                              ? "bg-[#ff9500]/10 text-[#1d1d1f]"
                                              : "bg-white text-[#1d1d1f]"
                                          }`}>
                                            <span className="text-xs font-medium text-[#86868b]">
                                              {msg.role === "user" ? "用户: " : "工小助(测试): "}
                                            </span>
                                            {msg.content}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-[#86868b] py-8">
                              该项目暂无填写数据
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-[#86868b] py-8">
                        该用户暂无项目数据
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-[#86868b]">
                    <div className="text-center">
                      <div className="text-4xl mb-3 opacity-30">👤</div>
                      <p className="text-sm">选择一个用户查看详情</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 overflow-hidden p-6">
                <WorkflowEditor />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 overflow-hidden p-6">
                <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-4">Prompt 配置</h2>
                <AgeAdaptationConfig />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 overflow-hidden p-6">
                <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-4">修改记录</h2>
                <PromptHistory />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
