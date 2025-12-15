"""
调试API路由 - 提供调试日志查看功能
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import json

from services.debug_service import (
    is_debug_mode, get_recent_logs, get_log_by_id, clear_logs,
    format_messages_for_display
)
from config import load_api_config

router = APIRouter(prefix="/api/debug", tags=["调试"])


@router.get("/status")
async def get_debug_status():
    """获取调试模式状态"""
    config = load_api_config()
    return {
        "debug_mode": config.get("debug_mode", False),
        "chat_mode": config.get("chat_mode", "dual_agent")
    }


@router.get("/logs")
async def get_debug_logs(limit: int = 10, full: bool = False):
    """获取最近的调试日志
    
    Args:
        limit: 返回的日志数量 (默认10条)
        full: 是否返回完整内容 (默认False，截断长内容)
    """
    if not is_debug_mode():
        return {
            "enabled": False,
            "message": "调试模式未开启，请在配置中设置 debug_mode: true",
            "logs": []
        }
    
    logs = get_recent_logs(min(limit, 50))
    
    # 如果不需要完整内容，截断长消息
    if not full:
        for log in logs:
            if "input" in log and "messages" in log["input"]:
                log["input"]["messages"] = format_messages_for_display(
                    log["input"]["messages"], max_content_length=500
                )
            if "output" in log and "response" in log["output"]:
                resp = log["output"]["response"]
                if len(resp) > 500:
                    log["output"]["response"] = resp[:500] + f"... [截断，原长度: {len(resp)}]"
    
    return {
        "enabled": True,
        "count": len(logs),
        "logs": logs
    }


@router.get("/logs/{log_id}")
async def get_single_log(log_id: int):
    """获取单条调试日志的完整内容"""
    if not is_debug_mode():
        raise HTTPException(status_code=400, detail="调试模式未开启")
    
    log = get_log_by_id(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="日志不存在")
    
    return log


@router.post("/clear")
async def clear_debug_logs():
    """清空调试日志"""
    count = clear_logs()
    return {"cleared": count, "message": f"已清空 {count} 条日志"}


@router.get("/latest")
async def get_latest_log():
    """获取最新一条调试日志的完整内容"""
    if not is_debug_mode():
        return {
            "enabled": False,
            "message": "调试模式未开启"
        }
    
    logs = get_recent_logs(1)
    if not logs:
        return {
            "enabled": True,
            "message": "暂无调试日志",
            "log": None
        }
    
    return {
        "enabled": True,
        "log": logs[0]
    }
