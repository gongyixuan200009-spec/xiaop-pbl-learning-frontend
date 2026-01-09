"""
工小助学习助手 - 配置文件 (Supabase 版本)
支持环境变量配置,向后兼容 JSON 文件存储
"""
import json
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 路径配置
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"

# 确保数据目录存在
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / "form_data").mkdir(exist_ok=True)
(DATA_DIR / "user_progress").mkdir(exist_ok=True)

# 配置文件路径 (用于向后兼容)
USERS_FILE = DATA_DIR / "users.json"
FORM_CONFIG_FILE = DATA_DIR / "form_config.json"
API_CONFIG_FILE = DATA_DIR / "api_key_config.json"
PIPELINE_CONFIG_FILE = DATA_DIR / "pipelines.json"

# ======================
# Supabase 配置
# ======================
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://10.1.20.75:8000")
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
)
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"
)

# 存储模式: "json" 或 "supabase"
STORAGE_MODE = os.getenv("STORAGE_MODE", "json")

# ======================
# JWT 配置
# ======================
SECRET_KEY = os.getenv("SECRET_KEY", "xiaop-v3-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7天

# ======================
# 环境配置
# ======================
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# ======================
# CORS 配置
# ======================
# 从环境变量读取额外的CORS源
EXTRA_CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []

CORS_ORIGINS = [
    "http://localhost:8604",
    "http://127.0.0.1:8604",
    "http://10.1.20.67:8604",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://182.92.239.199:8604",
    "https://pbl-learning.xiaoluxue.com",
] + EXTRA_CORS_ORIGINS

# ======================
# 文件上传配置
# ======================
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", str(10 * 1024 * 1024)))  # 10MB

# ======================
# JSON 文件操作 (向后兼容)
# ======================

def load_api_config():
    """加载 API 配置"""
    if API_CONFIG_FILE.exists():
        with open(API_CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_form_config():
    """加载表单配置"""
    if FORM_CONFIG_FILE.exists():
        with open(FORM_CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"forms": []}


def save_form_config(config):
    """保存表单配置"""
    with open(FORM_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def load_pipeline_config():
    """加载 Pipeline 配置"""
    if PIPELINE_CONFIG_FILE.exists():
        with open(PIPELINE_CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"pipelines": [], "active_pipeline": "dual_agent"}


def save_pipeline_config(config):
    """保存 Pipeline 配置"""
    with open(PIPELINE_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def get_active_pipeline_id():
    """获取当前激活的 Pipeline ID"""
    config = load_pipeline_config()
    return config.get("active_pipeline", "dual_agent")


def set_active_pipeline_id(pipeline_id: str):
    """设置当前激活的 Pipeline ID"""
    config = load_pipeline_config()
    config["active_pipeline"] = pipeline_id
    save_pipeline_config(config)


# ======================
# 打印配置信息
# ======================
def print_config_info():
    """打印当前配置信息"""
    print("=" * 50)
    print("工小助学习助手 - 配置信息")
    print("=" * 50)
    print(f"环境: {ENVIRONMENT}")
    print(f"调试模式: {DEBUG}")
    print(f"存储模式: {STORAGE_MODE}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"JWT 过期时间: {ACCESS_TOKEN_EXPIRE_MINUTES} 分钟")
    print(f"CORS 源: {len(CORS_ORIGINS)} 个")
    print("=" * 50)


if __name__ == "__main__":
    print_config_info()
