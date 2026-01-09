from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

# ========== 认证相关 ==========
class UserProfile(BaseModel):
    grade: str = ""
    gender: str = ""
    math_score: str = ""
    science_feeling: str = ""

class UserRegister(BaseModel):
    username: str
    password: str
    profile: UserProfile

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    profile: UserProfile
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ========== 聊天相关 ==========
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    image_url: Optional[str] = None  # 图片URL（用于多模态）
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    form_id: int
    chat_history: List[ChatMessage] = []
    extracted_fields: Dict[str, Union[str, List[str]]] = {}
    image_url: Optional[str] = None  # 当前消息附带的图片URL

class ChatResponse(BaseModel):
    reply: str
    extracted_fields: Dict[str, Union[str, List[str]]]
    is_complete: bool
    newly_extracted: List[str] = []
    needs_confirmation: bool = False  # 新增：是否需要用户确认

class ProgressResponse(BaseModel):
    form_id: int
    form_name: str
    fields: List[str]
    extracted_fields: Dict[str, Union[str, List[str]]]
    is_complete: bool
    progress_percent: float
    is_confirmed: bool = False  # 新增：是否已确认

# ========== 阶段确认相关 ==========
class StepConfirmRequest(BaseModel):
    form_id: int

class StepConfirmResponse(BaseModel):
    success: bool
    summary: str
    next_form_id: Optional[int] = None
    message: str

class StepDataResponse(BaseModel):
    extracted_fields: Dict[str, Union[str, List[str]]]
    chat_history: List[ChatMessage] = []
    is_confirmed: bool = False
    summary: str = ""

class UserProgressResponse(BaseModel):
    current_step: int
    completed_steps: List[int]
    step_data: Dict[int, Dict[str, Any]]

# ========== 管理相关 ==========
class FormConfig(BaseModel):
    id: int
    name: str
    description: str
    user_description: str = ""
    fields: List[str]
    extraction_prompt: str = ""  # 新增：自定义字段提取prompt
    test_enabled: bool = False   # 是否启用测试
    test_prompt: str = ""        # 测试提示词
    test_pass_pattern: str = ""  # 测试通过的关键词模式

class FormConfigUpdate(BaseModel):
    forms: List[FormConfig]

class AdminLogin(BaseModel):
    password: str

# ========== 测试相关 ==========
class TestStartRequest(BaseModel):
    form_id: int

class TestStartResponse(BaseModel):
    success: bool
    test_enabled: bool
    message: str
    initial_prompt: str = ""  # 测试开始时的提示

class TestMessageRequest(BaseModel):
    message: str
    form_id: int
    test_chat_history: List[ChatMessage] = []
    extracted_fields: Dict[str, Union[str, List[str]]] = {}
