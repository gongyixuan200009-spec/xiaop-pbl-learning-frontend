"""生成 prompt 预览 - 用于管理后台显示实际的 prompt

支持两种模式:
- single_agent: 单Agent模式，同时处理提取和回复，输出格式: [TABLE]JSON[/TABLE] + 回复内容
- dual_agent: 双Agent模式，先提取字段，再生成回复
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional

# 配置文件路径
DATA_DIR = Path(__file__).parent.parent / "data"
AGE_ADAPTATION_CONFIG_FILE = DATA_DIR / "age_adaptation_config.json"

# ============= 年龄段适配规则 =============
AGE_ADAPTATION_RULES = {
    "小学": {
        "language_style": "简单易懂",
        "vocabulary_level": "基础词汇",
        "sentence_structure": "短句为主，避免复杂从句",
        "examples": "日常生活中的例子，如玩具、动画、游戏",
        "encouragement": "多鼓励，使用可爱的表情和语气",
        "explanation_depth": "浅显易懂，重点讲概念",
        "prompt_rules": """【小学生适配规则】
- 使用简单、亲切的语言，避免复杂专业术语
- 多用比喻和生活中的例子解释抽象概念
- 句子要短，一次只问一个问题
- 给予充分的鼓励和正面反馈
- 可以使用一些可爱的表情（如：😊👍🌟）
- 引导时要更有耐心，允许学生慢慢思考
- 如果学生回答不完整，给予提示而不是直接纠正"""
    },
    "初中": {
        "language_style": "较为正式但友好",
        "vocabulary_level": "中等词汇",
        "sentence_structure": "可使用适度复杂的句式",
        "examples": "结合学科知识和青少年感兴趣的话题",
        "encouragement": "适度鼓励，强调思考过程",
        "explanation_depth": "可以深入一些原理",
        "prompt_rules": """【初中生适配规则】
- 使用清晰、规范的语言
- 可以引入一些学科术语，但要适当解释
- 鼓励学生独立思考，提问启发性问题
- 结合学科知识举例，如物理、化学、生物中的现象
- 适度使用表情，保持友好但不过于幼稚
- 引导学生形成系统的思维方式
- 对好的想法给予肯定，对不足之处温和指出"""
    },
    "高中": {
        "language_style": "正式、专业",
        "vocabulary_level": "高级词汇",
        "sentence_structure": "可使用复杂句式和专业表达",
        "examples": "学术案例、行业实践、科研前沿",
        "encouragement": "理性反馈，重视批判性思维",
        "explanation_depth": "深入原理和方法论",
        "prompt_rules": """【高中生适配规则】
