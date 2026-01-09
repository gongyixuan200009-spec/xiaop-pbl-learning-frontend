import json
import os
from pathlib import Path

# 路径配置
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"

# 确保数据目录存在
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / "form_data").mkdir(exist_ok=True)

# 配置文件路径
USERS_FILE = DATA_DIR / "users.json"
FORM_CONFIG_FILE = DATA_DIR / "form_config.json"
API_CONFIG_FILE = DATA_DIR / "api_key_config.json"
PIPELINE_CONFIG_FILE = DATA_DIR / "pipelines.json"

# API配置
def load_api_config():
    if API_CONFIG_FILE.exists():
        with open(API_CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def load_form_config():
    if FORM_CONFIG_FILE.exists():
        with open(FORM_CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"forms": []}

def save_form_config(config):
    with open(FORM_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

# Pipeline配置
def load_pipeline_config():
    if PIPELINE_CONFIG_FILE.exists():
        with open(PIPELINE_CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"pipelines": [], "active_pipeline": "dual_agent"}

def save_pipeline_config(config):
    with open(PIPELINE_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

def get_active_pipeline_id():
    """获取当前激活的Pipeline ID"""
    config = load_pipeline_config()
    return config.get("active_pipeline", "dual_agent")

def set_active_pipeline_id(pipeline_id: str):
    """设置当前激活的Pipeline ID"""
    config = load_pipeline_config()
    config["active_pipeline"] = pipeline_id
    save_pipeline_config(config)

# JWT配置
SECRET_KEY = "xiaop-v3-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天

# CORS配置
CORS_ORIGINS = [
    "http://localhost:8604",
    "http://127.0.0.1:8604",
    "http://10.1.20.67:8604",
    "http://182.92.239.199:8604",    "https://pbl-learning.xiaoluxue.com",  # 生产前端域名
]
