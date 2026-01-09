"use client";

import { motion } from "framer-motion";
import { useState, memo } from "react";
import Image from "next/image";
import { useTypewriter } from "@/hooks/useTypewriter";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  isNew?: boolean;
  isStreaming?: boolean;
  onTypingComplete?: () => void;
}

// 完全静态的用户消息组件 - 渲染一次后永不更新
const StaticUserBubble = memo(function StaticUserBubble({
  content,
  imageUrl,
  isNew = false,
}: {
  content: string;
  imageUrl?: string;
  isNew?: boolean;
}) {
  // 防御性检查：确保 content 是字符串
  const safeContent = typeof content === 'string' ? content :
                     (content && typeof content === 'object') ? JSON.stringify(content) : String(content || '');

  const bubbleContent = (
    <div
      className="shadow-sm bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/20"
      style={{
        maxWidth: "min(80%, 600px)",
        padding: "var(--space-sm) var(--space-md)",
        borderRadius: "var(--radius-lg)",
        borderTopRightRadius: "var(--radius-sm)",
        transform: "translateZ(0)",
      }}
    >
      {/* Image display */}
      {imageUrl && (
        <div className="mb-2">
          <img
            src={imageUrl}
            alt="用户上传的图片"
            className="max-w-full max-h-60 rounded-lg object-contain"
            style={{ maxWidth: "min(100%, 300px)" }}
          />
        </div>
      )}

      <p
        className="leading-relaxed whitespace-pre-wrap"
        style={{ fontSize: "var(--text-sm)" }}
      >
        {safeContent}
      </p>
    </div>
  );

  // 新消息使用入场动画
  if (isNew) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-row-reverse"
        style={{ gap: "var(--space-sm)" }}
      >
        {bubbleContent}
      </motion.div>
    );
  }

  // 历史消息完全静态
  return (
    <div
      className="flex flex-row-reverse"
      style={{ gap: "var(--space-sm)" }}
    >
      {bubbleContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：用户消息一旦渲染就永不更新
  // 只有当 isNew 从 true 变为 false 时才允许更新（动画完成）
  if (prevProps.isNew && !nextProps.isNew) {
    return false; // 允许更新
  }
  return true; // 阻止所有其他更新
});

// 助手消息组件 - 支持打字机效果和流式更新
function AssistantBubble({
  content,
  imageUrl,
  isNew = false,
  isStreaming = false,
  onTypingComplete
}: {
  content: string;
  imageUrl?: string;
  isNew?: boolean;
  isStreaming?: boolean;
  onTypingComplete?: () => void;
}) {
  // 只有首次挂载且是新消息时才需要动画
  const [shouldAnimate] = useState(() => isNew && !isStreaming);

  // 流式模式下不使用打字机效果
  const shouldUseTypewriter = isNew && !isStreaming;

  const { displayText, isTyping, skip } = useTypewriter({
    text: shouldUseTypewriter ? content : content,
    speed: shouldUseTypewriter ? 20 : 0,
    onComplete: onTypingComplete,
  });

  // 流式模式直接显示内容，否则使用打字机效果
  // 防御性检查：确保 content 是字符串
  const safeContent = typeof content === 'string' ? content :
                     (content && typeof content === 'object') ? JSON.stringify(content) : String(content || '');
  const finalText = isStreaming ? safeContent : (shouldUseTypewriter ? displayText : safeContent);

  const messageContent = (
    <>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className="rounded-full overflow-hidden ring-2 ring-[#0071e3]/20 shadow-md"
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
      </div>

      {/* Message bubble */}
      <div
        className="shadow-sm bg-white text-[#1d1d1f] border border-[#d2d2d7]/30"
        style={{
          maxWidth: "min(80%, 600px)",
          padding: "var(--space-sm) var(--space-md)",
          borderRadius: "var(--radius-lg)",
          borderTopLeftRadius: "var(--radius-sm)",
          transform: "translateZ(0)",
        }}
        onClick={isTyping ? skip : undefined}
      >
        {/* Image display */}
        {imageUrl && (
          <div className="mb-2">
            <img
              src={imageUrl}
              alt="用户上传的图片"
              className="max-w-full max-h-60 rounded-lg object-contain"
              style={{ maxWidth: "min(100%, 300px)" }}
            />
          </div>
        )}

        <p
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontSize: "var(--text-sm)" }}
        >
          {finalText}
          {/* 流式模式或打字机效果时显示光标 */}
          {(isStreaming || isTyping) && (
            <span
              className="inline-block bg-[#0071e3] animate-pulse rounded-full"
              style={{
                width: "clamp(2px, 0.5vw, 3px)",
                height: "clamp(12px, 3vw, 16px)",
                marginLeft: "var(--space-xs)"
              }}
            />
          )}
        </p>
      </div>
    </>
  );

  // 只有新消息需要动画
  if (shouldAnimate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-row"
        style={{ gap: "var(--space-sm)" }}
      >
        {messageContent}
      </motion.div>
    );
  }

  // 静态消息
  return (
    <div className="flex flex-row" style={{ gap: "var(--space-sm)" }}>
      {messageContent}
    </div>
  );
}

// 主组件 - 根据角色分发到不同的子组件
export function MessageBubble({
  role,
  content,
  imageUrl,
  isNew = false,
  isStreaming = false,
  onTypingComplete
}: MessageBubbleProps) {
  if (role === "user") {
    return (
      <StaticUserBubble
        content={content}
        imageUrl={imageUrl}
        isNew={isNew}
      />
    );
  }

  return (
    <AssistantBubble
      content={content}
      imageUrl={imageUrl}
      isNew={isNew}
      isStreaming={isStreaming}
      onTypingComplete={onTypingComplete}
    />
  );
}
