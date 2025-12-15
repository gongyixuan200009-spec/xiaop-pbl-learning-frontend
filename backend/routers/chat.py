from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List, Dict
import csv
import os
import json
import time
from datetime import datetime

from models.schemas import (
    ChatRequest, ChatResponse, ProgressResponse, ChatMessage,
    StepConfirmRequest, StepConfirmResponse, UserProgressResponse
)
from services.llm_service import extract_fields, generate_reply, generate_reply_stream, generate_summary
from services.single_agent_service import get_chat_mode, generate_single_agent_stream
from services.progress_service import progress_service
from config import load_form_config, DATA_DIR
import logging

logger = logging.getLogger("chat_router")
from routers.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["聊天"])

@router.get("/forms")
async def get_forms():
    """获取所有表格配置"""
    config = load_form_config()
    return config.get("forms", [])

@router.get("/form/{form_id}")
async def get_form(form_id: int):
    """获取单个表格配置"""
    config = load_form_config()
    for form in config.get("forms", []):
        if form["id"] == form_id:
            return form
    raise HTTPException(status_code=404, detail="表格不存在")

@router.get("/user-progress", response_model=UserProgressResponse)
async def get_user_progress(username: str = Depends(get_current_user)):
    """获取用户的整体进度"""
    progress = progress_service.get_user_progress(username)
    return UserProgressResponse(
        current_step=progress["current_step"],
        completed_steps=progress["completed_steps"],
        step_data={
            int(k): {
                "extracted_fields": v.get("extracted_fields", {}),
                "is_confirmed": v.get("is_confirmed", False),
                "summary": v.get("summary", "")
            }
            for k, v in progress["step_data"].items()
        }
    )

@router.get("/step-data/{form_id}")
async def get_step_data(form_id: int, username: str = Depends(get_current_user)):
    """获取用户某个阶段的保存数据"""
    # 检查是否可以访问该阶段
    if not progress_service.can_access_step(username, form_id):
        raise HTTPException(status_code=403, detail="请先完成前面的阶段")

    step_data = progress_service.get_step_data(username, form_id)
    if step_data:
        return {
            "extracted_fields": step_data.get("extracted_fields", {}),
            "chat_history": step_data.get("chat_history", []),
            "is_confirmed": step_data.get("is_confirmed", False),
            "summary": step_data.get("summary", "")
        }
    return {
        "extracted_fields": {},
        "chat_history": [],
        "is_confirmed": False,
        "summary": ""
    }

@router.get("/previous-summaries/{form_id}")
async def get_previous_summaries(form_id: int, username: str = Depends(get_current_user)):
    """获取前面所有已完成阶段的总结"""
    summaries = progress_service.get_previous_summaries(username, form_id)
    return {"summaries": summaries}

@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    username: str = Depends(get_current_user)
):
    """发送消息并获取AI回复（非流式）"""
    from services.auth_service import auth_service

    # 检查是否可以访问该阶段
    if not progress_service.can_access_step(username, request.form_id):
        raise HTTPException(status_code=403, detail="请先完成前面的阶段")

    # 检查该阶段是否已经确认完成
    step_data = progress_service.get_step_data(username, request.form_id)
    if step_data and step_data.get("is_confirmed"):
        raise HTTPException(status_code=400, detail="该阶段已经完成确认，无法继续修改")

    # 获取表格配置
    config = load_form_config()
    form = None
    for f in config.get("forms", []):
        if f["id"] == request.form_id:
            form = f
            break

    if not form:
        raise HTTPException(status_code=404, detail="表格不存在")

    # 获取用户画像
    user = auth_service.get_user(username)
    user_profile = user.get("profile", {}) if user else {}

    # 获取前面阶段的总结（用于上下文）
    previous_summaries = progress_service.get_previous_summaries(username, request.form_id)

    # 构建对话文本用于提取
    conversation_text = ""
    for msg in request.chat_history:
        conversation_text += f"\n{msg.role}: {msg.content}"
    conversation_text += f"\nuser: {request.message}"

    # 提取字段
    newly_extracted = extract_fields(
        form,
        conversation_text,
        request.extracted_fields
    )

    # 合并已提取的字段
    all_extracted = {**request.extracted_fields, **newly_extracted}

    # 构建聊天历史（包含新消息）
    full_history = list(request.chat_history) + [
        ChatMessage(role="user", content=request.message)
    ]

    # 生成AI回复（传入前面阶段的总结，支持图片，以及本次新提取的字段）
    reply = generate_reply(
        form,
        user_profile,
        [h.model_dump() for h in full_history],
        all_extracted,
        previous_summaries,
        request.image_url,  # 支持图片输入
        list(newly_extracted.keys())  # 本次新提取的字段列表
    )

    # 检查是否完成
    is_complete = all(f in all_extracted for f in form["fields"])

    # 保存进度（但不确认）
    # 构建包含图片URL的用户消息
    user_msg_dict = {"role": "user", "content": request.message}
    if request.image_url:
        user_msg_dict["image_url"] = request.image_url

    history_to_save = [h.model_dump() for h in request.chat_history]
    history_to_save.append(user_msg_dict)
    history_to_save.append({"role": "assistant", "content": reply})

    progress_service.save_step_data(
        username,
        request.form_id,
        all_extracted,
        history_to_save,
        is_confirmed=False
    )

    # 如果完成，提示用户确认
    needs_confirmation = is_complete

    return ChatResponse(
        reply=reply,
        extracted_fields=all_extracted,
        is_complete=is_complete,
        newly_extracted=list(newly_extracted.keys()),
        needs_confirmation=needs_confirmation
    )


