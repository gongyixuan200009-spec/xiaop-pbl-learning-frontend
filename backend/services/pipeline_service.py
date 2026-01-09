"""
Pipeline Service - 可配置的Agent流程编排服务

支持灵活的agent流程设计：
- 多个步骤串行执行
- 每个步骤可以是 extract(提取), reply(回复), extract_and_reply(单agent)
- 表格输出和回复输出可以来自不同步骤的组合
"""

import json
import logging
import time
from typing import List, Dict, Any, Optional, Generator
from dataclasses import dataclass, field, asdict
from enum import Enum

from services.llm_service import (
    extract_fields,
    generate_reply_stream,
    call_llm_stream,
    call_llm_vision_stream,
    call_llm_fast,
    build_reply_messages,
    clean_json_string
)
from services.single_agent_service import (
    generate_single_agent_stream,
    build_single_agent_messages,
    parse_single_agent_response
)

logger = logging.getLogger("pipeline_service")


# ===== 默认 Prompt 模板 =====
# 这些模板可以被用户自定义覆盖

DEFAULT_EXTRACT_PROMPT = """【严格提取规则】
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

DEFAULT_REPLY_PROMPT = """【回复生成规则】
你需要作为一个专业且友善的引导者，帮助学生完成表格填写任务。

【引导原则】
1. 自然对话：保持对话流畅自然，不要生硬地询问字段
2. 循序渐进：一次只引导1-2个字段，避免信息过载
3. 启发思考：通过开放性问题引导学生思考，而不是直接告诉答案
4. 积极反馈：适当肯定学生的回答，增强互动性
5. 灵活应对：根据学生的回答调整引导方向

【注意事项】
- 不要刻意说"已记录"、"我记下了"等提示语
- 不要重复学生刚说过的内容
- 如果学生回答不够具体，温和地引导补充
- 保持专业但亲和的语气"""

DEFAULT_EXTRACT_AND_REPLY_PROMPT = """【单Agent模式规则】
你需要同时完成两个任务：
1. 从学生的回答中提取符合要求的字段信息
2. 作为引导者进行回复

【字段提取规则】
1. 只提取user明确表达的内容，不要推测或补充
2. 内容必须与字段名要求严格匹配
3. 提取的内容必须与当前讨论的主题直接相关
4. 拒绝提取的情况（填null）：
   - 用户只是在询问或不确定
   - 内容模糊、不完整或缺少具体细节
   - 内容与字段要求不匹配
5. 只提取实质性内容，不提取"好的"、"我明白了"等无意义回复

