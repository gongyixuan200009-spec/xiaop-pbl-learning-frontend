"""
单Agent模式服务 - 方案二实现
一个agent同时处理提取和回复，输出格式: [TABLE]JSON[/TABLE] + 回复内容
"""

import json
import re
import logging
import time
from typing import List, Dict, Any, Optional, Generator

from config import load_api_config
from services.llm_service import (
    call_llm_stream, call_llm_vision_stream, clean_json_string
)

logger = logging.getLogger("single_agent_service")


def get_chat_mode() -> str:
    """获取当前聊天模式"""
    config = load_api_config()
    return config.get("chat_mode", "dual_agent")


def is_debug_mode() -> bool:
    """检查是否开启调试模式"""
    config = load_api_config()
    return config.get("debug_mode", False)


# 单Agent模式的提取规则prompt
SINGLE_AGENT_EXTRACTION_RULES = """【字段提取规则】
你需要从学生的对话中提取符合要求的字段信息。

提取原则：
1. 只提取user明确表达的内容，不要推测或补充
2. 内容必须与字段名要求严格匹配
3. 提取的内容必须与当前讨论的主题直接相关
4. 拒绝提取的情况（填null）：
   - 用户只是在询问或不确定
   - 内容模糊、不完整或缺少具体细节
   - 内容与字段要求不匹配
5. 只提取实质性内容，不提取"好的"、"我明白了"等无意义回复"""


def build_single_agent_messages(
    form_config: Dict[str, Any],
    user_profile: Dict[str, str],
    chat_history: List[Dict[str, str]],
    extracted_fields: Dict[str, str],
    previous_summaries: Optional[List[Dict]] = None,
    image_url: Optional[str] = None
) -> List[Dict[str, str]]:
    """构建单agent模式的消息列表（同时处理提取和回复）

    注意：每次都会提取所有字段，新结果会覆盖旧结果。
    这样用户可以修改之前填写的内容。
    """

    # 每次提取所有字段，而不是只提取剩余字段
    # 这样用户可以修改之前已经填写的内容
    all_fields = form_config["fields"]

    filled_summary = ""
    if extracted_fields:
        filled_summary = "已填写（可以被新回答覆盖）：\n"
        for f, v in extracted_fields.items():
            filled_summary += f"- {f}: {v}\n"
    else:
        filled_summary = "尚未填写任何字段"

    fields_str = ", ".join(all_fields)

    previous_context = ""
    if previous_summaries:
        previous_context = "\n【前面阶段的总结】\n"
        for ps in previous_summaries:
            previous_context += f"\n阶段{ps['form_id']}总结：\n{ps['summary']}\n"
            if ps.get('extracted_fields'):
                previous_context += "关键信息：\n"
                for k, v in ps['extracted_fields'].items():
                    previous_context += f"  - {k}: {v}\n"

    # 构建JSON模板 - 包含所有字段
    json_template = "{" + ", ".join([f'"{f}": null' for f in all_fields]) + "}"

    system_prompt = f"""你现在必须完全扮演以下角色，并且在每次回复时同时完成两个任务：
1. 从学生的对话中提取符合要求的字段信息（每次都重新提取所有字段）
2. 作为老师进行引导回复

【角色设定】
{form_config["description"]}

【学生画像】
- 年级：{user_profile.get("grade", "未知")}
- 性别：{user_profile.get("gender", "未知")}
- 数学基础：{user_profile.get("math_score", "未知")}
- 理科感受：{user_profile.get("science_feeling", "未知")}
{previous_context}

【当前任务】
引导学生填写表格。
目标字段：{fields_str}

【已收集信息】
{filled_summary}

{SINGLE_AGENT_EXTRACTION_RULES}

【输出格式要求 - 极其重要】
你的每次回复必须严格按照以下格式，先输出表格，再输出回复：

[TABLE]
{json_template}
[/TABLE]

你的引导回复内容...

【重要提示】
- [TABLE]和[/TABLE]之间必须是有效的JSON格式
- JSON中包含所有字段，每次都重新从整个对话中提取
- 如果学生提供了新的回答，新结果会覆盖旧结果
- 如果没有提取到某个字段的内容，该字段填null
- [/TABLE]之后的内容才是显示给学生的回复
- 回复时不要刻意说"已记录"等提示语
- 你具备图片识别能力，可以查看和分析用户发送的图片
- 自然地根据学生的回答继续对话
- 保持对话流畅、连贯
- 如果有前面阶段的信息，可以适当引用和关联
"""

    messages = [{"role": "system", "content": system_prompt}]

    for msg in chat_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    return messages