@router.post("/message/stream")
async def send_message_stream(
    request: ChatRequest,
    username: str = Depends(get_current_user)
):
    """发送消息并获取AI回复（SSE流式）

    支持两种模式：
    - dual_agent: 双agent模式（默认），分离的提取和回复模型
    - single_agent: 单agent模式，一个agent同时处理提取和回复
    """
    from services.auth_service import auth_service

    # 记录请求开始时间
    request_start = time.time()

    # 检查是否可以访问该阶段
    if not progress_service.can_access_step(username, request.form_id):
        raise HTTPException(status_code=403, detail="请先完成前面的阶段")

    # 检查该阶段是否已经确认完成
    step_data = progress_service.get_step_data(username, request.form_id)
    if step_data and step_data.get("is_confirmed"):
        raise HTTPException(status_code=400, detail="该阶段已经完成确认，无法继续修改")

    # 获取表格配置
    config = load_form_config()
    form = None
    for f in config.get("forms", []):
        if f["id"] == request.form_id:
            form = f
            break

    if not form:
        raise HTTPException(status_code=404, detail="表格不存在")

    # 获取用户画像
    user = auth_service.get_user(username)
    user_profile = user.get("profile", {}) if user else {}

    # 获取前面阶段的总结（用于上下文）
    previous_summaries = progress_service.get_previous_summaries(username, request.form_id)

    # 构建对话文本用于提取（仅双agent模式需要）
    conversation_text = ""
    for msg in request.chat_history:
        conversation_text += f"\n{msg.role}: {msg.content}"
    conversation_text += f"\nuser: {request.message}"

    # 构建聊天历史（包含新消息）
    full_history = list(request.chat_history) + [
        ChatMessage(role="user", content=request.message)
    ]

    # 记录预处理完成时间
    preprocess_time = time.time() - request_start

    def generate_sse():
        """生成 SSE 事件流 - 支持双模式切换"""
        full_reply = ""

        # 记录生成器启动时间
        generator_start = time.time()

        # 获取聊天模式
        chat_mode = get_chat_mode()
        logger.info(f"[流式消息] 当前聊天模式: {chat_mode}")

        # 1. 立即发送thinking事件，让前端知道开始处理了
        thinking_msg = "正在分析图片，这可能需要较长时间..." if request.image_url else "正在分析..."
        thinking_event = {
            "type": "thinking",
            "message": thinking_msg,
            "has_image": request.image_url is not None,
            "mode": chat_mode  # 添加模式信息
        }
        yield f"data: {json.dumps(thinking_event, ensure_ascii=False)}\n\n"

        thinking_sent_time = time.time() - generator_start

        # 根据模式选择不同的处理流程
        if chat_mode == "single_agent":
            # ========== 单Agent模式 ==========
            logger.info("[流式消息] 使用单Agent模式")

            single_agent_start = time.time()
            first_token_time = None
            token_count = 0
            all_extracted = dict(request.extracted_fields)
            newly_extracted_keys = []

            for event_type, data in generate_single_agent_stream(
                form,
                user_profile,
                [h.model_dump() for h in full_history],
                request.extracted_fields,
                previous_summaries,
                request.image_url
            ):
                if event_type == "extraction":
                    # 发送提取事件
                    all_extracted = data["all_extracted"]
                    newly_extracted_keys = data["newly_extracted"]
                    is_complete = all(f in all_extracted for f in form["fields"])
                    needs_confirmation = is_complete

                    extraction_event = {
                        "type": "extraction",
                        "extracted_fields": all_extracted,
                        "newly_extracted": newly_extracted_keys,
                        "is_complete": is_complete,
                        "needs_confirmation": needs_confirmation
                    }
                    yield f"data: {json.dumps(extraction_event, ensure_ascii=False)}\n\n"

                    extraction_time = time.time() - single_agent_start
                    logger.info(f"[单Agent] 提取完成, 耗时: {extraction_time*1000:.0f}ms, 新提取: {newly_extracted_keys}")

                elif event_type == "content":
                    if first_token_time is None:
                        first_token_time = time.time() - single_agent_start

                    token_count += 1
                    full_reply += data
                    content_event = {
                        "type": "content",
                        "content": data
                    }
                    yield f"data: {json.dumps(content_event, ensure_ascii=False)}\n\n"

                elif event_type == "done":
                    full_reply = data

            total_time = time.time() - single_agent_start

            # 发送完成事件
            done_event = {
                "type": "done",
                "full_reply": full_reply
            }
            yield f"data: {json.dumps(done_event, ensure_ascii=False)}\n\n"

            # 发送计时信息
            timing_event = {
                "type": "timing",
                "mode": "single_agent",
                "preprocess_ms": round(preprocess_time * 1000, 2),
                "thinking_sent_ms": round(thinking_sent_time * 1000, 2),
                "extraction_ms": round((first_token_time or 0) * 1000, 2),  # 单agent模式下提取和首token同时
                "first_token_ms": round((first_token_time or 0) * 1000, 2),
                "total_reply_ms": round(total_time * 1000, 2),
                "token_count": token_count,
                "total_ms": round((time.time() - request_start) * 1000, 2)
            }
            yield f"data: {json.dumps(timing_event, ensure_ascii=False)}\n\n"

            print(f"[TIMING-单Agent] 首Token: {timing_event['first_token_ms']}ms, "
                  f"总计: {timing_event['total_ms']}ms")

            # 保存进度
            history_to_save = [h.model_dump() for h in request.chat_history]
            user_msg_dict = {"role": "user", "content": request.message}
            if request.image_url:
                user_msg_dict["image_url"] = request.image_url
            history_to_save.append(user_msg_dict)
            history_to_save.append({"role": "assistant", "content": full_reply})

            progress_service.save_step_data(
                username,
                request.form_id,
                all_extracted,
                history_to_save,
                is_confirmed=False
            )

        else:
            # ========== 双Agent模式（默认） ==========
            logger.info("[流式消息] 使用双Agent模式")

            # 2. 先执行字段提取
            extraction_start = time.time()
            newly_extracted = extract_fields(
                form,
                conversation_text,
                request.extracted_fields
            )
            extraction_time = time.time() - extraction_start

            # 合并已提取的字段
            all_extracted = {**request.extracted_fields, **newly_extracted}

            # 检查是否完成
            is_complete = all(f in all_extracted for f in form["fields"])
            needs_confirmation = is_complete

            # 3. 发送提取结果（在回复之前）
            extraction_event = {
                "type": "extraction",
                "extracted_fields": all_extracted,
                "newly_extracted": list(newly_extracted.keys()),
                "is_complete": is_complete,
                "needs_confirmation": needs_confirmation
            }
            yield f"data: {json.dumps(extraction_event, ensure_ascii=False)}\n\n"

            # 4. 根据提取结果生成回复
            reply_start = time.time()
            first_token_time = None
            token_count = 0

            # 检查是否有图片，有图片时给出提示
            has_image = request.image_url is not None
            if has_image:
                logger.info(f"[流式消息] 包含图片: {request.image_url[:50]}...")

            for chunk in generate_reply_stream(
                form,
                user_profile,
                [h.model_dump() for h in full_history],
                all_extracted,  # 使用提取后的字段，回复会根据提取结果调整
                previous_summaries,
                request.image_url,  # 支持图片输入
                list(newly_extracted.keys())  # 本次新提取的字段列表，让回复模型知道提取结果
            ):
                if first_token_time is None:
                    first_token_time = time.time() - reply_start

                token_count += 1
                full_reply += chunk
                content_event = {
                    "type": "content",
                    "content": chunk
                }
                yield f"data: {json.dumps(content_event, ensure_ascii=False)}\n\n"

            total_reply_time = time.time() - reply_start

            # 5. 发送完成事件
            done_event = {
                "type": "done",
                "full_reply": full_reply
            }
            yield f"data: {json.dumps(done_event, ensure_ascii=False)}\n\n"

            # 6. 发送计时信息事件
            timing_event = {
                "type": "timing",
                "mode": "dual_agent",
                "preprocess_ms": round(preprocess_time * 1000, 2),
                "thinking_sent_ms": round(thinking_sent_time * 1000, 2),
                "extraction_ms": round(extraction_time * 1000, 2),
                "first_token_ms": round(first_token_time * 1000, 2) if first_token_time else None,
                "total_reply_ms": round(total_reply_time * 1000, 2),
                "token_count": token_count,
                "total_ms": round((time.time() - request_start) * 1000, 2)
            }
            yield f"data: {json.dumps(timing_event, ensure_ascii=False)}\n\n"

            # 打印日志
            print(f"[TIMING-双Agent] 字段提取: {timing_event['extraction_ms']}ms, "
                  f"首Token: {timing_event['first_token_ms']}ms, "
                  f"回复生成: {timing_event['total_reply_ms']}ms, "
                  f"总计: {timing_event['total_ms']}ms")

            # 7. 保存进度（在流式完成后）
            # 构建包含图片URL的消息历史
            history_to_save = [h.model_dump() for h in request.chat_history]
            user_msg_dict = {"role": "user", "content": request.message}
            if request.image_url:
                user_msg_dict["image_url"] = request.image_url
            history_to_save.append(user_msg_dict)
            history_to_save.append({"role": "assistant", "content": full_reply})

            progress_service.save_step_data(
                username,
                request.form_id,
                all_extracted,
                history_to_save,
                is_confirmed=False
            )

    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # 禁用 nginx 缓冲
        }
    )


