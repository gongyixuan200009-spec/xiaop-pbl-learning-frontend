"""
调试日志服务 - 用于记录和显示LLM的完整输入输出
"""

import json
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import deque
import logging

from config import load_api_config

logger = logging.getLogger("debug_service")

# 使用deque存储最近的调试记录，最多保存50条
MAX_DEBUG_LOGS = 50
debug_logs = deque(maxlen=MAX_DEBUG_LOGS)


def is_debug_mode() -> bool:
    """检查是否开启调试模式"""
    config = load_api_config()
    return config.get("debug_mode", False)


def record_llm_call(
    call_type: str,
    model: str,
    messages: List[Dict[str, Any]],
    response: str,
    duration_ms: float,
    context: str = "",
    extra_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """记录一次LLM调用
    
    Args:
        call_type: 调用类型 (extraction/reply/single_agent等)
        model: 使用的模型名称
        messages: 发送给LLM的消息列表
        response: LLM的响应内容
        duration_ms: 调用耗时(毫秒)
        context: 上下文信息
        extra_info: 额外信息
    
    Returns:
        记录的调试信息
    """
    if not is_debug_mode():
        return {}
    
    record = {
        "id": len(debug_logs) + 1,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "call_type": call_type,
        "model": model,
        "context": context,
        "duration_ms": round(duration_ms, 2),
        "input": {
            "messages": messages,
            "message_count": len(messages)
        },
        "output": {
            "response": response,
            "response_length": len(response)
        }
    }
    
    if extra_info:
        record["extra"] = extra_info
    
    debug_logs.append(record)
    
    # 同时记录到日志文件
    logger.info(f"[DEBUG-LLM] {call_type} | {model} | {duration_ms:.0f}ms | ctx: {context}")
    
    return record


def get_recent_logs(limit: int = 10) -> List[Dict[str, Any]]:
    """获取最近的调试日志
    
    Args:
        limit: 返回的日志数量
    
    Returns:
        最近的调试日志列表
    """
    logs = list(debug_logs)
    logs.reverse()  # 最新的在前
    return logs[:limit]


def get_log_by_id(log_id: int) -> Optional[Dict[str, Any]]:
    """根据ID获取特定的调试日志"""
    for log in debug_logs:
        if log.get("id") == log_id:
            return log
    return None


def clear_logs() -> int:
    """清空调试日志，返回清空的数量"""
    count = len(debug_logs)
    debug_logs.clear()
    return count


def format_messages_for_display(messages: List[Dict[str, Any]], max_content_length: int = 500) -> List[Dict[str, Any]]:
    """格式化消息以便显示（截断过长内容）"""
    formatted = []
    for msg in messages:
        formatted_msg = {"role": msg.get("role", "unknown")}
        content = msg.get("content", "")
        if len(content) > max_content_length:
            formatted_msg["content"] = content[:max_content_length] + f"... [截断，原长度: {len(content)}]"
        else:
            formatted_msg["content"] = content
        formatted.append(formatted_msg)
    return formatted
