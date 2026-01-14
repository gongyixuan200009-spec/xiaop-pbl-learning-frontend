#!/bin/bash

echo "🎉 后端服务验证测试"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 测试服务健康
echo "1️⃣  测试服务健康..."
HEALTH=$(curl -s http://localhost:8000/ 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 服务运行正常${NC}"
else
    echo -e "${RED}❌ 服务未运行${NC}"
    exit 1
fi

# 2. 测试用户注册
echo ""
echo "2️⃣  测试用户注册..."
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"test_${TIMESTAMP}\",
    \"password\": \"test123\",
    \"profile\": {
      \"grade\": \"高一\",
      \"gender\": \"男生\",
      \"math_score\": \"90-110分\",
      \"science_feeling\": \"基础尚可\"
    }
  }")

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✅ 用户注册成功${NC}"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}❌ 用户注册失败${NC}"
    echo "$REGISTER_RESPONSE"
fi

# 3. 测试用户登录
echo ""
echo "3️⃣  测试用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"test_${TIMESTAMP}\",
    \"password\": \"test123\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✅ 用户登录成功${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ 用户登录失败${NC}"
    echo "$LOGIN_RESPONSE"
fi

# 4. 测试获取用户信息
echo ""
echo "4️⃣  测试获取用户信息..."
if [ -n "$TOKEN" ]; then
    USER_INFO=$(curl -s -X GET http://localhost:8000/api/auth/me \
      -H "Authorization: Bearer ${TOKEN}")

    if echo "$USER_INFO" | grep -q "username"; then
        echo -e "${GREEN}✅ 获取用户信息成功${NC}"
        USERNAME=$(echo "$USER_INFO" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
        echo "   用户名: $USERNAME"
    else
        echo -e "${RED}❌ 获取用户信息失败${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  跳过（无 Token）${NC}"
fi

# 5. 测试获取表单配置
echo ""
echo "5️⃣  测试获取表单配置..."
FORMS=$(curl -s http://localhost:8000/api/chat/forms)

if echo "$FORMS" | grep -q "forms"; then
    echo -e "${GREEN}✅ 获取表单配置成功${NC}"
    FORM_COUNT=$(echo "$FORMS" | grep -o '"id"' | wc -l)
    echo "   表单数量: $FORM_COUNT"
else
    echo -e "${RED}❌ 获取表单配置失败${NC}"
fi

# 6. 测试创建项目
echo ""
echo "6️⃣  测试创建项目..."
if [ -n "$TOKEN" ]; then
    PROJECT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/projects/create \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"name\": \"测试项目_${TIMESTAMP}\"}")

    if echo "$PROJECT_RESPONSE" | grep -q "id"; then
        echo -e "${GREEN}✅ 创建项目成功${NC}"
        PROJECT_NAME=$(echo "$PROJECT_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        echo "   项目名称: $PROJECT_NAME"
    else
        echo -e "${RED}❌ 创建项目失败${NC}"
        echo "$PROJECT_RESPONSE"
    fi
else
    echo -e "${YELLOW}⏭️  跳过（无 Token）${NC}"
fi

# 总结
echo ""
echo "===================="
echo -e "${GREEN}🎉 测试完成！${NC}"
echo ""
echo "📊 访问以下地址查看更多："
echo "   • API 文档: http://localhost:8000/docs"
echo "   • Supabase Studio: http://10.1.20.75:3000"
echo ""
