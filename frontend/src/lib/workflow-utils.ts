/**
 * Workflow 工具函数
 * 在 Pipeline 数据格式和 ReactFlow 节点/边格式之间转换
 */

import type { Node, Edge } from "@xyflow/react";
import type { Pipeline, PipelineStep, PipelineOutput } from "./api";

// 节点类型定义
export type WorkflowNodeType = "start" | "end" | "extract" | "reply" | "extract_and_reply";

// 节点数据类型
export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  stepType?: "extract" | "reply" | "extract_and_reply";
  model?: string;
  prompt_template?: string;
  stepId?: string;
}

// ReactFlow 节点类型
export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;

// ReactFlow 边类型
export type WorkflowEdge = Edge;

// 节点颜色配置
export const NODE_COLORS: Record<WorkflowNodeType, { bg: string; border: string; text: string }> = {
  start: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  end: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  extract: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  reply: { bg: "#f3e8ff", border: "#a855f7", text: "#6b21a8" },
  extract_and_reply: { bg: "#ffedd5", border: "#f97316", text: "#9a3412" },
};

// 节点类型标签
export const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  start: "开始",
  end: "结束",
  extract: "字段提取",
  reply: "生成回复",
  extract_and_reply: "提取+回复",
};

// 模型类型标签
export const MODEL_LABELS: Record<string, string> = {
  fast: "快速模型",
  default: "默认模型",
  vision: "视觉模型",
};

/**
 * 将 Pipeline 格式转换为 ReactFlow 节点和边
 */
export function pipelineToWorkflow(pipeline: Pipeline): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  // 计算节点位置的布局参数
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 60;
  const HORIZONTAL_GAP = 100;
  const VERTICAL_GAP = 80;
  const START_X = 100;
  const START_Y = 100;

  // 添加开始节点
  nodes.push({
    id: "start",
    type: "start",
    position: { x: START_X, y: START_Y },
    data: { label: "开始" },
  });

  // 计算每个步骤的层级（用于布局）
  const stepLevels = calculateStepLevels(pipeline.steps);
  const levelSteps: Map<number, PipelineStep[]> = new Map();

  pipeline.steps.forEach((step) => {
    const level = stepLevels.get(step.id) || 0;
    if (!levelSteps.has(level)) {
      levelSteps.set(level, []);
    }
    levelSteps.get(level)!.push(step);
  });

  // 为每个步骤创建节点
  pipeline.steps.forEach((step) => {
    const level = stepLevels.get(step.id) || 0;
    const stepsAtLevel = levelSteps.get(level) || [];
    const indexAtLevel = stepsAtLevel.indexOf(step);
    const totalAtLevel = stepsAtLevel.length;

    // 计算位置：水平居中分布同层节点
    const x = START_X + (level + 1) * (NODE_WIDTH + HORIZONTAL_GAP);
    const yOffset = ((totalAtLevel - 1) / 2 - indexAtLevel) * (NODE_HEIGHT + VERTICAL_GAP);
    const y = START_Y - yOffset;

    nodes.push({
      id: step.id,
      type: step.type as WorkflowNodeType,
      position: { x, y },
      data: {
        label: step.name,
        stepType: step.type as "extract" | "reply" | "extract_and_reply",
        model: step.model,
        prompt_template: step.prompt_template,
        stepId: step.id,
      },
    });
  });

  // 添加结束节点
  const maxLevel = Math.max(...Array.from(stepLevels.values()), 0);
  nodes.push({
    id: "end",
    type: "end",
    position: {
      x: START_X + (maxLevel + 2) * (NODE_WIDTH + HORIZONTAL_GAP),
      y: START_Y,
    },
    data: { label: "结束" },
  });

  // 创建边：从开始节点到没有依赖的步骤
  const stepsWithDeps = new Set(pipeline.steps.flatMap((s) => s.context_from));
  pipeline.steps.forEach((step) => {
    if (step.context_from.length === 0) {
      edges.push({
        id: `start-${step.id}`,
        source: "start",
        target: step.id,
        type: "smoothstep",
      });
    }
  });

  // 创建边：根据 context_from 创建步骤间的连接
  pipeline.steps.forEach((step) => {
    step.context_from.forEach((sourceId) => {
      edges.push({
        id: `${sourceId}-${step.id}`,
        source: sourceId,
        target: step.id,
        type: "smoothstep",
      });
    });
  });

  // 创建边：从输出步骤到结束节点
  const outputSteps = new Set([
    ...(pipeline.output?.table_from || []),
    ...(pipeline.output?.reply_from || []),
  ]);

  // 如果没有明确的输出步骤，连接所有没有后续节点的步骤到结束
  if (outputSteps.size === 0) {
    const stepsWithFollowers = new Set(pipeline.steps.flatMap((s) => s.context_from));
    pipeline.steps.forEach((step) => {
      // 检查是否有其他步骤依赖这个步骤
      const hasFollower = pipeline.steps.some((s) => s.context_from.includes(step.id));
      if (!hasFollower) {
        edges.push({
          id: `${step.id}-end`,
          source: step.id,
          target: "end",
          type: "smoothstep",
        });
      }
    });
  } else {
    outputSteps.forEach((stepId) => {
      // 只连接没有后续节点的输出步骤
      const hasFollower = pipeline.steps.some((s) => s.context_from.includes(stepId));
      if (!hasFollower) {
        edges.push({
          id: `${stepId}-end`,
          source: stepId,
          target: "end",
          type: "smoothstep",
        });
      }
    });
  }

  return { nodes, edges };
}