def parse_single_agent_response(response: str, form_config: Dict[str, Any], already_extracted: Dict[str, str]) -> tuple:
    """解析单agent模式的响应，分离提取结果和回复内容

    返回: (extracted_fields: Dict, reply: str)
    """
    debug = is_debug_mode()

    # 尝试提取[TABLE]...[/TABLE]之间的JSON
    table_pattern = r'\[TABLE\]\s*([\s\S]*?)\s*\[/TABLE\]'
    match = re.search(table_pattern, response)

    extracted = {}
    reply = response

    if match:
        json_str = match.group(1).strip()
        # 移除[TABLE]...[/TABLE]部分，得到回复内容
        reply = re.sub(table_pattern, '', response).strip()

        if debug:
            logger.info(f"[DEBUG][单Agent] 提取到的JSON原始内容:\n{json_str}")

        try:
            # 清理JSON字符串
            cleaned = clean_json_string(json_str)

            if debug:
                logger.info(f"[DEBUG][单Agent] 清理后的JSON:\n{cleaned}")

            result = json.loads(cleaned)

            if debug:
                logger.info(f"[DEBUG][单Agent] 解析后的JSON对象: {result}")

            # 过滤有效的提取结果
            for field, value in result.items():
                if debug:
                    logger.info(f"[DEBUG][单Agent] 检查字段 '{field}': 值='{value}', 类型={type(value)}")
                    logger.info(f"[DEBUG][单Agent] 字段在form_config中: {field in form_config['fields']}")
                    logger.info(f"[DEBUG][单Agent] 值为真: {bool(value)}")
                    logger.info(f"[DEBUG][单Agent] 值不是null: {str(value).lower() != 'null'}")

                if field in form_config["fields"] and value and str(value).lower() != "null":
                    # 新提取的值会覆盖旧值
                    if field in already_extracted:
                        if already_extracted[field] != value:
                            # 更新已有字段
                            extracted[field] = value
                            logger.info(f"[单Agent] 更新字段: {field} = {str(value)[:50]}... (旧值: {str(already_extracted[field])[:30]}...)")
                        elif debug:
                            logger.info(f"[DEBUG][单Agent] 字段 '{field}' 值相同，跳过")
                    else:
                        # 新增字段
                        extracted[field] = value
                        logger.info(f"[单Agent] 新增字段: {field} = {str(value)[:50]}...")
                elif debug:
                    logger.info(f"[DEBUG][单Agent] 字段 '{field}' 不满足提取条件")

        except Exception as e:
            logger.warning(f"[单Agent] JSON解析失败: {e}, 原始内容: {json_str[:200]}")
            if debug:
                logger.error(f"[DEBUG][单Agent] JSON解析异常详情: {str(e)}")
    else:
        logger.warning(f"[单Agent] 未找到[TABLE]标记, 响应前200字符: {response[:200]}")
        if debug:
            logger.info(f"[DEBUG][单Agent] 完整响应:\n{response}")

    if debug:
        logger.info(f"[DEBUG][单Agent] 最终提取结果: {extracted}")
        logger.info(f"[DEBUG][单Agent] 回复内容前100字符: {reply[:100]}...")

    return extracted, reply


