#!/bin/bash
# =============================================================
#  ZALO TICKET BOT - Script tạo file .env
#  Chạy: bash scripts/setup-env.sh
# =============================================================

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
  echo "⚠️  File .env đã tồn tại. Bạn có muốn ghi đè không? (y/N)"
  read -r OVERWRITE
  if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
    echo "Hủy. File .env giữ nguyên."
    exit 0
  fi
fi

echo ""
echo "======================================"
echo "  CẤU HÌNH ZALO TICKET BOT"
echo "======================================"
echo ""

read -rp "BOT_TOKEN (Zalo OA token): " BOT_TOKEN
read -rp "WEBHOOK_SECRET_TOKEN (chuỗi bí mật webhook): " WEBHOOK_SECRET_TOKEN
read -rp "BOT_NAME (mặc định: @Bot Meyschool - IT): " BOT_NAME
BOT_NAME="${BOT_NAME:-@Bot Meyschool - IT}"

read -rp "AI_API_KEY (Groq API key, bắt đầu bằng gsk_): " AI_API_KEY

read -rp "PORT (mặc định: 3000): " PORT
PORT="${PORT:-3000}"

read -rp "PUBLIC_URL (ví dụ: https://api.minhhan.net): " PUBLIC_URL

# Tự sinh JWT_SECRET ngẫu nhiên 32 bytes
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > "$ENV_FILE" <<EOF
# Tự tạo bởi setup-env.sh - $(date)

BOT_TOKEN=$BOT_TOKEN
WEBHOOK_SECRET_TOKEN=$WEBHOOK_SECRET_TOKEN
BOT_NAME=$BOT_NAME

AI_API_KEY=$AI_API_KEY

PORT=$PORT
PUBLIC_URL=$PUBLIC_URL

JWT_SECRET=$JWT_SECRET
EOF

echo ""
echo "✅ Đã tạo file .env thành công!"
echo "   JWT_SECRET đã được tự động sinh ngẫu nhiên."
echo ""
echo "Chạy lại server: pm2 restart zalo-ticket-bot"
