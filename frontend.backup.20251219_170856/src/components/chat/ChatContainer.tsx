"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TaskProgress } from "./TaskProgress";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { chatAPI } from "@/lib/api";
import { Loader2, ChevronDown, CheckCircle, ArrowRight, Lock } from "lucide-react";

export function ChatContainer() {
  const { token, user } = useAuthStore();
  const {
    currentFormId,
    forms,
    chatHistory,
    extractedFields,
    isLoading,
    needsConfirmation,
    previousSummaries,
    currentStep,
    completedSteps,
    stepProgress,
    setForms,
    addMessage,
    updateExtractedFields,
    setLoading,
    getCurrentForm,
    setNeedsConfirmation,
    confirmCurrentStep,
    setPreviousSummaries,
    setUserProgress,
    setStepData,
    isStepConfirmed,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [newMessageIndex, setNewMessageIndex] = useState<number>(-1);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [progressExpanded, setProgressExpanded] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSummaries, setShowSummaries] = useState(true);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const lastScrollTime = useRef(0);

  const currentForm = getCurrentForm();
  const isCurrentStepConfirmed = isStepConfirmed(currentFormId);

  // Load forms and user progress
  useEffect(() => {
    const loadData = async () => {
      try {
        const formsData = await chatAPI.getForms();
        setForms(formsData);

        if (token) {
          const progress = await chatAPI.getUserProgress(token);
          setUserProgress(
            progress.current_step,
            progress.completed_steps,
            progress.step_data as Record<number, any>
          );
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    };
    loadData();
  }, [token, setForms, setUserProgress]);

  // Load step data when switching forms
  useEffect(() => {
    const loadStepData = async () => {
      if (!token || !currentFormId) return;

      try {
        const stepData = await chatAPI.getStepData(token, currentFormId);
        if (stepData) {
          setStepData(currentFormId, {
            extractedFields: stepData.extracted_fields,
            chatHistory: stepData.chat_history,
            isConfirmed: stepData.is_confirmed,
            summary: stepData.summary,
          });
        }

        const { summaries } = await chatAPI.getPreviousSummaries(token, currentFormId);
        setPreviousSummaries(summaries);
      } catch (error) {
        console.error("加载阶段数据失败:", error);
      }
    };
    loadStepData();
  }, [token, currentFormId, setStepData, setPreviousSummaries]);

  // Send welcome message
  useEffect(() => {
    if (currentForm && chatHistory.length === 0 && user && !isCurrentStepConfirmed) {
      const welcomeMsg = currentForm.user_description || currentForm.description;
      addMessage({ role: "assistant", content: welcomeMsg });
    }
  }, [currentForm, chatHistory.length, user, addMessage, isCurrentStepConfirmed]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    });
  }, []);

  // 优化滚动逻辑：只在新消息添加时滚动，流式更新时使用更长的节流
  useEffect(() => {
    // 非流式模式下，直接滚动
    if (!isStreaming) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      });
    }
  }, [chatHistory, isStreaming]);

  // 流式滚动使用更长的节流时间
  useEffect(() => {
    if (isStreaming && streamingContent) {
      const now = Date.now();
      if (now - lastScrollTime.current > 200) {  // 200ms 节流
        lastScrollTime.current = now;
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        });
      }
    }
  }, [streamingContent, isStreaming]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSend = async (message: string, imageUrl?: string) => {
    if (!token || !currentForm || isCurrentStepConfirmed) return;

    addMessage({ role: "user", content: message, image_url: imageUrl });
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent("");

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setProgressExpanded(false);
    }

    try {
      await chatAPI.sendMessageStream(
        token,
        message,
        currentFormId,
        chatHistory,
        extractedFields,
        {
          onThinking: (msg) => {
            // 显示thinking状态（如有图片会提示）
            console.log("[Thinking]", msg);
          },
          onExtraction: (data) => {
            // 更新提取的字段
            if (Object.keys(data.extracted_fields).length > 0) {
              updateExtractedFields(data.extracted_fields);
            }
            if (data.needs_confirmation) {
              setNeedsConfirmation(true);
            }
          },
          onContent: (content) => {
            // 流式更新内容 - 确保 content 是字符串
            const textContent = typeof content === 'string' ? content :
                               (content && typeof content === 'object') ? JSON.stringify(content) : String(content || '');
            setStreamingContent(prev => prev + textContent);
          },
          onDone: (fullReply) => {
            // 流式完成，添加完整消息 - 确保 fullReply 是字符串
            const textReply = typeof fullReply === 'string' ? fullReply :
                             (fullReply && typeof fullReply === 'object') ? JSON.stringify(fullReply) : String(fullReply || '');
            setStreamingContent("");
            setIsStreaming(false);
            setNewMessageIndex(chatHistory.length + 1);
            addMessage({ role: "assistant", content: textReply });
            setLoading(false);
          },
          onError: (error) => {
            console.error("流式消息失败:", error);
            setStreamingContent("");
            setIsStreaming(false);
            // 确保错误消息是字符串
            let errorMsg = "抱歉，我遇到了一些问题，请稍后再试~";
            if (error && error.message) {
              errorMsg = typeof error.message === 'string' ? error.message : String(error.message);
            }
            addMessage({
              role: "assistant",
              content: errorMsg,
            });
            setLoading(false);
          }
        },
        imageUrl  // 传递图片URL
      );
    } catch (error: any) {
      console.error("发送消息失败:", error);
      setStreamingContent("");
      setIsStreaming(false);
      // 确保错误消息是字符串
      let errorMsg = "抱歉，我遇到了一些问题，请稍后再试~";
      if (error && error.message) {
        errorMsg = typeof error.message === 'string' ? error.message : String(error.message);
      }
      addMessage({
        role: "assistant",
        content: errorMsg,
      });
      setLoading(false);
    }
  };

  const handleConfirmStep = async () => {
    if (!token || isConfirming) return;

    setIsConfirming(true);
    try {
      const response = await chatAPI.confirmStep(token, currentFormId);

      if (response.success) {
        confirmCurrentStep(response.summary, response.next_form_id);

        const confirmMsg = "太棒了！本阶段已完成！\n\n阶段总结：\n" + response.summary + "\n\n" + (response.next_form_id ? "点击左侧菜单进入下一阶段继续吧！" : "所有阶段都完成了，恭喜你！");
        addMessage({
          role: "assistant",
          content: confirmMsg,
        });
      }
    } catch (error) {
      console.error("确认阶段失败:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const isComplete = currentForm
    ? currentForm.fields.every((f) => extractedFields[f])
    : false;

  const completedCount = currentForm
    ? currentForm.fields.filter((f) => extractedFields[f]).length
    : 0;
  const totalCount = currentForm?.fields.length || 0;

  return (
    <div className="flex flex-col h-full bg-[#f5f5f7] overflow-hidden">
      {/* Mobile header placeholder */}
      <div
        className="md:hidden flex-shrink-0"
        style={{ height: "calc(env(safe-area-inset-top) + var(--header-height))" }}
      />

      {/* Previous summaries card */}
      {previousSummaries.length > 0 && showSummaries && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/30 flex-shrink-0"
        >
          <div style={{ padding: "var(--space-sm) var(--space-md)" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-xs)" }}>
              <h4 className="font-semibold text-[#1d1d1f]" style={{ fontSize: "var(--text-xs)" }}>
                前面阶段回顾
              </h4>
              <button
                onClick={() => setShowSummaries(false)}
                className="text-[#0071e3] hover:underline font-medium"
                style={{ fontSize: "var(--text-xs)" }}
              >
                收起
              </button>
            </div>
            <div
              className="overflow-y-auto"
              style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", maxHeight: "20vh" }}
            >
              {previousSummaries.map((ps) => (
                <div
                  key={ps.form_id}
                  className="bg-[#f5f5f7] rounded-vw-md"
                  style={{ fontSize: "var(--text-xs)", padding: "var(--space-sm)" }}
                >
                  <span className="font-medium text-[#0071e3]">阶段{ps.form_id}：</span>
                  <span className="text-[#86868b]">{ps.summary.slice(0, 100)}...</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirmed notice */}
      {isCurrentStepConfirmed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#34c759]/10 border-b border-[#34c759]/20 flex-shrink-0"
          style={{ padding: "var(--space-sm) var(--space-md)" }}
        >
          <div className="flex items-center text-[#34c759]" style={{ gap: "var(--space-xs)" }}>
            <Lock style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
            <span className="font-medium" style={{ fontSize: "var(--text-xs)" }}>本阶段已完成确认，内容已锁定</span>
          </div>
        </motion.div>
      )}

      {/* Task progress bar */}
      {currentForm && (
        <motion.div
          className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/30 overflow-hidden flex-shrink-0"
          initial={false}
        >
          <button
            onClick={() => setProgressExpanded(!progressExpanded)}
            className="w-full flex items-center justify-between md:hidden"
            style={{ padding: "var(--space-sm) var(--space-md)", fontSize: "var(--text-xs)" }}
          >
            <span className="text-[#1d1d1f] font-medium">
              任务进度 ({completedCount}/{totalCount})
            </span>
            <motion.span
              animate={{ rotate: progressExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} className="text-[#86868b]" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {progressExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ padding: "0 var(--space-md) var(--space-md) var(--space-md)" }}
                className="md:py-4"
              >
                <TaskProgress
                  fields={currentForm.fields}
                  extractedFields={extractedFields}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: "var(--space-md)" }}
      >
        <div className="max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          {chatHistory.map((msg, index) => (
            <MessageBubble
              key={`msg-${index}`}
              role={msg.role}
              content={msg.content}
              imageUrl={msg.image_url}
              isNew={index === newMessageIndex}
              onTypingComplete={() => setNewMessageIndex(-1)}
            />
          ))}

          {/* 流式消息显示 */}
          {isStreaming && streamingContent && (
            <MessageBubble
              role="assistant"
              content={streamingContent}
              isNew={false}
              isStreaming={true}
            />
          )}

          {/* 加载状态（等待字段提取时显示） */}
          {isLoading && !streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center"
              style={{ gap: "var(--space-sm)", padding: "var(--space-md)" }}
            >
              <div
                className="rounded-full bg-[#0071e3] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#0071e3]/25"
                style={{ width: "var(--avatar-sm)", height: "var(--avatar-sm)" }}
              >
                <Loader2
                  className="animate-spin text-white"
                  style={{ width: "50%", height: "50%" }}
                />
              </div>
              <div className="flex" style={{ gap: "var(--space-xs)" }}>
                {[0, 0.2, 0.4].map((delay) => (
                  <motion.span
                    key={delay}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay }}
                    className="bg-[#86868b] rounded-full"
                    style={{ width: "clamp(4px, 1vw, 8px)", height: "clamp(4px, 1vw, 8px)" }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} style={{ height: "var(--space-lg)" }} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bg-white rounded-full shadow-lg border border-[#d2d2d7]/50 flex items-center justify-center hover:bg-[#f5f5f7] transition-colors z-10 active:scale-95"
            style={{
              bottom: "clamp(70px, 18vw, 100px)",
              right: "var(--space-md)",
              width: "var(--btn-height-sm)",
              height: "var(--btn-height-sm)"
            }}
          >
            <ChevronDown style={{ width: "var(--icon-md)", height: "var(--icon-md)" }} className="text-[#1d1d1f]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Completion confirmation */}
      <AnimatePresence>
        {(isComplete || needsConfirmation) && !isCurrentStepConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border border-[#34c759]/30 shadow-lg flex-shrink-0 rounded-vw-lg"
            style={{ margin: "0 var(--space-md) var(--space-sm)", padding: "var(--space-lg)" }}
          >
            <div className="flex flex-col items-center" style={{ gap: "var(--space-md)" }}>
              <div className="flex items-center" style={{ gap: "var(--space-xs)" }}>
                <div
                  className="rounded-full bg-[#34c759] flex items-center justify-center"
                  style={{ width: "var(--icon-lg)", height: "var(--icon-lg)" }}
                >
                  <CheckCircle className="text-white" style={{ width: "60%", height: "60%" }} />
                </div>
                <p className="text-[#1d1d1f] font-semibold" style={{ fontSize: "var(--text-sm)" }}>
                  太棒了！本阶段所有任务已完成！
                </p>
              </div>
              <p className="text-[#86868b] text-center" style={{ fontSize: "var(--text-xs)" }}>
                确认后将保存本阶段内容并解锁下一阶段
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmStep}
                disabled={isConfirming}
                className="flex items-center bg-[#0071e3] text-white rounded-full font-medium shadow-lg shadow-[#0071e3]/25 hover:bg-[#0077ED] transition-all disabled:opacity-50 active:scale-95"
                style={{
                  gap: "var(--space-xs)",
                  padding: "var(--space-sm) var(--space-lg)",
                  fontSize: "var(--text-sm)"
                }}
              >
                {isConfirming ? (
                  <Loader2 className="animate-spin" style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
                ) : (
                  <>
                    <span>确认完成</span>
                    <ArrowRight style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || isCurrentStepConfirmed}
        placeholder={isCurrentStepConfirmed ? "本阶段已完成" : "输入消息..."}
      />
    </div>
  );
}