def generate_single_agent_stream(
    form_config: Dict[str, Any],
    user_profile: Dict[str, str],
    chat_history: List[Dict[str, str]],
    extracted_fields: Dict[str, str],
    previous_summaries: Optional[List[Dict]] = None,
    image_url: Optional[str] = None
) -> Generator[tuple, None, None]:
    """单agent模式的流式生成

    Yields:
        tuple: (event_type, data)
        - ("extraction", {"extracted": dict, "all_extracted": dict, "newly_extracted": list})
        - ("content", chunk_str)
        - ("done", full_reply_str)
    """
    debug = is_debug_mode()

    messages = build_single_agent_messages(
        form_config, user_profile, chat_history,
        extracted_fields, previous_summaries, image_url
    )

    # 调试模式：输出完整的输入消息
    if debug:
        logger.info("=" * 80)
        logger.info("[DEBUG][单Agent] ===== LLM调用开始 =====")
        logger.info(f"[DEBUG][单Agent] 表单配置: {form_config.get('name', 'unknown')}")
        logger.info(f"[DEBUG][单Agent] 已提取字段: {list(extracted_fields.keys())}")
        logger.info(f"[DEBUG][单Agent] 消息数量: {len(messages)}")

        for i, msg in enumerate(messages):
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            logger.info(f"[DEBUG][单Agent] 消息[{i}] role={role}:")
            # 如果是system消息，只输出前500字符
            if role == "system":
                logger.info(f"[DEBUG][单Agent] content(前500字符):\n{content[:500]}...")
            else:
                logger.info(f"[DEBUG][单Agent] content:\n{content}")
        logger.info("=" * 80)

    buffer = ""
    table_complete = False
    extraction_sent = False
    reply_started = False
    full_reply = ""

    logger.info(f"[单Agent] 开始流式生成, 已提取字段: {list(extracted_fields.keys())}")

    # 选择合适的流式调用
    if image_url:
        stream = call_llm_vision_stream(messages, image_url, "单Agent视觉回复")
    else:
        stream = call_llm_stream(messages, "单Agent回复")

    for chunk in stream:
        buffer += chunk

        # 检查是否收到了完整的[TABLE]...[/TABLE]
        if not table_complete:
            if "[/TABLE]" in buffer:
                table_complete = True
                logger.info(f"[单Agent] 检测到[/TABLE]标记，开始解析")

                # 调试模式：输出完整的模型输出
                if debug:
                    logger.info("=" * 80)
                    logger.info("[DEBUG][单Agent] ===== 模型原始输出（到[/TABLE]为止） =====")
                    logger.info(f"{buffer}")
                    logger.info("=" * 80)

                # 解析提取结果
                newly_extracted, reply_part = parse_single_agent_response(buffer, form_config, extracted_fields)

                # 合并提取结果
                all_extracted = {**extracted_fields, **newly_extracted}

                # 调试模式：输出解析结果
                if debug:
                    logger.info("[DEBUG][单Agent] ===== 解析结果 =====")
                    logger.info(f"[DEBUG][单Agent] 新提取字段: {newly_extracted}")
                    logger.info(f"[DEBUG][单Agent] 全部提取字段: {all_extracted}")
                    logger.info("=" * 80)

                # 发送提取事件
                yield ("extraction", {
                    "extracted": newly_extracted,
                    "all_extracted": all_extracted,
                    "newly_extracted": list(newly_extracted.keys())
                })
                extraction_sent = True

                # 处理[/TABLE]之后的内容
                table_end_idx = buffer.find("[/TABLE]")
                if table_end_idx != -1:
                    remaining = buffer[table_end_idx + len("[/TABLE]"):].strip()
                    if remaining:
                        reply_started = True
                        full_reply = remaining
                        yield ("content", remaining)
                    buffer = ""  # 清空buffer
        else:
            # [TABLE]已经处理完，直接流式输出回复
            if not reply_started:
                # 跳过可能的空白字符
                stripped = chunk.strip()
                if stripped:
                    reply_started = True
                    full_reply += chunk
                    yield ("content", chunk)
            else:
                full_reply += chunk
                yield ("content", chunk)

    # 如果没有找到[TABLE]标记，作为普通回复处理
    if not extraction_sent:
        logger.warning("[单Agent] 流式响应中未找到[TABLE]标记，使用空提取结果")

        if debug:
            logger.info("=" * 80)
            logger.info("[DEBUG][单Agent] ===== 完整模型输出（无TABLE标记） =====")
            logger.info(f"{buffer}")
            logger.info("=" * 80)

        yield ("extraction", {
            "extracted": {},
            "all_extracted": extracted_fields,
            "newly_extracted": []
        })
        # 整个buffer作为回复
        full_reply = buffer
        yield ("content", buffer)

    yield ("done", full_reply)
    logger.info(f"[单Agent] 流式生成完成，回复长度: {len(full_reply)}")

    if debug:
        logger.info("[DEBUG][单Agent] ===== LLM调用结束 =====")
