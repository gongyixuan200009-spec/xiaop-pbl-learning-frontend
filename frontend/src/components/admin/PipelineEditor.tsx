"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pipeline,
  PipelineStep,
  pipelineAPI,
  StepTypeInfo,
  ModelTypeInfo,
} from "@/lib/api";

interface PipelineEditorProps {
  onPipelineChange?: (pipelineId: string) => void;
}

export default function PipelineEditor({ onPipelineChange }: PipelineEditorProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<string>("dual_agent");
  const [stepTypes, setStepTypes] = useState<StepTypeInfo[]>([]);
  const [modelTypes, setModelTypes] = useState<ModelTypeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pipelineAPI.getPipelines();
      setPipelines(data.pipelines);
      setActivePipeline(data.active_pipeline);
      setStepTypes(data.step_types);
      setModelTypes(data.model_types);
    } catch (err) {
      setError("加载Pipeline失败");
      console.error("加载Pipeline失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (pipelineId: string) => {
    setSaving(true);
    setError(null);
    try {
      const result = await pipelineAPI.setActivePipeline(pipelineId);
      if (result.success) {
        setActivePipeline(result.active_pipeline);
        showSuccess("Pipeline已激活");
        onPipelineChange?.(result.active_pipeline);
      }
    } catch (err) {
      setError("激活Pipeline失败");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pipelineId: string) => {
    if (!confirm("确定要删除此Pipeline吗？")) return;

    setSaving(true);
    setError(null);
    try {
      const result = await pipelineAPI.deletePipeline(pipelineId);
      if (result.success) {
        showSuccess("Pipeline已删除");
        loadPipelines();
      }
    } catch (err: any) {
      setError(err.message || "删除Pipeline失败");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (pipeline: Pipeline) => {
    setSaving(true);
    setError(null);
    try {
      let result;
      if (isCreating) {
        result = await pipelineAPI.createPipeline(pipeline);
      } else {
        result = await pipelineAPI.updatePipeline(pipeline.id, pipeline);
      }

      if (result.success) {
        showSuccess(isCreating ? "Pipeline创建成功" : "Pipeline更新成功");
        setEditingPipeline(null);
        setIsCreating(false);
        loadPipelines();
      }
    } catch (err: any) {
      setError(err.message || "保存Pipeline失败");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const startCreate = () => {
    const newPipeline: Pipeline = {
      id: `custom_${Date.now()}`,
      name: "新Pipeline",
      description: "",
      steps: [
        {
          id: "step_1",
          name: "提取字段",
          type: "extract",
          model: "fast",
          context_from: [],
        },
        {
          id: "step_2",
          name: "生成回复",
          type: "reply",
          model: "default",
          context_from: ["step_1"],
        },
      ],
      output: {
        table_from: ["step_1"],
        reply_from: ["step_2"],
      },
    };
    setEditingPipeline(newPipeline);
    setIsCreating(true);
  };

  const startEdit = (pipeline: Pipeline) => {
    setEditingPipeline({ ...pipeline });
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-[#86868b]">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        加载中...
      </div>
    );
  }

  // 编辑模式
  if (editingPipeline) {
    return (
      <PipelineForm
        pipeline={editingPipeline}
        stepTypes={stepTypes}
        modelTypes={modelTypes}
        isCreating={isCreating}
        saving={saving}
        error={error}
        onSave={handleSave}
        onCancel={() => {
          setEditingPipeline(null);
          setIsCreating(false);
          setError(null);
        }}
      />
    );
  }

  // 列表模式
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

      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1d1d1f]">Pipeline 配置</h3>
          <p className="text-sm text-[#86868b] mt-1">配置AI Agent的处理流程</p>
        </div>
        <motion.button
          onClick={startCreate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-[#0071e3] text-white rounded-xl text-sm font-medium hover:bg-[#0077ed] transition-colors"
        >
          + 创建Pipeline
        </motion.button>
      </div>

      {/* Pipeline列表 */}
      <div className="space-y-3">
        {pipelines.map((pipeline) => (
          <motion.div
            key={pipeline.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border-2 transition-all ${
              activePipeline === pipeline.id
                ? "border-[#0071e3] bg-[#0071e3]/5"
                : "border-[#d2d2d7]/50 bg-white hover:border-[#0071e3]/30"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[15px] font-medium ${
                    activePipeline === pipeline.id ? "text-[#0071e3]" : "text-[#1d1d1f]"
                  }`}>
                    {pipeline.name}
                  </span>
                  {pipeline.is_preset && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b]">
                      预置
                    </span>
                  )}
                  {activePipeline === pipeline.id && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#34c759]">
                      当前使用
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#86868b] mb-3">{pipeline.description}</p>

                {/* 步骤展示 */}
                <div className="flex gap-2 flex-wrap">
                  {pipeline.steps.map((step, idx) => (
                    <span
                      key={step.id}
                      className="text-xs px-2 py-1 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] flex items-center gap-1"
                    >
                      <span className="text-[#0071e3] font-medium">{idx + 1}.</span>
                      {step.name}
                      <span className="text-[#86868b]">
                        ({step.type === "extract" ? "提取" : step.type === "reply" ? "回复" : "提取+回复"})
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 ml-4">
                {activePipeline !== pipeline.id && (
                  <motion.button
                    onClick={() => handleActivate(pipeline.id)}
                    disabled={saving}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-sm font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg transition-colors"
                  >
                    激活
                  </motion.button>
                )}
                {!pipeline.is_preset && (
                  <>
                    <motion.button
                      onClick={() => startEdit(pipeline)}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 text-sm font-medium text-[#86868b] hover:bg-[#f5f5f7] rounded-lg transition-colors"
                    >
                      编辑
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(pipeline.id)}
                      disabled={saving || activePipeline === pipeline.id}
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

      {/* Pipeline说明 */}
      <div className="bg-[#f5f5f7] rounded-xl p-4 mt-6">
        <h4 className="text-sm font-medium text-[#1d1d1f] mb-2">Pipeline说明</h4>
        <div className="text-sm text-[#86868b] space-y-2">
          <p><strong>单Agent模式：</strong>使用一个Agent同时处理字段提取和回复生成，速度最快。</p>
          <p><strong>双Agent模式：</strong>分离的提取Agent和回复Agent，提取更精确，适合大多数场景。</p>
          <p><strong>三Agent深度分析：</strong>快速提取 + 深度分析 + 回复生成，适合需要精细信息提取的复杂场景。</p>
        </div>
      </div>
    </div>
  );
}

// Pipeline 编辑表单组件
interface PipelineFormProps {
  pipeline: Pipeline;
  stepTypes: StepTypeInfo[];
  modelTypes: ModelTypeInfo[];
  isCreating: boolean;
  saving: boolean;
  error: string | null;
  onSave: (pipeline: Pipeline) => void;
  onCancel: () => void;
}

function PipelineForm({
  pipeline: initialPipeline,
  stepTypes,
  modelTypes,
  isCreating,
  saving,
  error,
  onSave,
  onCancel,
}: PipelineFormProps) {
  const [pipeline, setPipeline] = useState<Pipeline>(initialPipeline);

  const updateField = (field: keyof Pipeline, value: any) => {
    setPipeline({ ...pipeline, [field]: value });
  };

  const updateStep = (index: number, field: keyof PipelineStep, value: any) => {
    const newSteps = [...pipeline.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setPipeline({ ...pipeline, steps: newSteps });
  };

  const addStep = () => {
    const newStep: PipelineStep = {
      id: `step_${pipeline.steps.length + 1}`,
      name: `步骤${pipeline.steps.length + 1}`,
      type: "extract",
      model: "default",
      context_from: [],
    };
    setPipeline({ ...pipeline, steps: [...pipeline.steps, newStep] });
  };

  const removeStep = (index: number) => {
    if (pipeline.steps.length <= 1) return;
    const newSteps = pipeline.steps.filter((_, i) => i !== index);
    setPipeline({ ...pipeline, steps: newSteps });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === pipeline.steps.length - 1)
    ) {
      return;
    }
    const newSteps = [...pipeline.steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setPipeline({ ...pipeline, steps: newSteps });
  };

  const toggleContextFrom = (stepIndex: number, sourceId: string) => {
    const step = pipeline.steps[stepIndex];
    const newContextFrom = step.context_from.includes(sourceId)
      ? step.context_from.filter((id) => id !== sourceId)
      : [...step.context_from, sourceId];
    updateStep(stepIndex, "context_from", newContextFrom);
  };

  const toggleOutputFrom = (type: "table_from" | "reply_from", stepId: string) => {
    const current = pipeline.output[type];
    const newValue = current.includes(stepId)
      ? current.filter((id) => id !== stepId)
      : [...current, stepId];
    setPipeline({
      ...pipeline,
      output: { ...pipeline.output, [type]: newValue },
    });
  };

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <div className="bg-[#ff3b30]/10 text-[#ff3b30] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white rounded-xl border border-[#d2d2d7]/50 p-4">
        <h4 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">基本信息</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#86868b] mb-1">Pipeline ID</label>
            <input
              type="text"
              value={pipeline.id}
              onChange={(e) => updateField("id", e.target.value.replace(/\s/g, "_"))}
              disabled={!isCreating}
              className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3] disabled:bg-[#f5f5f7] disabled:text-[#86868b]"
              placeholder="pipeline_id"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868b] mb-1">名称</label>
            <input
              type="text"
              value={pipeline.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3]"
              placeholder="Pipeline名称"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868b] mb-1">描述</label>
            <textarea
              value={pipeline.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3] resize-none"
              rows={2}
              placeholder="Pipeline描述"
            />
          </div>
        </div>
      </div>

      {/* 步骤配置 */}
      <div className="bg-white rounded-xl border border-[#d2d2d7]/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[15px] font-semibold text-[#1d1d1f]">处理步骤</h4>
          <motion.button
            onClick={addStep}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 text-sm font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg transition-colors"
          >
            + 添加步骤
          </motion.button>
        </div>

        <div className="space-y-4">
          {pipeline.steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-[#f5f5f7] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0071e3]">步骤 {index + 1}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveStep(index, "up")}
                      disabled={index === 0}
                      className="w-6 h-6 flex items-center justify-center text-[#86868b] hover:bg-white rounded disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveStep(index, "down")}
                      disabled={index === pipeline.steps.length - 1}
                      className="w-6 h-6 flex items-center justify-center text-[#86868b] hover:bg-white rounded disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                {pipeline.steps.length > 1 && (
                  <button
                    onClick={() => removeStep(index)}
                    className="text-sm text-[#ff3b30] hover:bg-[#ff3b30]/10 px-2 py-1 rounded-lg transition-colors"
                  >
                    删除
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#86868b] mb-1">步骤ID</label>
                  <input
                    type="text"
                    value={step.id}
                    onChange={(e) => updateStep(index, "id", e.target.value.replace(/\s/g, "_"))}
                    className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-white text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#86868b] mb-1">名称</label>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => updateStep(index, "name", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-white text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#86868b] mb-1">类型</label>
                  <select
                    value={step.type}
                    onChange={(e) => updateStep(index, "type", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-white text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3]"
                  >
                    {stepTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#86868b] mb-1">模型</label>
                  <select
                    value={step.model}
                    onChange={(e) => updateStep(index, "model", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-white text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0071e3]"
                  >
                    {modelTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 上下文来源 */}
              {index > 0 && (
                <div className="mt-3">
                  <label className="block text-xs text-[#86868b] mb-1">上下文来源</label>
                  <div className="flex gap-2 flex-wrap">
                    {pipeline.steps.slice(0, index).map((prevStep) => (
                      <button
                        key={prevStep.id}
                        onClick={() => toggleContextFrom(index, prevStep.id)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                          step.context_from.includes(prevStep.id)
                            ? "bg-[#0071e3] text-white"
                            : "bg-white text-[#1d1d1f] border border-[#d2d2d7]"
                        }`}
                      >
                        {prevStep.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 输出配置 */}
      <div className="bg-white rounded-xl border border-[#d2d2d7]/50 p-4">
        <h4 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">输出配置</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#86868b] mb-2">表格数据来源</label>
            <div className="flex gap-2 flex-wrap">
              {pipeline.steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => toggleOutputFrom("table_from", step.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    pipeline.output.table_from.includes(step.id)
                      ? "bg-[#0071e3] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f]"
                  }`}
                >
                  {step.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#86868b] mb-2">回复来源</label>
            <div className="flex gap-2 flex-wrap">
              {pipeline.steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => toggleOutputFrom("reply_from", step.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    pipeline.output.reply_from.includes(step.id)
                      ? "bg-[#34c759] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f]"
                  }`}
                >
                  {step.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <motion.button
          onClick={onCancel}
          whileTap={{ scale: 0.97 }}
          className="px-6 py-2 text-sm font-medium text-[#86868b] hover:bg-[#f5f5f7] rounded-xl transition-colors"
        >
          取消
        </motion.button>
        <motion.button
          onClick={() => onSave(pipeline)}
          disabled={saving || !pipeline.name || !pipeline.id}
          whileTap={{ scale: 0.97 }}
          className="px-6 py-2 text-sm font-medium bg-[#0071e3] text-white rounded-xl hover:bg-[#0077ed] transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : isCreating ? "创建" : "保存"}
        </motion.button>
      </div>
    </div>
  );
}
