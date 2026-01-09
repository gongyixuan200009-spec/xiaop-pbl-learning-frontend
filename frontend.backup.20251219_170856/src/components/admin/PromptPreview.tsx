"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormConfig, previewAPI, PromptPreviewResponse, ChatMessage } from "@/lib/api";

interface PromptPreviewProps {
  form: FormConfig;
}

export default function PromptPreview({ form }: PromptPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PromptPreviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"extraction" | "reply">("extraction");
  const [includePrevious, setIncludePrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await previewAPI.getPromptPreview(form, includePrevious);
      setPreviewData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载预览失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPreview();
    }
  }, [isOpen, form, includePrevious]);

  const renderChatHistory = (messages: ChatMessage[]) => (
    <div className="space-y-2 mb-4">
      <div className="text-xs font-medium text-[#86868b] mb-2">示例对话</div>
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`p-2 rounded-lg text-xs ${
            msg.role === "user"
              ? "bg-[#007AFF]/10 text-[#007AFF] ml-4"
              : "bg-[#f5f5f7] text-[#1d1d1f] mr-4"
          }`}
        >
          <span className="font-medium">
            {msg.role === "user" ? "学生" : "助手"}:
          </span>{" "}
          {msg.content}
        </div>
      ))}
    </div>
  );

  const renderPromptContent = (content: string, title: string) => (
    <div className="space-y-2">
      <div className="text-xs font-medium text-[#86868b]">{title}</div>
      <pre className="bg-[#1d1d1f] text-[#f5f5f7] p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[400px]">
        {content}
      </pre>
    </div>
  );

  return (
    <div className="mt-6 pt-6 border-t border-[#d2d2d7]/50">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-medium text-[#86868b]">
          Prompt 预览
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-[#0071e3] hover:underline"
        >
          {isOpen ? "收起" : "展开预览"}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* 控制选项 */}
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-xs text-[#86868b]">
                <input
                  type="checkbox"
                  checked={includePrevious}
                  onChange={(e) => setIncludePrevious(e.target.checked)}
                  className="rounded border-[#d2d2d7]"
                />
                包含前序阶段信息
              </label>
              <button
                onClick={loadPreview}
                disabled={isLoading}
                className="text-xs text-[#0071e3] hover:underline disabled:opacity-50"
              >
                {isLoading ? "加载中..." : "刷新预览"}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("extraction")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "extraction"
                    ? "bg-[#0071e3] text-white"
                    : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                字段提取 Prompt
              </button>
              <button
                onClick={() => setActiveTab("reply")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "reply"
                    ? "bg-[#0071e3] text-white"
                    : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                回复生成 Prompt
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#ff3b30]/10 text-[#ff3b30] p-3 rounded-xl text-xs mb-4">
                {error}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Content */}
            {!isLoading && previewData && (
              <div className="space-y-4">
                {/* Sample Data Info */}
                <div className="bg-[#fff8e6] border border-[#ffcc00]/30 rounded-xl p-3">
                  <p className="text-xs text-[#8a6d00]">
                    <strong>说明：</strong>以下预览使用固定的示例对话数据生成。
                    实际运行时会根据真实的学生对话和已提取字段动态生成。
                  </p>
                </div>

                {activeTab === "extraction" && (
                  <div className="space-y-4">
                    {/* Show sample chat */}
                    {renderChatHistory(previewData.sample_data.chat_history)}

                    {/* Show extraction prompt */}
                    {renderPromptContent(
                      previewData.extraction_prompt,
                      "发送给 LLM 的字段提取 Prompt"
                    )}
                  </div>
                )}

                {activeTab === "reply" && (
                  <div className="space-y-4">
                    {/* Show sample data */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#f5f5f7] rounded-xl p-3">
                        <div className="text-xs font-medium text-[#86868b] mb-2">
                          示例学生画像
                        </div>
                        <div className="space-y-1 text-xs text-[#1d1d1f]">
                          {Object.entries(previewData.sample_data.user_profile).map(
                            ([k, v]) => (
                              <div key={k}>
                                {k}: {v}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      <div className="bg-[#f5f5f7] rounded-xl p-3">
                        <div className="text-xs font-medium text-[#86868b] mb-2">
                          示例已提取字段
                        </div>
                        <div className="space-y-1 text-xs text-[#1d1d1f]">
                          {Object.entries(
                            previewData.sample_data.extracted_fields
                          ).map(([k, v]) => (
                            <div key={k}>
                              {k}: {v}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Show system prompt */}
                    {renderPromptContent(
                      previewData.reply_system_prompt,
                      "System Prompt（角色设定）"
                    )}

                    {/* Show messages */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[#86868b]">
                        完整 Messages 数组
                      </div>
                      <pre className="bg-[#1d1d1f] text-[#f5f5f7] p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[300px]">
                        {JSON.stringify(previewData.reply_messages, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <div className="bg-[#f5f5f7] rounded-xl p-3">
          <p className="text-xs text-[#86868b]">
            点击展开可预览字段提取和回复生成的实际 Prompt
          </p>
        </div>
      )}
    </div>
  );
}
