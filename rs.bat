@echo off
chcp 866 > nul
:: Проверяем, запущен ли скрипт от имени администратора
net session >nul 2>&1
if %errorLevel% neq 0 (
   echo Запуск от имени администратора...
   powershell -Command "Start-Process '%~f0' -Verb RunAs"
   exit /b
)

:: Скрипт запущен с правами администратора, продолжаем выполнение
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe" >NUL
if "%ERRORLEVEL%"=="0" (
   taskkill /F /IM node.exe
   cd /d "%~dp0"
   timeout /t 1
   node main.js
   exit
) else (
   cd /d "%~dp0"
   node main.js
   exit
)