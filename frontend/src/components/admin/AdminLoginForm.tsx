"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAdminStore } from "@/store/adminStore";

export default function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(password);
    } catch (err) {
      setError("密码错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[360px]"
      >
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight mb-2">
            小P 管理后台
          </h1>
          <p className="text-[15px] text-[#86868b]">
            请输入管理员密码
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                autoFocus
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[#ff3b30] text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || !password}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-[#0071e3] text-white rounded-xl text-[15px] font-medium hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  验证中...
                </span>
              ) : (
                "登录"
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-[#86868b] mt-6">
          仅限管理员访问
        </p>
      </motion.div>
    </div>
  );
}
