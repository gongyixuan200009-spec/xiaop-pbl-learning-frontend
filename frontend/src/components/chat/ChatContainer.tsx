"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TaskProgress } from "./TaskProgress";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { chatAPI } from "@/lib/api";
import { Loader2, ChevronDown, CheckCircle, ArrowRight, Lock, BookOpen, Award } from "lucide-react";

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
    // 测试相关状态
    isInTest,
    testPassed,
    testChatHistory,
    testCredential,
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
    // 测试相关方法
    startTest,
    addTestMessage,
    setTestPassed,
    setTestState,
    cleanInvalidMessages,
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
  const [isStartingTest, setIsStartingTest] = useState(false);
  const [testStreamingContent, setTestStreamingContent] = useState<string>("");
  const [isTestStreaming, setIsTestStreaming] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const lastScrollTime = useRef(0);

  const currentForm = getCurrentForm();
  const isCurrentStepConfirmed = isStepConfirmed(currentFormId);

  // Load forms and user progress
  useEffect(() => {
    const loadData = async () => {
      try {
        const formsData = await chatAPI.getForms();
        console.log('[DEBUG] 加载表单数据:', formsData.map(f => ({
          id: f.id,
          name: f.name,
          test_enabled: f.test_enabled,
          test_pass_pattern: f.test_pass_pattern
        })));
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
            // 加载测试状态
            isInTest: stepData.is_in_test || false,
            testPassed: stepData.test_passed || false,
            testChatHistory: stepData.test_chat_history || [],
            testCredential: stepData.test_credential || "",
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
      const desc = currentForm.user_description || currentForm.description;
      let welcomeMsg = "嗨 " + user.username + "！我是工小助，你的AI学习伙伴！\n\n" + desc + "\n\n";

      if (previousSummaries.length > 0) {
        welcomeMsg += "在开始之前，让我们回顾一下你之前的内容：\n";
      }

      welcomeMsg += "准备好了吗？让我们一起加油吧！";
      addMessage({ role: "assistant", content: welcomeMsg });
    }
  }, [currentForm, chatHistory.length, user, addMessage, previousSummaries, isCurrentStepConfirmed]);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    });
  }, []);

  // 优化滚动逻辑：只在新消息添加时滚动，流式更新时使用更长的节流
  useEffect(() => {
    // 非流式模式下，直接滚动
    if (!isStreaming && !isTestStreaming) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      });
    }
  }, [chatHistory, testChatHistory, isStreaming, isTestStreaming]);

  // 流式滚动使用更长的节流时间
  useEffect(() => {
    if ((isStreaming && streamingContent) || (isTestStreaming && testStreamingContent)) {
      const now = Date.now();
      if (now - lastScrollTime.current > 200) {  // 200ms 节流
        lastScrollTime.current = now;
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        });
      }
    }
  }, [streamingContent, testStreamingContent, isStreaming, isTestStreaming]);

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
            // 先添加消息，再清除流式状态，避免闪烁
            // 不设置 newMessageIndex，因为内容已经通过流式展示过了，不需要打字机效果
            addMessage({ role: "assistant", content: textReply });
            // 使用 setTimeout 确保消息先渲染，再清除流式内容
            // 注意：不使用 requestAnimationFrame，因为在移动端浏览器上可能被节流或跳过
            setTimeout(() => {
              setStreamingContent("");
              setIsStreaming(false);
              setLoading(false);
            }, 0);
          },
          onError: (error) => {
            console.error("流式消息失败:", error);
            setStreamingContent("");
            setIsStreaming(false);

            // 检查是否是验证错误
            if (error && (error as any).isValidationError) {
              console.warn("[硬性容错] 检测到验证错误，清理历史记录并准备重试");

              // 清理无效消息
              cleanInvalidMessages();

              // 显示友好的错误提示
              addMessage({
                role: "assistant",
                content: "检测到历史记录中有无效数据，已自动清理。请重新发送您的消息。",
              });
              setLoading(false);
              return;
            }

            // 普通错误处理
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

      // 检查是否是验证错误
      if (error && error.isValidationError) {
        console.warn("[硬性容错] 检测到验证错误，清理历史记录并准备重试");

        // 清理无效消息
        cleanInvalidMessages();

        // 显示友好的错误提示
        addMessage({
          role: "assistant",
          content: "检测到历史记录中有无效数据，已自动清理。请重新发送您的消息。",
        });
        setLoading(false);
        return;
      }

      // 普通错误处理
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

  // 开始测试
  const handleStartTest = async () => {
    if (!token || isStartingTest) return;

    console.log('[DEBUG] handleStartTest 被调用');
    setIsStartingTest(true);
    try {
      const response = await chatAPI.startTest(token, currentFormId);
      console.log('[DEBUG] startTest API 响应:', response);

      if (response.success && response.test_enabled) {
        console.log('[DEBUG] 测试已启用，进入测试模式');
        startTest();
        // 先添加工小助的引导语
        addTestMessage({
          role: "assistant",
          content: "接下来让我们做一个小测试，考察你是否完全掌握了。你准备好了么？"
        });
        // 使用 setTimeout 确保引导语先渲染，再发送用户的自动回复
        setTimeout(() => {
          handleSendTestMessageAuto("好的，我准备好了！");
        }, 100);
      } else {
        // 测试未启用，直接进入确认流程
        console.log('[DEBUG] 测试未启用或启动失败，跳过测试直接确认', { success: response.success, test_enabled: response.test_enabled });
        handleConfirmStep();
      }
    } catch (error) {
      console.error("开始测试失败:", error);
    } finally {
      setIsStartingTest(false);
    }
  };

  // 自动发送测试消息（用于测试开始时自动触发 AI 提问）
  const handleSendTestMessageAuto = async (message: string) => {
    if (!token || !currentForm) return;

    addTestMessage({ role: "user", content: message });
    setLoading(true);
    setIsTestStreaming(true);
    setTestStreamingContent("");

    try {
      await chatAPI.sendTestMessageStream(
        token,
        message,
        currentFormId,
        [], // 空的历史，因为刚开始测试
        {
          onThinking: (msg) => {
            console.log("[Test Thinking]", msg);
          },
          onContent: (content) => {
            const textContent = typeof content === 'string' ? content :
                               (content && typeof content === 'object') ? JSON.stringify(content) : String(content || '');
            setTestStreamingContent(prev => prev + textContent);
          },
          onDone: (data) => {
            const { full_reply, is_passed, pass_credential } = data;
            const textReply = typeof full_reply === 'string' ? full_reply :
                             (full_reply && typeof full_reply === 'object') ? JSON.stringify(full_reply) : String(full_reply || '');
            addTestMessage({ role: "assistant", content: textReply });
            // 使用 setTimeout 替代 requestAnimationFrame，在移动端浏览器上更可靠
            // requestAnimationFrame 在页面后台或省电模式下可能被跳过，导致 testPassed 状态无法更新
            setTimeout(() => {
              setTestStreamingContent("");
              setIsTestStreaming(false);
              setLoading(false);
              if (is_passed) {
                setTestPassed(true, pass_credential);
              }
            }, 0);
          },
          onError: (error) => {
            console.error("测试消息失败:", error);
            setTestStreamingContent("");
            setIsTestStreaming(false);

            // 检查是否是验证错误
            if (error && (error as any).isValidationError) {
              console.warn("[硬性容错] 检测到测试消息验证错误，清理历史记录");

              // 清理无效消息
              cleanInvalidMessages();

              // 显示友好的错误提示
              addTestMessage({
                role: "assistant",
                content: "检测到历史记录中有无效数据，已自动清理。请重新发送您的消息。",
              });
              setLoading(false);
              return;
            }

            // 普通错误处理
            let errorMsg = "抱歉，我遇到了一些问题，请稍后再试~";
            if (error && error.message) {
              errorMsg = typeof error.message === 'string' ? error.message : String(error.message);
            }
            addTestMessage({
              role: "assistant",
              content: errorMsg,
            });
            setLoading(false);
          }
        }
      );
    } catch (error: any) {
      console.error("自动发送测试消息失败:", error);
      setTestStreamingContent("");
      setIsTestStreaming(false);

      // 检查是否是验证错误
      if (error && error.isValidationError) {
        console.warn("[硬性容错] 检测到测试消息验证错误，清理历史记录");

        // 清理无效消息
        cleanInvalidMessages();

        // 显示友好的错误提示
        addTestMessage({
          role: "assistant",
          content: "检测到历史记录中有无效数据，已自动清理。请重新发送您的消息。",
        });
        setLoading(false);
        return;
      }

      // 普通错误处理
      let errorMsg = "抱歉，我遇到了一些问题，请稍后再试~";
      if (error && error.message) {
        errorMsg = typeof error.message === 'string' ? error.message : String(error.message);
      }
      addTestMessage({
        role: "assistant",
        content: errorMsg,
      });
      setLoading(false);
    }
  };

  // 发送测试消息
  const handleSendTestMessage = async (message: string, imageUrl?: string) => {
    if (!token || !currentForm || isCurrentStepConfirmed) return;

    addTestMessage({ role: "user", content: message, image_url: imageUrl });
    setLoading(true);
    setIsTestStreaming(true);
    setTestStreamingContent("");

    try {
      await chatAPI.sendTestMessageStream(
        token,
        message,
        currentFormId,
        testChatHistory,
        {
          onThinking: (msg) => {
            console.log("[Test Thinking]", msg);
          },
          onContent: (content) => {
            const textContent = typeof content === 'string' ? content :
                               (content && typeof content === 'object') ? JSON.stringify(content) : String(content || '');
            setTestStreamingContent(prev => prev + textContent);
          },
          onDone: (data) => {
            const { full_reply, is_passed, pass_credential } = data;
            const textReply = typeof full_reply === 'string' ? full_reply :
                             (full_reply && typeof full_reply === 'object') ? JSON.stringify(full_reply) : String(full_reply || '');
            // 先添加消息，再清除流式状态，避免闪烁
            addTestMessage({ role: "assistant", content: textReply });
            // 使用 setTimeout 替代 requestAnimationFrame，在移动端浏览器上更可靠
            // requestAnimationFrame 在页面后台或省电模式下可能被跳过，导致弹窗无法显示
            setTimeout(() => {
              setTestStreamingContent("");
              setIsTestStreaming(false);
              setLoading(false);
              // 如果测试通过
              if (is_passed) {
                setTestPassed(true, pass_credential);
              }
            }, 0);
          },
          onError: (error) => {
            console.error("测试消息失败:", error);
            setTestStreamingContent("");
            setIsTestStreaming(false);

            // 检查是否是验证错误
            if (error && (error as any).isValidationError) {
              console.warn("[硬性容错] 检测到测试消息验证错误，清理历史记录");

              // 清理无效消息
              cleanInvalidMessages();

              // 显示友好的错误提示
              addTestMessage({
                role: "assistant",
                content: "检测到历史记录中有无效数据，已自动清理。请重新发送您的消息。",
              });
              setLoading(false);
              return;
            }

            // 普通错误处理
            let errorMsg = "抱歉，我遇到了一些问题，请稍后再试~";
            if (error && error.message) {
              errorMsg = typeof error.message === 'string' ? error.message : String(error.message);
            }
            addTestMessage({
              role: "assistant",
              content: errorMsg,
            });
            setLoading(false);
          }
        },
        imageUrl
      );
    } catch (error: any) {
      console.error("发送测试消息失败:", error);
      setTestStreamingContent("");
      setIsTestStreaming(false);

      // 检查是否是验证错误
      if (error && error.isValidationError) {
        console.warn("[硬性容错] 检测到测试消息验证错误，清理历史记录");

        // 清理无效消息
        cleanInvalidMessages();

        // 显示友好的错误提示
        addTestMessage({
          role: "assistant",
          content: "检测到历史记录中有无效数据，已自动清理。请重新发送您的消息。",
        });
        setLoading(false);
        return;
      }

      // 普通错误处理
      let errorMsg = "抱歉，我遇到了一些问题，请稍后再试~";
      if (error && error.message) {
        errorMsg = typeof error.message === 'string' ? error.message : String(error.message);
      }
      addTestMessage({
        role: "assistant",
        content: errorMsg,
      });
      setLoading(false);
    }
  };

  // 重置当前阶段
  const handleResetStep = async () => {
    if (!token || isResetting) return;

    setIsResetting(true);
    try {
      const response = await chatAPI.resetStep(token, currentFormId);

      if (response.success) {
        // 重新加载阶段数据
        const stepData = await chatAPI.getStepData(token, currentFormId);
        setStepData(currentFormId, stepData as any);

        // 重新加载用户进度
        const progress = await chatAPI.getUserProgress(token);
        setUserProgress(
          progress.current_step,
          progress.completed_steps,
          progress.step_data as Record<number, any>
        );

        // 关闭确认对话框
        setShowResetConfirm(false);
      }
    } catch (error) {
      console.error("重置阶段失败:", error);
    } finally {
      setIsResetting(false);
    }
  };

  // 检查当前 form 是否启用了测试
  const isTestEnabled = currentForm?.test_enabled === true;

  // 调试：打印测试相关状态
  console.log('[DEBUG] 关卡测试状态:', {
    currentFormId,
    currentFormExists: !!currentForm,
    test_enabled: currentForm?.test_enabled,
    isTestEnabled,
    isInTest,
    testPassed,
  });

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
                  <span className="text-[#86868b]">{ps.summary}</span>
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
          <div className="flex items-center justify-between w-full" style={{ padding: "var(--space-sm) var(--space-md)" }}>
            <button
              onClick={() => setProgressExpanded(!progressExpanded)}
              className="flex items-center gap-2 md:hidden flex-1"
              style={{ fontSize: "var(--text-xs)" }}
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

            {/* Desktop title */}
            <div className="hidden md:block text-[#1d1d1f] font-medium" style={{ fontSize: "var(--text-xs)" }}>
              任务进度 ({completedCount}/{totalCount})
            </div>

            {/* Reset button - only show if not confirmed and has data */}
            {(() => {
              const hasData = chatHistory.length > 0 || Object.keys(extractedFields).length > 0;
              console.log('[DEBUG] Reset button visibility:', {
                isCurrentStepConfirmed,
                chatHistoryLength: chatHistory.length,
                extractedFieldsCount: Object.keys(extractedFields).length,
                hasData,
                shouldShow: !isCurrentStepConfirmed && hasData
              });
              return !isCurrentStepConfirmed && hasData ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="text-[#ff3b30] hover:text-[#ff453a] font-medium transition-colors"
                  style={{ fontSize: "var(--text-xs)" }}
                >
                  重置
                </button>
              ) : null;
            })()}
          </div>

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

      {/* 测试进度指示器 - 表单完成且启用测试时显示 */}
      {currentForm && isTestEnabled && (isComplete || needsConfirmation || isInTest) && !isCurrentStepConfirmed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/30 flex-shrink-0"
          style={{ padding: "var(--space-sm) var(--space-md)" }}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center" style={{ gap: "var(--space-sm)" }}>
              <div
                className={`rounded-full flex items-center justify-center ${
                  testPassed ? 'bg-[#34c759]' : isInTest ? 'bg-[#ff9500]' : 'bg-[#86868b]'
                }`}
                style={{ width: "var(--icon-md)", height: "var(--icon-md)" }}
              >
                {testPassed ? (
                  <CheckCircle className="text-white" style={{ width: "60%", height: "60%" }} />
                ) : (
                  <BookOpen className="text-white" style={{ width: "60%", height: "60%" }} />
                )}
              </div>
              <div className="flex items-center" style={{ gap: "var(--space-xs)" }}>
                <span className="font-medium text-[#1d1d1f]" style={{ fontSize: "var(--text-sm)" }}>
                  关卡测试
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    testPassed
                      ? 'bg-[#34c759]/10 text-[#34c759]'
                      : isInTest
                        ? 'bg-[#ff9500]/10 text-[#ff9500]'
                        : 'bg-[#86868b]/10 text-[#86868b]'
                  }`}
                  style={{ fontSize: "var(--text-xs)" }}
                >
                  {testPassed ? '已通过' : isInTest ? '进行中' : '待开始'}
                </span>
              </div>
            </div>
            {testCredential && (
              <span
                className="font-mono text-[#34c759] bg-[#34c759]/10 px-2 py-1 rounded-lg truncate max-w-[200px]"
                style={{ fontSize: "var(--text-xs)" }}
                title={testCredential}
              >
                {testCredential}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{ padding: "var(--space-md)" }}
      >
        <div className="max-w-3xl mx-auto">
          {/* 历史消息容器 - 使用 block 布局，完全隔离 */}
          <div style={{ contain: "content" }}>
            {chatHistory.map((msg, index) => (
              <div
                key={`history-${index}-${msg.role}`}
                style={{
                  marginBottom: "var(--space-xs)",
                  contain: "layout style",
                }}
              >
                <MessageBubble
                  role={msg.role}
                  content={msg.content}
                  imageUrl={msg.image_url}
                  isNew={index === newMessageIndex}
                  onTypingComplete={() => setNewMessageIndex(-1)}
                />
              </div>
            ))}
          </div>

          {/* 流式消息 - 独立容器，不影响历史消息 */}
          {isStreaming && streamingContent && (
            <div style={{ marginBottom: "var(--space-xs)" }}>
              <MessageBubble
                role="assistant"
                content={streamingContent}
                isNew={false}
                isStreaming={true}
              />
            </div>
          )}

          {/* 测试阶段分隔线 */}
          {isInTest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center my-4"
              style={{ gap: "var(--space-sm)" }}
            >
              <div className="flex-1 h-px bg-[#ff9500]/30"></div>
              <div className="flex items-center bg-[#ff9500]/10 rounded-full px-4 py-2" style={{ gap: "var(--space-xs)" }}>
                <BookOpen style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} className="text-[#ff9500]" />
                <span className="text-[#ff9500] font-medium" style={{ fontSize: "var(--text-xs)" }}>关卡测试</span>
              </div>
              <div className="flex-1 h-px bg-[#ff9500]/30"></div>
            </motion.div>
          )}

          {/* 测试对话历史 */}
          {isInTest && (
            <div style={{ contain: "content" }}>
              {testChatHistory.map((msg, index) => (
                <div
                  key={`test-msg-${index}`}
                  style={{
                    marginBottom: "var(--space-xs)",
                    contain: "layout style",
                  }}
                >
                  <MessageBubble
                    role={msg.role}
                    content={msg.content}
                    imageUrl={msg.image_url}
                    isNew={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 测试流式消息显示 */}
          {isTestStreaming && testStreamingContent && (
            <div style={{ marginBottom: "var(--space-xs)" }}>
              <MessageBubble
                role="assistant"
                content={testStreamingContent}
                isNew={false}
                isStreaming={true}
              />
            </div>
          )}

          {/* 测试通过凭证显示 */}
          {isInTest && testPassed && testCredential && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-[#34c759]/10 to-[#30d158]/10 border border-[#34c759]/30 rounded-vw-lg my-4"
              style={{ padding: "var(--space-lg)" }}
            >
              <div className="flex items-center justify-center" style={{ gap: "var(--space-sm)" }}>
                <div
                  className="rounded-full bg-[#34c759] flex items-center justify-center"
                  style={{ width: "var(--icon-xl)", height: "var(--icon-xl)" }}
                >
                  <Award className="text-white" style={{ width: "60%", height: "60%" }} />
                </div>
                <div>
                  <p className="text-[#34c759] font-bold" style={{ fontSize: "var(--text-md)" }}>🎉 测试通过！</p>
                  <p className="text-[#34c759]/80 font-mono" style={{ fontSize: "var(--text-xs)" }}>{testCredential}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 加载状态（等待字段提取时显示） */}
          {isLoading && !streamingContent && !testStreamingContent && (
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

      {/* Completion confirmation / Start Test / Test Passed */}
      <AnimatePresence>
        {/* 情况1: 完成任务但未进入测试 - 显示"开始测试"按钮 */}
        {(isComplete || needsConfirmation) && !isCurrentStepConfirmed && !isInTest && isTestEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border border-[#ff9500]/30 shadow-lg flex-shrink-0 rounded-vw-lg"
            style={{ margin: "0 var(--space-md) var(--space-sm)", padding: "var(--space-lg)" }}
          >
            <div className="flex flex-col items-center" style={{ gap: "var(--space-md)" }}>
              <div className="flex items-center" style={{ gap: "var(--space-xs)" }}>
                <div
                  className="rounded-full bg-[#ff9500] flex items-center justify-center"
                  style={{ width: "var(--icon-lg)", height: "var(--icon-lg)" }}
                >
                  <BookOpen className="text-white" style={{ width: "60%", height: "60%" }} />
                </div>
                <p className="text-[#1d1d1f] font-semibold" style={{ fontSize: "var(--text-sm)" }}>
                  太棒了！本阶段学习已完成！
                </p>
              </div>
              <p className="text-[#86868b] text-center" style={{ fontSize: "var(--text-xs)" }}>
                请通过关卡测试来检验你的学习成果
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartTest}
                disabled={isStartingTest}
                className="flex items-center bg-[#ff9500] text-white rounded-full font-medium shadow-lg shadow-[#ff9500]/25 hover:bg-[#e68600] transition-all disabled:opacity-50 active:scale-95"
                style={{
                  gap: "var(--space-xs)",
                  padding: "var(--space-sm) var(--space-lg)",
                  fontSize: "var(--text-sm)"
                }}
              >
                {isStartingTest ? (
                  <Loader2 className="animate-spin" style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
                ) : (
                  <>
                    <span>开始测试</span>
                    <BookOpen style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 情况2: 测试通过后 - 显示"确认完成"按钮 */}
        {isInTest && testPassed && !isCurrentStepConfirmed && (
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
                  <Award className="text-white" style={{ width: "60%", height: "60%" }} />
                </div>
                <p className="text-[#1d1d1f] font-semibold" style={{ fontSize: "var(--text-sm)" }}>
                  恭喜通过测试！准备进入下一阶段
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
                className="flex items-center bg-[#34c759] text-white rounded-full font-medium shadow-lg shadow-[#34c759]/25 hover:bg-[#30d158] transition-all disabled:opacity-50 active:scale-95"
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

        {/* 情况3: 未启用测试 - 显示原来的"确认完成"按钮 */}
        {(isComplete || needsConfirmation) && !isCurrentStepConfirmed && !isTestEnabled && (
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

      {/* Reset confirmation dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            style={{ padding: "var(--space-md)" }}
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-vw-lg shadow-2xl max-w-md w-full"
              style={{ padding: "var(--space-lg)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-[#1d1d1f] font-semibold" style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-sm)" }}>
                确认重置阶段？
              </h3>
              <p className="text-[#86868b]" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-lg)" }}>
                重置后将清除本阶段的所有聊天记录、提取字段和测试状态。此操作无法撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-[#f5f5f7] text-[#1d1d1f] rounded-full font-medium hover:bg-[#e8e8ed] transition-colors"
                  style={{ padding: "var(--space-sm) var(--space-md)", fontSize: "var(--text-sm)" }}
                >
                  取消
                </button>
                <button
                  onClick={handleResetStep}
                  disabled={isResetting}
                  className="flex-1 bg-[#ff3b30] text-white rounded-full font-medium hover:bg-[#ff453a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ padding: "var(--space-sm) var(--space-md)", fontSize: "var(--text-sm)" }}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="animate-spin" style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
                      <span>重置中...</span>
                    </>
                  ) : (
                    "确认重置"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <ChatInput
        onSend={isInTest && !testPassed ? handleSendTestMessage : handleSend}
        disabled={isLoading || isCurrentStepConfirmed || (isInTest && testPassed)}
        placeholder={
          isCurrentStepConfirmed
            ? "本阶段已完成"
            : isInTest && testPassed
              ? "测试已通过，请确认完成"
              : isInTest
                ? "输入测试答案..."
                : "输入消息..."
        }
      />
    </div>
  );
}
