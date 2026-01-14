"""
聊天日志服务
记录聊天消息到日志文件
"""

import logging
import os
from pathlib import Path
from datetime import datetime


class ChatLogger:
    """聊天日志记录器"""

    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)

        # 创建日志记录器
        self.logger = logging.getLogger("chat_logger")
        self.logger.setLevel(logging.INFO)

        # 避免重复添加 handler
        if not self.logger.handlers:
            # 创建文件 handler
            log_file = self.log_dir / f"chat_{datetime.now().strftime('%Y%m%d')}.log"
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setLevel(logging.INFO)

            # 创建格式化器
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            file_handler.setFormatter(formatter)

            # 添加 handler
            self.logger.addHandler(file_handler)

    def log_message(self, username: str, form_id: int, role: str, content: str):
        """记录聊天消息"""
        self.logger.info(f"[{username}] [Form {form_id}] [{role}]: {content[:100]}...")

    def log_extraction(self, username: str, form_id: int, extracted_fields: dict):
        """记录字段提取"""
        self.logger.info(f"[{username}] [Form {form_id}] [Extraction]: {extracted_fields}")

    def log_test(self, username: str, form_id: int, test_passed: bool):
        """记录测试结果"""
        status = "PASSED" if test_passed else "FAILED"
        self.logger.info(f"[{username}] [Form {form_id}] [Test]: {status}")

    def log_confirm(self, username: str, form_id: int):
        """记录阶段确认"""
        self.logger.info(f"[{username}] [Form {form_id}] [Confirm]: Step completed")


# 全局实例
_chat_logger = None


def get_chat_logger() -> ChatLogger:
    """获取聊天日志记录器单例"""
    global _chat_logger
    if _chat_logger is None:
        _chat_logger = ChatLogger()
    return _chat_logger
