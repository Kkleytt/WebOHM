@echo off
chcp 866 > nul
:: �஢��塞, ����饭 �� �ਯ� �� ����� �����������
net session >nul 2>&1
if %errorLevel% neq 0 (
   echo ����� �� ����� �����������...
   powershell -Command "Start-Process '%~f0' -Verb RunAs"
   exit /b
)

:: ��ਯ� ����饭 � �ࠢ��� �����������, �த������ �믮������
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