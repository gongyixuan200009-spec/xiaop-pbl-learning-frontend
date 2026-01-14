"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: string;
  features: string[];
}

interface CurrentConfig {
  selected_model: string;
}

interface ModelConfigResponse {
  current_config: CurrentConfig;
  available_models: ModelConfig[];
}

export default function ModelSelector() {
  const [config, setConfig] = useState<CurrentConfig | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/admin/model-config`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load config");
      }

      const data: ModelConfigResponse = await response.json();
      setConfig(data.current_config);
      setModels(data.available_models);
    } catch (error) {
      console.error("加载模型配置失败:", error);
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = async (modelId: string) => {
    if (!config) return;

    setSaving(true);
    setSaveStatus("idle");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/admin/model-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ selected_model: modelId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save config");
      }

      setConfig({ selected_model: modelId });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("保存模型配置失败:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#86868b]">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        加载中...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center text-[#86868b]">
        加载配置失败
      </div>
    );
  }

  const selectedModel = models.find(m => m.id === config.selected_model);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1d1d1f]">AI 模型配置</h2>
        {saveStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-[#34c759] font-medium"
          >
            ✓ 已保存
          </motion.div>
        )}
        {saveStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-[#ff3b30] font-medium"
          >
            ✗ 保存失败
          </motion.div>
        )}
      </div>

      {/* Current Model Display */}
      {selectedModel && (
        <div className="bg-[#f5f5f7] rounded-xl p-4">
          <div className="text-xs text-[#86868b] mb-1">当前使用模型</div>
          <div className="text-[15px] font-semibold text-[#1d1d1f] mb-1">
            {selectedModel.name}
          </div>
          <div className="text-xs text-[#86868b] mb-2">
            {selectedModel.description}
          </div>
          <div className="flex gap-2 flex-wrap">
            {selectedModel.features.map((feature, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-[#0071e3]/10 text-[#0071e3] rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-[#1d1d1f] mb-3">
          选择 AI 模型
        </label>
        <div className="space-y-3">
          {models.map((model) => (
            <motion.button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              disabled={saving}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                config.selected_model === model.id
                  ? "border-[#0071e3] bg-[#0071e3]/5"
                  : "border-[#d2d2d7] bg-white hover:border-[#0071e3]/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[15px] font-semibold text-[#1d1d1f]">
                      {model.name}
                    </div>
                    {config.selected_model === model.id && (
                      <div className="w-5 h-5 rounded-full bg-[#0071e3] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[#86868b] mb-2">
                    {model.description}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {model.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          config.selected_model === model.id
                            ? "bg-[#0071e3]/10 text-[#0071e3]"
                            : "bg-[#f5f5f7] text-[#86868b]"
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#0071e3]/5 border border-[#0071e3]/20 rounded-xl p-4">
        <div className="text-xs text-[#0071e3] font-medium mb-1">提示</div>
        <div className="text-xs text-[#1d1d1f]/70">
          切换模型后，新的对话将使用选定的模型。已有的对话不受影响。
        </div>
      </div>
    </div>
  );
}