【回复生成规则】
1. 自然对话：保持对话流畅自然
2. 循序渐进：一次只引导1-2个字段
3. 启发思考：通过开放性问题引导学生思考
4. 灵活应对：根据学生的回答调整引导方向
5. 不要刻意说"已记录"等提示语"""

# 获取步骤类型对应的默认 Prompt
def get_default_prompt_for_step_type(step_type: str) -> str:
    """获取指定步骤类型的默认 Prompt"""
    prompts = {
        "extract": DEFAULT_EXTRACT_PROMPT,
        "reply": DEFAULT_REPLY_PROMPT,
        "extract_and_reply": DEFAULT_EXTRACT_AND_REPLY_PROMPT,
    }
    return prompts.get(step_type, "")


class StepType(str, Enum):
    """步骤类型"""
    EXTRACT = "extract"              # 只提取字段
    REPLY = "reply"                  # 只生成回复
    EXTRACT_AND_REPLY = "extract_and_reply"  # 同时提取和回复（单agent模式）


class ModelType(str, Enum):
    """模型类型"""
    FAST = "fast"           # 快速模型（提取用）
    DEFAULT = "default"     # 默认模型
    VISION = "vision"       # 视觉模型


@dataclass
class PipelineStep:
    """Pipeline步骤配置"""
    id: str                           # 步骤ID
    name: str                         # 步骤名称
    type: str                         # 步骤类型: extract, reply, extract_and_reply
    model: str = "default"            # 模型类型: fast, default, vision
    prompt_template: Optional[str] = None  # 自定义prompt模板（可选）
    context_from: List[str] = field(default_factory=list)  # 依赖的上游步骤ID

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> 'PipelineStep':
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            type=data.get("type", "extract"),
            model=data.get("model", "default"),
            prompt_template=data.get("prompt_template"),
            context_from=data.get("context_from", [])
        )


@dataclass
class PipelineOutput:
    """Pipeline输出配置"""
    table_from: List[str] = field(default_factory=list)   # 表格数据来源步骤
    reply_from: List[str] = field(default_factory=list)   # 回复来源步骤

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> 'PipelineOutput':
        return cls(
            table_from=data.get("table_from", []),
            reply_from=data.get("reply_from", [])
        )


@dataclass
class Pipeline:
    """Pipeline配置"""
    id: str                           # Pipeline ID
    name: str                         # Pipeline名称
    description: str = ""             # 描述
    steps: List[PipelineStep] = field(default_factory=list)  # 步骤列表
    output: PipelineOutput = field(default_factory=PipelineOutput)  # 输出配置

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "steps": [s.to_dict() for s in self.steps],
            "output": self.output.to_dict()
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'Pipeline':
        steps = [PipelineStep.from_dict(s) for s in data.get("steps", [])]
        output = PipelineOutput.from_dict(data.get("output", {}))
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            description=data.get("description", ""),
            steps=steps,
            output=output
        )


# 预置的Pipeline配置
PRESET_PIPELINES = {
    "single_agent": Pipeline(
        id="single_agent",
        name="单Agent模式",
        description="一个Agent同时处理字段提取和回复生成，速度快",
        steps=[
            PipelineStep(
                id="main",
                name="提取与回复",
                type="extract_and_reply",
                model="default"
            )
        ],
        output=PipelineOutput(
            table_from=["main"],
            reply_from=["main"]
        )
    ),
    "dual_agent": Pipeline(
        id="dual_agent",
        name="双Agent模式",
        description="分离的提取Agent和回复Agent，提取更精确",
        steps=[
            PipelineStep(
                id="extract",
                name="字段提取",
                type="extract",
                model="fast"
            ),
            PipelineStep(
                id="reply",
                name="生成回复",
                type="reply",
                model="default",
                context_from=["extract"]
            )
        ],
        output=PipelineOutput(
            table_from=["extract"],
            reply_from=["reply"]
        )
    ),
    "triple_agent": Pipeline(
        id="triple_agent",
        name="三Agent深度分析",
        description="快速提取 + 深度分析 + 回复生成，适合复杂场景",
        steps=[
            PipelineStep(
                id="quick_extract",
                name="快速提取",
                type="extract",
                model="fast"
            ),
            PipelineStep(
                id="deep_extract",
                name="深度分析提取",
                type="extract",
                model="default",
                context_from=["quick_extract"]
            ),
            PipelineStep(
                id="reply",
                name="生成回复",
                type="reply",
                model="default",
                context_from=["quick_extract", "deep_extract"]
            )
        ],
        output=PipelineOutput(
            table_from=["quick_extract", "deep_extract"],
            reply_from=["reply"]
        )
    )
}


@dataclass
class StepResult:
    """步骤执行结果"""
    step_id: str
    extracted_fields: Dict[str, str] = field(default_factory=dict)
    reply: str = ""
    timing_ms: float = 0


class PipelineExecutor:
    """Pipeline执行器"""

    def __init__(
        self,
        pipeline: Pipeline,
        form_config: Dict[str, Any],
        user_profile: Dict[str, str],
        chat_history: List[Dict[str, str]],
        extracted_fields: Dict[str, str],
        previous_summaries: Optional[List[Dict]] = None,
        image_url: Optional[str] = None
    ):
        self.pipeline = pipeline
        self.form_config = form_config
        self.user_profile = user_profile
        self.chat_history = chat_history
        self.extracted_fields = extracted_fields
        self.previous_summaries = previous_summaries
        self.image_url = image_url

        # 步骤执行结果缓存
        self.step_results: Dict[str, StepResult] = {}

    def _build_conversation_text(self) -> str:
        """构建用于提取的对话文本"""
        conversation_text = ""
        for msg in self.chat_history:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            conversation_text += f"\n{role}: {content}"
        return conversation_text

    def _get_context_from_steps(self, context_from: List[str]) -> Dict[str, StepResult]:
        """获取上游步骤的结果作为上下文"""
        context = {}
        for step_id in context_from:
            if step_id in self.step_results:
                context[step_id] = self.step_results[step_id]
        return context

    def _merge_extracted_fields(self, step_ids: List[str]) -> Dict[str, str]:
        """合并多个步骤的提取结果"""
        merged = dict(self.extracted_fields)  # 从已提取字段开始
        for step_id in step_ids:
            if step_id in self.step_results:
                merged.update(self.step_results[step_id].extracted_fields)
        return merged

    def _execute_extract_step(
        self,
        step: PipelineStep,
        current_extracted: Dict[str, str]
    ) -> StepResult:
        """执行提取步骤"""
        start_time = time.time()

        conversation_text = self._build_conversation_text()

        # 如果有自定义prompt模板，可以在这里处理
        # 目前使用默认的extract_fields
        newly_extracted = extract_fields(
            self.form_config,
            conversation_text,
            current_extracted
        )

        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[Pipeline][{step.id}] 提取完成, 耗时: {elapsed:.0f}ms, 新字段: {list(newly_extracted.keys())}")

        return StepResult(
            step_id=step.id,
            extracted_fields=newly_extracted,
            timing_ms=elapsed
        )

    def _execute_reply_step_stream(
        self,
        step: PipelineStep,
        current_extracted: Dict[str, str],
        newly_extracted_keys: List[str]
    ) -> Generator[str, None, StepResult]:
        """执行回复步骤（流式）"""
        start_time = time.time()
        full_reply = ""

        for chunk in generate_reply_stream(
            self.form_config,
            self.user_profile,
            self.chat_history,
            current_extracted,
            self.previous_summaries,
            self.image_url,
            newly_extracted_keys
        ):
            full_reply += chunk
            yield chunk

        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[Pipeline][{step.id}] 回复完成, 耗时: {elapsed:.0f}ms, 长度: {len(full_reply)}")

        result = StepResult(
            step_id=step.id,
            reply=full_reply,
            timing_ms=elapsed
        )
        self.step_results[step.id] = result
        return result

    def _execute_extract_and_reply_step_stream(
        self,
        step: PipelineStep
    ) -> Generator[tuple, None, StepResult]:
        """执行提取+回复步骤（单agent模式，流式）

        Yields:
            tuple: (event_type, data)
            - ("extraction", extracted_dict)
            - ("content", chunk_str)
            - ("done", full_reply)
        """
        start_time = time.time()

        for event_type, data in generate_single_agent_stream(
            self.form_config,
            self.user_profile,
            self.chat_history,
            self.extracted_fields,
            self.previous_summaries,
            self.image_url
        ):
            yield (event_type, data)

            if event_type == "extraction":
                self.step_results[step.id] = StepResult(
                    step_id=step.id,
                    extracted_fields=data.get("extracted", {}),
                    timing_ms=(time.time() - start_time) * 1000
                )
            elif event_type == "done":
                if step.id in self.step_results:
                    self.step_results[step.id].reply = data
                    self.step_results[step.id].timing_ms = (time.time() - start_time) * 1000

    def execute_stream(self) -> Generator[Dict, None, None]:
        """流式执行Pipeline

        Yields:
            Dict: SSE事件
            - {"type": "step_start", "step_id": str, "step_name": str}
            - {"type": "extraction", "step_id": str, "extracted_fields": dict, "newly_extracted": list}
            - {"type": "content", "step_id": str, "content": str}
            - {"type": "step_done", "step_id": str, "timing_ms": float}
            - {"type": "pipeline_done", "all_extracted": dict, "full_reply": str}
        """
        logger.info(f"[Pipeline] 开始执行: {self.pipeline.name}, 步骤数: {len(self.pipeline.steps)}")

        current_extracted = dict(self.extracted_fields)
        all_newly_extracted = []
        full_reply = ""

        for step in self.pipeline.steps:
            # 发送步骤开始事件
            yield {
                "type": "step_start",
                "step_id": step.id,
                "step_name": step.name,
                "step_type": step.type
            }

            if step.type == StepType.EXTRACT.value:
                # 提取步骤
                result = self._execute_extract_step(step, current_extracted)
                self.step_results[step.id] = result

                # 合并提取结果
                current_extracted.update(result.extracted_fields)
                newly_keys = list(result.extracted_fields.keys())
                all_newly_extracted.extend(newly_keys)

                # 发送提取结果事件
                is_complete = all(f in current_extracted for f in self.form_config["fields"])
                yield {
                    "type": "extraction",
                    "step_id": step.id,
                    "extracted_fields": current_extracted,
                    "newly_extracted": newly_keys,
                    "is_complete": is_complete,
                    "needs_confirmation": is_complete
                }

                yield {
                    "type": "step_done",
                    "step_id": step.id,
                    "timing_ms": result.timing_ms
                }

            elif step.type == StepType.REPLY.value:
                # 回复步骤
                step_reply = ""
                for chunk in self._execute_reply_step_stream(
                    step,
                    current_extracted,
                    all_newly_extracted
                ):
                    step_reply += chunk
                    yield {
                        "type": "content",
                        "step_id": step.id,
                        "content": chunk
                    }

                # 收集回复
                if step.id in [s for s in self.pipeline.output.reply_from]:
                    full_reply += step_reply

                yield {
                    "type": "step_done",
                    "step_id": step.id,
                    "timing_ms": self.step_results.get(step.id, StepResult(step.id)).timing_ms
                }

            elif step.type == StepType.EXTRACT_AND_REPLY.value:
                # 单agent模式：同时提取和回复
                for event_type, data in self._execute_extract_and_reply_step_stream(step):
                    if event_type == "extraction":
                        # 合并提取结果
                        current_extracted.update(data.get("extracted", {}))
                        newly_keys = data.get("newly_extracted", [])
                        all_newly_extracted.extend(newly_keys)

                        is_complete = all(f in current_extracted for f in self.form_config["fields"])
                        yield {
                            "type": "extraction",
                            "step_id": step.id,
                            "extracted_fields": data.get("all_extracted", current_extracted),
                            "newly_extracted": newly_keys,
                            "is_complete": is_complete,
                            "needs_confirmation": is_complete
                        }

                    elif event_type == "content":
                        yield {
                            "type": "content",
                            "step_id": step.id,
                            "content": data
                        }

                    elif event_type == "done":
                        full_reply = data

                yield {
                    "type": "step_done",
                    "step_id": step.id,
                    "timing_ms": self.step_results.get(step.id, StepResult(step.id)).timing_ms
                }

        # 根据output配置合并最终结果
        final_extracted = self._merge_extracted_fields(self.pipeline.output.table_from)

        # 如果有多个reply来源，合并它们
        if len(self.pipeline.output.reply_from) > 1:
            reply_parts = []
            for step_id in self.pipeline.output.reply_from:
                if step_id in self.step_results and self.step_results[step_id].reply:
                    reply_parts.append(self.step_results[step_id].reply)
            if reply_parts:
                full_reply = "\n\n".join(reply_parts)

        is_complete = all(f in final_extracted for f in self.form_config["fields"])

        yield {
            "type": "pipeline_done",
            "all_extracted": final_extracted,
            "newly_extracted": all_newly_extracted,
            "full_reply": full_reply,
            "is_complete": is_complete,
            "needs_confirmation": is_complete
        }

        logger.info(f"[Pipeline] 执行完成: {self.pipeline.name}")


def get_pipeline(pipeline_id: str) -> Optional[Pipeline]:
    """获取Pipeline配置"""
    # 先检查预置的Pipeline
    if pipeline_id in PRESET_PIPELINES:
        return PRESET_PIPELINES[pipeline_id]

    # 再检查自定义Pipeline
    from config import load_pipeline_config
    custom_pipelines = load_pipeline_config()
    for p in custom_pipelines.get("pipelines", []):
        if p.get("id") == pipeline_id:
            return Pipeline.from_dict(p)

    return None


def list_pipelines() -> List[Dict]:
    """列出所有可用的Pipeline"""
    result = []

    # 添加预置Pipeline
    for pid, pipeline in PRESET_PIPELINES.items():
        p_dict = pipeline.to_dict()
        p_dict["is_preset"] = True
        result.append(p_dict)

    # 添加自定义Pipeline
    from config import load_pipeline_config
    custom_pipelines = load_pipeline_config()
    for p in custom_pipelines.get("pipelines", []):
        p["is_preset"] = False
        result.append(p)

    return result


def save_custom_pipeline(pipeline: Pipeline) -> bool:
    """保存自定义Pipeline"""
    from config import load_pipeline_config, save_pipeline_config

    # 不允许覆盖预置Pipeline
    if pipeline.id in PRESET_PIPELINES:
        logger.error(f"不能覆盖预置Pipeline: {pipeline.id}")
        return False

    config = load_pipeline_config()
    pipelines = config.get("pipelines", [])

    # 查找是否已存在
    found = False
    for i, p in enumerate(pipelines):
        if p.get("id") == pipeline.id:
            pipelines[i] = pipeline.to_dict()
            found = True
            break

    if not found:
        pipelines.append(pipeline.to_dict())

    config["pipelines"] = pipelines
    save_pipeline_config(config)

    logger.info(f"保存自定义Pipeline: {pipeline.id}")
    return True


def delete_custom_pipeline(pipeline_id: str) -> bool:
    """删除自定义Pipeline"""
    from config import load_pipeline_config, save_pipeline_config

    # 不允许删除预置Pipeline
    if pipeline_id in PRESET_PIPELINES:
        logger.error(f"不能删除预置Pipeline: {pipeline_id}")
        return False

    config = load_pipeline_config()
    pipelines = config.get("pipelines", [])

    original_len = len(pipelines)
    pipelines = [p for p in pipelines if p.get("id") != pipeline_id]

    if len(pipelines) == original_len:
        return False

    config["pipelines"] = pipelines
    save_pipeline_config(config)

    logger.info(f"删除自定义Pipeline: {pipeline_id}")
    return True


def copy_pipeline_with_prompts(source_pipeline_id: str, new_id: str = None) -> Optional[Pipeline]:
    """
    复制一个 Pipeline，并填充所有步骤的默认 Prompt。
    用于让用户可以看到和编辑实际使用的 Prompt。
    """
    source = get_pipeline(source_pipeline_id)
    if not source:
        return None

    # 生成新 ID
    if not new_id:
        new_id = f"custom_{int(time.time() * 1000)}"

    # 复制步骤并填充 prompt
    new_steps = []
    for step in source.steps:
        # 如果原步骤没有自定义 prompt，使用默认 prompt
        prompt = step.prompt_template
        if not prompt:
            prompt = get_default_prompt_for_step_type(step.type)

        new_step = PipelineStep(
            id=step.id,
            name=step.name,
            type=step.type,
            model=step.model,
            prompt_template=prompt,
            context_from=list(step.context_from)
        )
        new_steps.append(new_step)

    # 创建新 Pipeline
    new_pipeline = Pipeline(
        id=new_id,
        name=f"{source.name} (副本)",
        description=source.description,
        steps=new_steps,
        output=PipelineOutput(
            table_from=list(source.output.table_from),
            reply_from=list(source.output.reply_from)
        )
    )

    return new_pipeline


def get_default_prompts() -> Dict[str, str]:
    """获取所有步骤类型的默认 Prompt"""
    return {
        "extract": DEFAULT_EXTRACT_PROMPT,
        "reply": DEFAULT_REPLY_PROMPT,
        "extract_and_reply": DEFAULT_EXTRACT_AND_REPLY_PROMPT,
    }