- 使用规范、专业的语言表达
- 可以直接使用学科专业术语
- 鼓励深度思考和批判性分析
- 举例可涉及学术研究、行业案例、社会问题
- 减少表情使用，保持专业对话氛围
- 引导学生建立完整的思维框架和方法论
- 对学生的观点进行理性讨论，可以提出不同看法"""
    }
}

def load_custom_age_adaptation_config() -> Dict[str, Any]:
    """加载自定义年龄段适配配置"""
    if AGE_ADAPTATION_CONFIG_FILE.exists():
        try:
            with open(AGE_ADAPTATION_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"加载自定义年龄段配置失败: {e}")
    return {}


def save_custom_age_adaptation_config(config: Dict[str, Any]) -> bool:
    """保存自定义年龄段适配配置"""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(AGE_ADAPTATION_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存自定义年龄段配置失败: {e}")
        return False


def get_merged_age_adaptation_rules() -> Dict[str, Any]:
    """获取合并后的年龄段适配规则（自定义覆盖默认）"""
    # 深拷贝默认规则
    merged = {}
    for age_group, rules in AGE_ADAPTATION_RULES.items():
        merged[age_group] = dict(rules)

    # 加载自定义配置并覆盖
    custom_config = load_custom_age_adaptation_config()
    for age_group, custom_rules in custom_config.items():
        if age_group in merged:
            # 只覆盖自定义配置中存在的字段
            for key, value in custom_rules.items():
                if value is not None and value != "":
                    merged[age_group][key] = value
        else:
            # 新的年龄段（不太可能，但保留灵活性）
            merged[age_group] = custom_rules

    return merged


def get_age_adaptation_prompt(grade: str) -> str:
    """根据年级获取年龄段适配规则（优先使用自定义配置）"""
    # 获取合并后的规则
    rules = get_merged_age_adaptation_rules()

    if "小学" in grade or "一年级" in grade or "二年级" in grade or "三年级" in grade or "四年级" in grade or "五年级" in grade or "六年级" in grade:
        return rules["小学"]["prompt_rules"]
    elif "初" in grade or "七年级" in grade or "八年级" in grade or "九年级" in grade:
        return rules["初中"]["prompt_rules"]
    elif "高" in grade or "十年级" in grade or "十一年级" in grade or "十二年级" in grade:
        return rules["高中"]["prompt_rules"]
    else:
        # 默认使用初中规则
        return rules["初中"]["prompt_rules"]


# ============= 单Agent模式提取规则 =============
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


# ============= 双Agent模式默认提取规则 =============
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


def generate_single_agent_prompt_preview(
    form_config: Dict[str, Any],
    user_profile: Dict[str, str] = None,
    chat_history: List[Dict[str, str]] = None,
    extracted_fields: Dict[str, str] = None,
    previous_summaries: List[Dict] = None
) -> Dict[str, Any]:
    """生成单Agent模式的 prompt 预览

    单Agent模式特点：
    - 同时处理字段提取和回复生成
    - 输出格式: [TABLE]JSON[/TABLE] + 回复内容
    """

    if user_profile is None:
        user_profile = SAMPLE_USER_PROFILE
    if chat_history is None:
        chat_history = SAMPLE_CHAT_HISTORY
    if extracted_fields is None:
        extracted_fields = SAMPLE_EXTRACTED_FIELDS

    # 计算待提取字段
    remaining_fields = [f for f in form_config["fields"] if f not in extracted_fields]

    # 构建已填写摘要
    filled_summary = ""
    if extracted_fields:
        filled_summary = "已填写：\n"
        for f, v in extracted_fields.items():
            filled_summary += f"- {f}: {v}\n"
    else:
        filled_summary = "尚未填写任何字段"

    fields_str = ", ".join(form_config["fields"])
    remaining_str = ", ".join(remaining_fields) if remaining_fields else "无"

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

    # 获取年龄段适配规则
    grade = user_profile.get("grade", "未知")
    age_adaptation = get_age_adaptation_prompt(grade)

    # 构建JSON模板
    json_template = "{" + ", ".join([f'"{f}": null' for f in remaining_fields]) + "}" if remaining_fields else "{}"

    system_prompt = f"""你现在必须完全扮演以下角色，并且在每次回复时同时完成两个任务：
1. 从学生的回答中提取符合要求的字段信息
2. 作为老师进行引导回复

【角色设定】
{form_config["description"]}

【学生画像】
- 年级：{user_profile.get("grade", "未知")}
- 性别：{user_profile.get("gender", "未知")}
- 数学基础：{user_profile.get("math_score", "未知")}
- 理科感受：{user_profile.get("science_feeling", "未知")}

{age_adaptation}
{previous_context}

【当前任务】
引导学生填写表格。
目标字段：{fields_str}
待提取字段：{remaining_str}

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
- JSON中只包含待提取字段，已提取的字段不要重复
- 如果没有提取到任何字段，JSON中所有值都填null
- [/TABLE]之后的内容才是显示给学生的回复
- 回复时不要刻意说"已记录"等提示语
- 你具备图片识别能力，可以查看和分析用户发送的图片
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
        "messages": messages,
        "output_format_example": f"""[TABLE]
{json_template}
[/TABLE]

（这里是给学生的引导回复内容）"""
    }


