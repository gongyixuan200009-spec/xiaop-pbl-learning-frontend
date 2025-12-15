from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import uvicorn
import logging
import json

from config import CORS_ORIGINS, DATA_DIR
from routers import auth_router, chat_router, admin_router, upload_router, debug_router

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("validation_debug")

app = FastAPI(
    title="小P学习助手 API",
    description="AI驱动的学习辅助系统",
    version="2.0.0"
)

# 自定义422验证错误处理器 - 记录详细错误信息
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # 获取请求体
    try:
        body = await request.body()
        body_str = body.decode('utf-8')[:2000]  # 限制长度
    except Exception:
        body_str = "[无法读取请求体]"
    
    # 记录详细错误信息
    error_details = exc.errors()
    logger.error(f"=== 422 验证错误 ===")
    logger.error(f"URL: {request.url.path}")
    logger.error(f"Method: {request.method}")
    logger.error(f"错误详情: {json.dumps(error_details, ensure_ascii=False, indent=2)}")
    logger.error(f"请求体预览: {body_str[:500]}...")
    logger.error(f"===================")
    
    return JSONResponse(
        status_code=422,
        content={"detail": error_details}
    )

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],  # 开发时允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(upload_router)
app.include_router(debug_router)

# 静态文件（头像等）
# app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {
        "name": "小P学习助手 API",
        "version": "2.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
