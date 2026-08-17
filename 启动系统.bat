@echo off
chcp 65001 >nul
echo ====================================
echo   郑州美食GIS系统 - 启动脚本
echo ====================================
echo.

echo [1] 检查后端服务器...
cd /d "%~dp0backend"
if not exist "node_modules" (
    echo 正在安装后端依赖...
    call npm install
)

echo 启动后端服务器 (端口 5000)...
start "后端服务器" cmd /k "node server.js"

timeout /t 3 /nobreak >nul

echo.
echo [2] 检查前端服务器...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
)

echo 启动前端服务器 (端口 3000)...
start "前端服务器" cmd /k "npm run dev"

echo.
echo ====================================
echo   系统启动完成！
echo ====================================
echo.
echo 后端地址: http://127.0.0.1:5000
echo 前端地址: http://127.0.0.1:3000
echo.
echo 请在浏览器中打开: http://127.0.0.1:3000
echo.
echo 按任意键关闭此窗口（服务器将继续运行）...
pause >nul