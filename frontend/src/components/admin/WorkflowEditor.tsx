"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  Panel,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";

import { nodeTypes } from "./workflow/CustomNodes";
import NodeConfigModal from "./workflow/NodeConfigModal";
import {
  pipelineToWorkflow,
  workflowToPipeline,
  createStepNode,
  validateWorkflow,
  autoLayout,
  type WorkflowNode,
  type WorkflowEdge,
  type WorkflowNodeData,
} from "@/lib/workflow-utils";
import { Pipeline, pipelineAPI } from "@/lib/api";

interface WorkflowEditorProps {
  onPipelineChange?: (pipelineId: string) => void;
}

// 可拖拽的节点类型
const draggableNodeTypes = [
  { type: "extract", label: "字段提取", color: "#3b82f6", icon: "📋" },
  { type: "reply", label: "生成回复", color: "#a855f7", icon: "💬" },
  { type: "extract_and_reply", label: "提取+回复", color: "#f97316", icon: "🔄" },
] as const;

// 默认边样式
const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: "#94a3b8",
  },
  style: {
    strokeWidth: 2,
    stroke: "#94a3b8",
  },
};

export default function WorkflowEditor({ onPipelineChange }: WorkflowEditorProps) {
  // Pipeline 列表状态
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>("dual_agent");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // ReactFlow 状态
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>([]);

  // 节点配置弹窗
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Pipeline 基本信息
  const [pipelineName, setPipelineName] = useState("");
  const [pipelineDescription, setPipelineDescription] = useState("");
  const [pipelineId, setPipelineId] = useState("");

  // 拖拽状态
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // 加载 Pipeline 列表
  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pipelineAPI.getPipelines();
      setPipelines(data.pipelines);
      setActivePipelineId(data.active_pipeline);
    } catch (err) {
      setError("加载 Pipeline 失败");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 激活 Pipeline
  const handleActivate = async (id: string) => {
    setSaving(true);
    try {
      const result = await pipelineAPI.setActivePipeline(id);
      if (result.success) {
        setActivePipelineId(result.active_pipeline);
        showSuccess("Pipeline 已激活");
        onPipelineChange?.(result.active_pipeline);
      }
    } catch (err) {
      setError("激活失败");
    } finally {
      setSaving(false);
    }
  };

  // 删除 Pipeline
  const handleDeletePipeline = async (id: string) => {
    if (!confirm("确定要删除此 Pipeline 吗？")) return;

    setSaving(true);
    try {
      const result = await pipelineAPI.deletePipeline(id);
      if (result.success) {
        showSuccess("Pipeline 已删除");
        loadPipelines();
      }
    } catch (err: any) {
      setError(err.message || "删除失败");
    } finally {
      setSaving(false);
    }
  };

  // 开始编辑
  const startEdit = (pipeline: Pipeline) => {
    const { nodes: flowNodes, edges: flowEdges } = pipelineToWorkflow(pipeline);
    setNodes(flowNodes);
    setEdges(flowEdges);
    setPipelineName(pipeline.name);
    setPipelineDescription(pipeline.description);
    setPipelineId(pipeline.id);
    setEditingPipeline(pipeline);
    setIsCreating(false);
    setIsEditing(true);
  };

  // 开始创建
  const startCreate = () => {
    const newId = `custom_${Date.now()}`;
    // 创建默认的双 Agent 流程
    const defaultNodes: WorkflowNode[] = [
      {
        id: "start",
        type: "start",
        position: { x: 100, y: 200 },
        data: { label: "开始" },
      },
      {
        id: "step_1",
        type: "extract",
        position: { x: 320, y: 200 },
        data: { label: "字段提取", stepType: "extract", model: "fast", stepId: "step_1" },
      },
      {
        id: "step_2",
        type: "reply",
        position: { x: 540, y: 200 },
        data: { label: "生成回复", stepType: "reply", model: "default", stepId: "step_2" },
      },
      {
        id: "end",
        type: "end",
        position: { x: 760, y: 200 },
        data: { label: "结束" },
      },
    ];

    const defaultEdges: WorkflowEdge[] = [
      { id: "start-step_1", source: "start", target: "step_1", ...defaultEdgeOptions },
      { id: "step_1-step_2", source: "step_1", target: "step_2", ...defaultEdgeOptions },
      { id: "step_2-end", source: "step_2", target: "end", ...defaultEdgeOptions },
    ];

    setNodes(defaultNodes);
    setEdges(defaultEdges);
    setPipelineName("新 Pipeline");
    setPipelineDescription("");
    setPipelineId(newId);
    setEditingPipeline(null);
    setIsCreating(true);
    setIsEditing(true);
  };

  // 复制 Pipeline（使用新 API 填充完整 Prompt）
  const handleCopy = async (pipeline: Pipeline) => {
    setSaving(true);
    setError(null);
    try {
      console.log("[handleCopy] 开始复制 Pipeline:", pipeline.id);

      // 调用后端 API 获取填充了完整 Prompt 的副本
      const result = await pipelineAPI.copyPipelineWithPrompts(
        pipeline.id,
        `custom_${Date.now()}`,
        `${pipeline.name} (副本)`
      );

      console.log("[handleCopy] API 返回:", result);

      if (result.success && result.pipeline) {
        // 验证 pipeline 数据格式
        const pipelineData = result.pipeline;
        if (!pipelineData.id || !pipelineData.steps || !Array.isArray(pipelineData.steps)) {
          console.error("[handleCopy] Pipeline 数据格式错误:", pipelineData);
          setError("复制失败：返回的 Pipeline 数据格式错误");
          return;
        }

        console.log("[handleCopy] 转换为工作流...");
        try {
          const { nodes: flowNodes, edges: flowEdges } = pipelineToWorkflow(pipelineData);
          console.log("[handleCopy] 工作流节点:", flowNodes.length, "边:", flowEdges.length);

          setNodes(flowNodes);
          setEdges(flowEdges);
          setPipelineName(pipelineData.name);
          setPipelineDescription(pipelineData.description);
          setPipelineId(pipelineData.id);
          setEditingPipeline(null);
          setIsCreating(true);
          setIsEditing(true);
          showSuccess("已复制完整的 Pipeline 配置（包含 Prompt）");
        } catch (conversionError: any) {
          console.error("[handleCopy] 转换错误:", conversionError);
          setError("复制失败：工作流转换出错 - " + (conversionError?.message || "未知错误"));
        }
      } else {
        console.error("[handleCopy] API 返回失败或无 pipeline:", result);
        setError("复制失败：无效的响应数据");
      }
    } catch (err: any) {
      console.error("[handleCopy] 错误:", err);
      // 尝试获取更详细的错误信息
      let errorMessage = "复制失败";
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err?.toString) {
        errorMessage = err.toString();
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // 编辑预置 Pipeline（自动复制后编辑）
  const handleEditPreset = async (pipeline: Pipeline) => {
    setSaving(true);
    setError(null);
    try {
      console.log("[handleEditPreset] 开始加载预置 Pipeline:", pipeline.id);

      // 调用后端 API 获取填充了完整 Prompt 的副本
      const result = await pipelineAPI.copyPipelineWithPrompts(
        pipeline.id,
        `custom_${Date.now()}`,
        pipeline.name  // 保持原名，用户可以在编辑界面修改
      );

      console.log("[handleEditPreset] API 返回:", result);

      if (result.success && result.pipeline) {
        // 验证 pipeline 数据格式
        const pipelineData = result.pipeline;
        if (!pipelineData.id || !pipelineData.steps || !Array.isArray(pipelineData.steps)) {
          console.error("[handleEditPreset] Pipeline 数据格式错误:", pipelineData);
          setError("加载失败：返回的 Pipeline 数据格式错误");
          return;
        }

        console.log("[handleEditPreset] 转换为工作流...");
        try {
          const { nodes: flowNodes, edges: flowEdges } = pipelineToWorkflow(pipelineData);
          console.log("[handleEditPreset] 工作流节点:", flowNodes.length, "边:", flowEdges.length);

          setNodes(flowNodes);
          setEdges(flowEdges);
          setPipelineName(pipelineData.name);
          setPipelineDescription(pipelineData.description);
          setPipelineId(pipelineData.id);
          setEditingPipeline(null);
          setIsCreating(true);  // 标记为创建新的
          setIsEditing(true);
          showSuccess("已加载预置 Pipeline 配置，修改后将保存为新的自定义 Pipeline");
        } catch (conversionError: any) {
          console.error("[handleEditPreset] 转换错误:", conversionError);
          setError("加载失败：工作流转换出错 - " + (conversionError?.message || "未知错误"));
        }
      } else {
        console.error("[handleEditPreset] API 返回失败或无 pipeline:", result);
        setError("加载失败：无效的响应数据");
      }
    } catch (err: any) {
      console.error("[handleEditPreset] 错误:", err);
      // 尝试获取更详细的错误信息
      let errorMessage = "加载失败";
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err?.toString) {
        errorMessage = err.toString();
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // 保存 Pipeline
  const handleSave = async () => {
    // 验证工作流
    const validation = validateWorkflow(nodes, edges);
    if (!validation.valid) {
      setError(validation.errors.join("; "));
      return;
    }

    // 转换为 Pipeline 格式
    const pipeline = workflowToPipeline(
      nodes,
      edges,
      pipelineId,
      pipelineName,
      pipelineDescription
    );

    setSaving(true);
    setError(null);

    try {
      let result;
      if (isCreating) {
        result = await pipelineAPI.createPipeline(pipeline);
      } else {
        result = await pipelineAPI.updatePipeline(pipelineId, pipeline);
      }

      if (result.success) {
        showSuccess(isCreating ? "Pipeline 创建成功" : "Pipeline 更新成功");
        setIsEditing(false);
        loadPipelines();
      }
    } catch (err: any) {
      setError(err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false);
    setEditingPipeline(null);
    setError(null);
  };

  // 连接边
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...defaultEdgeOptions,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // 双击节点打开配置
  const onNodeDoubleClick = useCallback((_: any, node: WorkflowNode) => {
    if (node.type === "start" || node.type === "end") return;
    setSelectedNode(node);
    setIsConfigOpen(true);
  }, []);

  // 保存节点配置
  const handleNodeConfigSave = useCallback(
    (nodeId: string, data: WorkflowNodeData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // 更新节点类型和数据
            return {
              ...node,
              type: data.stepType as any,
              data: { ...node.data, ...data },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 删除节点
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  // 拖拽开始
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  // 拖拽放置
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const existingIds = nodes.map((n) => n.id);
      const newNode = createStepNode(
        type as "extract" | "reply" | "extract_and_reply",
        position,
        existingIds
      );

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, nodes, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // 自动布局
  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = autoLayout(nodes, edges);
    setNodes(layoutedNodes);
  }, [nodes, edges, setNodes]);

  // 显示成功消息
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-[#86868b]">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        加载中...
      </div>
    );
  }

  // 编辑视图
  if (isEditing) {
    return (
      <div className="h-[600px] flex flex-col">
        {/* 消息提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#ff3b30]/10 text-[#ff3b30] px-4 py-3 rounded-xl text-sm mb-4"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 基本信息 */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-[#86868b] mb-1">Pipeline 名称</label>
            <input
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3]"
              placeholder="输入名称"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-[#86868b] mb-1">描述</label>
            <input
              type="text"
              value={pipelineDescription}
              onChange={(e) => setPipelineDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3]"
              placeholder="输入描述"
            />
          </div>
        </div>

        {/* 工作流编辑器 */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 rounded-xl overflow-hidden border border-[#d2d2d7]/50"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeDoubleClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case "start":
                    return "#22c55e";
                  case "end":
                    return "#ef4444";
                  case "extract":
                    return "#3b82f6";
                  case "reply":
                    return "#a855f7";
                  case "extract_and_reply":
                    return "#f97316";
                  default:
                    return "#94a3b8";
                }
              }}
              maskColor="rgba(255, 255, 255, 0.8)"
              style={{ background: "#f5f5f7" }}
            />

            {/* 左侧节点面板 */}
            <Panel position="top-left" className="!m-2">
              <div className="bg-white rounded-xl shadow-lg border border-[#d2d2d7]/50 p-3">
                <div className="text-xs font-medium text-[#86868b] mb-2">拖拽添加节点</div>
                <div className="space-y-2">
                  {draggableNodeTypes.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:bg-[#f5f5f7]"
                      style={{ borderLeft: `3px solid ${item.color}` }}
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm text-[#1d1d1f]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            {/* 工具栏 */}
            <Panel position="top-right" className="!m-2">
              <div className="flex gap-2">
                <motion.button
                  onClick={handleAutoLayout}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 text-sm font-medium text-[#0071e3] bg-white hover:bg-[#f5f5f7] rounded-lg shadow-sm border border-[#d2d2d7]/50 transition-colors"
                >
                  自动布局
                </motion.button>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-[#86868b]">
            双击节点编辑配置 · 拖拽节点到画布添加 · 拖动连接点建立连接
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={handleCancel}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2 text-sm font-medium text-[#86868b] hover:bg-[#f5f5f7] rounded-xl transition-colors"
            >
              取消
            </motion.button>
            <motion.button
              onClick={handleSave}
              disabled={saving || !pipelineName}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2 text-sm font-medium bg-[#0071e3] text-white rounded-xl hover:bg-[#0077ed] transition-colors disabled:opacity-50"
            >
              {saving ? "保存中..." : isCreating ? "创建" : "保存"}
            </motion.button>
          </div>
        </div>

        {/* 节点配置弹窗 */}
        <NodeConfigModal
          node={selectedNode}
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onSave={handleNodeConfigSave}
          onDelete={handleNodeDelete}
        />
      </div>
    );
  }

  // 列表视图
  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#ff3b30]/10 text-[#ff3b30] px-4 py-3 rounded-xl text-sm"
          >
            {error}
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#34c759]/10 text-[#34c759] px-4 py-3 rounded-xl text-sm"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1d1d1f]">Pipeline 工作流</h3>
          <p className="text-sm text-[#86868b] mt-1">可视化配置 AI Agent 处理流程</p>
        </div>
        <motion.button
          onClick={startCreate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-[#0071e3] text-white rounded-xl text-sm font-medium hover:bg-[#0077ed] transition-colors"
        >
          + 创建 Pipeline
        </motion.button>
      </div>

      {/* Pipeline 列表 */}
      <div className="space-y-3">
        {pipelines.map((pipeline) => (
          <motion.div
            key={pipeline.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border-2 transition-all ${
              activePipelineId === pipeline.id
                ? "border-[#0071e3] bg-[#0071e3]/5"
                : "border-[#d2d2d7]/50 bg-white hover:border-[#0071e3]/30"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[15px] font-medium ${
                      activePipelineId === pipeline.id ? "text-[#0071e3]" : "text-[#1d1d1f]"
                    }`}
                  >
                    {pipeline.name}
                  </span>
                  {pipeline.is_preset && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b]">
                      预置
                    </span>
                  )}
                  {activePipelineId === pipeline.id && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#34c759]">
                      当前使用
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#86868b] mb-3">{pipeline.description}</p>

                {/* 步骤流程图 */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-lg bg-[#dcfce7] text-[#166534]">
                    开始
                  </span>
                  {pipeline.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                      <span className="text-[#86868b] mx-1">→</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-lg ${
                          step.type === "extract"
                            ? "bg-[#dbeafe] text-[#1e40af]"
                            : step.type === "reply"
                            ? "bg-[#f3e8ff] text-[#6b21a8]"
                            : "bg-[#ffedd5] text-[#9a3412]"
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                  ))}
                  <span className="text-[#86868b] mx-1">→</span>
                  <span className="text-xs px-2 py-1 rounded-lg bg-[#fee2e2] text-[#991b1b]">
                    结束
                  </span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 ml-4">
                {activePipelineId !== pipeline.id && (
                  <motion.button
                    onClick={() => handleActivate(pipeline.id)}
                    disabled={saving}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-sm font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg transition-colors"
                  >
                    激活
                  </motion.button>
                )}
                {pipeline.is_preset ? (
                  // 预置流程：可以编辑（自动复制）和复制
                  <>
                    <motion.button
                      onClick={() => handleEditPreset(pipeline)}
                      disabled={saving}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 text-sm font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      编辑
                    </motion.button>
                    <motion.button
                      onClick={() => handleCopy(pipeline)}
                      disabled={saving}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 text-sm font-medium text-[#34c759] hover:bg-[#34c759]/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      复制
                    </motion.button>
                  </>
                ) : (
                  // 自定义流程：可以直接编辑、复制、删除
                  <>
                    <motion.button
                      onClick={() => startEdit(pipeline)}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 text-sm font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg transition-colors"
                    >
                      编辑
                    </motion.button>
                    <motion.button
                      onClick={() => handleCopy(pipeline)}
                      disabled={saving}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 text-sm font-medium text-[#34c759] hover:bg-[#34c759]/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      复制
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeletePipeline(pipeline.id)}
                      disabled={saving || activePipelineId === pipeline.id}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 text-sm font-medium text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      删除
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 说明 */}
      <div className="bg-[#f5f5f7] rounded-xl p-4">
        <h4 className="text-sm font-medium text-[#1d1d1f] mb-2">Pipeline 说明</h4>
        <div className="text-sm text-[#86868b] space-y-2">
          <p>
            <strong>单 Agent 模式：</strong>使用一个 Agent 同时处理字段提取和回复生成，速度最快。
          </p>
          <p>
            <strong>双 Agent 模式：</strong>分离的提取 Agent 和回复 Agent，提取更精确，适合大多数场景。
          </p>
          <p>
            <strong>三 Agent 深度分析：</strong>快速提取 + 深度分析 + 回复生成，适合需要精细信息提取的复杂场景。
          </p>
          <p className="pt-2 border-t border-[#d2d2d7]/50">
            <strong>自定义 Pipeline：</strong>点击"创建 Pipeline"，可视化拖拽设计您自己的 Agent 流程，支持串行和并行执行。
          </p>
        </div>
      </div>
    </div>
  );
}
