"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FormConfig,
  previewAPI,
  PromptPreviewResponse,
  DualAgentPromptPreviewResponse,
  SingleAgentPromptPreviewResponse,
  ChatMessage,
} from "@/lib/api";

interface PromptPreviewProps {
  form: FormConfig;
}

export default function PromptPreview({ form }: PromptPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PromptPreviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"extraction" | "reply" | "combined" | "age">("extraction");
  const [includePrevious, setIncludePrevious] = useState(false);
  const [mode, setMode] = useState<"single_agent" | "dual_agent">("dual_agent");
  const [previewGrade, setPreviewGrade] = useState<string>("高二");
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await previewAPI.getPromptPreview(
        form,
        includePrevious,
        mode,
        { grade: previewGrade, gender: "男", math_score: "中等", science_feeling: "一般" }
      );
      setPreviewData(data);
      // 根据模式自动切换默认 tab
      if (data.mode === "single_agent") {
        setActiveTab("combined");
      } else {
        setActiveTab("extraction");
      }
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
  }, [isOpen, form, includePrevious, mode, previewGrade]);

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

  const isDualAgent = (data: PromptPreviewResponse): data is DualAgentPromptPreviewResponse => {
    return data.mode === "dual_agent";
  };

  const isSingleAgent = (data: PromptPreviewResponse): data is SingleAgentPromptPreviewResponse => {
    return data.mode === "single_agent";
  };

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
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {/* 模式选择 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#86868b]">模式:</span>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "single_agent" | "dual_agent")}
                  className="text-xs border border-[#d2d2d7] rounded-lg px-2 py-1 bg-white"
                >
                  <option value="dual_agent">双Agent模式</option>
                  <option value="single_agent">单Agent模式</option>
                </select>
              </div>

              {/* 年龄段选择 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#86868b]">预览年级:</span>
                <select
                  value={previewGrade}
                  onChange={(e) => setPreviewGrade(e.target.value)}
                  className="text-xs border border-[#d2d2d7] rounded-lg px-2 py-1 bg-white"
                >
                  <optgroup label="小学">
                    <option value="三年级">三年级</option>
                    <option value="四年级">四年级</option>
                    <option value="五年级">五年级</option>
                    <option value="六年级">六年级</option>
                  </optgroup>
                  <optgroup label="初中">
                    <option value="初一">初一</option>
                    <option value="初二">初二</option>
                    <option value="初三">初三</option>
                  </optgroup>
                  <optgroup label="高中">
                    <option value="高一">高一</option>
                    <option value="高二">高二</option>
                    <option value="高三">高三</option>
                  </optgroup>
                </select>
              </div>

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

            {/* 模式说明 */}
            {previewData && (
              <div className="bg-[#e8f4fd] border border-[#007AFF]/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-[#007AFF]">
                  <strong>当前模式：</strong>{previewData.mode_description}
                </p>
              </div>
            )}

            {/* Tabs - 根据模式显示不同的标签 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {previewData && isDualAgent(previewData) && (
                <>
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
                </>
              )}
              {previewData && isSingleAgent(previewData) && (
                <button
                  onClick={() => setActiveTab("combined")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "combined"
                      ? "bg-[#0071e3] text-white"
                      : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  组合 Prompt
                </button>
              )}
              <button
                onClick={() => setActiveTab("age")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "age"
                    ? "bg-[#34c759] text-white"
                    : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                年龄段适配规则
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
                    <strong className="ml-2">当前预览年级：{previewGrade}</strong>
                  </p>
                </div>

                {/* 双Agent模式 - 字段提取 */}
                {activeTab === "extraction" && isDualAgent(previewData) && (
                  <div className="space-y-4">
                    {renderChatHistory(previewData.sample_data.chat_history)}
                    {renderPromptContent(
                      previewData.extraction_prompt,
                      "发送给 LLM 的字段提取 Prompt"
                    )}
                  </div>
                )}

                {/* 双Agent模式 - 回复生成 */}
                {activeTab === "reply" && isDualAgent(previewData) && (
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

                    {renderPromptContent(
                      previewData.reply_system_prompt,
                      "System Prompt（角色设定）"
                    )}

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

                {/* 单Agent模式 - 组合 Prompt */}
                {activeTab === "combined" && isSingleAgent(previewData) && (
                  <div className="space-y-4">
                    {/* 输出格式示例 */}
                    <div className="bg-[#e8f4fd] border border-[#007AFF]/20 rounded-xl p-3">
                      <div className="text-xs font-medium text-[#007AFF] mb-2">
                        输出格式示例
                      </div>
                      <pre className="text-xs text-[#007AFF]/80 font-mono whitespace-pre-wrap">
                        {previewData.output_format_example}
                      </pre>
                    </div>

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

                    {renderPromptContent(
                      previewData.system_prompt,
                      "System Prompt（同时处理提取和回复）"
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[#86868b]">
                        完整 Messages 数组
                      </div>
                      <pre className="bg-[#1d1d1f] text-[#f5f5f7] p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[300px]">
                        {JSON.stringify(previewData.messages, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 年龄段适配规则 */}
                {activeTab === "age" && previewData && (
                  <div className="space-y-4">
                    <div className="bg-[#f0fdf4] border border-[#34c759]/30 rounded-xl p-4">
                      <div className="text-xs font-medium text-[#34c759] mb-2">
                        当前年级 ({previewGrade}) 适用的适配规则
                      </div>
                      <pre className="text-xs text-[#1d1d1f] font-mono whitespace-pre-wrap">
                        {previewData.age_adaptation_rules}
                      </pre>
                    </div>

                    <div className="bg-[#f5f5f7] rounded-xl p-3">
                      <p className="text-xs text-[#86868b]">
                        <strong>说明：</strong>年龄段适配规则会根据学生的年级自动注入到 System Prompt 中，
                        使 AI 根据学生的认知水平调整语言风格、词汇复杂度和引导方式。
                        可以通过上方的"预览年级"下拉菜单切换不同年级查看效果。
                      </p>
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
            点击展开可预览字段提取和回复生成的实际 Prompt，支持切换单/双Agent模式和年龄段适配预览
          </p>
        </div>
      )}
    </div>
  );
}
