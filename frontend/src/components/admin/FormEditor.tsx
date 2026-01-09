"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormConfig, previewAPI, AgeAdaptationRulesResponse } from "@/lib/api";
import PromptPreview from "./PromptPreview";

interface FormEditorProps {
  form: FormConfig;
  onUpdate: (form: FormConfig) => void;
  onDelete: () => void;
}

const DEFAULT_EXTRACTION_RULES = `【严格提取规则】
1. 只提取user明确表达的内容，不要推测或补充
2. 内容必须与字段名要求严格匹配：
   - 如果字段名含"(如何...)"，提取的内容必须是以"如何"/"怎样"开头的问句
   - 如果字段名含"(2条量化)"，必须提取至少2条带有数字/可测量指标的内容
   - 如果字段名含"(2条限制)"，必须提取至少2条限制条件
   - 如果字段名含"原理"，必须是具体的科学原理或方法说明
   - 如果字段名含"方案"，必须是具体可执行的解决方案描述
3. 【主题相关性检查】：
   - 提取的内容必须与当前讨论的主题直接相关
   - 如果用户讨论的是A主题，但字段要求B主题的内容，则填null
   - 内容必须在逻辑上与整个对话的上下文一致
   - 不能将不相关的回答强行归类到某个字段
4. 拒绝提取的情况（填null）：
   - 用户只是在询问或不确定
   - 内容模糊、不完整或缺少具体细节
   - 内容与字段要求不匹配（如要求"如何..."但用户说的不是问句）
   - 只有1条而字段要求2条
   - 内容与当前讨论主题不相关
5. 质量检查：
   - 提取内容应该是用户最终确认的版本，不是中间讨论的内容
   - 只提取实质性内容，不提取"好的"、"我明白了"等无意义回复
   - 确保提取的内容在语义上与对话主题保持一致`;

