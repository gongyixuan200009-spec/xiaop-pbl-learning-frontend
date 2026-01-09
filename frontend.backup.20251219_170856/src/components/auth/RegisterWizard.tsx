"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Loader2, ChevronRight } from "lucide-react";
import { authAPI, UserProfile } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface RegisterWizardProps {
  onSuccess?: () => void;
}

export function RegisterWizard({ onSuccess }: RegisterWizardProps) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<UserProfile>({
    grade: "",
    gender: "",
    math_score: "",
    science_feeling: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuthStore();
  
  // 根据年级动态生成科学/理科步骤
  const getScienceStep = (grade: string) => {
    const isElementary = ["四年级", "五年级", "六年级"].includes(grade);
    const subject = isElementary ? "科学" : "理科";
    return {
      id: "science",
      title: `${subject}感受`,
      question: `在${subject}学习中，你的感受是？🔬`,
      options: ["得心应手，很有自信", "基础尚可，偶尔吃力", "比较困难，需要帮助"]
    };
  };
  
  // 动态生成步骤列表
  const steps = useMemo(() => {
    const baseSteps = [
      { id: "account", title: "设置账号" },
      { id: "grade", title: "年级", question: "你现在读几年级呀？🎒", options: ["四年级", "五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"] },
      { id: "gender", title: "称呼", question: "工小助该怎么称呼你呢？😊", options: ["男生", "女生", "保密"] },
      { id: "math", title: "数学成绩", question: "你的数学成绩大概是什么等级呢？📊", options: ["A", "B", "C", "D"] },
    ];
    return [...baseSteps, getScienceStep(profile.grade)];
  }, [profile.grade]);
  
  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  
  const handleAccountNext = () => {
    if (!username || !password) {
      setError("请填写完整");
      return;
    }
    setError("");
    setStep(1);
  };
  
  const handleOptionSelect = async (option: string) => {
    const fieldMap: Record<string, keyof UserProfile> = {
      grade: "grade",
      gender: "gender",
      math: "math_score",
      science: "science_feeling",
    };
    
    const field = fieldMap[currentStep.id];
    if (field) {
      setProfile((prev) => ({ ...prev, [field]: option }));
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // 完成注册
      await handleRegister({ ...profile, [field]: option });
    }
  };
  
  const handleRegister = async (finalProfile: UserProfile) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await authAPI.register(username, password, finalProfile);
      login(response.access_token, response.user);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
      setStep(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>注册进度</span>
          <span>{step + 1}/{steps.length} 🎯</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-blue-50 rounded-lg p-4 text-blue-700 text-sm">
              💬 工小助：你好！我是工小助，你的AI学习伙伴！让我们先设置你的账号~
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="设置密码"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            
            <button
              onClick={handleAccountNext}
              className={cn(
                "w-full py-3 rounded-xl font-semibold",
                "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
                "hover:shadow-lg transition-all flex items-center justify-center gap-2"
              )}
            >
              开始注册 <ChevronRight size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-blue-50 rounded-lg p-4 text-blue-700 text-sm">
              💬 工小助：{currentStep.question}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {currentStep.options?.map((option) => (
                <motion.button
                  key={option}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isLoading}
                  className={cn(
                    "p-4 rounded-xl border-2 border-gray-200",
                    "hover:border-blue-500 hover:bg-blue-50",
                    "transition-all text-sm font-medium",
                    "disabled:opacity-50"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    option
                  )}
                </motion.button>
              ))}
            </div>
            
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
