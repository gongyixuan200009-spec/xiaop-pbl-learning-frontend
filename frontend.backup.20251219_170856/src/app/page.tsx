"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterWizard } from "@/components/auth/RegisterWizard";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);
  
  const handleSuccess = () => {
    router.push("/chat");
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <Image
              src="/avatar.png"
              alt="工小助"
              width={100}
              height={100}
              className="rounded-full border-4 border-white shadow-xl mx-auto"
            />
          </motion.div>
          <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            嗨！我是工小助
          </h1>
          <p className="mt-2 text-gray-600">你的 AI 学习伙伴 ✨</p>
        </div>
        
        {/* 表单卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Tab 切换 */}
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("login")}
              className={cn(
                "flex-1 py-2 rounded-lg font-medium transition-all",
                activeTab === "login"
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              🔑 登录
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={cn(
                "flex-1 py-2 rounded-lg font-medium transition-all",
                activeTab === "register"
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              ✨ 注册
            </button>
          </div>
          
          {/* 表单内容 */}
          {activeTab === "login" ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterWizard onSuccess={handleSuccess} />
          )}
        </div>
        
        {/* 底部信息 */}
        <p className="mt-6 text-center text-gray-500 text-sm">
          工小助学习助手 v2.0 · 由 AI 驱动
        </p>
      </motion.div>
    </div>
  );
}