export default function FormEditor({ form, onUpdate, onDelete }: FormEditorProps) {
  const [localForm, setLocalForm] = useState(form);
  const [newField, setNewField] = useState("");
  const [showExtractionPrompt, setShowExtractionPrompt] = useState(false);
  const [showAgePrompts, setShowAgePrompts] = useState(false);
  const [showTestConfig, setShowTestConfig] = useState(false);

  // 年龄段适配规则状态
  const [ageRulesData, setAgeRulesData] = useState<AgeAdaptationRulesResponse | null>(null);
  const [editingAgeRules, setEditingAgeRules] = useState<Record<string, string>>({});
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("小学");
  const [ageRulesLoading, setAgeRulesLoading] = useState(false);
  const [ageRulesSaving, setAgeRulesSaving] = useState(false);
  const [ageRulesMessage, setAgeRulesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setLocalForm(form);
  }, [form]);

  // 加载全局年龄段适配规则
  useEffect(() => {
    const loadAgeRules = async () => {
      setAgeRulesLoading(true);
      try {
        const data = await previewAPI.getAgeAdaptationRules();
        setAgeRulesData(data);
        // 初始化编辑状态为自定义规则中的 prompt_rules
        const editingState: Record<string, string> = {};
        for (const group of Object.keys(data.default_rules)) {
          editingState[group] = data.custom_rules?.[group]?.prompt_rules || "";
        }
        setEditingAgeRules(editingState);
      } catch (error) {
        console.error("加载年龄段规则失败:", error);
      } finally {
        setAgeRulesLoading(false);
      }
    };
    loadAgeRules();
  }, []);

  // 获取当前年龄段的默认规则
  const getDefaultAgeRule = (group: string): string => {
    return ageRulesData?.default_rules?.[group]?.prompt_rules || "";
  };

  // 获取当前年龄段的编辑值
  const getEditingAgeRule = (group: string): string => {
    return editingAgeRules[group] || "";
  };

  // 处理年龄段规则编辑
  const handleAgeRuleChange = (group: string, value: string) => {
    setEditingAgeRules(prev => ({ ...prev, [group]: value }));
  };

  // 填入默认规则
  const fillDefaultAgeRule = (group: string) => {
    const defaultRule = getDefaultAgeRule(group);
    setEditingAgeRules(prev => ({ ...prev, [group]: defaultRule }));
  };

  // 清空自定义规则
  const clearAgeRule = (group: string) => {
    setEditingAgeRules(prev => ({ ...prev, [group]: "" }));
  };

  // 保存年龄段规则到全局配置
  const saveAgeRules = async () => {
    setAgeRulesSaving(true);
    setAgeRulesMessage(null);
    try {
      // 构建自定义规则对象
      const customRules: Record<string, { prompt_rules: string }> = {};
      for (const [group, rule] of Object.entries(editingAgeRules)) {
        if (rule && rule.trim() !== "") {
          customRules[group] = { prompt_rules: rule };
        }
      }
      await previewAPI.updateAgeAdaptationRules(customRules);
      setAgeRulesMessage({ type: "success", text: "年龄段适配规则已保存" });
      // 重新加载数据
      const data = await previewAPI.getAgeAdaptationRules();
      setAgeRulesData(data);
      setTimeout(() => setAgeRulesMessage(null), 3000);
    } catch (error) {
      setAgeRulesMessage({ type: "error", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setAgeRulesSaving(false);
    }
  };

  // 重置为默认规则
  const resetAgeRules = async () => {
    if (!confirm("确定要重置所有年龄段规则为默认值吗？")) return;
    setAgeRulesSaving(true);
    setAgeRulesMessage(null);
    try {
      await previewAPI.resetAgeAdaptationRules();
      setAgeRulesMessage({ type: "success", text: "已重置为默认规则" });
      setEditingAgeRules({});
      const data = await previewAPI.getAgeAdaptationRules();
      setAgeRulesData(data);
      setTimeout(() => setAgeRulesMessage(null), 3000);
    } catch (error) {
      setAgeRulesMessage({ type: "error", text: error instanceof Error ? error.message : "重置失败" });
    } finally {
      setAgeRulesSaving(false);
    }
  };

  const handleChange = (field: keyof FormConfig, value: string | string[] | boolean) => {
    const updated = { ...localForm, [field]: value };
    setLocalForm(updated);
    onUpdate(updated);
  };

  const addField = () => {
    if (newField.trim()) {
      handleChange("fields", [...localForm.fields, newField.trim()]);
      setNewField("");
    }
  };

  const removeField = (index: number) => {
    handleChange(
      "fields",
      localForm.fields.filter((_, i) => i !== index)
    );
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...localForm.fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFields.length) {
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      handleChange("fields", newFields);
    }
  };

  const resetExtractionPrompt = () => {
    handleChange("extraction_prompt", "");
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#86868b] mb-2">表单名称</label>
          <input
            type="text"
            value={localForm.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#86868b] mb-2">用户描述（侧边栏显示）</label>
          <input
            type="text"
            value={localForm.user_description}
            onChange={(e) => handleChange("user_description", e.target.value)}
            className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#86868b] mb-2">AI提示词</label>
          <textarea
            value={localForm.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all resize-none"
          />
        </div>
      </div>

      {/* Fields */}
      <div>
        <label className="block text-xs font-medium text-[#86868b] mb-3">字段列表</label>

        <div className="space-y-2 mb-4">
          <AnimatePresence>
            {localForm.fields.map((field, index) => (
              <motion.div
                key={field + index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 p-3 bg-[#f5f5f7] rounded-xl group"
              >
                <span className="text-xs text-[#86868b] w-6">{index + 1}.</span>
                <span className="flex-1 text-[15px] text-[#1d1d1f]">{field}</span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveField(index, "up")}
                    disabled={index === 0}
                    className="w-7 h-7 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] disabled:opacity-30 transition-colors"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveField(index, "down")}
                    disabled={index === localForm.fields.length - 1}
                    className="w-7 h-7 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] disabled:opacity-30 transition-colors"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeField(index)}
                    className="w-7 h-7 flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addField()}
            placeholder="输入新字段名称"
            className="flex-1 px-4 py-2 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
          />
          <motion.button
            onClick={addField}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-[#0071e3] text-white rounded-xl text-sm font-medium hover:bg-[#0077ed] transition-colors"
          >
            添加
          </motion.button>
        </div>
      </div>

      {/* Extraction Prompt Section */}
      <div className="pt-4 border-t border-[#d2d2d7]/50">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-medium text-[#86868b]">
            字段提取规则（高级）
          </label>
          <button
            onClick={() => setShowExtractionPrompt(!showExtractionPrompt)}
            className="text-xs text-[#0071e3] hover:underline"
          >
            {showExtractionPrompt ? "收起" : "展开配置"}
          </button>
        </div>

        <AnimatePresence>
          {showExtractionPrompt && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-[#fff8e6] border border-[#ffcc00]/30 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#8a6d00] leading-relaxed">
                  <strong>说明：</strong>此处可自定义字段提取的判断规则。系统会根据这些规则判断学生的回答是否可以记录到表格字段中。
                  留空则使用默认规则（严格模式：只提取学生明确表达的内容）。
                </p>
              </div>

              <textarea
                value={localForm.extraction_prompt || ""}
                onChange={(e) => handleChange("extraction_prompt", e.target.value)}
                rows={12}
                placeholder={DEFAULT_EXTRACTION_RULES}
                className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[13px] text-[#1d1d1f] font-mono outline-none focus:ring-2 focus:ring-[#0071e3] transition-all resize-none"
              />

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[#86868b]">
                  {localForm.extraction_prompt ? "使用自定义规则" : "使用默认规则"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChange("extraction_prompt", DEFAULT_EXTRACTION_RULES)}
                    className="text-xs text-[#0071e3] hover:underline"
                  >
                    填入默认规则
                  </button>
                  {localForm.extraction_prompt && (
                    <button
                      onClick={resetExtractionPrompt}
                      className="text-xs text-[#ff3b30] hover:underline"
                    >
                      清空（使用默认）
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showExtractionPrompt && localForm.extraction_prompt && (
          <div className="bg-[#f5f5f7] rounded-xl p-3">
            <p className="text-xs text-[#86868b]">
              ✓ 已配置自定义提取规则（{localForm.extraction_prompt.length} 字符）
            </p>
          </div>
        )}
      </div>

      {/* Age-Based Prompts Section - 全局配置 */}
      <div className="pt-4 border-t border-[#d2d2d7]/50">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-medium text-[#86868b]">
            年龄段适配Prompt（高级）
          </label>
          <button
            onClick={() => setShowAgePrompts(!showAgePrompts)}
            className="text-xs text-[#0071e3] hover:underline"
          >
            {showAgePrompts ? "收起" : "展开配置"}
          </button>
        </div>

        <AnimatePresence>
          {showAgePrompts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-4"
            >
              <div className="bg-[#e8f5e9] border border-[#4caf50]/30 rounded-xl p-4">
                <p className="text-xs text-[#2e7d32] leading-relaxed">
                  <strong>说明：</strong>此配置为全局设置，适用于所有表单。系统会根据用户注册时选择的年龄段，
                  在基础prompt后附加对应的适配规则。留空则使用系统默认规则。
                </p>
              </div>

              {/* 消息提示 */}
              {ageRulesMessage && (
                <div className={`p-3 rounded-xl text-sm ${
                  ageRulesMessage.type === "success"
                    ? "bg-[#34c759]/10 text-[#34c759]"
                    : "bg-[#ff3b30]/10 text-[#ff3b30]"
                }`}>
                  {ageRulesMessage.text}
                </div>
              )}

              {ageRulesLoading ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-sm text-[#86868b]">加载中...</span>
                </div>
              ) : (
                <>
                  {/* 年龄段选项卡 */}
                  <div className="flex gap-2">
                    {["小学", "初中", "高中"].map((group) => (
                      <button
                        key={group}
                        onClick={() => setSelectedAgeGroup(group)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedAgeGroup === group
                            ? "bg-[#0071e3] text-white"
                            : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                        }`}
                      >
                        {group}
                        {editingAgeRules[group] && (
                          <span className="ml-1 text-xs">*</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* 编辑区域 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-[#86868b]">
                        {selectedAgeGroup}生适配规则
                        {editingAgeRules[selectedAgeGroup] && (
                          <span className="ml-1 text-[#0071e3]">(已自定义)</span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fillDefaultAgeRule(selectedAgeGroup)}
                          className="text-xs text-[#0071e3] hover:underline"
                        >
                          填入默认规则
                        </button>
                        {editingAgeRules[selectedAgeGroup] && (
                          <button
                            onClick={() => clearAgeRule(selectedAgeGroup)}
                            className="text-xs text-[#ff3b30] hover:underline"
                          >
                            清空
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={getEditingAgeRule(selectedAgeGroup)}
                      onChange={(e) => handleAgeRuleChange(selectedAgeGroup, e.target.value)}
                      rows={10}
                      placeholder={getDefaultAgeRule(selectedAgeGroup) || "加载中..."}
                      className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[13px] text-[#1d1d1f] font-mono outline-none focus:ring-2 focus:ring-[#0071e3] transition-all resize-y"
                    />
                    <p className="text-xs text-[#86868b] mt-2">
                      {editingAgeRules[selectedAgeGroup] ? "使用自定义规则" : "使用默认规则（显示在placeholder中）"}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#d2d2d7]/50">
                    <button
                      onClick={resetAgeRules}
                      disabled={ageRulesSaving}
                      className="px-4 py-2 text-sm font-medium text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      重置所有为默认
                    </button>
                    <button
                      onClick={saveAgeRules}
                      disabled={ageRulesSaving}
                      className="px-6 py-2 bg-[#0071e3] text-white text-sm font-medium rounded-lg hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                    >
                      {ageRulesSaving ? "保存中..." : "保存规则"}
                    </button>
                  </div>

                  {/* 当前生效规则预览 */}
                  {ageRulesData?.merged_rules && (
                    <div className="pt-4 border-t border-[#d2d2d7]/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#86868b]">
                          当前生效的规则预览（{selectedAgeGroup}）
                        </span>
                      </div>
                      <pre className="bg-[#1d1d1f] text-[#f5f5f7] p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[200px]">
                        {ageRulesData.merged_rules[selectedAgeGroup]?.prompt_rules || "无"}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!showAgePrompts && (
          <div className="bg-[#f5f5f7] rounded-xl p-3">
            <p className="text-xs text-[#86868b]">
              {Object.values(editingAgeRules).some(r => r && r.trim())
                ? "✓ 已配置自定义年龄段适配规则（全局生效）"
                : "使用系统默认的年龄段适配规则"}
            </p>
          </div>
        )}
      </div>

      {/* Checkpoint Test Configuration */}
      <div className="pt-4 border-t border-[#d2d2d7]/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <label className="block text-xs font-medium text-[#86868b]">
              关卡测试配置
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localForm.test_enabled || false}
                onChange={(e) => handleChange("test_enabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#d2d2d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#34c759]"></div>
              <span className="ms-2 text-xs text-[#1d1d1f]">
                {localForm.test_enabled ? "已启用" : "未启用"}
              </span>
            </label>
          </div>
          {localForm.test_enabled && (
            <button
              onClick={() => setShowTestConfig(!showTestConfig)}
              className="text-xs text-[#0071e3] hover:underline"
            >
              {showTestConfig ? "收起" : "展开配置"}
            </button>
          )}
        </div>

        <AnimatePresence>
          {localForm.test_enabled && showTestConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-4"
            >
              <div className="bg-[#fff8e6] border border-[#ffcc00]/30 rounded-xl p-4">
                <p className="text-xs text-[#8a6d00] leading-relaxed">
                  <strong>说明：</strong>关卡测试在学生完成所有字段后触发。学生需要通过测试才能确认完成当前阶段并进入下一步。
                  测试通过时，AI需要在回复中包含"通过凭证"中的内容（如 STEP1_OK:）。
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868b] mb-2">
                  测试提示词（AI出题指引）
                </label>
                <textarea
                  value={localForm.test_prompt || ""}
                  onChange={(e) => handleChange("test_prompt", e.target.value)}
                  rows={10}
                  placeholder="输入测试的提示词，告诉AI如何出题、评判标准、通过条件等..."
                  className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[13px] text-[#1d1d1f] font-mono outline-none focus:ring-2 focus:ring-[#0071e3] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868b] mb-2">
                  通过凭证（判断通过的标识）
                </label>
                <input
                  type="text"
                  value={localForm.test_pass_pattern || ""}
                  onChange={(e) => handleChange("test_pass_pattern", e.target.value)}
                  placeholder="例如: STEP1_OK:"
                  className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[15px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                />
                <p className="text-xs text-[#86868b] mt-2">
                  当AI回复中包含此内容时，系统判定测试通过。建议使用类似 "STEP1_OK:" 的格式。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {localForm.test_enabled && !showTestConfig && (
          <div className="bg-[#e8f5e9] rounded-xl p-3">
            <p className="text-xs text-[#2e7d32]">
              ✓ 关卡测试已启用 | 通过凭证: {localForm.test_pass_pattern || "未设置"}
            </p>
          </div>
        )}

        {!localForm.test_enabled && (
          <div className="bg-[#f5f5f7] rounded-xl p-3">
            <p className="text-xs text-[#86868b]">
              关卡测试未启用，学生完成字段后可直接确认进入下一步
            </p>
          </div>
        )}
      </div>

      {/* Prompt Preview Section */}
      <PromptPreview form={localForm} />

      {/* Delete Button */}
      <div className="pt-6 border-t border-[#d2d2d7]/50">
        <motion.button
          onClick={onDelete}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-xl text-sm font-medium transition-colors"
        >
          删除此表单
        </motion.button>
      </div>
    </div>
  );
}
