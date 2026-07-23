#!/bin/bash
echo "Đang dọn dẹp file cũ và tải bản cập nhật mới nhất từ GitHub..."
git reset --hard
git pull origin main
echo "Khởi động lại hệ thống bằng PM2..."
pm2 restart all

echo "========================================="
echo "✅ Cập nhật thành công! Hệ thống đã chạy."
echo "========================================="