@router.post("/confirm-step", response_model=StepConfirmResponse)
async def confirm_step(
    request: StepConfirmRequest,
    username: str = Depends(get_current_user)
):
    """确认完成某个阶段"""
    # 获取表格配置
    config = load_form_config()
    form = None
    for f in config.get("forms", []):
        if f["id"] == request.form_id:
            form = f
            break

    if not form:
        raise HTTPException(status_code=404, detail="表格不存在")

    # 获取该阶段数据
    step_data = progress_service.get_step_data(username, request.form_id)
    if not step_data:
        raise HTTPException(status_code=400, detail="没有该阶段的数据")

    # 检查是否所有字段都已填写
    extracted = step_data.get("extracted_fields", {})
    if not all(f in extracted for f in form["fields"]):
        raise HTTPException(status_code=400, detail="请先完成所有必填项")

    # 生成该阶段的总结
    summary = generate_summary(form, extracted, step_data.get("chat_history", []))

    # 确认阶段并保存到CSV
    success = progress_service.confirm_step(username, request.form_id, summary)

    if success:
        # 保存到CSV
        save_to_csv(username, form["id"], form["name"], step_data.get("chat_history", []), extracted)

    # 获取下一个阶段
    forms = config.get("forms", [])
    next_form_id = None
    for i, f in enumerate(forms):
        if f["id"] == request.form_id and i + 1 < len(forms):
            next_form_id = forms[i + 1]["id"]
            break

    return StepConfirmResponse(
        success=success,
        summary=summary,
        next_form_id=next_form_id,
        message="阶段已确认完成！" if success else "确认失败"
    )

