"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { previewAPI, AgeAdaptationRule, AgeAdaptationRulesResponse } from "@/lib/api";

const FIELD_LABELS: Record<keyof AgeAdaptationRule, string> = {
  language_style: "语言风格",
  vocabulary_level: "词汇水平",
  sentence_structure: "句子结构",
  examples: "举例类型",
  encouragement: "鼓励方式",
  explanation_depth: "解释深度",
  prompt_rules: "Prompt 规则（核心）",
};

const AGE_GROUP_LABELS: Record<string, string> = {
  "小学": "小学 (一至六年级)",
  "初中": "初中 (七至九年级)",
  "高中": "高中 (十至十二年级)",
};

export default function AgeAdaptationConfig() {
  const [data, setData] = useState<AgeAdaptationRulesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingRules, setEditingRules] = useState<Record<string, Partial<AgeAdaptationRule>>>({});
  const [selectedGroup, setSelectedGroup] = useState<string>("小学");
  const [isExpanded, setIsExpanded] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await previewAPI.getAgeAdaptationRules();
      setData(response);
      // Initialize editing rules with custom rules (or empty)
      setEditingRules(response.custom_rules || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFieldChange = (ageGroup: string, field: keyof AgeAdaptationRule, value: string) => {
    setEditingRules(prev => ({
      ...prev,
      [ageGroup]: {
        ...prev[ageGroup],
        [field]: value,
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Filter out empty values
      const cleanedRules: Record<string, Partial<AgeAdaptationRule>> = {};
      for (const [group, rules] of Object.entries(editingRules)) {
        const cleanedGroupRules: Partial<AgeAdaptationRule> = {};
        for (const [field, value] of Object.entries(rules)) {
          if (value && value.trim() !== "") {
            cleanedGroupRules[field as keyof AgeAdaptationRule] = value;
          }
        }
        if (Object.keys(cleanedGroupRules).length > 0) {
          cleanedRules[group] = cleanedGroupRules;
        }
      }

      await previewAPI.updateAgeAdaptationRules(cleanedRules);
      setSuccess("配置已保存");
      await loadData(); // Reload to get merged rules
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("确定要重置为默认配置吗？这将删除所有自定义配置。")) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await previewAPI.resetAgeAdaptationRules();
      setSuccess("已重置为默认配置");
      setEditingRules({});
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "重置失败");
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldValue = (ageGroup: string, field: keyof AgeAdaptationRule): string => {
    // Check if there's a custom value being edited
    const editedValue = editingRules[ageGroup]?.[field];
    if (editedValue !== undefined && editedValue !== "") {
      return editedValue;
    }
    // Otherwise show empty (placeholder will show default)
    return editingRules[ageGroup]?.[field] ?? "";
  };

  const getDefaultValue = (ageGroup: string, field: keyof AgeAdaptationRule): string => {
    return data?.default_rules[ageGroup]?.[field] || "";
  };

  const hasCustomValue = (ageGroup: string, field: keyof AgeAdaptationRule): boolean => {
    const customValue = data?.custom_rules?.[ageGroup]?.[field];
    return customValue !== undefined && customValue !== "";
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-sm text-[#86868b]">加载中...</span>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-[#d2d2d7]/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1d1d1f]">年龄段适配配置</h3>
          <p className="text-xs text-[#86868b] mt-1">{data?.description}</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-[#0071e3] hover:underline"
        >
          {isExpanded ? "收起" : "展开配置"}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-[#ff3b30]/10 text-[#ff3b30] rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-[#34c759]/10 text-[#34c759] rounded-xl text-sm">
                {success}
              </div>
            )}

            {/* Tab navigation for age groups */}
            <div className="flex gap-2 mb-4">
              {Object.keys(AGE_GROUP_LABELS).map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedGroup === group
                      ? "bg-[#0071e3] text-white"
                      : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  {group}
                  {data?.custom_rules?.[group] && Object.keys(data.custom_rules[group]).length > 0 && (
                    <span className="ml-1 text-xs">*</span>
                  )}
                </button>
              ))}
            </div>

            {/* Info box */}
            <div className="mb-4 p-3 bg-[#e8f4fd] border border-[#007AFF]/20 rounded-xl">
              <p className="text-xs text-[#007AFF]">
                <strong>说明：</strong>留空的字段将使用默认值。输入自定义内容后，该字段会覆盖默认配置。
                <br />
                <strong>包含年级：</strong>{data?.grades[selectedGroup]?.join("、")}
              </p>
            </div>

            {/* Fields editor */}
            <div className="space-y-4">
              {Object.entries(FIELD_LABELS).map(([field, label]) => {
                const fieldKey = field as keyof AgeAdaptationRule;
                const defaultValue = getDefaultValue(selectedGroup, fieldKey);
                const currentValue = getFieldValue(selectedGroup, fieldKey);
                const isCustomized = hasCustomValue(selectedGroup, fieldKey);
                const isPromptRules = fieldKey === "prompt_rules";

                return (
                  <div key={field}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-[#86868b]">
                        {label}
                        {isCustomized && (
                          <span className="ml-1 text-[#0071e3]">(已自定义)</span>
                        )}
                      </label>
                      {isCustomized && (
                        <button
                          onClick={() => handleFieldChange(selectedGroup, fieldKey, "")}
                          className="text-xs text-[#ff3b30] hover:underline"
                        >
                          清除自定义
                        </button>
                      )}
                    </div>
                    {isPromptRules ? (
                      <textarea
                        value={currentValue}
                        onChange={(e) => handleFieldChange(selectedGroup, fieldKey, e.target.value)}
                        placeholder={defaultValue}
                        rows={10}
                        className="w-full px-3 py-2 bg-[#f5f5f7] rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b]/50 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50 font-mono resize-y"
                      />
                    ) : (
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleFieldChange(selectedGroup, fieldKey, e.target.value)}
                        placeholder={defaultValue}
                        className="w-full px-3 py-2 bg-[#f5f5f7] rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b]/50 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#d2d2d7]/50">
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg transition-colors disabled:opacity-50"
              >
                重置为默认
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-[#0071e3] text-white text-sm font-medium rounded-lg hover:bg-[#0077ed] transition-colors disabled:opacity-50"
              >
                {isSaving ? "保存中..." : "保存配置"}
              </button>
            </div>

            {/* Preview of merged rules */}
            {data?.merged_rules && (
              <div className="mt-6 pt-4 border-t border-[#d2d2d7]/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#86868b]">
                    当前生效的 Prompt 规则预览（{selectedGroup}）
                  </span>
                </div>
                <pre className="bg-[#1d1d1f] text-[#f5f5f7] p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[200px]">
                  {data.merged_rules[selectedGroup]?.prompt_rules || "无"}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isExpanded && (
        <div className="bg-[#f5f5f7] rounded-xl p-3">
          <p className="text-xs text-[#86868b]">
            自定义不同年龄段（小学/初中/高中）的 AI 对话风格和语言适配规则。未自定义的字段将使用系统默认值。
          </p>
        </div>
      )}
    </div>
  );
}
