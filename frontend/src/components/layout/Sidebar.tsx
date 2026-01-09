"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { LogOut, CheckCircle, Circle, Menu, X, ChevronRight, Lock, FolderPlus, ChevronDown, Trash2, Edit2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { projectAPI, Project } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const { token, user, logout } = useAuthStore();
  const {
    forms,
    currentFormId,
    setCurrentForm,
    extractedFields,
    currentStep,
    completedSteps,
    stepProgress,
    canAccessStep,
    isStepConfirmed,
    resetAllProgress,
  } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLockedAlert, setShowLockedAlert] = useState(false);

  // 项目相关状态
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      if (!token) return;
      setIsLoadingProjects(true);
      try {
        const response = await projectAPI.listProjects(token);
        setProjects(response.projects);
        setCurrentProjectId(response.current_project_id);
      } catch (error) {
        console.error("加载项目列表失败:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    loadProjects();
  }, [token]);

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  const handleFormSelect = (formId: number) => {
    if (!canAccessStep(formId)) {
      setShowLockedAlert(true);
      setTimeout(() => setShowLockedAlert(false), 2000);
      return;
    }

    setCurrentForm(formId);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // 创建新项目
  const handleCreateProject = async () => {
    if (!token || !newProjectName.trim()) return;

    try {
      const response = await projectAPI.createProject(token, newProjectName.trim());
      if (response.success) {
        // 更新项目列表
        setProjects(prev => [response.project, ...prev.map(p => ({ ...p, is_current: false }))]);
        setCurrentProjectId(response.project.id);
        setNewProjectName("");
        setIsCreatingProject(false);
        setShowProjectMenu(false);
        // 重置当前进度以加载新项目
        resetAllProgress();
        // 刷新页面以加载新项目数据
        window.location.reload();
      }
    } catch (error) {
      console.error("创建项目失败:", error);
    }
  };

  // 切换项目
  const handleSwitchProject = async (projectId: string) => {
    if (!token || projectId === currentProjectId) return;

    try {
      const response = await projectAPI.switchProject(token, projectId);
      if (response.success) {
        setCurrentProjectId(projectId);
        setProjects(prev => prev.map(p => ({ ...p, is_current: p.id === projectId })));
        setShowProjectMenu(false);
        // 重置当前进度以加载新项目
        resetAllProgress();
        // 刷新页面以加载新项目数据
        window.location.reload();
      }
    } catch (error) {
      console.error("切换项目失败:", error);
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    if (!window.confirm("确定要删除这个项目吗？所有进度将丢失。")) return;

    try {
      const response = await projectAPI.deleteProject(token, projectId);
      if (response.success) {
        // 重新加载项目列表
        const listResponse = await projectAPI.listProjects(token);
        setProjects(listResponse.projects);
        setCurrentProjectId(listResponse.current_project_id);
        // 如果删除的是当前项目，刷新页面
        if (projectId === currentProjectId) {
          window.location.reload();
        }
      }
    } catch (error: any) {
      alert(error.message || "删除项目失败");
    }
  };

  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentForm = forms.find((f) => f.id === currentFormId);

  // Mobile header
  const MobileHeader = () => (
    <div
      className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#fbfbfd]/90 backdrop-blur-xl border-b border-[#d2d2d7]/30"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding: "clamp(8px, 2.5vw, 12px) clamp(12px, 4vw, 16px)",
          height: "var(--header-height)"
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-vw-md hover:bg-black/5 transition-colors active:scale-95"
          style={{ padding: "clamp(6px, 1.5vw, 8px)", marginLeft: "clamp(-6px, -1.5vw, -8px)" }}
        >
          <Menu style={{ width: "var(--icon-md)", height: "var(--icon-md)" }} className="text-[#1d1d1f]" />
        </button>
        <div className="flex items-center" style={{ gap: "var(--space-sm)" }}>
          <div
            className="rounded-full overflow-hidden ring-2 ring-[#0071e3]/20"
            style={{ width: "var(--avatar-sm)", height: "var(--avatar-sm)" }}
          >
            <Image
              src="/avatar.png"
              alt="工小助"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <span
            className="font-semibold text-[#1d1d1f] truncate"
            style={{ fontSize: "var(--text-sm)", maxWidth: "45vw" }}
          >
            {currentForm?.name || "工小助学习助手"}
          </span>
        </div>
        <div style={{ width: "clamp(32px, 8vw, 40px)" }} />
      </div>
    </div>
  );

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* User info */}
      <div
        className="border-b border-[#d2d2d7]/30"
        style={{ padding: "var(--space-lg)" }}
      >
        <div className="flex items-center" style={{ gap: "var(--space-md)" }}>
          <div
            className="rounded-full overflow-hidden ring-2 ring-[#0071e3]/20 flex-shrink-0 shadow-sm"
            style={{ width: "var(--avatar-lg)", height: "var(--avatar-lg)" }}
          >
            <Image
              src="/avatar.png"
              alt="工小助"
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#1d1d1f]" style={{ fontSize: "var(--text-lg)" }}>
              工小助陪你学习
            </h3>
            <p className="text-[#86868b] truncate" style={{ fontSize: "var(--text-xs)", marginTop: "2px" }}>
              {user?.username}
            </p>
          </div>
        </div>

        {/* 项目选择器 */}
        <div className="relative" style={{ marginTop: "var(--space-md)" }}>
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="w-full flex items-center justify-between bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-vw-md transition-colors"
            style={{ padding: "var(--space-sm)" }}
          >
            <div className="flex items-center" style={{ gap: "var(--space-xs)" }}>
              <div
                className="rounded-md bg-[#0071e3] flex items-center justify-center"
                style={{ width: "var(--icon-md)", height: "var(--icon-md)" }}
              >
                <span className="text-white font-bold" style={{ fontSize: "var(--text-xs)" }}>
                  {currentProject?.name?.[0]?.toUpperCase() || "P"}
                </span>
              </div>
              <div className="text-left min-w-0">
                <p className="font-medium text-[#1d1d1f] truncate" style={{ fontSize: "var(--text-sm)" }}>
                  {currentProject?.name || "默认项目"}
                </p>
                <p className="text-[#86868b]" style={{ fontSize: "var(--text-xs)" }}>
                  进度: {currentProject?.completed_steps?.length || 0} 阶段完成
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "text-[#86868b] transition-transform flex-shrink-0",
                showProjectMenu && "rotate-180"
              )}
              style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }}
            />
          </button>

          {/* 提示文字 */}
          {!showProjectMenu && (
            <p
              className="text-center text-[#86868b] cursor-pointer hover:text-[#0071e3] transition-colors"
              style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-xs)" }}
              onClick={() => setShowProjectMenu(true)}
            >
              点击此处切换项目/新建项目
            </p>
          )}

          {/* 项目下拉菜单 */}
          <AnimatePresence>
            {showProjectMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-1 bg-white rounded-vw-md shadow-xl border border-[#d2d2d7]/50 overflow-hidden z-50"
                style={{ maxHeight: "50vh" }}
              >
                {/* 新建项目 */}
                {isCreatingProject ? (
                  <div className="border-b border-[#d2d2d7]/30" style={{ padding: "var(--space-sm)" }}>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="输入项目名称..."
                      className="w-full bg-[#f5f5f7] rounded-md outline-none focus:ring-2 focus:ring-[#0071e3]/30 text-[#1d1d1f]"
                      style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "var(--text-sm)" }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateProject();
                        if (e.key === "Escape") {
                          setIsCreatingProject(false);
                          setNewProjectName("");
                        }
                      }}
                    />
                    <div className="flex justify-end" style={{ gap: "var(--space-xs)", marginTop: "var(--space-xs)" }}>
                      <button
                        onClick={() => {
                          setIsCreatingProject(false);
                          setNewProjectName("");
                        }}
                        className="text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                        style={{ fontSize: "var(--text-xs)", padding: "var(--space-xs)" }}
                      >
                        取消
                      </button>
                      <button
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim()}
                        className="bg-[#0071e3] text-white rounded-md disabled:opacity-50 hover:bg-[#0077ED] transition-colors"
                        style={{ fontSize: "var(--text-xs)", padding: "var(--space-xs) var(--space-sm)" }}
                      >
                        创建
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingProject(true)}
                    className="w-full flex items-center text-[#0071e3] hover:bg-[#f5f5f7] transition-colors border-b border-[#d2d2d7]/30"
                    style={{ gap: "var(--space-xs)", padding: "var(--space-sm)" }}
                  >
                    <FolderPlus style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
                    <span style={{ fontSize: "var(--text-sm)" }}>新建项目</span>
                  </button>
                )}

                {/* 项目列表 */}
                <div className="overflow-y-auto" style={{ maxHeight: "35vh" }}>
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleSwitchProject(project.id)}
                      className={cn(
                        "flex items-center justify-between cursor-pointer transition-colors",
                        project.id === currentProjectId
                          ? "bg-[#0071e3]/10"
                          : "hover:bg-[#f5f5f7]"
                      )}
                      style={{ padding: "var(--space-sm)" }}
                    >
                      <div className="flex items-center min-w-0" style={{ gap: "var(--space-xs)" }}>
                        <div
                          className={cn(
                            "rounded-md flex items-center justify-center flex-shrink-0",
                            project.id === currentProjectId ? "bg-[#0071e3]" : "bg-[#86868b]"
                          )}
                          style={{ width: "var(--icon-md)", height: "var(--icon-md)" }}
                        >
                          <span className="text-white font-bold" style={{ fontSize: "var(--text-xs)" }}>
                            {project.name?.[0]?.toUpperCase() || "P"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "font-medium truncate",
                              project.id === currentProjectId ? "text-[#0071e3]" : "text-[#1d1d1f]"
                            )}
                            style={{ fontSize: "var(--text-sm)" }}
                          >
                            {project.name}
                          </p>
                          <p className="text-[#86868b]" style={{ fontSize: "var(--text-xs)" }}>
                            {project.completed_steps?.length || 0} 阶段完成
                          </p>
                        </div>
                      </div>
                      {/* 删除按钮（不能删除当前项目且只有一个项目时不显示） */}
                      {projects.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="text-[#86868b] hover:text-[#ff3b30] transition-colors p-1 rounded-md hover:bg-[#ff3b30]/10 flex-shrink-0"
                        >
                          <Trash2 style={{ width: "var(--icon-xs)", height: "var(--icon-xs)" }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {user?.profile && (
          <div
            className="bg-[#f5f5f7] rounded-vw-md"
            style={{ marginTop: "var(--space-md)", padding: "var(--space-sm)" }}
          >
            <div className="grid grid-cols-2" style={{ gap: "var(--space-sm)" }}>
              <div>
                <p className="text-[#86868b]" style={{ fontSize: "var(--text-xs)", marginBottom: "2px" }}>年级</p>
                <p className="text-[#1d1d1f] font-medium" style={{ fontSize: "var(--text-sm)" }}>
                  {user.profile.grade}
                </p>
              </div>
              <div>
                <p className="text-[#86868b]" style={{ fontSize: "var(--text-xs)", marginBottom: "2px" }}>数学水平</p>
                <p className="text-[#1d1d1f] font-medium" style={{ fontSize: "var(--text-sm)" }}>
                  {user.profile.math_score}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "var(--space-md)" }}>
        <h4
          className="font-semibold text-[#86868b] uppercase tracking-wider"
          style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-sm)", paddingLeft: "2px" }}
        >
          任务阶段
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          {forms.map((form) => {
            const isActive = form.id === currentFormId;
            const isConfirmed = isStepConfirmed(form.id);
            const canAccess = canAccessStep(form.id);
            const isLocked = !canAccess;

            const stepData = stepProgress[form.id];
            const extractedForStep = stepData?.extractedFields || (isActive ? extractedFields : {});
            const completedFields = form.fields.filter((f) => extractedForStep[f]).length;
            const totalFields = form.fields.length;
            const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

            return (
              <motion.button
                key={form.id}
                whileHover={!isLocked ? { scale: 1.01 } : {}}
                whileTap={!isLocked ? { scale: 0.98 } : {}}
                onClick={() => handleFormSelect(form.id)}
                disabled={isLocked}
                className={cn(
                  "w-full text-left transition-all relative overflow-hidden flex items-center rounded-vw-md",
                  isActive
                    ? "bg-[#0071e3] shadow-lg shadow-[#0071e3]/25"
                    : isConfirmed
                    ? "bg-[#f5f5f7] ring-1 ring-[#34c759]/30"
                    : isLocked
                    ? "bg-[#f5f5f7]/60 opacity-50 cursor-not-allowed"
                    : "bg-[#f5f5f7] hover:bg-[#e8e8ed] active:scale-[0.98]"
                )}
                style={{ padding: "var(--space-md)", gap: "var(--space-sm)" }}
              >
                {!isConfirmed && !isLocked && progress > 0 && !isActive && (
                  <div
                    className="absolute bottom-0 left-0 bg-[#0071e3]/30 transition-all duration-500"
                    style={{ width: `${progress}%`, height: "clamp(2px, 0.5vw, 4px)" }}
                  />
                )}

                <div className="flex-shrink-0">
                  {isConfirmed ? (
                    <div
                      className="rounded-full bg-[#34c759] flex items-center justify-center"
                      style={{ width: "var(--icon-md)", height: "var(--icon-md)" }}
                    >
                      <CheckCircle style={{ width: "60%", height: "60%" }} className="text-white" />
                    </div>
                  ) : isLocked ? (
                    <div
                      className="rounded-full bg-[#86868b]/20 flex items-center justify-center"
                      style={{ width: "var(--icon-md)", height: "var(--icon-md)" }}
                    >
                      <Lock style={{ width: "50%", height: "50%" }} className="text-[#86868b]" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-full flex items-center justify-center",
                        isActive ? "bg-white/20" : "bg-[#0071e3]/10"
                      )}
                      style={{ width: "var(--icon-md)", height: "var(--icon-md)" }}
                    >
                      <Circle
                        style={{ width: "60%", height: "60%" }}
                        className={isActive ? "text-white" : "text-[#0071e3]"}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "font-medium block truncate",
                      isActive
                        ? "text-white"
                        : isConfirmed
                        ? "text-[#1d1d1f]"
                        : isLocked
                        ? "text-[#86868b]"
                        : "text-[#1d1d1f]"
                    )}
                    style={{ fontSize: "var(--text-sm)" }}
                  >
                    {form.name}
                  </span>
                  <span
                    className={cn(
                      "block",
                      isActive ? "text-white/70" : isConfirmed ? "text-[#34c759]" : "text-[#86868b]"
                    )}
                    style={{ fontSize: "var(--text-xs)", marginTop: "2px" }}
                  >
                    {isConfirmed
                      ? "已完成"
                      : isLocked
                      ? "请先完成前面阶段"
                      : `${completedFields}/${totalFields} 已完成`}
                  </span>
                </div>

                <ChevronRight
                  style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }}
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    isActive ? "text-white/70" : isLocked ? "text-[#86868b]/30" : "text-[#86868b]"
                  )}
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Logout button */}
      <div
        className="border-t border-[#d2d2d7]/30"
        style={{
          padding: "var(--space-md)",
          paddingBottom: "max(env(safe-area-inset-bottom), var(--space-md))"
        }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] transition-all active:scale-[0.98] rounded-vw-md"
          style={{ gap: "var(--space-sm)", padding: "var(--space-sm)" }}
        >
          <LogOut style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
          <span className="font-medium" style={{ fontSize: "var(--text-sm)" }}>退出登录</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <MobileHeader />

      {/* Locked alert */}
      <AnimatePresence>
        {showLockedAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed z-50 bg-[#ff9500] text-white shadow-lg flex items-center rounded-vw-md"
            style={{
              top: "calc(env(safe-area-inset-top) + var(--header-height) + var(--space-md))",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "var(--space-sm) var(--space-md)",
              gap: "var(--space-xs)"
            }}
          >
            <Lock style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
            <span className="font-medium" style={{ fontSize: "var(--text-xs)" }}>请先完成前面的阶段</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div
        className="hidden md:flex h-full bg-[#fbfbfd] border-r border-[#d2d2d7]/30 flex-col"
        style={{ width: "var(--sidebar-width)" }}
      >
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Drawer content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 bg-[#fbfbfd] z-50 flex flex-col shadow-2xl md:hidden"
              style={{
                width: "var(--sidebar-width)",
                maxWidth: "85vw",
                paddingLeft: "env(safe-area-inset-left)"
              }}
            >
              {/* Close button */}
              <div
                className="absolute z-10"
                style={{
                  top: "calc(env(safe-area-inset-top) + var(--space-md))",
                  right: "var(--space-md)"
                }}
              >
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full hover:bg-black/5 transition-colors active:scale-95"
                  style={{ padding: "var(--space-xs)" }}
                >
                  <X style={{ width: "var(--icon-md)", height: "var(--icon-md)" }} className="text-[#86868b]" />
                </button>
              </div>

              {/* Top safe area placeholder */}
              <div style={{ paddingTop: "env(safe-area-inset-top)" }} />

              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