/**
 * 计算每个步骤的层级（用于布局）
 * 层级由依赖关系决定
 */
function calculateStepLevels(steps: PipelineStep[]): Map<string, number> {
  const levels = new Map<string, number>();
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  function getLevel(stepId: string, visited: Set<string> = new Set()): number {
    if (levels.has(stepId)) {
      return levels.get(stepId)!;
    }

    if (visited.has(stepId)) {
      // 循环依赖，返回0
      return 0;
    }

    visited.add(stepId);
    const step = stepMap.get(stepId);

    if (!step || step.context_from.length === 0) {
      levels.set(stepId, 0);
      return 0;
    }

    const maxDependencyLevel = Math.max(
      ...step.context_from.map((depId) => getLevel(depId, new Set(visited)))
    );

    const level = maxDependencyLevel + 1;
    levels.set(stepId, level);
    return level;
  }

  steps.forEach((step) => getLevel(step.id));
  return levels;
}

/**
 * 将 ReactFlow 节点和边转换回 Pipeline 格式
 */
export function workflowToPipeline(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  pipelineId: string,
  pipelineName: string,
  pipelineDescription: string
): Pipeline {
  // 过滤出实际的步骤节点（排除 start 和 end）
  const stepNodes = nodes.filter(
    (n) => n.type !== "start" && n.type !== "end"
  );

  // 构建边的映射：target -> sources
  const incomingEdges = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    if (edge.source !== "start") {
      incomingEdges.get(edge.target)!.push(edge.source);
    }
  });

  // 拓扑排序确定步骤顺序
  const sortedSteps = topologicalSort(stepNodes, incomingEdges);

  // 构建 PipelineStep 数组
  const steps: PipelineStep[] = sortedSteps.map((node) => ({
    id: node.data.stepId || node.id,
    name: node.data.label,
    type: node.data.stepType || (node.type as "extract" | "reply" | "extract_and_reply"),
    model: (node.data.model || "default") as "fast" | "default" | "vision",
    prompt_template: node.data.prompt_template,
    context_from: incomingEdges.get(node.id)?.filter((id) => id !== "start") || [],
  }));

  // 确定输出配置
  const outgoingToEnd = new Set(
    edges.filter((e) => e.target === "end").map((e) => e.source)
  );

  // 默认：提取类型的输出用于表格，回复类型的输出用于回复
  const table_from: string[] = [];
  const reply_from: string[] = [];

  steps.forEach((step) => {
    if (step.type === "extract" || step.type === "extract_and_reply") {
      table_from.push(step.id);
    }
    if (step.type === "reply" || step.type === "extract_and_reply") {
      reply_from.push(step.id);
    }
  });

  return {
    id: pipelineId,
    name: pipelineName,
    description: pipelineDescription,
    steps,
    output: {
      table_from,
      reply_from,
    },
  };
}

/**
 * 拓扑排序
 */
function topologicalSort(
  nodes: WorkflowNode[],
  incomingEdges: Map<string, string[]>
): WorkflowNode[] {
  const result: WorkflowNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const deps = incomingEdges.get(nodeId) || [];
    deps.forEach((depId) => {
      if (nodeMap.has(depId)) {
        visit(depId);
      }
    });

    const node = nodeMap.get(nodeId);
    if (node) {
      result.push(node);
    }
  }

  nodes.forEach((node) => visit(node.id));
  return result;
}

/**
 * 创建新的步骤节点
 */
