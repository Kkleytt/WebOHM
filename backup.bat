@echo off
chcp 866 > nul
taskkill /F /IM node.exe
timeout /t 1 /nobreak
mkdir "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App"
xcopy "D:/Cloud Files/�����/�஥���/#Programs/Node/data" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App\data" /E /I /Y
xcopy "D:/Cloud Files/�����/�஥���/#Programs/Node/node_modules" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App\node_modules" /E /I /Y
copy "D:\Cloud Files\�����\�஥���\#Programs\Node\main.js" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\�����\�஥���\#Programs\Node\rs.bat" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\�����\�஥���\#Programs\Node\send.py" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\�����\�஥���\#Programs\Node\config.json" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\�����\�஥���\#Programs\Node\test.bat" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\�����\�஥���\#Programs\Node\package.json" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\�����\�஥���\#Programs\Node\package-lock.json" "D:\Cloud Files\�����\�஥���\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
echo Backup completed.
cd D:\Cloud Files\�����\�஥���\#Programs\Node
start "" "D:\Cloud Files\�����\�஥���\#Programs\Node\rs.bat"
exit