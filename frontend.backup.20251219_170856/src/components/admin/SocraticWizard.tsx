"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormConfig, SocraticQuestionConfig, adminAPI, CustomPrompts } from "@/lib/api";

interface SocraticWizardProps {
  form: FormConfig;
  onUpdate: (form: FormConfig) => void;
  onDelete: () => void;
  onSave?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_INFO: Record<WizardStep, { title: string; desc: string }> = {
  1: { title: "输入教学内容", desc: "填写课程基本信息和教学内容" },
  2: { title: "生成教学目标", desc: "AI根据教学内容自动生成问题（Prompt 1）" },
  3: { title: "编辑教学目标", desc: "调整生成的问题和回答要点" },
  4: { title: "配置教学Prompt", desc: "设置引导对话和评价判断的Prompt" },
  5: { title: "总览与编辑", desc: "查看和修改所有配置内容" },
};

export default function SocraticWizard({ form, onUpdate, onDelete, onSave }: SocraticWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [localForm, setLocalForm] = useState<FormConfig>({
    ...form,
    type: "socratic",
    questions: form.questions || [],
    teaching_content: form.teaching_content || "",
    custom_prompts: form.custom_prompts || {},
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [defaultPrompts, setDefaultPrompts] = useState<{
    generation: string;
    guidance: string;
    evaluation: string;
  } | null>(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [showDefaultPrompt, setShowDefaultPrompt] = useState<"guidance" | "evaluation" | null>(null);

  useEffect(() => {
    setLocalForm({
      ...form,
      type: "socratic",
      questions: form.questions || [],
      teaching_content: form.teaching_content || "",
      custom_prompts: form.custom_prompts || {},
    });
    // Determine initial step based on form state
    // 如果有问题，说明配置已完成，进入 Step 5（总览编辑）
    if (form.questions && form.questions.length > 0) {
      setCurrentStep(5);
    } else if (form.teaching_content) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, [form.id]);

  // Load default prompts on mount
  useEffect(() => {
    loadDefaultPrompts();
  }, []);

  const loadDefaultPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const prompts = await adminAPI.getDefaultPrompts();
      setDefaultPrompts(prompts);
    } catch (error) {
      console.error("Failed to load default prompts:", error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleChange = (field: keyof FormConfig, value: any) => {
    const updated = { ...localForm, [field]: value };
    setLocalForm(updated);
    onUpdate(updated);
  };

  const handleCustomPromptChange = (field: keyof CustomPrompts, value: string) => {
    const customPrompts = { ...localForm.custom_prompts, [field]: value || undefined };
    Object.keys(customPrompts).forEach(key => {
      if (!customPrompts[key as keyof CustomPrompts]) {
        delete customPrompts[key as keyof CustomPrompts];
      }
    });
    handleChange("custom_prompts", customPrompts);
  };

  const generateQuestions = async () => {
    if (!localForm.teaching_content?.trim()) {
      setGenerateError("请先输入教学内容");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const result = await adminAPI.generateQuestions(localForm.teaching_content);
      if (result.success && result.questions.length > 0) {
        handleChange("questions", result.questions);
        setCurrentStep(3);
      } else {
        setGenerateError("生成问题失败，请重试");
      }
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "生成问题失败");
    } finally {
      setIsGenerating(false);
    }
  };

  // Question management
  const addQuestion = () => {
    const questions = localForm.questions || [];
    const maxId = questions.reduce((max, q) => Math.max(max, q.id), 0);
    const newQuestion: SocraticQuestionConfig = {
      id: maxId + 1,
      question: "",
      answer_points: "",
    };
    handleChange("questions", [...questions, newQuestion]);
  };

  const updateQuestion = (id: number, field: "question" | "answer_points", value: string) => {
    const questions = localForm.questions || [];
    const updated = questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    );
    handleChange("questions", updated);
  };

  const removeQuestion = (id: number) => {
    const questions = localForm.questions || [];
    handleChange("questions", questions.filter(q => q.id !== id));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const questions = [...(localForm.questions || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < questions.length) {
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      handleChange("questions", questions);
    }
  };

  const canProceedToStep = (step: WizardStep): boolean => {
    switch (step) {
      case 1: return true;
      case 2: return !!localForm.name?.trim() && !!localForm.teaching_content?.trim();
      case 3: return (localForm.questions?.length || 0) > 0;
      case 4: return (localForm.questions?.length || 0) > 0;
      case 5: return (localForm.questions?.length || 0) > 0;
      default: return false;
    }
  };

  // Step Indicator Component (只在 Step 1-4 显示)
  const StepIndicator = () => {
    if (currentStep === 5) {
      // Step 5 显示不同的标题样式
      return (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#1d1d1f]">{localForm.name}</h3>
              <p className="text-sm text-[#86868b] mt-1">总览与编辑 - 查看和修改所有配置内容</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#34c759]/10 text-[#34c759] rounded-full text-xs font-medium">
                已配置完成
              </span>
              <motion.button
                onClick={() => setCurrentStep(1)}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-1.5 text-xs text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg transition-colors"
              >
                重新配置
              </motion.button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {([1, 2, 3, 4] as WizardStep[]).map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <motion.button
                onClick={() => canProceedToStep(step) && setCurrentStep(step)}
                disabled={!canProceedToStep(step)}
                whileHover={canProceedToStep(step) ? { scale: 1.05 } : {}}
                whileTap={canProceedToStep(step) ? { scale: 0.95 } : {}}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-all ${
                  currentStep === step
                    ? "bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/30"
                    : currentStep > step
                    ? "bg-[#34c759] text-white"
                    : canProceedToStep(step)
                    ? "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                    : "bg-[#f5f5f7] text-[#86868b] cursor-not-allowed"
                }`}
              >
                {currentStep > step ? "✓" : step}
              </motion.button>
              {index < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  currentStep > step ? "bg-[#34c759]" : "bg-[#e8e8ed]"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#1d1d1f]">{STEP_INFO[currentStep].title}</h3>
          <p className="text-sm text-[#86868b] mt-1">{STEP_INFO[currentStep].desc}</p>
        </div>
      </div>
    );
  };

  // Step 1: Input Teaching Content
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#86868b] mb-2">模块名称 *</label>
          <input
            type="text"
            value={localForm.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="例如：牛顿第一定律"
            className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#86868b] mb-2">用户描述</label>
          <input
            type="text"
            value={localForm.user_description}
            onChange={(e) => handleChange("user_description", e.target.value)}
            placeholder="学生看到的简短描述"
            className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#86868b] mb-2">
          教学内容 * <span className="text-[#0071e3]">（这是生成问题的依据）</span>
        </label>
        <div className="bg-[#fff8e6] border border-[#ffcc00]/30 rounded-xl p-3 mb-3">
          <p className="text-xs text-[#8a6d00]">
            输入完整的教学讲义内容。系统将使用 <strong>Prompt 1（教学目标生成）</strong> 自动分析此内容，生成3-5个核心形成性检测问题。
          </p>
        </div>
        <textarea
          value={localForm.teaching_content || ""}
          onChange={(e) => handleChange("teaching_content", e.target.value)}
          rows={12}
          placeholder="请输入完整的教学内容，例如：

牛顿第一定律（惯性定律）：
一切物体总保持匀速直线运动状态或静止状态，直到有外力迫使它改变这种状态为止。

这个定律说明了：
1. 物体都有保持原有运动状态的性质，这种性质叫做惯性
2. 力不是维持物体运动的原因，而是改变物体运动状态的原因
3. 质量是惯性大小的唯一量度..."
          className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all resize-none"
        />
        <div className="text-right mt-2 text-xs text-[#86868b]">
          {(localForm.teaching_content?.length || 0)} 字符
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-[#e8e8ed]">
        <motion.button
          onClick={onDelete}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-xl text-sm font-medium transition-colors"
        >
          删除此模块
        </motion.button>
        <motion.button
          onClick={() => canProceedToStep(2) && setCurrentStep(2)}
          disabled={!canProceedToStep(2)}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            canProceedToStep(2)
              ? "bg-[#0071e3] text-white hover:bg-[#0077ed]"
              : "bg-[#d2d2d7] text-white cursor-not-allowed"
          }`}
        >
          下一步：生成教学目标 →
        </motion.button>
      </div>
    </div>
  );

  // Step 2: Generate Questions
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Prompt 1 Info Card */}
      <div className="bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 rounded-xl p-5 border border-[#667eea]/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#667eea] rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            P1
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-[#1d1d1f] mb-1">Prompt 1 - 教学目标生成提示词</h4>
            <p className="text-sm text-[#86868b] mb-3">
              AI将扮演顶级中学教研老师，根据您的教学内容设计3-5个核心形成性检测问题。
            </p>
            <div className="bg-white/50 rounded-lg p-3">
              <p className="text-xs text-[#86868b] mb-2">输出格式：</p>
              <code className="text-xs text-[#1d1d1f] font-mono">
                {"[{id, question, answer_points}, ...]"}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Content Summary */}
      <div className="bg-[#f5f5f7] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-[#1d1d1f]">已输入的教学内容</h4>
          <button
            onClick={() => setCurrentStep(1)}
            className="text-xs text-[#0071e3] hover:underline"
          >
            修改
          </button>
        </div>
        <p className="text-sm text-[#86868b] line-clamp-4">
          {localForm.teaching_content?.substring(0, 300)}
          {(localForm.teaching_content?.length || 0) > 300 && "..."}
        </p>
        <p className="text-xs text-[#86868b] mt-2">共 {localForm.teaching_content?.length || 0} 字符</p>
      </div>

      {generateError && (
        <div className="bg-[#ff3b30]/10 border border-[#ff3b30]/30 rounded-xl p-4">
          <p className="text-sm text-[#ff3b30]">{generateError}</p>
        </div>
      )}

      <div className="flex justify-center py-4">
        <motion.button
          onClick={generateQuestions}
          disabled={isGenerating}
          whileHover={!isGenerating ? { scale: 1.02 } : {}}
          whileTap={!isGenerating ? { scale: 0.98 } : {}}
          className={`px-10 py-4 rounded-2xl text-base font-medium transition-all flex items-center gap-3 ${
            isGenerating
              ? "bg-[#d2d2d7] text-white cursor-wait"
              : "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-[#667eea]/30"
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              AI正在生成问题...
            </>
          ) : (
            <>
              <span className="text-xl">✨</span>
              调用 Prompt 1 生成教学目标
            </>
          )}
        </motion.button>
      </div>

      <div className="flex justify-between pt-4 border-t border-[#e8e8ed]">
        <motion.button
          onClick={() => setCurrentStep(1)}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-[#0071e3] hover:bg-[#0071e3]/10 rounded-xl text-sm font-medium transition-colors"
        >
          ← 返回上一步
        </motion.button>
        {(localForm.questions?.length || 0) > 0 && (
          <motion.button
            onClick={() => setCurrentStep(3)}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 text-[#86868b] hover:text-[#1d1d1f] rounded-xl text-sm font-medium transition-colors"
          >
            跳过（使用已有 {localForm.questions?.length} 个问题）→
          </motion.button>
        )}
      </div>
    </div>
  );

  // Step 3: Edit Questions
  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#86868b]">
            共 <span className="text-[#34c759] font-semibold">{(localForm.questions || []).length}</span> 个教学目标
          </span>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => setCurrentStep(2)}
            whileTap={{ scale: 0.98 }}
            className="px-3 py-1.5 bg-[#f5f5f7] text-[#1d1d1f] rounded-lg text-xs font-medium hover:bg-[#e8e8ed] transition-colors"
          >
            重新生成
          </motion.button>
          <motion.button
            onClick={addQuestion}
            whileTap={{ scale: 0.98 }}
            className="px-3 py-1.5 bg-[#34c759] text-white rounded-lg text-xs font-medium hover:bg-[#30b350] transition-colors"
          >
            + 手动添加
          </motion.button>
        </div>
      </div>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
        <AnimatePresence>
          {(localForm.questions || []).map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#f5f5f7] rounded-xl p-4 border border-[#d2d2d7]/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-[#34c759] w-6 h-6 rounded-lg flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs text-[#86868b]">教学目标</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveQuestion(index, "up")}
                    disabled={index === 0}
                    className="w-7 h-7 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-white rounded-lg disabled:opacity-30 transition-all"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveQuestion(index, "down")}
                    disabled={index === (localForm.questions || []).length - 1}
                    className="w-7 h-7 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-white rounded-lg disabled:opacity-30 transition-all"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="w-7 h-7 flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg transition-all"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#0071e3] font-medium mb-1">问题（题干）</label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                    rows={2}
                    placeholder="输入要问学生的问题..."
                    className="w-full px-3 py-2 bg-white rounded-lg text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#34c759] font-medium mb-1">回答要点（判断依据）</label>
                  <textarea
                    value={question.answer_points}
                    onChange={(e) => updateQuestion(question.id, "answer_points", e.target.value)}
                    rows={2}
                    placeholder="学生回答正确需要包含的关键点..."
                    className="w-full px-3 py-2 bg-white rounded-lg text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#34c759] transition-all resize-none"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {(localForm.questions || []).length === 0 && (
        <div className="text-center py-12 text-[#86868b]">
          <div className="text-4xl mb-3 opacity-30">📝</div>
          <p className="text-sm">暂无问题，请返回上一步生成或手动添加</p>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-[#e8e8ed]">
        <motion.button
          onClick={() => setCurrentStep(2)}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-[#0071e3] hover:bg-[#0071e3]/10 rounded-xl text-sm font-medium transition-colors"
        >
          ← 返回上一步
        </motion.button>
        <motion.button
          onClick={() => canProceedToStep(4) && setCurrentStep(4)}
          disabled={!canProceedToStep(4)}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            canProceedToStep(4)
              ? "bg-[#0071e3] text-white hover:bg-[#0077ed]"
              : "bg-[#d2d2d7] text-white cursor-not-allowed"
          }`}
        >
          下一步：配置Prompt →
        </motion.button>
      </div>
    </div>
  );

  // Step 4: Configure Prompts
  const renderStep4 = () => (
    <div className="space-y-5">
      {loadingPrompts ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Prompt 2 - Guidance */}
          <div className="bg-gradient-to-br from-[#34c759]/10 to-[#30d158]/10 rounded-xl p-5 border border-[#34c759]/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-[#34c759] rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                P2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#1d1d1f]">Prompt 2 - 引导提示词（苏格拉底对话）</h4>
                <p className="text-xs text-[#86868b] mt-1">
                  控制AI如何引导学生进行对话式学习。AI会根据【教学内容】和【当前阶段目标】引导学生。
                </p>
              </div>
              <button
                onClick={() => setShowDefaultPrompt(showDefaultPrompt === "guidance" ? null : "guidance")}
                className="text-xs text-[#34c759] hover:underline shrink-0"
              >
                {showDefaultPrompt === "guidance" ? "收起默认" : "查看默认"}
              </button>
            </div>

            <AnimatePresence>
              {showDefaultPrompt === "guidance" && defaultPrompts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="bg-white/60 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-[#86868b] whitespace-pre-wrap font-mono">
                      {defaultPrompts.guidance}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <textarea
                value={localForm.custom_prompts?.guidance || ""}
                onChange={(e) => handleCustomPromptChange("guidance", e.target.value)}
                rows={5}
                placeholder="留空使用默认Prompt，或输入自定义内容覆盖..."
                className="w-full px-3 py-2 bg-white rounded-lg text-[13px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#34c759] transition-all resize-none font-mono"
              />
              {!localForm.custom_prompts?.guidance && (
                <div className="absolute bottom-2 right-2 text-xs text-[#34c759] bg-[#34c759]/10 px-2 py-1 rounded">
                  使用默认
                </div>
              )}
            </div>
          </div>

          {/* Prompt 3 - Evaluation */}
          <div className="bg-gradient-to-br from-[#0071e3]/10 to-[#00a1ff]/10 rounded-xl p-5 border border-[#0071e3]/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-[#0071e3] rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                P3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#1d1d1f]">Prompt 3 - 评价提示词（判断完成）</h4>
                <p className="text-xs text-[#86868b] mt-1">
                  判断学生是否正确回答了当前问题。输出"1"表示完成，"0"表示未完成。
                </p>
              </div>
              <button
                onClick={() => setShowDefaultPrompt(showDefaultPrompt === "evaluation" ? null : "evaluation")}
                className="text-xs text-[#0071e3] hover:underline shrink-0"
              >
                {showDefaultPrompt === "evaluation" ? "收起默认" : "查看默认"}
              </button>
            </div>

            <AnimatePresence>
              {showDefaultPrompt === "evaluation" && defaultPrompts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="bg-white/60 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-[#86868b] whitespace-pre-wrap font-mono">
                      {defaultPrompts.evaluation}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <textarea
                value={localForm.custom_prompts?.evaluation || ""}
                onChange={(e) => handleCustomPromptChange("evaluation", e.target.value)}
                rows={5}
                placeholder="留空使用默认Prompt，或输入自定义内容覆盖..."
                className="w-full px-3 py-2 bg-white rounded-lg text-[13px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all resize-none font-mono"
              />
              {!localForm.custom_prompts?.evaluation && (
                <div className="absolute bottom-2 right-2 text-xs text-[#0071e3] bg-[#0071e3]/10 px-2 py-1 rounded">
                  使用默认
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-[#f5f5f7] rounded-xl p-4">
            <h4 className="text-sm font-semibold text-[#1d1d1f] mb-3">配置摘要</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#86868b]">模块名称：</span>
                <span className="text-[#1d1d1f] font-medium">{localForm.name}</span>
              </div>
              <div>
                <span className="text-[#86868b]">教学目标：</span>
                <span className="text-[#34c759] font-medium">{(localForm.questions || []).length} 个问题</span>
              </div>
              <div>
                <span className="text-[#86868b]">引导Prompt：</span>
                <span className={localForm.custom_prompts?.guidance ? "text-[#ff9500]" : "text-[#34c759]"}>
                  {localForm.custom_prompts?.guidance ? "自定义" : "默认"}
                </span>
              </div>
              <div>
                <span className="text-[#86868b]">评价Prompt：</span>
                <span className={localForm.custom_prompts?.evaluation ? "text-[#ff9500]" : "text-[#0071e3]"}>
                  {localForm.custom_prompts?.evaluation ? "自定义" : "默认"}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between pt-4 border-t border-[#e8e8ed]">
        <motion.button
          onClick={() => setCurrentStep(3)}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-[#0071e3] hover:bg-[#0071e3]/10 rounded-xl text-sm font-medium transition-colors"
        >
          ← 返回上一步
        </motion.button>
        <div className="flex gap-2">
          <motion.button
            onClick={onDelete}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-xl text-sm font-medium transition-colors"
          >
            删除
          </motion.button>
          {onSave && (
            <motion.button
              onClick={() => {
                onSave();
                setCurrentStep(5);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-[#34c759] text-white rounded-xl text-sm font-medium hover:bg-[#30b350] transition-colors"
            >
              完成配置 ✓
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );

  // Step 5: Overview & Edit - 总览编辑页面
  const renderStep5 = () => (
    <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
      {/* 基本信息 */}
      <div className="bg-[#f5f5f7] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#0071e3] text-white rounded-lg flex items-center justify-center text-xs">1</span>
          基本信息
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-2">模块名称</label>
            <input
              type="text"
              value={localForm.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg text-[14px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-2">用户描述</label>
            <input
              type="text"
              value={localForm.user_description}
              onChange={(e) => handleChange("user_description", e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg text-[14px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            />
          </div>
        </div>
      </div>

      {/* 教学内容 */}
      <div className="bg-[#f5f5f7] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#ff9500] text-white rounded-lg flex items-center justify-center text-xs">2</span>
          教学内容
          <span className="text-xs text-[#86868b] font-normal ml-2">
            ({(localForm.teaching_content?.length || 0)} 字符)
          </span>
        </h4>
        <textarea
          value={localForm.teaching_content || ""}
          onChange={(e) => handleChange("teaching_content", e.target.value)}
          rows={6}
          className="w-full px-3 py-2 bg-white rounded-lg text-[13px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#ff9500] transition-all resize-none"
        />
      </div>

      {/* 教学目标（问题列表） */}
      <div className="bg-[#f5f5f7] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-[#1d1d1f] flex items-center gap-2">
            <span className="w-6 h-6 bg-[#34c759] text-white rounded-lg flex items-center justify-center text-xs">3</span>
            教学目标
            <span className="text-xs text-[#86868b] font-normal ml-2">
              ({(localForm.questions || []).length} 个问题)
            </span>
          </h4>
          <motion.button
            onClick={addQuestion}
            whileTap={{ scale: 0.98 }}
            className="px-3 py-1.5 bg-[#34c759] text-white rounded-lg text-xs font-medium hover:bg-[#30b350] transition-colors"
          >
            + 添加问题
          </motion.button>
        </div>
        <div className="space-y-3">
          {(localForm.questions || []).map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-[#34c759]">问题 {index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveQuestion(index, "up")}
                    disabled={index === 0}
                    className="w-6 h-6 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded disabled:opacity-30 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveQuestion(index, "down")}
                    disabled={index === (localForm.questions || []).length - 1}
                    className="w-6 h-6 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded disabled:opacity-30 text-xs"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="w-6 h-6 flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
              <textarea
                value={question.question}
                onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                rows={2}
                placeholder="问题内容..."
                className="w-full px-2 py-1.5 bg-[#f5f5f7] rounded text-[13px] text-[#1d1d1f] outline-none focus:ring-1 focus:ring-[#34c759] transition-all resize-none mb-2"
              />
              <div className="text-xs text-[#0071e3] mb-1">回答要点：</div>
              <textarea
                value={question.answer_points}
                onChange={(e) => updateQuestion(question.id, "answer_points", e.target.value)}
                rows={2}
                placeholder="回答要点..."
                className="w-full px-2 py-1.5 bg-[#f5f5f7] rounded text-[13px] text-[#1d1d1f] outline-none focus:ring-1 focus:ring-[#0071e3] transition-all resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Prompt 配置 */}
      <div className="bg-[#f5f5f7] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#667eea] text-white rounded-lg flex items-center justify-center text-xs">4</span>
          Prompt 配置
        </h4>
        <div className="space-y-4">
          {/* 引导 Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#34c759]">引导提示词 (P2)</label>
              <span className={`text-xs px-2 py-0.5 rounded ${
                localForm.custom_prompts?.guidance
                  ? "bg-[#ff9500]/10 text-[#ff9500]"
                  : "bg-[#34c759]/10 text-[#34c759]"
              }`}>
                {localForm.custom_prompts?.guidance ? "自定义" : "使用默认"}
              </span>
            </div>
            <textarea
              value={localForm.custom_prompts?.guidance || ""}
              onChange={(e) => handleCustomPromptChange("guidance", e.target.value)}
              rows={3}
              placeholder="留空使用默认Prompt..."
              className="w-full px-2 py-1.5 bg-white rounded text-[12px] text-[#1d1d1f] outline-none focus:ring-1 focus:ring-[#34c759] transition-all resize-none font-mono"
            />
          </div>
          {/* 评价 Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#0071e3]">评价提示词 (P3)</label>
              <span className={`text-xs px-2 py-0.5 rounded ${
                localForm.custom_prompts?.evaluation
                  ? "bg-[#ff9500]/10 text-[#ff9500]"
                  : "bg-[#0071e3]/10 text-[#0071e3]"
              }`}>
                {localForm.custom_prompts?.evaluation ? "自定义" : "使用默认"}
              </span>
            </div>
            <textarea
              value={localForm.custom_prompts?.evaluation || ""}
              onChange={(e) => handleCustomPromptChange("evaluation", e.target.value)}
              rows={3}
              placeholder="留空使用默认Prompt..."
              className="w-full px-2 py-1.5 bg-white rounded text-[12px] text-[#1d1d1f] outline-none focus:ring-1 focus:ring-[#0071e3] transition-all resize-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex justify-between pt-4 border-t border-[#e8e8ed] sticky bottom-0 bg-white -mx-2 px-2 pb-2">
        <motion.button
          onClick={onDelete}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-xl text-sm font-medium transition-colors"
        >
          删除模块
        </motion.button>
        {onSave && (
          <motion.button
            onClick={onSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2.5 bg-[#0071e3] text-white rounded-xl text-sm font-medium hover:bg-[#0077ed] transition-colors"
          >
            保存修改
          </motion.button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <StepIndicator />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