@router.get("/progress/{form_id}", response_model=ProgressResponse)
async def get_progress(
    form_id: int,
    username: str = Depends(get_current_user)
):
    """获取表格填写进度"""
    config = load_form_config()
    form = None
    for f in config.get("forms", []):
        if f["id"] == form_id:
            form = f
            break

    if not form:
        raise HTTPException(status_code=404, detail="表格不存在")

    # 获取用户的阶段数据
    step_data = progress_service.get_step_data(username, form_id)
    extracted = step_data.get("extracted_fields", {}) if step_data else {}
    is_confirmed = step_data.get("is_confirmed", False) if step_data else False

    completed = sum(1 for f in form["fields"] if f in extracted)
    total = len(form["fields"])

    return ProgressResponse(
        form_id=form_id,
        form_name=form["name"],
        fields=form["fields"],
        extracted_fields=extracted,
        is_complete=completed == total,
        progress_percent=(completed / total * 100) if total > 0 else 0,
        is_confirmed=is_confirmed
    )

def save_to_csv(username: str, form_id: int, form_name: str, chat_history: List, extracted_fields: Dict):
    """保存数据到CSV"""
    csv_dir = DATA_DIR / "form_data"
    csv_dir.mkdir(exist_ok=True)
    csv_file = csv_dir / f"form_{form_id}_data.csv"

    file_exists = csv_file.exists()

    # 处理聊天记录
    chat_text = "\n".join([
        f"{msg.get('role', msg.role) if hasattr(msg, 'role') else msg.get('role', 'unknown')}: {msg.get('content', msg.content) if hasattr(msg, 'content') else msg.get('content', '')}"
        for msg in chat_history
    ])

    fieldnames = ["时间戳", "用户名", "表格名称"] + list(extracted_fields.keys()) + ["聊天记录"]

    with open(csv_file, "a", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()

        row = {
            "时间戳": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "用户名": username,
            "表格名称": form_name,
            "聊天记录": chat_text
        }
        row.update(extracted_fields)
        writer.writerow(row)
