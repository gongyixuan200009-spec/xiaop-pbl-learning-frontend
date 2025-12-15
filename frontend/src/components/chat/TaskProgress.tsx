"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TaskProgressProps {
  fields: string[];
  extractedFields: Record<string, string>;
  isExpanded?: boolean;
}

export function TaskProgress({ fields, extractedFields, isExpanded: defaultExpanded = true }: TaskProgressProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedCount = fields.filter((f) => extractedFields[f]).length;
  const progress = fields.length > 0 ? (completedCount / fields.length) * 100 : 0;

  return (
    <div className="bg-white shadow-sm border border-[#d2d2d7]/30 overflow-hidden rounded-vw-lg">
      {/* Title bar */}
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-[#f5f5f7]/50 transition-colors active:bg-[#f5f5f7]"
        style={{ padding: "var(--space-sm) var(--space-md)" }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center" style={{ gap: "var(--space-sm)" }}>
          <div
            className="rounded-full bg-[#0071e3]/10 flex items-center justify-center"
            style={{ width: "var(--icon-lg)", height: "var(--icon-lg)" }}
          >
            <span style={{ fontSize: "var(--text-sm)" }}>📝</span>
          </div>
          <div>
            <span className="font-semibold text-[#1d1d1f]" style={{ fontSize: "var(--text-xs)" }}>
              小P记下了这些
            </span>
            <span className="text-[#86868b]" style={{ fontSize: "var(--text-xs)", marginLeft: "var(--space-xs)" }}>
              ({completedCount}/{fields.length})
            </span>
          </div>
        </div>
        <button className="text-[#86868b] hover:text-[#1d1d1f] transition-colors" style={{ padding: "2px" }}>
          {isExpanded ? (
            <ChevronUp style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
          ) : (
            <ChevronDown style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 var(--space-md) var(--space-sm)" }}>
        <div
          className="bg-[#f5f5f7] rounded-full overflow-hidden"
          style={{ height: "clamp(3px, 0.8vw, 6px)" }}
        >
          <motion.div
            className="h-full bg-[#0071e3] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Field list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="overflow-y-auto"
              style={{
                padding: "0 var(--space-md) var(--space-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-xs)",
                maxHeight: "35vh"
              }}
            >
              {fields.map((field, index) => {
                const value = extractedFields[field];
                const isCompleted = !!value;

                return (
                  <motion.div
                    key={field}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "transition-all rounded-vw-md",
                      isCompleted
                        ? "bg-[#34c759]/10"
                        : "bg-[#f5f5f7]"
                    )}
                    style={{
                      padding: "var(--space-sm)",
                      borderLeft: `clamp(2px, 0.5vw, 3px) solid ${isCompleted ? '#34c759' : '#d2d2d7'}`
                    }}
                  >
                    <div className="flex items-center" style={{ gap: "var(--space-xs)" }}>
                      {isCompleted ? (
                        <div
                          className="rounded-full bg-[#34c759] flex items-center justify-center"
                          style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }}
                        >
                          <CheckCircle style={{ width: "60%", height: "60%" }} className="text-white" />
                        </div>
                      ) : (
                        <div
                          className="rounded-full border-2 border-[#d2d2d7] flex items-center justify-center"
                          style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }}
                        >
                          <Circle style={{ width: "50%", height: "50%" }} className="text-[#d2d2d7]" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "font-medium",
                          isCompleted ? "text-[#1d1d1f]" : "text-[#86868b]"
                        )}
                        style={{ fontSize: "var(--text-xs)" }}
                      >
                        {field}
                      </span>
                    </div>
                    {isCompleted && (
                      <p
                        className="text-[#1d1d1f] line-clamp-2"
                        style={{
                          marginTop: "var(--space-xs)",
                          paddingLeft: "calc(var(--icon-sm) + var(--space-xs))",
                          fontSize: "var(--text-xs)"
                        }}
                      >
                        {value}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
