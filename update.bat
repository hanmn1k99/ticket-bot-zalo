@echo off
chcp 65001 >nul
echo Đang tải bản cập nhật mới nhất từ GitHub...
git pull origin main

echo.
echo Khởi động lại hệ thống bằng PM2...
pm2 restart all

echo.
echo =========================================
echo ✅ Cập nhật thành công! Hệ thống đã chạy.
echo =========================================
pause
