#!/usr/bin/env python3
"""
测试所有配置的AI模型是否可用
"""

import json
import requests
from openai import OpenAI

def test_openrouter_model(model_name, api_key):
    """测试OpenRouter模型"""
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model_name,
                "messages": [{"role": "user", "content": "你好，请用一句话介绍你自己。"}],
                "max_tokens": 100
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            return True, content
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
    except Exception as e:
        return False, str(e)

def test_volcengine_model(model_name, api_key, api_endpoint, reasoning_effort="medium"):
    """测试火山引擎模型"""
    try:
        client = OpenAI(
            base_url=api_endpoint,
            api_key=api_key
        )

        extra_body = {}
        if reasoning_effort:
            extra_body["reasoning_effort"] = reasoning_effort

        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "你好，请用一句话介绍你自己。"}],
            max_tokens=100,
            extra_body=extra_body if extra_body else None
        )

        content = response.choices[0].message.content
        return True, content
    except Exception as e:
        return False, str(e)

def main():
    """主测试函数"""
    print("="*60)
    print("AI模型可用性测试")
    print("="*60)

    # 读取API密钥
    with open('/root/workspace/xiaop-v2-dev-deploy/backend/data/api_key_config.json', 'r') as f:
        config = json.load(f)

    # 获取API密钥
    openrouter_key = config.get('api_key') if config.get('api_provider') == 'openrouter' else None
    volcengine_key = "7c51735e-0a71-4e2f-b775-2668f3efb757"
    volcengine_endpoint = "https://ark.cn-beijing.volces.com/api/v3"

    # 如果没有OpenRouter密钥，尝试从环境变量或配置中获取
    if not openrouter_key:
        print("⚠️  警告: 未找到OpenRouter API密钥，将跳过OpenRouter模型测试")

    # 定义测试模型
    models = [
        {
            "id": "deepseek-chat",
            "name": "DeepSeek Chat",
            "provider": "openrouter",
            "model": "deepseek/deepseek-chat",
            "skip": not openrouter_key
        },
        {
            "id": "qwen-turbo",
            "name": "通义千问 Turbo",
            "provider": "openrouter",
            "model": "alibaba/qwen-turbo",
            "skip": not openrouter_key
        },
        {
            "id": "doubao-lite",
            "name": "豆包 Lite",
            "provider": "volcengine",
            "model": "doubao-seed-1-6-lite-251015",
            "reasoning_effort": "low"
        },
        {
            "id": "doubao-pro",
            "name": "豆包 Pro",
            "provider": "volcengine",
            "model": "doubao-pro-32k",
            "reasoning_effort": "high"
        },
        {
            "id": "claude-sonnet",
            "name": "Claude 3.5 Sonnet",
            "provider": "openrouter",
            "model": "anthropic/claude-3.5-sonnet",
            "skip": not openrouter_key
        }
    ]

    # 测试结果
    results = {}

    # 测试每个模型
    for model_info in models:
        print(f"\n{'='*60}")
        print(f"测试模型: {model_info['name']} ({model_info['id']})")
        print(f"{'='*60}")

        if model_info.get('skip'):
            print("⏭️  跳过 (缺少API密钥)")
            results[model_info['id']] = None
            continue

        print(f"提供商: {model_info['provider']}")
        print(f"模型ID: {model_info['model']}")

        if model_info['provider'] == 'openrouter':
            success, response = test_openrouter_model(model_info['model'], openrouter_key)
        else:  # volcengine
            success, response = test_volcengine_model(
                model_info['model'],
                volcengine_key,
                volcengine_endpoint,
                model_info.get('reasoning_effort')
            )

        if success:
            print(f"✅ 成功!")
            print(f"响应: {response[:100]}..." if len(response) > 100 else f"响应: {response}")
            results[model_info['id']] = True
        else:
            print(f"❌ 失败!")
            print(f"错误: {response}")
            results[model_info['id']] = False

    # 打印总结
    print(f"\n{'='*60}")
    print("测试总结")
    print(f"{'='*60}")

    for model_info in models:
        model_id = model_info['id']
        result = results[model_id]
        if result is None:
            status = "⏭️  跳过"
        elif result:
            status = "✅ 可用"
        else:
            status = "❌ 不可用"
        print(f"{model_info['name']:25s} {status}")

    # 统计
    tested = [r for r in results.values() if r is not None]
    if tested:
        passed = sum(1 for r in tested if r)
        print(f"\n总计: {passed}/{len(tested)} 个模型可用")
    else:
        print(f"\n未测试任何模型（缺少API密钥）")

    return 0

if __name__ == "__main__":
    main()
