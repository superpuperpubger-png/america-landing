@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   Пуш исправлений на GitHub
echo ========================================
git add src/api.js
git status
git commit -m "fix: strip trailing slash from VITE_API_URL to fix 404 on register/login"
git push origin main
echo.
echo Готово. Теперь открой NETLIFY_FIX.txt и сделай один шаг в Netlify.
pause
