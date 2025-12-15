import json
import base64
import requests
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Generator

from config import load_api_config
from services.debug_service import record_llm_call, is_debug_mode

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("llm_service")

# 简化的提取规则prompt
SIMPLE_EXTRACTION_RULES = """【严格提取规则】
1. 只提取user明确表达的内容，不要推测或补充
2. 内容必须与字段名要求严格匹配：
   - 如果字段名含"(如何...)"，提取的内容必须是以"如何"/"怎样"开头的问句
   - 如果字段名含"(2条量化)"，必须提取至少2条带有数字/可测量指标的内容
   - 如果字段名含"(2条限制)"，必须提取至少2条限制条件
   - 如果字段名含"原理"，必须是具体的科学原理或方法说明
   - 如果字段名含"方案"，必须是具体可执行的解决方案描述
3. 【主题相关性检查】：
   - 提取的内容必须与当前讨论的主题直接相关
   - 如果用户讨论的是A主题，但字段要求B主题的内容，则填null
   - 内容必须在逻辑上与整个对话的上下文一致
   - 不能将不相关的回答强行归类到某个字段
4. 拒绝提取的情况（填null）：
   - 用户只是在询问或不确定
   - 内容模糊、不完整或缺少具体细节
   - 内容与字段要求不匹配（如要求"如何..."但用户说的不是问句）
   - 只有1条而字段要求2条
   - 内容与当前讨论主题不相关
5. 质量检查：
   - 提取内容应该是用户最终确认的版本，不是中间讨论的内容
   - 只提取实质性内容，不提取"好的"、"我明白了"等无意义回复
   - 确保提取的内容在语义上与对话主题保持一致"""

def get_api_url(config: Dict) -> str:
    """从配置获取API endpoint URL"""
    # 支持多种配置字段名
    endpoint = config.get('api_endpoint') or config.get('api_header_name') or 'https://router.requesty.ai/v1'
    # 确保以 /chat/completions 结尾
    if not endpoint.endswith('/chat/completions'):
        endpoint = endpoint.rstrip('/') + '/chat/completions'
    return endpoint

def get_fast_model(config: Dict) -> str:
    """获取快速提取模型名称"""
    return config.get('fast_model') or config.get('default_model') or 'alibaba/qwen-turbo'

def get_vision_model(config: Dict) -> str:
    """获取视觉模型名称"""
    return config.get('vision_model') or 'openai/gpt-4o-mini'

def is_vision_enabled(config: Dict) -> bool:
    """检查是否启用视觉模型"""
    return config.get('vision_model_enabled', True)

def clean_json_string(json_str: str) -> str:
    """清理LLM返回的JSON字符串"""
    if "```json" in json_str:
        start = json_str.find("```json") + 7
        end = json_str.find("```", start)
        if end != -1:
            json_str = json_str[start:end]
    elif "```" in json_str:
        start = json_str.find("```") + 3
        end = json_str.find("```", start)
        if end != -1:
            json_str = json_str[start:end]

    lines = json_str.strip().split("\n")
    json_lines = []
    brace_count = 0
    json_started = False

    for line in lines:
        if not line.strip():
            continue
        if "{" in line:
            json_started = True
        if json_started:
            json_lines.append(line)
            brace_count += line.count("{") - line.count("}")
            if brace_count == 0:
                break

    result = "\n".join(json_lines).strip()
    return result if result else json_str.strip()



