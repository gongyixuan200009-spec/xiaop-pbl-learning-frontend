#!/bin/bash

# 部署API配置功能到服务器

echo "开始部署API配置功能..."

# 上传新组件
echo "上传 APIConfigEditor 组件..."
scp frontend/src/components/admin/APIConfigEditor.tsx root@pbl-learning.xiaoluxue.com:/root/xiaop-v2-dev-deploy/frontend/src/components/admin/

# 上传更新的admin页面
echo "上传更新的 admin 页面..."
scp frontend/src/app/admin/page.tsx root@pbl-learning.xiaoluxue.com:/root/xiaop-v2-dev-deploy/frontend/src/app/admin/

# 在服务器上重新构建前端
echo "在服务器上重新构建前端..."
ssh root@pbl-learning.xiaoluxue.com << 'EOF'
cd /root/xiaop-v2-dev-deploy/frontend
npm run build
pm2 restart frontend
EOF

echo "部署完成！"
echo "请访问 https://pbl-learning.xiaoluxue.com/admin/ 查看系统设置中的API配置"
