"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormConfig } from "@/lib/api";
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

  useEffect(() => {
    setLocalForm(form);
  }, [form]);

  const handleChange = (field: keyof FormConfig, value: string | string[]) => {
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
