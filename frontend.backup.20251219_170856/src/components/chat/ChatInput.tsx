"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface ChatInputProps {
  onSend: (message: string, imageUrl?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "输入消息...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // 使用 auth store 获取 token
  const token = useAuthStore((state) => state.token);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!message.trim() && !selectedImage) || disabled || isUploading) return;

    let imageUrl: string | undefined;

    // Upload image if selected
    if (selectedImage) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedImage);

        const response = await fetch(`${API_BASE}/api/upload/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("上传失败");
        }

        const data = await response.json();
        // Convert relative URL to full URL
        imageUrl = `${API_BASE}${data.url}`;
      } catch (error) {
        console.error("图片上传失败:", error);
        alert("图片上传失败，请重试");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSend(message.trim() || "请看这张图片", imageUrl);
    setMessage("");
    setSelectedImage(null);
    setImagePreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("图片大小不能超过10MB");
        return;
      }
      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 120;
      const scrollHeight = textarea.scrollHeight;
      const newHeight = scrollHeight < maxHeight ? scrollHeight : maxHeight;
      textarea.style.height = newHeight + "px";
    }
  }, [message]);

  return (
    <div
      className="bg-white/90 backdrop-blur-xl border-t border-[#d2d2d7]/30 flex-shrink-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-3xl mx-auto"
            style={{ padding: "var(--space-sm) var(--space-md) 0" }}
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="预览"
                className="max-h-24 rounded-lg border border-[#d2d2d7]/50"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-[#ff3b30] text-white rounded-full p-1 shadow-lg hover:bg-[#ff453a] transition-colors"
              >
                <X style={{ width: "12px", height: "12px" }} />
              </button>
            </div>
            <p className="text-xs text-[#ff9500] mt-1">
              提示：包含图片的消息可能需要较长处理时间
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto"
        style={{ padding: "var(--space-sm) var(--space-md)" }}
      >
        <motion.div
          animate={{
            boxShadow: isFocused
              ? "0 0 0 3px rgba(0, 113, 227, 0.2)"
              : "0 0 0 1px rgba(210, 210, 215, 0.5)",
          }}
          className="flex items-end bg-[#f5f5f7] rounded-vw-lg transition-all"
          style={{ gap: "var(--space-sm)", padding: "var(--space-sm)" }}
        >
          {/* Image upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={disabled}
          />
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-shrink-0 flex items-center justify-center transition-all active:scale-95 rounded-vw-md ${
              selectedImage
                ? "bg-[#0071e3] text-white"
                : "bg-[#e8e8ed] text-[#86868b] hover:bg-[#d2d2d7]"
            }`}
            style={{ width: "var(--btn-height-sm)", height: "var(--btn-height-sm)" }}
            title="添加图片"
          >
            <ImageIcon
              style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }}
            />
          </motion.button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || isUploading}
            placeholder={selectedImage ? "添加说明（可选）..." : placeholder}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-[#1d1d1f] placeholder-[#86868b] leading-6 disabled:opacity-50"
            style={{
              fontSize: "var(--text-base)",
              padding: "var(--space-xs) 0",
              minHeight: "clamp(20px, 5vw, 24px)",
              maxHeight: "120px"
            }}
          />

          <motion.button
            type="submit"
            disabled={(!message.trim() && !selectedImage) || disabled || isUploading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-shrink-0 flex items-center justify-center transition-all active:scale-95 rounded-vw-md ${
              (message.trim() || selectedImage) && !disabled && !isUploading
                ? "bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/25"
                : "bg-[#d2d2d7] text-white"
            }`}
            style={{ width: "var(--btn-height-sm)", height: "var(--btn-height-sm)" }}
          >
            {isUploading ? (
              <Loader2
                className="animate-spin"
                style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }}
              />
            ) : (
              <Send
                style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }}
                className={(message.trim() || selectedImage) ? "" : "opacity-50"}
              />
            )}
          </motion.button>
        </motion.div>

        {/* Quick replies - hidden by default */}
        <div className="hidden flex-wrap" style={{ marginTop: "var(--space-xs)", gap: "var(--space-xs)" }}>
          {["好的", "明白了", "我想问一下"].map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => {
                setMessage(quick);
                textareaRef.current?.focus();
              }}
              className="bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full text-[#1d1d1f] transition-colors active:scale-95"
              style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "var(--text-xs)" }}
            >
              {quick}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