def image_url_to_base64(image_url: str) -> str:
    """将图片URL转换为base64数据URL，支持本地文件"""
    import os
    from config import DATA_DIR
    
    def get_mime_type(file_path_or_url: str) -> str:
        """根据文件扩展名判断MIME类型"""
        path_lower = file_path_or_url.lower()
        if '.jpg' in path_lower or '.jpeg' in path_lower:
            return 'image/jpeg'
        elif '.png' in path_lower:
            return 'image/png'
        elif '.gif' in path_lower:
            return 'image/gif'
        elif '.webp' in path_lower:
            return 'image/webp'
        return 'image/png'
    
    try:
        # 检查是否是本地上传的文件 (localhost URL pointing to /data/uploads/)
        if 'localhost' in image_url and '/data/uploads/' in image_url:
            # 从URL提取文件名: http://localhost:8505/data/uploads/filename.jpg -> filename.jpg
            filename = image_url.split('/data/uploads/')[-1]
            local_path = os.path.join(DATA_DIR, 'uploads', filename)
            
            logger.info(f"检测到本地图片URL，直接读取文件: {local_path}")
            
            if os.path.exists(local_path):
                with open(local_path, 'rb') as f:
                    image_data = f.read()
                mime_type = get_mime_type(local_path)
                b64_data = base64.b64encode(image_data).decode('utf-8')
                logger.info(f"本地文件读取成功，大小: {len(image_data)} bytes, MIME: {mime_type}")
                return f"data:{mime_type};base64,{b64_data}"
            else:
                logger.error(f"本地文件不存在: {local_path}")
                return image_url
        
        # 远程URL: 通过HTTP获取图片
        response = requests.get(image_url, timeout=30)
        if response.status_code == 200:
            # 检测图片类型
            content_type = response.headers.get('content-type', 'image/png')
            if 'jpeg' in content_type or 'jpg' in content_type:
                mime_type = 'image/jpeg'
            elif 'png' in content_type:
                mime_type = 'image/png'
            elif 'gif' in content_type:
                mime_type = 'image/gif'
            elif 'webp' in content_type:
                mime_type = 'image/webp'
            else:
                mime_type = get_mime_type(image_url)
            
            # 转换为base64
            b64_data = base64.b64encode(response.content).decode('utf-8')
            return f"data:{mime_type};base64,{b64_data}"
        else:
            logger.error(f"获取图片失败: {response.status_code}")
            return image_url
    except Exception as e:
        logger.error(f"转换图片失败: {e}")
        return image_url

def call_llm_fast(messages: List[Dict[str, str]], context: str = "", max_tokens: int = 200) -> str:
    """调用快速LLM API（用于提取，使用更小的模型）"""
    config = load_api_config()
    start_time = time.time()

    api_url = get_api_url(config)
    model = get_fast_model(config)

    logger.info(f"[{context}] 快速调用LLM({model}), API: {api_url[:50]}...")

    try:
        response = requests.post(
            url=api_url,
            headers={
                "Authorization": f"Bearer {config.get('api_key', '')}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0
            },
            timeout=15
        )

        elapsed = (time.time() - start_time) * 1000
        if response.status_code == 200:
            result = response.json()["choices"][0]["message"]["content"]
            logger.info(f"[TIMING][{context}] 快速LLM响应成功, 耗时: {elapsed:.0f}ms")
            record_llm_call("call_llm_fast", context, messages, result, elapsed)
            return result
        else:
            error = f"API错误: {response.status_code} - {response.text[:200]}"
            logger.error(f"[TIMING][{context}] {error}, 耗时: {elapsed:.0f}ms")
            return error

    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        error = f"调用失败: {str(e)}"
        logger.error(f"[TIMING][{context}] {error}, 耗时: {elapsed:.0f}ms")
        return error


