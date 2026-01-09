"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SocraticChat } from "@/components/socratic/SocraticChat";
import { useSocraticStore } from "@/store/socraticStore";
import { useAuthStore } from "@/store/authStore";
import { socraticAPI } from "@/lib/api";
import { Loader2, BookOpen, CheckCircle, Clock, ArrowLeft, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SocraticPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const {
    modules,
    modulesLoading,
    currentModule,
    currentProgress,
    setModules,
    setModulesLoading,
    setCurrentModule,
    setCurrentProgress,
    setMessages,
    addMessage,
    reset,
  } = useSocraticStore();

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [startingModule, setStartingModule] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    loadModules();
  }, [isAuthenticated, token, router]);

  const loadModules = async () => {
    if (!token) return;
    
    setModulesLoading(true);
    try {
      const modulesList = await socraticAPI.getModules(token);
      setModules(modulesList);
    } catch (error) {
      console.error("加载模块列表失败:", error);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleStartModule = async (moduleId: string) => {
    if (!token || startingModule) return;
    
    setStartingModule(true);
    try {
      // 开始学习模块
      const result = await socraticAPI.startModule(token, moduleId);
      
      if (result.success && result.module && result.progress) {
        setCurrentModule(result.module);
        setCurrentProgress(result.progress);
        
        // 设置初始消息
        if (result.progress.chat_history && result.progress.chat_history.length > 0) {
          setMessages(result.progress.chat_history);
        } else {
          // 添加欢迎消息
          setMessages([{
            role: "assistant",
            content: result.welcome_message || `欢迎学习 ${result.module.name}!让我们开始吧。`,
          }]);
        }
      }
    } catch (error) {
      console.error("开始模块失败:", error);
      alert("开始学习失败,请稍后重试");
    } finally {
      setStartingModule(false);
    }
  };

  const handleBackToList = () => {
    reset();
  };

  // 如果已经选择了模块,显示对话界面
  if (currentModule && currentProgress) {
    return (
      <div className="h-screen flex flex-col">
        {/* 顶部导航 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回模块列表</span>
          </button>
        </div>
        
        {/* 对话界面 */}
        <div className="flex-1 overflow-hidden">
          <SocraticChat />
        </div>
      </div>
    );
  }

  // 显示模块列表
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">形成性教学</h1>
          </div>
          <p className="text-gray-600">
            通过苏格拉底式问答,深入理解知识,培养批判性思维
          </p>
        </motion.div>

        {/* 模块列表 */}
        {modulesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无可用模块
            </h3>
            <p className="text-gray-600">
              请联系老师创建学习模块
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-6">
                  {/* 模块状态标签 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        {module.question_count} 个问题
                      </span>
                    </div>
                    {module.status === "completed" && (
                      <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">已完成</span>
                      </div>
                    )}
                    {module.status === "in_progress" && (
                      <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">进行中</span>
                      </div>
                    )}
                  </div>

                  {/* 模块信息 */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {module.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {module.description}
                  </p>

                  {/* 开始按钮 */}
                  <button
                    onClick={() => handleStartModule(module.id)}
                    disabled={startingModule}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
                      module.status === "completed"
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : module.status === "in_progress"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      startingModule && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {startingModule ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>加载中...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>
                          {module.status === "completed"
                            ? "复习"
                            : module.status === "in_progress"
                            ? "继续学习"
                            : "开始学习"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
