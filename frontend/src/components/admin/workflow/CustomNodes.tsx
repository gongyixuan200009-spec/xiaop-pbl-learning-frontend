"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { motion } from "framer-motion";

// 节点数据类型
export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  stepType?: "extract" | "reply" | "extract_and_reply";
  model?: string;
  prompt_template?: string;
  stepId?: string;
}

// 节点颜色配置
const nodeColors = {
  start: { bg: "#dcfce7", border: "#22c55e", text: "#166534", icon: "▶" },
  end: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", icon: "■" },
  extract: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", icon: "📋" },
  reply: { bg: "#f3e8ff", border: "#a855f7", text: "#6b21a8", icon: "💬" },
  extract_and_reply: { bg: "#ffedd5", border: "#f97316", text: "#9a3412", icon: "🔄" },
};

// 基础节点样式
const baseNodeStyle = `
  px-4 py-3 rounded-xl shadow-sm
  border-2 transition-all duration-200
  hover:shadow-md cursor-pointer
  min-w-[140px]
`;

// 自定义节点类型
type CustomNodeType = "start" | "end" | "extract" | "reply" | "extract_and_reply";
type CustomNode = Node<WorkflowNodeData, CustomNodeType>;

// 开始节点
export const StartNode = memo(({ selected }: NodeProps<CustomNode>) => {
  const colors = nodeColors.start;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${baseNodeStyle} ${selected ? "ring-2 ring-offset-2 ring-green-500" : ""}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{colors.icon}</span>
        <span
          className="text-sm font-semibold"
          style={{ color: colors.text }}
        >
          开始
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
    </motion.div>
  );
});
StartNode.displayName = "StartNode";

// 结束节点
export const EndNode = memo(({ selected }: NodeProps<CustomNode>) => {
  const colors = nodeColors.end;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${baseNodeStyle} ${selected ? "ring-2 ring-offset-2 ring-red-500" : ""}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-2">
        <span className="text-lg">{colors.icon}</span>
        <span
          className="text-sm font-semibold"
          style={{ color: colors.text }}
        >
          结束
        </span>
      </div>
    </motion.div>
  );
});
EndNode.displayName = "EndNode";

// 提取节点
export const ExtractNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  const colors = nodeColors.extract;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${baseNodeStyle} ${selected ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{colors.icon}</span>
          <span
            className="text-sm font-semibold truncate max-w-[100px]"
            style={{ color: colors.text }}
          >
            {data.label || "字段提取"}
          </span>
        </div>
        {data.model && (
          <span className="text-xs text-gray-500 ml-6">
            {data.model === "fast" ? "快速模型" : data.model === "vision" ? "视觉模型" : "默认模型"}
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
    </motion.div>
  );
});
ExtractNode.displayName = "ExtractNode";

// 回复节点
export const ReplyNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  const colors = nodeColors.reply;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${baseNodeStyle} ${selected ? "ring-2 ring-offset-2 ring-purple-500" : ""}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500 !border-2 !border-white"
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{colors.icon}</span>
          <span
            className="text-sm font-semibold truncate max-w-[100px]"
            style={{ color: colors.text }}
          >
            {data.label || "生成回复"}
          </span>
        </div>
        {data.model && (
          <span className="text-xs text-gray-500 ml-6">
            {data.model === "fast" ? "快速模型" : data.model === "vision" ? "视觉模型" : "默认模型"}
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-purple-500 !border-2 !border-white"
      />
    </motion.div>
  );
});
ReplyNode.displayName = "ReplyNode";

// 提取+回复节点（单Agent）
export const ExtractAndReplyNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  const colors = nodeColors.extract_and_reply;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${baseNodeStyle} ${selected ? "ring-2 ring-offset-2 ring-orange-500" : ""}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-orange-500 !border-2 !border-white"
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{colors.icon}</span>
          <span
            className="text-sm font-semibold truncate max-w-[100px]"
            style={{ color: colors.text }}
          >
            {data.label || "提取+回复"}
          </span>
        </div>
        {data.model && (
          <span className="text-xs text-gray-500 ml-6">
            {data.model === "fast" ? "快速模型" : data.model === "vision" ? "视觉模型" : "默认模型"}
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-orange-500 !border-2 !border-white"
      />
    </motion.div>
  );
});
ExtractAndReplyNode.displayName = "ExtractAndReplyNode";

// 导出节点类型映射
export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  extract: ExtractNode,
  reply: ReplyNode,
  extract_and_reply: ExtractAndReplyNode,
};
