"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";

export default function ChatPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    router.push("/");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen h-[100dvh] flex flex-col md:flex-row bg-[#f5f5f7] overflow-hidden">
      {/* 侧边栏 - 包含移动端头部 */}
      <Sidebar onLogout={handleLogout} />

      {/* 主内容区 - 移动端需要留出顶部空间 */}
      <div className="flex-1 flex flex-col pt-14 md:pt-0 overflow-hidden">
        <ChatContainer />
      </div>
    </div>
  );
}
