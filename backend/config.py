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

# JWT配置
SECRET_KEY = "xiaop-v2-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天

# CORS配置
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.1.20.67:3000",
]
