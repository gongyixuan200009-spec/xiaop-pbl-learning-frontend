"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ModelOption {
  value: string;
  label: string;
}

interface ProviderModels {
  default: ModelOption[];
  vision: ModelOption[];
}

interface ReasoningEffort {
  value: string;
  label: string;
  description?: string;
}

interface Provider {
  value: string;
  label: string;
  description?: string;
  models: ProviderModels;
  reasoning_efforts?: ReasoningEffort[];
  default_endpoint?: string;
}

interface APIConfig {
  api_provider: string;
  api_key: string;
  api_endpoint: string;
  default_model: string;
  fast_model: string;
  vision_model: string;
  vision_model_enabled: boolean;
  reasoning_effort?: string;
}

interface APIConfigResponse {
  current_config: APIConfig;
  providers: Provider[];
}

export default function APIConfigEditor() {
  const [config, setConfig] = useState<APIConfig | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/admin/api-config`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load config");
      }

      const data: APIConfigResponse = await response.json();
      setConfig(data.current_config);
      setProviders(data.providers);
    } catch (error) {
      console.error("加载API配置失败:", error);
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setSaveStatus("idle");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/admin/api-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("Failed to save config");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("保存API配置失败:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<APIConfig>) => {
    if (!config) return;
    setConfig({ ...config, ...updates });
  };

  const handleProviderChange = (newProvider: string) => {
    if (!config) return;

    const provider = providers.find(p => p.value === newProvider);
    if (!provider) return;

    const providerModels = provider.models;
    const defaultModel = providerModels.default[0]?.value || "";
    const visionModel = providerModels.vision[0]?.value || "";

    updateConfig({
      api_provider: newProvider,
      default_model: defaultModel,
      fast_model: defaultModel,
      vision_model: visionModel,
      reasoning_effort: newProvider === "volcengine" ? "medium" : undefined,
    });
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

  const currentProvider = providers.find(p => p.value === config.api_provider);
  const isVolcengine = config.api_provider === "volcengine";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1d1d1f]">API 配置</h2>
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            saveStatus === "success"
              ? "bg-[#34c759] text-white"
              : saveStatus === "error"
              ? "bg-[#ff3b30] text-white"
              : "bg-[#0071e3] text-white hover:bg-[#0077ed]"
          }`}
        >
          {saving ? "保存中..." : saveStatus === "success" ? "已保存" : saveStatus === "error" ? "保存失败" : "保存配置"}
        </motion.button>
      </div>

      {/* API Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
          API 提供商
        </label>
        <select
          value={config.api_provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full px-4 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
        >
          {providers.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
          API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={config.api_key}
            onChange={(e) => updateConfig({ api_key: e.target.value })}
            className="w-full px-4 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent pr-20"
            placeholder="输入 API Key"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#0071e3] hover:text-[#0077ed]"
          >
            {showApiKey ? "隐藏" : "显示"}
          </button>
        </div>
      </div>

      {/* API Endpoint (for Volcengine) */}
      {isVolcengine && (
        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
            API 端点
          </label>
          <input
            type="text"
            value={config.api_endpoint}
            onChange={(e) => updateConfig({ api_endpoint: e.target.value })}
            className="w-full px-4 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
            placeholder="https://ark.cn-beijing.volces.com/api/v3"
          />
        </div>
      )}

      {/* Model Selection */}
      {currentProvider && (
        <>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              默认模型
            </label>
            <select
              value={config.default_model}
              onChange={(e) => updateConfig({ default_model: e.target.value })}
              className="w-full px-4 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
            >
              {currentProvider.models.default.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              快速模型
            </label>
            <select
              value={config.fast_model}
              onChange={(e) => updateConfig({ fast_model: e.target.value })}
              className="w-full px-4 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
            >
              {currentProvider.models.default.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              视觉模型
            </label>
            <select
              value={config.vision_model}
              onChange={(e) => updateConfig({ vision_model: e.target.value })}
              className="w-full px-4 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
            >
              {currentProvider.models.vision.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vision Model Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#f5f5f7] rounded-xl">
            <span className="text-sm font-medium text-[#1d1d1f]">启用视觉模型</span>
            <button
              onClick={() => updateConfig({ vision_model_enabled: !config.vision_model_enabled })}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                config.vision_model_enabled ? "bg-[#34c759]" : "bg-[#d2d2d7]"
              }`}
            >
              <motion.div
                animate={{ x: config.vision_model_enabled ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          {/* Reasoning Effort (Volcengine only) */}
          {isVolcengine && currentProvider.reasoning_efforts && (
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                推理强度
              </label>
              <select
                value={config.reasoning_effort || "medium"}
                onChange={(e) => updateConfig({ reasoning_effort: e.target.value })}
                className="w-full px-4 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
              >
                {currentProvider.reasoning_efforts.map((effort) => (
                  <option key={effort.value} value={effort.value}>
                    {effort.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="bg-[#0071e3]/5 border border-[#0071e3]/20 rounded-xl p-4">
        <div className="text-xs text-[#0071e3] font-medium mb-1">提示</div>
        <div className="text-xs text-[#1d1d1f]/70">
          修改API配置后，新的对话将使用更新后的模型。已有的对话不受影响。
        </div>
      </div>
    </div>
  );
}
