"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WorkflowNode, WorkflowNodeData } from "@/lib/workflow-utils";

interface NodeConfigModalProps {
  node: WorkflowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, data: WorkflowNodeData) => void;
  onDelete: (nodeId: string) => void;
}

const stepTypeOptions = [
  { value: "extract", label: "字段提取", description: "从对话中提取表格字段" },
  { value: "reply", label: "生成回复", description: "生成 AI 回复" },
  { value: "extract_and_reply", label: "提取+回复", description: "单 Agent 同时提取和回复" },
];

const modelOptions = [
  { value: "fast", label: "快速模型", description: "适合提取任务，速度快" },
  { value: "default", label: "默认模型", description: "平衡速度和质量" },
  { value: "vision", label: "视觉模型", description: "支持图片理解" },
];

export default function NodeConfigModal({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: NodeConfigModalProps) {
  const [label, setLabel] = useState("");
  const [stepType, setStepType] = useState<"extract" | "reply" | "extract_and_reply">("extract");
  const [model, setModel] = useState("default");
  const [promptTemplate, setPromptTemplate] = useState("");

  useEffect(() => {
    if (node && node.data) {
      setLabel(node.data.label || "");
      setStepType(node.data.stepType || "extract");
      setModel(node.data.model || "default");
      setPromptTemplate(node.data.prompt_template || "");
    }
  }, [node]);

  const handleSave = () => {
    if (!node) return;

    onSave(node.id, {
      label,
      stepType,
      model,
      prompt_template: promptTemplate || undefined,
      stepId: node.data.stepId,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!node) return;
    if (confirm("确定要删除此节点吗？")) {
      onDelete(node.id);
      onClose();
    }
  };

  // 不显示开始和结束节点的配置
  if (node?.type === "start" || node?.type === "end") {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            {/* 头部 */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#d2d2d7]/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1d1d1f]">节点配置</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-5">
              {/* 节点名称 */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  节点名称
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="输入节点名称"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                />
              </div>

              {/* 步骤类型 */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  步骤类型
                </label>
                <div className="space-y-2">
                  {stepTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        stepType === option.value
                          ? "border-[#0071e3] bg-[#0071e3]/5"
                          : "border-[#d2d2d7]/50 hover:border-[#0071e3]/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="stepType"
                        value={option.value}
                        checked={stepType === option.value}
                        onChange={(e) => setStepType(e.target.value as any)}
                        className="mt-0.5 accent-[#0071e3]"
                      />
                      <div>
                        <div className="text-sm font-medium text-[#1d1d1f]">
                          {option.label}
                        </div>
                        <div className="text-xs text-[#86868b] mt-0.5">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 模型选择 */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  模型类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {modelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setModel(option.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        model === option.value
                          ? "border-[#0071e3] bg-[#0071e3]/5"
                          : "border-[#d2d2d7]/50 hover:border-[#0071e3]/30"
                      }`}
                    >
                      <div className="text-sm font-medium text-[#1d1d1f]">
                        {option.label}
                      </div>
                      <div className="text-xs text-[#86868b] mt-0.5 line-clamp-2">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义 Prompt（高级） */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  自定义 Prompt
                  <span className="text-[#86868b] font-normal ml-2">(可选)</span>
                </label>
                <textarea
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  placeholder="留空使用系统默认 Prompt。系统会根据步骤类型自动选择最优的提取或回复 Prompt。"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all resize-none"
                />
                <p className="text-xs text-[#86868b] mt-1.5">
                  提示：留空时使用经过优化的默认 Prompt，适合大多数场景。如需自定义，可在此输入完整的 Prompt 模板。
                </p>
              </div>
            </div>

            {/* 底部操作 */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-[#d2d2d7]/50 flex items-center justify-between">
              <motion.button
                onClick={handleDelete}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 text-sm font-medium text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-xl transition-colors"
              >
                删除节点
              </motion.button>
              <div className="flex gap-3">
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 text-sm font-medium text-[#86868b] hover:bg-[#f5f5f7] rounded-xl transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 text-sm font-medium bg-[#0071e3] text-white rounded-xl hover:bg-[#0077ed] transition-colors"
                >
                  保存
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
