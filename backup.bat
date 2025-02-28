@echo off
chcp 866 > nul
taskkill /F /IM node.exe
timeout /t 1 /nobreak
mkdir "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App"
xcopy "D:/Cloud Files/Работа/Проекты/#Programs/Node/data" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App\data" /E /I /Y
xcopy "D:/Cloud Files/Работа/Проекты/#Programs/Node/node_modules" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App\node_modules" /E /I /Y
copy "D:\Cloud Files\Работа\Проекты\#Programs\Node\main.js" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\Работа\Проекты\#Programs\Node\rs.bat" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\Работа\Проекты\#Programs\Node\send.py" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\Работа\Проекты\#Programs\Node\config.json" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\Работа\Проекты\#Programs\Node\test.bat" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\Работа\Проекты\#Programs\Node\package.json" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
copy "D:\Cloud Files\Работа\Проекты\#Programs\Node\package-lock.json" "D:\Cloud Files\Работа\Проекты\#Programs\Node\backup\app\2024.09.24 17.09 - App" /Y
echo Backup completed.
cd D:\Cloud Files\Работа\Проекты\#Programs\Node
start "" "D:\Cloud Files\Работа\Проекты\#Programs\Node\rs.bat"
exit