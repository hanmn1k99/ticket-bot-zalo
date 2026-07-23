#!/bin/bash
echo "Đang tải bản cập nhật mới nhất từ GitHub..."
git pull origin main

echo "Khởi động lại hệ thống bằng PM2..."
pm2 restart all

echo "========================================="
echo "✅ Cập nhật thành công! Hệ thống đã chạy."
echo "========================================="
