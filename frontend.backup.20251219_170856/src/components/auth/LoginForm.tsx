"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuthStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("请填写完整");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await authAPI.login(username, password);
      login(response.access_token, response.user);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="bg-blue-50 rounded-lg p-4 text-blue-700 text-sm">
        💬 工小助：很高兴再次见到你！准备好继续我们的学习之旅了吗？
      </div>
      
      <div className="space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
            className={cn(
              "w-full pl-10 pr-4 py-3 rounded-xl border-2",
              "focus:outline-none focus:border-blue-500",
              "transition-colors"
            )}
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className={cn(
              "w-full pl-10 pr-4 py-3 rounded-xl border-2",
              "focus:outline-none focus:border-blue-500",
              "transition-colors"
            )}
          />
        </div>
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm text-center"
        >
          {error}
        </motion.p>
      )}
      
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full py-3 rounded-xl font-semibold",
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
          "hover:shadow-lg hover:scale-[1.02]",
          "active:scale-[0.98]",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : (
          "登录"
        )}
      </button>
    </motion.form>
  );
}