def generate_reply_prompt_preview(
    form_config: Dict[str, Any],
    user_profile: Dict[str, str] = None,
    chat_history: List[Dict[str, str]] = None,
    extracted_fields: Dict[str, str] = None,
    previous_summaries: List[Dict] = None
) -> Dict[str, Any]:
    """生成双Agent模式的回复生成 prompt 预览

    双Agent模式特点：
    - 第一个Agent负责字段提取（见 generate_extraction_prompt_preview）
    - 第二个Agent负责生成回复（本函数）
    """

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

    # 获取年龄段适配规则
    grade = user_profile.get("grade", "未知")
    age_adaptation = get_age_adaptation_prompt(grade)

    system_prompt = f"""你现在必须完全扮演以下角色：

【角色设定】
{form_config["description"]}

【学生画像】
- 年级：{user_profile.get("grade", "未知")}
- 性别：{user_profile.get("gender", "未知")}
- 数学基础：{user_profile.get("math_score", "未知")}
- 理科感受：{user_profile.get("science_feeling", "未知")}

{age_adaptation}
{previous_context}

【当前任务】
引导学生填写表格。
目标字段：{fields_str}

【已收集信息】
{filled_summary}

【重要提示】
- 不要刻意说"已记录"等提示语
- 你具备图片识别能力，可以查看和分析用户发送的图片
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


def get_prompt_previews(
    form_config: Dict[str, Any],
    include_previous: bool = False,
    mode: str = "dual_agent",
    user_profile: Dict[str, str] = None
) -> Dict[str, Any]:
    """获取 prompt 预览

    Args:
        form_config: 表单配置
        include_previous: 是否包含前面阶段的总结
        mode: 模式，可选 "single_agent" 或 "dual_agent"
        user_profile: 用户画像，用于年龄段适配

    Returns:
        根据模式返回不同的预览内容
    """

    if user_profile is None:
        user_profile = SAMPLE_USER_PROFILE

    previous_summaries = SAMPLE_PREVIOUS_SUMMARIES if include_previous else None

    # 获取年龄段适配规则用于展示
    grade = user_profile.get("grade", "未知")
    age_adaptation_rules = get_age_adaptation_prompt(grade)

    if mode == "single_agent":
        # 单Agent模式：只有一个组合的prompt
        single_agent_data = generate_single_agent_prompt_preview(
            form_config,
            user_profile=user_profile,
            previous_summaries=previous_summaries
        )

        return {
            "mode": "single_agent",
            "mode_description": "单Agent模式：一个Agent同时处理字段提取和回复生成，输出格式为 [TABLE]JSON[/TABLE] + 回复内容",
            "system_prompt": single_agent_data["system_prompt"],
            "messages": single_agent_data["messages"],
            "output_format_example": single_agent_data["output_format_example"],
            "age_adaptation_rules": age_adaptation_rules,
            "sample_data": {
                "chat_history": SAMPLE_CHAT_HISTORY,
                "user_profile": user_profile,
                "extracted_fields": SAMPLE_EXTRACTED_FIELDS,
                "previous_summaries": SAMPLE_PREVIOUS_SUMMARIES if include_previous else []
            }
        }
    else:
        # 双Agent模式：提取和回复分开
        extraction_prompt = generate_extraction_prompt_preview(form_config)
        reply_data = generate_reply_prompt_preview(
            form_config,
            user_profile=user_profile,
            previous_summaries=previous_summaries
        )

        return {
            "mode": "dual_agent",
            "mode_description": "双Agent模式：第一个Agent负责从对话中提取字段，第二个Agent负责生成引导回复",
            "extraction_prompt": extraction_prompt,
            "reply_system_prompt": reply_data["system_prompt"],
            "reply_messages": reply_data["messages"],
            "age_adaptation_rules": age_adaptation_rules,
            "sample_data": {
                "chat_history": SAMPLE_CHAT_HISTORY,
                "user_profile": user_profile,
                "extracted_fields": SAMPLE_EXTRACTED_FIELDS,
                "previous_summaries": SAMPLE_PREVIOUS_SUMMARIES if include_previous else []
            }
        }


def get_age_adaptation_info() -> Dict[str, Any]:
    """获取年龄段适配规则信息，用于后台展示"""
    custom_config = load_custom_age_adaptation_config()
    merged_rules = get_merged_age_adaptation_rules()

    return {
        "default_rules": AGE_ADAPTATION_RULES,
        "custom_rules": custom_config,
        "merged_rules": merged_rules,
        "description": "根据学生年级自动适配对话风格和语言复杂度",
        "grades": {
            "小学": ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
            "初中": ["七年级", "八年级", "九年级", "初一", "初二", "初三"],
            "高中": ["十年级", "十一年级", "十二年级", "高一", "高二", "高三"]
        }
    }