def call_llm(messages: List[Dict[str, str]], context: str = "") -> str:
    """调用LLM API（非流式）"""
    config = load_api_config()

    api_url = get_api_url(config)
    model = config.get("default_model", "alibaba/qwen-turbo")

    logger.info(f"[{context}] 调用LLM({model}), 消息数: {len(messages)}")

    try:
        response = requests.post(
            url=api_url,
            headers={
                "Authorization": f"Bearer {config.get('api_key', '')}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages
            },
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()["choices"][0]["message"]["content"]
            logger.info(f"[{context}] LLM响应成功, 长度: {len(result)}")
            record_llm_call("call_llm", context, messages, result, 0)
            return result
        else:
            error = f"API错误: {response.status_code}"
            logger.error(f"[{context}] {error}")
            return error

    except Exception as e:
        error = f"调用失败: {str(e)}"
        logger.error(f"[{context}] {error}")
        return error


def call_llm_stream(messages: List[Dict[str, str]], context: str = "") -> Generator[str, None, None]:
    """调用LLM API（流式）"""
    config = load_api_config()

    api_url = get_api_url(config)
    model = config.get("default_model", "alibaba/qwen-turbo")
    total_chars = sum(len(m.get("content", "")) for m in messages)

    logger.info(f"[{context}] 流式调用LLM({model}), API: {api_url[:50]}..., prompt字符: {total_chars}")

    start_time = time.time()
    first_token_time = None
    full_response = []  # Buffer for recording

    try:
        response = requests.post(
            url=api_url,
            headers={
                "Authorization": f"Bearer {config.get('api_key', '')}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "stream": True
            },
            timeout=60,
            stream=True
        )

        http_connect_time = (time.time() - start_time) * 1000
        logger.info(f"[TIMING][{context}] HTTP连接, 耗时: {http_connect_time:.0f}ms, status: {response.status_code}")

        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:]
                        if data == '[DONE]':
                            total_time = (time.time() - start_time) * 1000
                            logger.info(f"[TIMING][{context}] 流式完成, 总耗时: {total_time:.0f}ms")
                            # Record the complete response
                            complete_response = "".join(full_response)
                            record_llm_call("call_llm_stream", context, messages, complete_response, total_time / 1000)
                            break
                        try:
                            chunk = json.loads(data)
                            if 'choices' in chunk and len(chunk['choices']) > 0:
                                delta = chunk['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                if content:
                                    if first_token_time is None:
                                        first_token_time = (time.time() - start_time) * 1000
                                        logger.info(f"[TIMING][{context}] 首Token, 耗时: {first_token_time:.0f}ms")
                                    full_response.append(content)  # Buffer
                                    yield content
                        except json.JSONDecodeError:
                            continue
        else:
            error_body = response.text[:500] if response.text else "no body"
            error = f"API错误: {response.status_code}"
            logger.error(f"[{context}] {error}, body: {error_body}")
            yield error

    except Exception as e:
        error = f"调用失败: {str(e)}"
        logger.error(f"[{context}] {error}")
        yield error



def call_llm_vision(messages: List[Dict], image_url: str, context: str = "") -> str:
    """调用视觉LLM API（支持图片）"""
    config = load_api_config()
    start_time = time.time()

    api_url = get_api_url(config)
    model = get_vision_model(config)

    logger.info(f"[{context}] 调用视觉LLM({model}), 包含图片")
    
    # 将URL转换为base64
    if image_url.startswith('http'):
        logger.info(f"[{context}] 转换图片URL为base64...")
        image_url = image_url_to_base64(image_url)

    # 构建multimodal消息 - 添加调试日志
    logger.info(f"[{context}] DEBUG: messages数量: {len(messages)}")
    for i, m in enumerate(messages):
        role = m.get('role', 'unknown')
        content_preview = str(m.get('content', ''))[:50]
        logger.info(f"[{context}] DEBUG: messages[{i}]: role={role}, content={content_preview}...")
    
    last_msg = messages[-1] if messages else None
    logger.info(f"[{context}] DEBUG: 最后一条消息role: {last_msg.get('role') if last_msg else 'None'}")
    
    vision_messages = []
    image_added = False
    for i, msg in enumerate(messages):
        is_last = (i == len(messages) - 1)
        is_user = (msg["role"] == "user")
        logger.info(f"[{context}] DEBUG: 处理messages[{i}]: is_last={is_last}, is_user={is_user}")
        if is_user and is_last:
            # 最后一条用户消息，添加图片
            logger.info(f"[{context}] DEBUG: 在messages[{i}]添加图片!")
            image_added = True
            vision_messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": msg["content"]},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            })
        else:
            vision_messages.append(msg)
    
    logger.info(f"[{context}] DEBUG: 图片是否已添加: {image_added}")
    logger.info(f"[{context}] DEBUG: vision_messages数量: {len(vision_messages)}")

    try:
        response = requests.post(
            url=api_url,
            headers={
                "Authorization": f"Bearer {config.get('api_key', '')}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": vision_messages,
                "max_tokens": 1000
            },
            timeout=60
        )

        elapsed = (time.time() - start_time) * 1000
        if response.status_code == 200:
            result = response.json()["choices"][0]["message"]["content"]
            logger.info(f"[TIMING][{context}] 视觉LLM响应成功, 耗时: {elapsed:.0f}ms")
            record_llm_call("call_llm_vision", context, messages, result, elapsed)
            return result
        else:
            error = f"API错误: {response.status_code} - {response.text[:200]}"
            logger.error(f"[TIMING][{context}] {error}, 耗时: {elapsed:.0f}ms")
            return error

    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        error = f"调用失败: {str(e)}"
        logger.error(f"[TIMING][{context}] {error}, 耗时: {elapsed:.0f}ms")
        return error


def call_llm_vision_stream(messages: List[Dict], image_url: str, context: str = "") -> Generator[str, None, None]:
    """调用视觉LLM API（流式，支持图片）"""
    config = load_api_config()

    api_url = get_api_url(config)
    model = get_vision_model(config)

    logger.info(f"[{context}] 流式调用视觉LLM({model}), 包含图片")

    # 将URL转换为base64，因为外部API可能无法访问我们的服务器
    if image_url.startswith('http'):
        logger.info(f"[{context}] 转换图片URL为base64...")
        image_url = image_url_to_base64(image_url)
        if image_url.startswith('data:'):
            logger.info(f"[{context}] base64转换成功, 长度: {len(image_url)}")
        else:
            logger.warning(f"[{context}] base64转换失败，使用原始URL")

    start_time = time.time()
    first_token_time = None
    full_response = []  # Buffer for recording

    # 构建multimodal消息 - 添加调试日志
    logger.info(f"[{context}] DEBUG: messages数量: {len(messages)}")
    for i, m in enumerate(messages):
        role = m.get('role', 'unknown')
        content_preview = str(m.get('content', ''))[:50]
        logger.info(f"[{context}] DEBUG: messages[{i}]: role={role}, content={content_preview}...")

    last_msg = messages[-1] if messages else None
    logger.info(f"[{context}] DEBUG: 最后一条消息role: {last_msg.get('role') if last_msg else 'None'}")

    vision_messages = []
    image_added = False
    for i, msg in enumerate(messages):
        is_last = (i == len(messages) - 1)
        is_user = (msg["role"] == "user")
        logger.info(f"[{context}] DEBUG: 处理messages[{i}]: is_last={is_last}, is_user={is_user}")
        if is_user and is_last:
            # 最后一条用户消息，添加图片
            logger.info(f"[{context}] DEBUG: 在messages[{i}]添加图片!")
            image_added = True
            vision_messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": msg["content"]},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            })
        else:
            vision_messages.append(msg)

    logger.info(f"[{context}] DEBUG: 图片是否已添加: {image_added}")
    logger.info(f"[{context}] DEBUG: vision_messages数量: {len(vision_messages)}")

    try:
        response = requests.post(
            url=api_url,
            headers={
                "Authorization": f"Bearer {config.get('api_key', '')}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": vision_messages,
                "stream": True,
                "max_tokens": 1000
            },
            timeout=120,
            stream=True
        )

        http_connect_time = (time.time() - start_time) * 1000
        logger.info(f"[TIMING][{context}] 视觉HTTP连接, 耗时: {http_connect_time:.0f}ms, status: {response.status_code}")

        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:]
                        if data == '[DONE]':
                            total_time = (time.time() - start_time) * 1000
                            logger.info(f"[TIMING][{context}] 视觉流式完成, 总耗时: {total_time:.0f}ms")
                            # Record the complete response
                            complete_response = "".join(full_response)
                            record_llm_call("call_llm_vision_stream", context, messages, complete_response, total_time / 1000)
                            break
                        try:
                            chunk = json.loads(data)
                            if 'choices' in chunk and len(chunk['choices']) > 0:
                                delta = chunk['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                if content:
                                    if first_token_time is None:
                                        first_token_time = (time.time() - start_time) * 1000
                                        logger.info(f"[TIMING][{context}] 视觉首Token, 耗时: {first_token_time:.0f}ms")
                                    full_response.append(content)  # Buffer
                                    yield content
                        except json.JSONDecodeError:
                            continue
        else:
            error_body = response.text[:500] if response.text else "no body"
            error = f"API错误: {response.status_code}"
            logger.error(f"[{context}] {error}, body: {error_body}")
            yield error

    except Exception as e:
        error = f"调用失败: {str(e)}"
        logger.error(f"[{context}] {error}")
        yield error



def extract_fields(
    form_config: Dict[str, Any],
    conversation_text: str,
    already_extracted: Dict[str, str]
) -> Dict[str, str]:
    """从对话中提取字段信息"""
    start_time = time.time()

    remaining_fields = [f for f in form_config["fields"] if f not in already_extracted]

    if not remaining_fields:
        logger.info(f"[TIMING][字段提取] 无待提取字段，跳过")
        return {}

    json_template = "{" + ", ".join([f'"{f}": null' for f in remaining_fields]) + "}"
    recent_conversation = conversation_text[-1000:]

    # 构建更详细的字段要求说明
    field_requirements = []
    for field in remaining_fields:
        req = f"- {field}"
        if "(如何" in field or "(怎样" in field:
            req += " -> 必须是以'如何'或'怎样'开头的工程问题陈述"
        elif "量化" in field or "标准" in field:
            req += " -> 必须包含至少2条带有数字或可测量指标的内容"
        elif "限制" in field:
            req += " -> 必须包含至少2条限制条件（时间/预算/材料等）"
        elif "原理" in field:
            req += " -> 必须是具体的科学原理或方法说明，不能是模糊描述"
        elif "方案" in field:
            req += " -> 必须是具体可执行的解决方案，包含明确的做法"
        elif "思路" in field:
            req += " -> 必须是明确的解决方向，与灵感来源有关联"
        elif "灵感" in field:
            req += " -> 必须是具体的自然现象、动物、植物或人类发明"
        field_requirements.append(req)

    field_req_str = "\n".join(field_requirements)

    # 获取表单描述（系统描述）用于上下文理解
    form_description = form_config.get("description", "")
    form_name = form_config.get("name", "")
    
    # 截取描述的关键部分（避免过长影响提取效率）
    # 提取前500字符作为上下文提示
    desc_context = form_description[:500] if len(form_description) > 500 else form_description
    
    prompt = f"""从对话中提取学生明确表达的信息，只提取user说的内容。

【当前阶段】
{form_name}

【阶段内容说明】
{desc_context}

【待提取字段及其要求】
{field_req_str}

【对话内容】
{recent_conversation}

{SIMPLE_EXTRACTION_RULES}

【重要提示】
- 根据上述"阶段内容说明"判断学生回答是否与当前阶段主题相关
- 只有当学生的回答明确符合该阶段的引导内容时才进行提取
- 如果学生的回答与当前阶段主题无关，则填null

只返回JSON: {json_template}"""

    response = call_llm_fast([{"role": "user", "content": prompt}], "字段提取", max_tokens=150)

    try:
        cleaned = clean_json_string(response)
        result = json.loads(cleaned)

        filtered = {}
        for field, value in result.items():
            if field in form_config["fields"] and value and str(value).lower() != "null":
                if field not in already_extracted or already_extracted[field] != value:
                    filtered[field] = value
                    val_str = str(value)
                    logger.info(f"提取字段: {field} = {val_str[:50] if len(val_str) > 50 else val_str}...")

        total_time = (time.time() - start_time) * 1000
        logger.info(f"[TIMING][字段提取] 总耗时: {total_time:.0f}ms, 提取到: {list(filtered.keys())}")
        return filtered
    except Exception as e:
        total_time = (time.time() - start_time) * 1000
        logger.error(f"[TIMING][字段提取] JSON解析失败: {e}, 耗时: {total_time:.0f}ms")
        return {}


def build_reply_messages(
    form_config: Dict[str, Any],
    user_profile: Dict[str, str],
    chat_history: List[Dict[str, str]],
    extracted_fields: Dict[str, str],
    previous_summaries: Optional[List[Dict]] = None,
    image_url: Optional[str] = None,
    newly_extracted: Optional[List[str]] = None
) -> List[Dict[str, str]]:
    """构建用于生成回复的消息列表（支持图片）"""

    filled_summary = ""
    if extracted_fields:
        filled_summary = "已填写：\n"
        for f, v in extracted_fields.items():
            filled_summary += f"- {f}: {v}\n"
    else:
        filled_summary = "尚未填写任何字段"

    # 添加本次提取结果的信息
    extraction_status = ""
    if newly_extracted is not None:
        if newly_extracted:
            extraction_status = f"\n【本次提取结果】\n学生这次的回答成功提取了以下字段：{', '.join(newly_extracted)}"
        else:
            extraction_status = """\n【本次提取结果】
学生这次的回答未能提取到任何字段。这可能是因为：
- 回答内容与当前阶段要求的字段不匹配
- 回答不够具体或不符合字段格式要求
- 回答与当前讨论主题不相关
【重要】你必须继续引导学生，绝对不能说"任务完成"、"完成"、"恭喜"等话语。
只有当【已收集信息】中所有字段都已填写时，才能宣布任务完成。"""

    fields_str = ", ".join(form_config["fields"])

    previous_context = ""
    if previous_summaries:
        previous_context = "\n【前面阶段的总结】\n"
        for ps in previous_summaries:
            previous_context += f"\n阶段{ps['form_id']}总结：\n{ps['summary']}\n"
            if ps.get('extracted_fields'):
                previous_context += "关键信息：\n"
                for k, v in ps['extracted_fields'].items():
                    previous_context += f"  - {k}: {v}\n"

    system_prompt = f"""你现在必须完全扮演以下角色：

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
{extraction_status}

【重要提示】
- 不要刻意说"已记录"等提示语
- 你具备图片识别能力，可以查看和分析用户发送的图片
- 自然地根据学生的回答继续对话
- 保持对话流畅、连贯
- 如果有前面阶段的信息，可以适当引用和关联
"""

    messages = [{"role": "system", "content": system_prompt}]

    for msg in chat_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    return messages


def generate_reply(
    form_config: Dict[str, Any],
    user_profile: Dict[str, str],
    chat_history: List[Dict[str, str]],
    extracted_fields: Dict[str, str],
    previous_summaries: Optional[List[Dict]] = None,
    image_url: Optional[str] = None,
    newly_extracted: Optional[List[str]] = None
) -> str:
    """生成AI引导回复（非流式，支持图片）"""
    messages = build_reply_messages(
        form_config, user_profile, chat_history,
        extracted_fields, previous_summaries, image_url, newly_extracted
    )
    if image_url:
        return call_llm_vision(messages, image_url, "视觉回复")
    return call_llm(messages, "生成回复")


def generate_reply_stream(
    form_config: Dict[str, Any],
    user_profile: Dict[str, str],
    chat_history: List[Dict[str, str]],
    extracted_fields: Dict[str, str],
    previous_summaries: Optional[List[Dict]] = None,
    image_url: Optional[str] = None,
    newly_extracted: Optional[List[str]] = None
) -> Generator[str, None, None]:
    """生成AI引导回复（流式，支持图片）"""
    messages = build_reply_messages(
        form_config, user_profile, chat_history,
        extracted_fields, previous_summaries, image_url, newly_extracted
    )
    if image_url:
        yield from call_llm_vision_stream(messages, image_url, "视觉回复")
    else:
        yield from call_llm_stream(messages, "生成回复")


def generate_summary(
    form_config: Dict[str, Any],
    extracted_fields: Dict[str, str],
    chat_history: List[Dict[str, str]]
) -> str:
    """生成阶段总结"""

    fields_info = "\n".join([f"- {k}: {v}" for k, v in extracted_fields.items()])

    recent_chat = ""
    for msg in chat_history[-10:]:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        recent_chat += f"{role}: {content}\n"

    prompt = f"""请根据以下信息生成一个简洁的阶段总结（100-200字）。

【阶段名称】
{form_config["name"]}

【阶段描述】
{form_config["description"]}

【收集到的信息】
{fields_info}

【对话记录】
{recent_chat[-2000:]}

【要求】
1. 总结这个阶段学生表达的主要内容和想法
2. 突出重点信息
3. 语言简洁明了
4. 不要使用第一人称
5. 直接输出总结内容，不要有"总结："等前缀
"""

    return call_llm([{"role": "user", "content": prompt}], "生成总结")
