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
    StepConfirmRequest, StepConfirmResponse, UserProgressResponse,
    TestStartRequest, TestStartResponse, TestMessageRequest
)
from services.llm_service import extract_fields, generate_reply, generate_reply_stream, generate_summary
from services.single_agent_service import get_chat_mode, generate_single_agent_stream
from services.pipeline_service import get_pipeline, PipelineExecutor
from services.progress_service import progress_service
from config import load_form_config, DATA_DIR, get_active_pipeline_id
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

    # 转换 step_data 并包含测试状态
    transformed_step_data = {}
    for k, v in progress["step_data"].items():
        test_state = v.get("test_state", {})
        transformed_step_data[int(k)] = {
            "extracted_fields": v.get("extracted_fields", {}),
            "is_confirmed": v.get("is_confirmed", False),
            "summary": v.get("summary", ""),
            "is_in_test": test_state.get("is_in_test", False),
            "test_passed": test_state.get("test_passed", False),
            "test_chat_history": test_state.get("test_chat_history", []),
            "test_credential": test_state.get("test_credential", "")
        }

    return UserProgressResponse(
        current_step=progress["current_step"],
        completed_steps=progress["completed_steps"],
        step_data=transformed_step_data
    )

@router.get("/step-data/{form_id}")
async def get_step_data(form_id: int, username: str = Depends(get_current_user)):
    """获取用户某个阶段的保存数据"""
    # 检查是否可以访问该阶段
    if not progress_service.can_access_step(username, form_id):
        raise HTTPException(status_code=403, detail="请先完成前面的阶段")

    step_data = progress_service.get_step_data(username, form_id)

    # 提取测试状态
    test_state = step_data.get("test_state", {}) if step_data else {}

    if step_data:
        return {
            "extracted_fields": step_data.get("extracted_fields", {}),
            "chat_history": step_data.get("chat_history", []),
            "is_confirmed": step_data.get("is_confirmed", False),
            "summary": step_data.get("summary", ""),
            # 添加测试状态字段
            "is_in_test": test_state.get("is_in_test", False),
            "test_passed": test_state.get("test_passed", False),
            "test_chat_history": test_state.get("test_chat_history", []),
            "test_credential": test_state.get("test_credential", "")
        }
    return {
        "extracted_fields": {},
        "chat_history": [],
        "is_confirmed": False,
        "summary": "",
        "is_in_test": False,
        "test_passed": False,
        "test_chat_history": [],
        "test_credential": ""
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
        """生成 SSE 事件流 - 支持Pipeline模式"""
        full_reply = ""

        # 记录生成器启动时间
        generator_start = time.time()

        # 获取当前激活的Pipeline
        pipeline_id = get_active_pipeline_id()
        pipeline = get_pipeline(pipeline_id)

        if not pipeline:
            # 回退到双agent模式
            pipeline_id = "dual_agent"
            pipeline = get_pipeline(pipeline_id)

        logger.info(f"[流式消息] 使用Pipeline: {pipeline.name} ({pipeline_id})")

        # 1. 立即发送thinking事件
        thinking_msg = "正在分析图片，这可能需要较长时间..." if request.image_url else "正在分析..."
        thinking_event = {
            "type": "thinking",
            "message": thinking_msg,
            "has_image": request.image_url is not None,
            "pipeline_id": pipeline_id,
            "pipeline_name": pipeline.name
        }
        yield f"data: {json.dumps(thinking_event, ensure_ascii=False)}\n\n"

        thinking_sent_time = time.time() - generator_start

        # 使用PipelineExecutor执行流程
        executor = PipelineExecutor(
            pipeline=pipeline,
            form_config=form,
            user_profile=user_profile,
            chat_history=[h.model_dump() for h in full_history],
            extracted_fields=request.extracted_fields,
            previous_summaries=previous_summaries,
            image_url=request.image_url
        )

        all_extracted = dict(request.extracted_fields)
        all_newly_extracted = []
        step_timings = {}

        for event in executor.execute_stream():
            event_type = event.get("type")

            if event_type == "step_start":
                # 发送步骤开始事件
                step_event = {
                    "type": "step_start",
                    "step_id": event.get("step_id"),
                    "step_name": event.get("step_name"),
                    "step_type": event.get("step_type")
                }
                yield f"data: {json.dumps(step_event, ensure_ascii=False)}\n\n"

            elif event_type == "extraction":
                # 发送提取结果事件
                all_extracted = event.get("extracted_fields", all_extracted)
                newly = event.get("newly_extracted", [])
                all_newly_extracted.extend(newly)

                extraction_event = {
                    "type": "extraction",
                    "step_id": event.get("step_id"),
                    "extracted_fields": all_extracted,
                    "newly_extracted": newly,
                    "is_complete": event.get("is_complete", False),
                    "needs_confirmation": event.get("needs_confirmation", False)
                }
                yield f"data: {json.dumps(extraction_event, ensure_ascii=False)}\n\n"

            elif event_type == "content":
                # 流式发送内容
                chunk = event.get("content", "")
                full_reply += chunk
                content_event = {
                    "type": "content",
                    "step_id": event.get("step_id"),
                    "content": chunk
                }
                yield f"data: {json.dumps(content_event, ensure_ascii=False)}\n\n"

            elif event_type == "step_done":
                # 步骤完成
                step_id = event.get("step_id")
                step_timings[step_id] = event.get("timing_ms", 0)

            elif event_type == "pipeline_done":
                # Pipeline执行完成
                all_extracted = event.get("all_extracted", all_extracted)
                all_newly_extracted = event.get("newly_extracted", all_newly_extracted)
                full_reply = event.get("full_reply", full_reply)

        # 发送完成事件
        done_event = {
            "type": "done",
            "full_reply": full_reply
        }
        yield f"data: {json.dumps(done_event, ensure_ascii=False)}\n\n"

        # 发送计时信息
        total_time = time.time() - request_start
        timing_event = {
            "type": "timing",
            "pipeline_id": pipeline_id,
            "pipeline_name": pipeline.name,
            "preprocess_ms": round(preprocess_time * 1000, 2),
            "thinking_sent_ms": round(thinking_sent_time * 1000, 2),
            "step_timings": {k: round(v, 2) for k, v in step_timings.items()},
            "total_ms": round(total_time * 1000, 2)
        }
        yield f"data: {json.dumps(timing_event, ensure_ascii=False)}\n\n"

        logger.info(f"[TIMING-Pipeline] {pipeline.name}: 总计 {timing_event['total_ms']}ms")

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

    # 检查是否需要通过测试
    test_enabled = form.get("test_enabled", False)
    if test_enabled:
        test_state = step_data.get("test_state", {})
        if not test_state.get("test_passed", False):
            raise HTTPException(status_code=400, detail="请先通过关卡测试")

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


# ========== 测试相关接口 ==========

@router.post("/start-test", response_model=TestStartResponse)
async def start_test(
    request: TestStartRequest,
    username: str = Depends(get_current_user)
):
    """开始关卡测试"""
    # 获取表格配置
    config = load_form_config()
    form = None
    for f in config.get("forms", []):
        if f["id"] == request.form_id:
            form = f
            break

    if not form:
        raise HTTPException(status_code=404, detail="表格不存在")

    # 检查测试是否启用
    test_enabled = form.get("test_enabled", False)
    logger.info(f"[start-test] form_id={request.form_id}, test_enabled={test_enabled}, form_keys={list(form.keys())}")

    if not test_enabled:
        return TestStartResponse(
            success=False,
            test_enabled=False,
            message="该阶段未启用测试"
        )

    # 检查是否已完成所有字段
    step_data = progress_service.get_step_data(username, request.form_id)
    if not step_data:
        raise HTTPException(status_code=400, detail="请先完成该阶段的学习内容")

    extracted = step_data.get("extracted_fields", {})
    if not all(f in extracted for f in form["fields"]):
        raise HTTPException(status_code=400, detail="请先完成所有必填项才能开始测试")

    # 保存测试开始状态
    progress_service.save_test_state(username, request.form_id, is_in_test=True)

    return TestStartResponse(
        success=True,
        test_enabled=True,
        message="测试开始！",
        initial_prompt="🎯 关卡测试开始！请认真回答以下问题来验证你的学习成果。"
    )


@router.post("/test-message/stream")
async def test_message_stream(
    request: TestMessageRequest,
    username: str = Depends(get_current_user)
):
    """发送测试消息并获取AI评估（SSE流式）"""
    from services.llm_service import call_llm_stream

    # 获取表格配置
    config = load_form_config()
    form = None
    for f in config.get("forms", []):
        if f["id"] == request.form_id:
            form = f
            break

    if not form:
        raise HTTPException(status_code=404, detail="表格不存在")

    test_prompt = form.get("test_prompt", "")
    test_pass_pattern = form.get("test_pass_pattern", "")

    if not test_prompt:
        raise HTTPException(status_code=400, detail="该阶段未配置测试内容")

    # 获取用户该阶段的数据
    step_data = progress_service.get_step_data(username, request.form_id)
    extracted_fields = step_data.get("extracted_fields", {}) if step_data else {}

    def generate_sse():
        full_reply = ""

        # 构建测试对话的系统提示
        system_prompt = f"""{test_prompt}

学生在本阶段完成的内容摘要：
{json.dumps(extracted_fields, ensure_ascii=False, indent=2)}

请基于学生的回答进行评估和引导。"""

        # 构建消息历史
        messages = [{"role": "system", "content": system_prompt}]

        # 添加测试对话历史
        for msg in request.test_chat_history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # 添加当前用户消息
        messages.append({
            "role": "user",
            "content": request.message
        })

        # 发送thinking事件
        thinking_event = {
            "type": "thinking",
            "message": "正在评估你的回答..."
        }
        yield f"data: {json.dumps(thinking_event, ensure_ascii=False)}\n\n"

        # 调用LLM进行流式生成
        try:
            for chunk in call_llm_stream(messages):
                full_reply += chunk
                content_event = {
                    "type": "content",
                    "content": chunk
                }
                yield f"data: {json.dumps(content_event, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error(f"测试消息生成失败: {str(e)}")
            error_event = {
                "type": "error",
                "message": f"生成回复时出错: {str(e)}"
            }
            yield f"data: {json.dumps(error_event, ensure_ascii=False)}\n\n"
            return

        # 检查是否通过测试（大小写不敏感）
        is_passed = test_pass_pattern and test_pass_pattern.lower() in full_reply.lower()

        # 提取凭证（如果通过）
        pass_credential = ""
        if is_passed:
            # 从回复中提取包含通过模式的那一行作为凭证（大小写不敏感）
            pattern_lower = test_pass_pattern.lower()
            for line in full_reply.split("\n"):
                if pattern_lower in line.lower():
                    pass_credential = line.strip()
                    break

        # 保存测试聊天历史
        test_history = [msg.model_dump() for msg in request.test_chat_history]
        test_history.append({"role": "user", "content": request.message})
        test_history.append({"role": "assistant", "content": full_reply})

        progress_service.save_test_state(
            username,
            request.form_id,
            is_in_test=True,
            test_passed=is_passed,
            test_chat_history=test_history,
            test_credential=pass_credential
        )

        # 发送完成事件
        done_event = {
            "type": "done",
            "full_reply": full_reply,
            "is_passed": is_passed,
            "pass_credential": pass_credential
        }
        yield f"data: {json.dumps(done_event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/test-state/{form_id}")
async def get_test_state(
    form_id: int,
    username: str = Depends(get_current_user)
):
    """获取用户某个阶段的测试状态"""
    test_state = progress_service.get_test_state(username, form_id)
    return test_state or {
        "is_in_test": False,
        "test_passed": False,
        "test_chat_history": [],
        "test_credential": ""
    }