export function createStepNode(
  type: "extract" | "reply" | "extract_and_reply",
  position: { x: number; y: number },
  existingIds: string[]
): WorkflowNode {
  // 生成唯一ID
  let id = `step_${Date.now()}`;
  let counter = 1;
  while (existingIds.includes(id)) {
    id = `step_${Date.now()}_${counter++}`;
  }

  const labels: Record<string, string> = {
    extract: "字段提取",
    reply: "生成回复",
    extract_and_reply: "提取+回复",
  };

  return {
    id,
    type,
    position,
    data: {
      label: labels[type],
      stepType: type,
      model: type === "extract" ? "fast" : "default",
      stepId: id,
    },
  };
}

/**
 * 验证工作流是否有效
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查是否有开始和结束节点
  const hasStart = nodes.some((n) => n.type === "start");
  const hasEnd = nodes.some((n) => n.type === "end");

  if (!hasStart) {
    errors.push("缺少开始节点");
  }
  if (!hasEnd) {
    errors.push("缺少结束节点");
  }

  // 检查是否有实际的步骤节点
  const stepNodes = nodes.filter((n) => n.type !== "start" && n.type !== "end");
  if (stepNodes.length === 0) {
    errors.push("至少需要一个处理步骤");
  }

  // 检查是否有连接到开始节点的步骤
  const hasStartConnection = edges.some((e) => e.source === "start");
  if (!hasStartConnection && stepNodes.length > 0) {
    errors.push("没有步骤连接到开始节点");
  }

  // 检查是否有连接到结束节点的步骤
  const hasEndConnection = edges.some((e) => e.target === "end");
  if (!hasEndConnection && stepNodes.length > 0) {
    errors.push("没有步骤连接到结束节点");
  }

  // 检查循环依赖
  const hasCycle = detectCycle(stepNodes, edges);
  if (hasCycle) {
    errors.push("存在循环依赖");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 检测循环依赖
 */
function detectCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjacencyList = new Map<string, string[]>();

  // 构建邻接表
  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
  });

  edges.forEach((edge) => {
    if (adjacencyList.has(edge.source)) {
      adjacencyList.get(edge.source)!.push(edge.target);
    }
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}

/**
 * 自动布局节点
 */
export function autoLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 60;
  const HORIZONTAL_GAP = 120;
  const VERTICAL_GAP = 100;
  const START_X = 100;
  const START_Y = 250;

  // 分离特殊节点和步骤节点
  const startNode = nodes.find((n) => n.type === "start");
  const endNode = nodes.find((n) => n.type === "end");
  const stepNodes = nodes.filter((n) => n.type !== "start" && n.type !== "end");

  // 构建依赖关系
  const incomingEdges = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge.source);
  });

  // 计算层级
  const levels = new Map<string, number>();

  function getLevel(nodeId: string, visited: Set<string> = new Set()): number {
    if (levels.has(nodeId)) return levels.get(nodeId)!;
    if (visited.has(nodeId) || nodeId === "start") return 0;

    visited.add(nodeId);
    const deps = (incomingEdges.get(nodeId) || []).filter((id) => id !== "start");

    if (deps.length === 0) {
      levels.set(nodeId, 0);
      return 0;
    }

    const maxDep = Math.max(...deps.map((id) => getLevel(id, new Set(visited))));
    const level = maxDep + 1;
    levels.set(nodeId, level);
    return level;
  }

  stepNodes.forEach((node) => getLevel(node.id));

  // 按层级分组
  const levelGroups = new Map<number, WorkflowNode[]>();
  stepNodes.forEach((node) => {
    const level = levels.get(node.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  // 计算新位置
  const newNodes: WorkflowNode[] = [];

  // 开始节点
  if (startNode) {
    newNodes.push({
      ...startNode,
      position: { x: START_X, y: START_Y },
    });
  }

  // 步骤节点
  const maxLevel = Math.max(...Array.from(levels.values()), 0);

  levelGroups.forEach((nodesAtLevel, level) => {
    const x = START_X + (level + 1) * (NODE_WIDTH + HORIZONTAL_GAP);
    const totalHeight = nodesAtLevel.length * NODE_HEIGHT + (nodesAtLevel.length - 1) * VERTICAL_GAP;
    const startY = START_Y - totalHeight / 2 + NODE_HEIGHT / 2;

    nodesAtLevel.forEach((node, index) => {
      newNodes.push({
        ...node,
        position: {
          x,
          y: startY + index * (NODE_HEIGHT + VERTICAL_GAP),
        },
      });
    });
  });

  // 结束节点
  if (endNode) {
    newNodes.push({
      ...endNode,
      position: {
        x: START_X + (maxLevel + 2) * (NODE_WIDTH + HORIZONTAL_GAP),
        y: START_Y,
      },
    });
  }

  return newNodes;
}
