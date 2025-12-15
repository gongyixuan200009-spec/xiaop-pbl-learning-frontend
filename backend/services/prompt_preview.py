"""生成 prompt 预览 - 用于管理后台显示实际的 prompt"""

from typing import Dict, Any, List, Optional

# 默认提取规则prompt（与llm_service中保持同步）
DEFAULT_EXTRACTION_RULES = """【严格提取规则】
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

# 示例对话数据
SAMPLE_CHAT_HISTORY = [
    {"role": "assistant", "content": "你好！我是你的职业规划顾问。我们来聊聊你对未来的想法吧。你有没有想过以后想从事什么样的工作？"},
    {"role": "user", "content": "嗯，我还没有特别明确的想法，不过我对计算机挺感兴趣的。"},
    {"role": "assistant", "content": "对计算机感兴趣很好！计算机领域有很多方向，比如软件开发、数据分析、人工智能、网络安全等。你有没有接触过编程或者做过什么小项目？"},
    {"role": "user", "content": "我学过一点Python，还用它做过一个简单的游戏。"},
    {"role": "assistant", "content": "哇，能用Python做游戏说明你已经有一定的编程基础了！你觉得做游戏的过程中，最让你有成就感的是什么部分？是设计游戏玩法，还是解决编程问题，或者是看到最终作品？"},
    {"role": "user", "content": "我觉得解决编程问题最有意思，每次调试成功都特别开心。"},
]

SAMPLE_USER_PROFILE = {
    "grade": "高二",
    "gender": "男",
    "math_score": "中等偏上",
    "science_feeling": "喜欢动手实践"
}

SAMPLE_EXTRACTED_FIELDS = {
    "兴趣领域": "计算机/编程"
}

SAMPLE_PREVIOUS_SUMMARIES = [
    {
        "form_id": 1,
        "summary": "该学生对计算机和编程表现出浓厚兴趣，已有Python基础，曾独立完成游戏项目。在解决问题过程中获得成就感，属于逻辑思维型学习者。",
        "extracted_fields": {"兴趣领域": "计算机/编程", "已有技能": "Python基础"}
    }
]


def generate_extraction_prompt_preview(
    form_config: Dict[str, Any],
    chat_history: List[Dict[str, str]] = None,
    already_extracted: Dict[str, str] = None
) -> str:
    """生成字段提取 prompt 的预览"""
    
    if chat_history is None:
        chat_history = SAMPLE_CHAT_HISTORY
    if already_extracted is None:
        already_extracted = SAMPLE_EXTRACTED_FIELDS
    
    # 构建对话文本
    conversation_text = ""
    for msg in chat_history:
        role = "学生" if msg["role"] == "user" else "助手"
        conversation_text += f"{role}: {msg['content']}\n"
    
    remaining_fields = [f for f in form_config["fields"] if f not in already_extracted]

    json_template = "{\n"
    for field in form_config["fields"]:
        json_template += '    "' + field + '": "内容或null",\n'
    json_template += "}"

    extracted_info = ""
    if already_extracted:
        extracted_info = "【已提取的字段】\n"
        for field, value in already_extracted.items():
            extracted_info += f"- {field}: {value}\n"

    fields_list = "\n".join([f"{i+1}. {f}" for i, f in enumerate(form_config["fields"])])
    remaining_list = "\n".join([f"- {f}" for f in remaining_fields]) if remaining_fields else "所有字段已填写"

    # 使用自定义提取规则，如果没有则使用默认规则
    custom_rules = form_config.get("extraction_prompt", "").strip()
    extraction_rules = custom_rules if custom_rules else DEFAULT_EXTRACTION_RULES

    # 获取表单描述用于上下文理解
    form_description = form_config.get("description", "")
    form_name = form_config.get("name", "")
    desc_context = form_description[:500] if len(form_description) > 500 else form_description
    
    prompt = f"""【任务】从学生与AI助手的对话中，严格提取学生明确表达或认同的信息。

【当前阶段】
{form_name}

【阶段内容说明】
{desc_context}

【目标字段】
{fields_list}

{extracted_info}

【待提取字段】
{remaining_list}

【对话内容】
{conversation_text[-2000:]}

{extraction_rules}

【重要提示】
- 根据上述"阶段内容说明"判断学生回答是否与当前阶段主题相关
- 只有当学生的回答明确符合该阶段的引导内容时才进行提取
- 如果学生的回答与当前阶段主题无关，则填null

【输出格式】严格返回纯JSON，不确定的字段必须填null：
{json_template}
"""
    
    return prompt


def generate_reply_prompt_preview(
    form_config: Dict[str, Any],
    user_profile: Dict[str, str] = None,
    chat_history: List[Dict[str, str]] = None,
    extracted_fields: Dict[str, str] = None,
    previous_summaries: List[Dict] = None
) -> Dict[str, Any]:
    """生成回复生成 prompt 的预览，返回 system prompt 和 messages"""
    
    if user_profile is None:
        user_profile = SAMPLE_USER_PROFILE
    if chat_history is None:
        chat_history = SAMPLE_CHAT_HISTORY
    if extracted_fields is None:
        extracted_fields = SAMPLE_EXTRACTED_FIELDS
    
    # 构建已填写摘要
    filled_summary = ""
    if extracted_fields:
        filled_summary = "已填写：\n"
        for f, v in extracted_fields.items():
            filled_summary += f"- {f}: {v}\n"
    else:
        filled_summary = "尚未填写任何字段"

    fields_str = ", ".join(form_config["fields"])

    # 构建前面阶段的总结上下文
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

【重要提示】
- 不要刻意说"已记录"等提示语
- 自然地根据学生的回答继续对话
- 保持对话流畅、连贯
- 如果有前面阶段的信息，可以适当引用和关联
"""

    # 构建 messages
    messages = [{"role": "system", "content": system_prompt}]
    for msg in chat_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    return {
        "system_prompt": system_prompt,
        "messages": messages
    }


def get_prompt_previews(form_config: Dict[str, Any], include_previous: bool = False) -> Dict[str, Any]:
    """获取所有 prompt 预览"""
    
    previous_summaries = SAMPLE_PREVIOUS_SUMMARIES if include_previous else None
    
    extraction_prompt = generate_extraction_prompt_preview(form_config)
    reply_data = generate_reply_prompt_preview(
        form_config,
        previous_summaries=previous_summaries
    )
    
    return {
        "extraction_prompt": extraction_prompt,
        "reply_system_prompt": reply_data["system_prompt"],
        "reply_messages": reply_data["messages"],
        "sample_data": {
            "chat_history": SAMPLE_CHAT_HISTORY,
            "user_profile": SAMPLE_USER_PROFILE,
            "extracted_fields": SAMPLE_EXTRACTED_FIELDS,
            "previous_summaries": SAMPLE_PREVIOUS_SUMMARIES if include_previous else []
        }
    }
