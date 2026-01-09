"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  isNew?: boolean;
  isStreaming?: boolean;
  isTyping?: boolean;
  onTypingComplete?: () => void;
}

export function MessageBubble({
  role,
  content,
  imageUrl,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  // 处理内容 - 确保是字符串
  const safeContent = typeof content === 'string' ? content :
                     (content && typeof content === 'object') ? JSON.stringify(content) : String(content || '');

  return (
    <div
      className={cn(
        "flex",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}
      style={{ gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}
    >
      {/* AI 头像 */}
      {isAssistant && (
        <div
          className="flex-shrink-0 rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c7be] flex items-center justify-center shadow-sm"
          style={{
            width: "clamp(28px, 7vw, 36px)",
            height: "clamp(28px, 7vw, 36px)"
          }}
        >
          <Image
            src="/avatar.png"
            alt="工小助"
            width={36}
            height={36}
            className="rounded-full"
            style={{
              width: "clamp(24px, 6vw, 32px)",
              height: "clamp(24px, 6vw, 32px)"
            }}
          />
        </div>
      )}

      {/* 消息气泡 */}
      <div
        className={cn(
          isUser
            ? "bg-[#0071e3] text-white"
            : "bg-white text-[#1d1d1f] border border-[#d2d2d7]/30"
        )}
        style={{
          maxWidth: "80%",
          minWidth: isAssistant ? "50%" : undefined,
          padding: "var(--space-sm) var(--space-md)",
          borderRadius: "var(--radius-lg)",
          borderTopLeftRadius: isAssistant ? "var(--radius-sm)" : "var(--radius-lg)",
          borderTopRightRadius: isAssistant ? "var(--radius-lg)" : "var(--radius-sm)"
        }}
      >
        {/* 图片显示 */}
        {imageUrl && (
          <div style={{ marginBottom: "var(--space-sm)" }}>
            <Image
              src={imageUrl}
              alt="上传的图片"
              width={200}
              height={200}
              className="rounded-lg object-cover"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        )}

        {/* 消息内容 */}
        <p
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontSize: "var(--text-sm)", margin: 0 }}
        >
          {safeContent}
          {isStreaming && (
            <span
              className="inline-block bg-[#0071e3] rounded-full opacity-70"
              style={{
                width: "clamp(2px, 0.5vw, 3px)",
                height: "clamp(12px, 3vw, 16px)",
                marginLeft: "var(--space-xs)"
              }}
            />
          )}
        </p>
      </div>
    </div>
  );
}
