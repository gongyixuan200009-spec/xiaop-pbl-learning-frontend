"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { promptHistoryAPI, PromptHistoryRecord, PromptHistoryType } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  form_config: "表单配置",
  age_adaptation: "年龄段适配规则",
  extraction_rules: "字段提取规则",
  test_config: "关卡测试配置",
};

const TYPE_COLORS: Record<string, string> = {
  form_config: "bg-[#0071e3]/10 text-[#0071e3]",
  age_adaptation: "bg-[#34c759]/10 text-[#34c759]",
  extraction_rules: "bg-[#ff9500]/10 text-[#ff9500]",
  test_config: "bg-[#af52de]/10 text-[#af52de]",
};

export default function PromptHistory() {
  const [records, setRecords] = useState<PromptHistoryRecord[]>([]);
  const [types, setTypes] = useState<PromptHistoryType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 加载历史记录类型
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const data = await promptHistoryAPI.getTypes();
        setTypes(data.types);
      } catch (err) {
        console.error("加载类型失败:", err);
      }
    };
    loadTypes();
  }, []);

  // 加载历史记录
  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await promptHistoryAPI.getHistory(
        selectedType || undefined,
        undefined,
        limit,
        offset
      );
      setRecords(data.records);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      loadHistory();
    }
  }, [selectedType, offset, isExpanded]);

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 渲染内容预览
  const renderContentPreview = (content: Record<string, any>) => {
    const keys = Object.keys(content);
    if (keys.length === 0) return "无内容";

    // 显示前两个字段的预览
    return keys.slice(0, 2).map(key => {
      const value = content[key];
      const preview = typeof value === "string"
        ? value.substring(0, 50) + (value.length > 50 ? "..." : "")
        : JSON.stringify(value).substring(0, 50) + "...";
      return `${key}: ${preview}`;
    }).join(" | ");
  };

  // 渲染完整内容
  const renderFullContent = (content: Record<string, any>) => {
    return (
      <div className="space-y-3">
        {Object.entries(content).map(([key, value]) => (
          <div key={key} className="bg-[#f5f5f7] rounded-lg p-3">
            <div className="text-xs font-medium text-[#0071e3] mb-1">{key}</div>
            <div className="text-sm text-[#1d1d1f] whitespace-pre-wrap font-mono">
              {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-6 pt-6 border-t border-[#d2d2d7]/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Prompt 修改历史</h3>
          <p className="text-xs text-[#86868b] mt-1">
            记录每次 Prompt 修改，支持历史版本追踪
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-[#0071e3] hover:underline"
        >
          {isExpanded ? "收起" : "展开"}
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
            {/* 筛选器 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-[#86868b]">筛选类型:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedType(""); setOffset(0); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedType === ""
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  全部
                </button>
                {types.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => { setSelectedType(type.value); setOffset(0); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedType === type.value
                        ? "bg-[#1d1d1f] text-white"
                        : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <button
                onClick={loadHistory}
                className="ml-auto text-xs text-[#0071e3] hover:underline"
              >
                刷新
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-[#ff3b30]/10 text-[#ff3b30] rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* 历史记录列表 */}
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-sm text-[#86868b]">加载中...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-8 text-center text-[#86868b]">
                <p className="text-sm">暂无修改记录</p>
                <p className="text-xs mt-1">保存配置后，修改记录会自动保存到这里</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {records.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#f5f5f7] rounded-xl overflow-hidden"
                  >
                    {/* 记录头部 */}
                    <button
                      onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                      className="w-full p-4 text-left hover:bg-[#e8e8ed] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[record.type] || "bg-[#86868b]/10 text-[#86868b]"}`}>
                            {TYPE_LABELS[record.type] || record.type}
                          </span>
                          <span className="text-xs text-[#86868b]">
                            {record.identifier}
                          </span>
                        </div>
                        <span className="text-xs text-[#86868b]">
                          {formatTime(record.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-[#1d1d1f]">{record.description}</p>
                      <p className="text-xs text-[#86868b] mt-1 truncate">
                        {renderContentPreview(record.content)}
                      </p>
                    </button>

                    {/* 展开的详情 */}
                    <AnimatePresence>
                      {expandedId === record.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-[#d2d2d7]/50"
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-medium text-[#86868b]">修改内容详情</span>
                              <span className="text-xs text-[#86868b]">
                                操作者: {record.operator}
                              </span>
                            </div>
                            {renderFullContent(record.content)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {total > limit && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#d2d2d7]/50">
                <span className="text-xs text-[#86868b]">
                  共 {total} 条记录，当前显示 {offset + 1}-{Math.min(offset + limit, total)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="px-3 py-1 text-xs font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                    className="px-3 py-1 text-xs font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isExpanded && (
        <div className="bg-[#f5f5f7] rounded-xl p-3">
          <p className="text-xs text-[#86868b]">
            {total > 0 ? `已保存 ${total} 条修改记录` : "保存配置后，修改记录会自动保存到这里"}
          </p>
        </div>
      )}
    </div>
  );
}
