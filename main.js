const express = require('express'); // Модуль для создания API
const fs = require('fs'); // Модль чтения и записи в файл
const path = require('path'); // Модуль для опредления локальных путей
const systemInfo = require('systeminformation');
const os = require('os');  // Модуль для определения ОС
const ping = require('ping'); // Модуль для отправки Ping-запроса
const { exec } = require('child_process'); // Модуль ядля поддержки CMD
const axios = require('axios'); // Модуль для отправки запросов
const iconv = require('iconv-lite'); // Модуль для конвертирования строк в разные кодировки

// Загружаем настройки
const config = require('./config.json');

// Создаем приложение Express
const app = express();
let staticData = {};

// Функция для проверки данных и возврата альтернативных значений
const checkData = (value, alternative = 'N/A') => (value ? value : alternative);

// Функция получения актуального временив формате "DD:MM:YYYY HH:MM:SS - " или "[DD:MM:YYYY HH:MM:SS] - ""
function getDate(){
    if (config.App.LogDate){
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = ("0" + date_ob.getHours()).slice(-2)
        let minutes = ("0" + date_ob.getMinutes()).slice(-2)
        let seconds = ("0" + date_ob.getSeconds()).slice(-2)

        if (config.App.ContrastDate) {
            return `[${date}.${month}.${year} ${hours}:${minutes}:${seconds}] - `
        }
        else {
           return `${date}.${month}.${year} ${hours}:${minutes}:${seconds} - ` 
        }
    } else {
        return ``
    }
    
};

// Функция для записи логов
async function writeLog(message) {
    const logFilePath = path.resolve(config.Path.ActiveLog);
    let logMessage = `${getDate()}${message}`;

    if (config.App.LogWrite) {
        // Если включен вывод логов в консоль
        if (config.App.LogWriteConsole) {
            console.log(logMessage);
        }

        // Асинхронная запись в файл, с ожиданием завершения
        try {
            await fs.promises.appendFile(logFilePath, logMessage + "\n");
        } catch (err) {
            console.error('Ошибка записи лога: ', err);
        }
    } else {
        // Если логи не записываются, выводим их только в консоль
        console.log(message);
    }
};

// Функция для очистки логов при старте программы
async function clearLogFile() {
    try {
        const logFilePath = path.resolve(config.Path.ActiveLog);
        await fs.promises.writeFile(logFilePath, ''); // Очистка лог-файла
        await writeLog("Лог-файл очищен"); // Запись в логи
    } catch (err) {
        await writeLog(`Ошибка очистки лог-файла: ${err}`)
    }
};

// Таймер для Очистки + Бекапа logs.log
async function LogFileUpdate() {
    const ClearHours = config.Backup.TimerLog.Hours
    const ClearMinuts = config.Backup.TimerLog.Minuts
    const ClearSeconds = config.Backup.TimerLog.Seconds
    const now = new Date();
    const nextClearTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, ClearHours, ClearMinuts, ClearSeconds);
    const delay = nextClearTime - now;

    let date = ("0" + (now.getDate() + 1)).slice(-2);
    let month = ("0" + (now.getMonth() + 1)).slice(-2);
    let year = now.getFullYear();
    let hours = ("0" + ClearHours).slice(-2)
    let minutes = ("0" + ClearMinuts).slice(-2)
    let seconds = ("0" + ClearSeconds).slice(-2)

     // Запись в логи
    await writeLog(`    Очистка лог-файла запланирована на ${date}.${month}.${year} ${hours}:${minutes}:${seconds}`);

    setTimeout(async () => {
        try {
            createBackupLog()
            await clearLogFile(); // Вызов функции очистки лог-файла при сбросе
        } catch (err) {
            writeLog(`Error in function LogFileUpdate() - ${err}`)
        }
        
    }, delay);
};

// Таймер для Бекапа config.json
async function ConfigFileBackup() {
    const ClearHours = config.Backup.TimerConfig.Hours
    const ClearMinuts = config.Backup.TimerConfig.Minuts
    const ClearSeconds = config.Backup.TimerConfig.Seconds
    const now = new Date();
    const nextClearTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, ClearHours, ClearMinuts, ClearSeconds);
    const delay = nextClearTime - now;

    let date = ("0" + (now.getDate() + 1)).slice(-2);
    let month = ("0" + (now.getMonth() + 1)).slice(-2);
    let year = now.getFullYear();
    let hours = ("0" + ClearHours).slice(-2)
    let minutes = ("0" + ClearMinuts).slice(-2)
    let seconds = ("0" + ClearSeconds).slice(-2)

     // Запись в логи
    await writeLog(`    Бекап config.json запланирован на ${date}.${month}.${year} ${hours}:${minutes}:${seconds}`);

    setTimeout(async () => {
        try {
            createBackupConfig()
        } catch (err) {
            writeLog(`Error in function ConfigFileBackup() - ${err}`)
        }
        
    }, delay);
};

// Таймер для Бекапа программы
async function AppFileBackup() {
    const ClearHours = config.Backup.TimerApp.Hours
    const ClearMinuts = config.Backup.TimerApp.Minuts
    const ClearSeconds = config.Backup.TimerApp.Seconds
    const now = new Date();
    const nextClearTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, ClearHours, ClearMinuts, ClearSeconds);
    const delay = nextClearTime - now;

    let date = ("0" + (now.getDate() + 1)).slice(-2);
    let month = ("0" + (now.getMonth() + 1)).slice(-2);
    let year = now.getFullYear();
    let hours = ("0" + ClearHours).slice(-2)
    let minutes = ("0" + ClearMinuts).slice(-2)
    let seconds = ("0" + ClearSeconds).slice(-2)

     // Запись в логи
    await writeLog(`    Бекап программы запланирован на ${date}.${month}.${year} ${hours}:${minutes}:${seconds}`);

    setTimeout(async () => {
        try {
            BackupApp()
        } catch (err) {
            writeLog(`Error in function AppFileBackup() - ${err}`)
        }
        
    }, delay);
};

// Чтение и обновление статических данных
async function updateStaticData() {
    await writeLog(`Выполняется процесс обновления статических файлов`)

    // Запрос данных о ЦП
    const cpuInfo = await systemInfo.cpu();

    // Запрос данных о ГП
    const gpuInfo = await systemInfo.graphics();
    const gpu = gpuInfo.controllers && gpuInfo.controllers[0] ? gpuInfo.controllers[0] : null;

    // Запрос данных о ОЗУ
    const memory = await systemInfo.mem();
    const memoryLayout = await systemInfo.memLayout();
    const numModules = memoryLayout.length;
    const averageModuleSizeGB = numModules > 0 
      ? (memoryLayout.reduce((acc, module) => acc + (module.size || 0), 0) / numModules / (1024 ** 3)).toFixed(2)
      : 'N/A';
    const averageVoltage = numModules > 0
      ? (memoryLayout.reduce((acc, module) => acc + (module.voltageConfigured || 0), 0) / numModules).toFixed(2)
      : 'N/A';

    // Запрос данных о дисках
    const diskLayout = await systemInfo.diskLayout();
    const fsInfo = await systemInfo.fsSize()
    const disks = diskLayout.map((disk, index) => {
        const fs = fsInfo[index] || {};
        const diskName = disk.name.replace('NVMe ', '')
        return {
            Name: diskName || 'N/A',
            Format: fs.type || 'N/A',
            Type: disk.type || 'N/A',
            Size: disk.size ? (disk.size / (1024 ** 3)).toFixed(2) + '' : 'N/A',
        }
    });

    // Запрос данных о Сетевых девайсах
    const networkInterfaces = await systemInfo.networkInterfaces();

    // Фильтруем только проводные и беспроводные интерфейсы
    const filteredInterfaces = networkInterfaces.filter(iface => {
    const ifaceType = iface.type.toLowerCase();
    return ifaceType.includes('wired') || ifaceType.includes('wireless');
    });

    const ethernetData = filteredInterfaces.map((iface) => ({
        Name: iface.ifaceName,
        Speed: iface.speed || 'N/A',
        IPv4: iface.ip4 || 'N/A',
        Mac: iface.mac.toUpperCase() || 'N/A',
    }));

    // Запрос данных о Системе
    const osInfo = await systemInfo.osInfo();
    const system = await systemInfo.system();

    
    // Проверяем, есть ли хотя бы один подходящий интерфейс
    const selectedInterface = filteredInterfaces.length > 0 ? filteredInterfaces[0] : null;

    // Запрос данных о системных компонентах
    const versionsInfo = await systemInfo.versions();

    // Запрос данных о материнской плате
    const BoardSystem = await systemInfo.baseboard();
    const Bios = await systemInfo.bios();

    staticData = {
        board: {
            Name: `${BoardSystem.manufacturer} ${BoardSystem.model}`,
            MemSlots: BoardSystem.memSlots,
            MemMax: (BoardSystem.memMax / (1024 ** 3)).toFixed(2),
            Serial: BoardSystem.serial,
            BiosVendor: Bios.vendor,
            BiosVersion: Bios.version,     
        },
        cpu: {
            CPUname: `${cpuInfo.manufacturer} ${cpuInfo.brand}`,
            CPUcores: cpuInfo.physicalCores,
            CPUthreads: cpuInfo.cores,
            CPUl2: checkData((cpuInfo.cache.l2 / (1024 * 1024)).toFixed(2)),
            CPUl3: checkData((cpuInfo.cache.l3 / (1024 * 1024)).toFixed(2))
        },
        gpu: {
            GPUname: gpu?.model || 'Unknown Model',
            GPUdriver: gpu?.driverVersion || 'Unknown version',
            GPUTotalMemory: gpu?.memoryTotal ? (gpu.memoryTotal / 1024).toFixed(2) + '' : 'N/A',
        },
        memory: {
            RAMtotal: (memory.total / (1024 ** 3)).toFixed(2),
            RAMtype: memoryLayout[0]?.type || 'N/A',
            RAMspeed: memoryLayout[0]?.clockSpeed || 'N/A',
            RAMNumbersModule: memoryLayout.length || 'N/A',
            RAMSizeModule: averageModuleSizeGB,
            RAMvoltage: averageVoltage
        },
        disks: disks,
        ethernet: ethernetData,
        info: {
            OSname: osInfo.distro,
            OSkernel: osInfo.kernel,
            OSdevice: osInfo.hostname,
            OSserialnumber: system.serial,
            OSIPv4: selectedInterface ? selectedInterface.ip4 : 'N/A',
            OSmac: selectedInterface ? selectedInterface.mac.toUpperCase() : 'N/A'
        },
        apps: {
            kernel: versionsInfo.kernel || 'N/A',
            node: versionsInfo.node || 'N/A',
            npm: versionsInfo.npm || 'N/A',
            python: versionsInfo.python || 'N/A',
            python3: versionsInfo.python3 || 'N/A',
            pip: versionsInfo.pip || 'N/A',
            pip3: versionsInfo.pip3 || 'N/A',
            gcc: versionsInfo.gcc || 'N/A',
            java: versionsInfo.java || 'N/A',
            git: versionsInfo.git || 'N/A',
            docker: versionsInfo.docker || 'N/A',
            apache: versionsInfo.apache || 'N/A',
            mysql: versionsInfo.mysql || 'N/A',
            virtualbox: versionsInfo.virtualbox || 'N/A',
            bash: versionsInfo.bash || 'N/A',
            zsh: versionsInfo.zsh || 'N/A',
            powershell: versionsInfo.powershell || 'N/A',
            dotnet: versionsInfo.dotnet || 'N/A',
        }
        // Остальные статические данные...
    };
    fs.writeFileSync(config.Path.StaticData, JSON.stringify(staticData, null, 2));
    await writeLog(`Статические данные обновлены в файл: ${config.Path.StaticData}\n`)
    return true
};

// Получение статических данных
function getStaticData() {
    return new Promise((resolve, reject) => {
        fs.readFile(config.Path.StaticData, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
};

// Функция для блокировки клиентов при превышении лимита запросов
const clientRequestCounts = new Map();
function checkRequestLimit(clientIp) {
    if (!clientRequestCounts.has(clientIp)) {
        clientRequestCounts.set(clientIp, { count: 1, block: false });
    } else {
        const clientData = clientRequestCounts.get(clientIp);
        if (clientData.block) {
            return false;
        }
        clientData.count++;
        if (clientData.count > config.Server.RequestLimit) {
            clientData.block = true;
            writeLog(`Блокировка пользователя ${clientIp} на ${config.Server.BlockDuration} min`);
            setTimeout(() => {
                clientRequestCounts.set(clientIp, { count: 0, block: false });
                writeLog(`Пользователь ${clientIp} был разблокирован`);
            }, config.Server.BlockDuration * 60 * 1000);
        }
        clientRequestCounts.set(clientIp, clientData);
    }
    return true;
};

// Блокировка пользователя при некорректном токене
function blockInvalidToken(clientIp, token) {
    // Проверка, заблокирован ли уже пользователь
    const clientData = clientRequestCounts.get(clientIp);
    
    if (clientData && clientData.block) {
        return false; // Пользователь уже заблокирован, ничего не делаем
    }

    // Проверка токена
    if (!config.Server.TrustedTokens.includes(token)) {
        writeLog(`Неавторизованный запрос от ${clientIp}. Блокировка на ${config.Server.BlockDurationToken} минут`);

        // Блокировка клиента
        clientRequestCounts.set(clientIp, { count: 0, block: true });
        
        // Таймер на снятие блокировки
        setTimeout(() => {
            clientRequestCounts.set(clientIp, { count: 0, block: false });
            writeLog(`Пользователь ${clientIp} был разблокирован`);
        }, config.Server.BlockDurationToken * 60 * 1000);

        return false; // Блокируем и возвращаем false
    } 
    
    return true; // Токен валидный, продолжаем выполнение
};

// Функция перезапуска программы
function restartApp(res) {
    writeLog('Перезапуск программы...');
    
    if (os.platform() === 'win32') {
        try {
            // Генерация .bat файла
            const RestartScriptCommands = [
                `@echo off`,
                `chcp 866 > nul`, // Установка кодировки OEM-866 (для работы с кириллицей)
                `:: Проверяем, запущен ли скрипт от имени администратора`,
                `net session >nul 2>&1`,
                `if %errorLevel% neq 0 (`,
                `   echo Запуск от имени администратора...`,
                `   powershell -Command "Start-Process '%~f0' -Verb RunAs"`,
                `   exit /b`,
                `)`,
                ``,
                `:: Скрипт запущен с правами администратора, продолжаем выполнение`,
                `tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe" >NUL`,
                `if "%ERRORLEVEL%"=="0" (`,
                `   taskkill /F /IM node.exe`,
                `   cd /d "%~dp0"`,
                `   timeout /t ${config.App.AppRestart}`,
                `   node "${config.Path.App}"`,
                `   exit`,
                `) else (`,
                `   cd /d "%~dp0"`,
                `   node "${config.Path.App}"`,
                `   exit`,
                `)`
            ];
        
            // Преобразуем команды в строку и переводим в кодировку OEM 866
            const RestartScript = RestartScriptCommands.join('\n');
            const RestartContent = iconv.encode(RestartScript, 'cp866');
            fs.writeFileSync(config.Path.RestartBat, RestartContent);

            exec(`start "" "${config.Path.RestartBat}"`)
            res.json({
                Respone: "Reboot status - successful",
                Wait: `${config.App.AppRestart + 2} seconds`
            })
        } catch {
            res.json({
                Respone: "Reboot status - crash",
            })
        }

        
    } else {
        exec('pkill -f ' + path.basename(__filename), (error) => {
            if (error) {
                console.error(`Ошибка при остановке программы: ${error.message}`);
            }
            exec('node ' + path.resolve(__filename), (error) => {
                if (error) {
                    console.error(`Ошибка при запуске программы: ${error.message}`);
                }
            });
        });
    }
};

// Функция для создания бекапа config.json
function createBackupConfig(configPath) {
    const backupDir = config.Path.ArchiveConfig
    const date = new Date();
    const backupName = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')} - config.json`;

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPathConfig = path.join(backupDir, backupName);
    fs.copyFileSync(configPath, backupPathConfig);
    
    // Проверка на количество бекапов
    const files = fs.readdirSync(backupDir).filter(file => file.endsWith(' - config.json'));
    const maxBackups = config.Backup.SaveConfigMax; // maxBackupFiles = 30

    if (files.length > maxBackups) {
        const sortedFiles = files.sort();
        fs.unlinkSync(path.join(backupDir, sortedFiles[0]));  // Удаляем старейший файл
    }

    writeLog(`Создан бекап файла config - ${backupName}`);
};

// Функция для создания бекапа logs.log
function createBackupLog() {
    const backupDir = config.Path.ArchiveLog
    const date = new Date();
    const backupName = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')} - logs.log`;

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPathConfig = path.join(backupDir, backupName);
    fs.copyFileSync(config.Path.ActiveLog, backupPathConfig);
    
    // Проверка на количество бекапов
    const files = fs.readdirSync(backupDir).filter(file => file.endsWith(' - logs.log'));
    const maxBackups = config.Backup.SaveLogMax;

    if (files.length > maxBackups) {
        const sortedFiles = files.sort();
        fs.unlinkSync(path.join(backupDir, sortedFiles[0]));  // Удаляем старейший файл
    }

    writeLog(`Создан бекап лог-файлов - ${backupName}`);
};

// Функция для создания Бекапа всей программы
function BackupApp() {
    const date = new Date();
    const FolderName = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')} - App`;
    const backupFolder = path.join(config.Path.ArchiveApp, FolderName);
    const rootPath = path.resolve(__dirname);

    // Команды для бекапа программы
    const BackupScriptCommands = [
        `@echo off`,
        `chcp 866 > nul`, // Установка кодировки OEM-866 (для работы с кириллицей)
        `taskkill /F /IM node.exe`, // Остановка программы
        `timeout /t ${config.App.AppRestart} /nobreak`, // Пауза перед копированием
        `mkdir "${backupFolder}"`, // Создание папки для бэкапа
        // Копирования папок
        ...config.Backup.Folders.map(folder => {
            const relativePath = path.relative(rootPath, folder); // Получаем относительный путь к папке от корневого каталога программы
            return `xcopy "${folder}" "${path.join(backupFolder, relativePath)}" /E /I /Y`; // Копируем в аналогичную вложенную папку
        }),
        ...config.Backup.Files.map(file => `copy "${path.resolve(file)}" "${path.resolve(backupFolder)}" /Y`), // Копирование файлов
        `echo Backup completed.`,
        `cd ${__dirname}`, // Переход в директорию программы
        `start "" "${path.resolve(config.Path.RestartBat)}"`, // Перезапуск программы
        `exit`
    ];

    // Преобразуем команды в строку и переводим в кодировку OEM 866
    const BackupScript = BackupScriptCommands.join('\n');
    const BackupContent = iconv.encode(BackupScript, 'cp866');
    fs.writeFileSync(config.Path.BackupBat, BackupContent);

    const RestartScriptCommands = [
        `@echo off`,
        `chcp 866 > nul`, // Установка кодировки OEM-866 (для работы с кириллицей)
        `:: Проверяем, запущен ли скрипт от имени администратора`,
        `net session >nul 2>&1`,
        `if %errorLevel% neq 0 (`,
        `   echo Запуск от имени администратора...`,
        `   powershell -Command "Start-Process '%~f0' -Verb RunAs"`,
        `   exit /b`,
        `)`,
        ``,
        `:: Скрипт запущен с правами администратора, продолжаем выполнение`,
        `tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe" >NUL`,
        `if "%ERRORLEVEL%"=="0" (`,
        `   taskkill /F /IM node.exe`,
        `   cd /d "%~dp0"`,
        `   timeout /t ${config.App.AppRestart}`,
        `   node main.js`,
        `   exit`,
        `) else (`,
        `   cd /d "%~dp0"`,
        `   node main.js`,
        `   exit`,
        `)`
    ];

    // Преобразуем команды в строку и переводим в кодировку OEM 866
    const RestartScript = RestartScriptCommands.join('\n');
    const RestartContent = iconv.encode(RestartScript, 'cp866');
    fs.writeFileSync(config.Path.RestartBat, RestartContent);

    writeLog(`Начат процесс бекапа программы по пути "${config.Path.ArchiveApp}"`);

    // Чтение содержимого папки и фильтрация только папок
    const directories = fs.readdirSync(config.Path.ArchiveApp).filter(folder => {
        const folderPath = path.join(config.Path.ArchiveApp, folder);
        return fs.statSync(folderPath).isDirectory();  // Проверка, является ли элемент папкой
    });

    if (directories.length > (config.Backup.SaveAppMax - 1)) {
        const sortedDirectories = directories.sort((a, b) => {
            const aTime = fs.statSync(path.join(config.Path.ArchiveApp, a)).mtime;
            const bTime = fs.statSync(path.join(config.Path.ArchiveApp, b)).mtime;
            return aTime - bTime;  // Сортировка по времени последнего изменения
        });

        // Удаление старейшей папки
        fs.rmSync(path.join(config.Path.ArchiveApp, sortedDirectories[0]), { recursive: true, force: true });
    }
    
    // Запуск бэкапа
    exec(`start "" "${config.Path.BackupBat}"`, (err, stdout, stderr) => {
        if (err) {
            writeLog(`Error in function BackupApp(res) - ${err}`)
            return;
        }
    });

    
} 

// Вспомогательная функция для рекурсивного обхода дерева JSON
function parseSensorData(data, result = {}) {
    // Motherboard (Материнская плата)
    if (config.OHM.Names.Board.some(boardName => data.Text.toLowerCase().includes(boardName.toLowerCase()))) {
        data.Children.forEach(child => {
            if (child.Text.includes('ITE IT8686E')) {
                result.Mainboard = result.Mainboard || { Temp: [], Voltage: [], FanSpeed: [] };

                child.Children.forEach(metric => {
                    if (metric.Text.toLowerCase().includes('temperature') && config.OHM.Show.Temp) {
                        result.Mainboard.Temp.push(...parseMetrics(metric.Children));
                    }
                    if (metric.Text.toLowerCase().includes('voltage') && config.OHM.Show.Voltage) {
                        result.Mainboard.Voltage.push(...parseMetrics(metric.Children));
                    }
                    if (metric.Text.toLowerCase().includes('fan') && config.OHM.Show.Fan) {
                        result.Mainboard.FanSpeed.push(...parseMetrics(metric.Children));
                    }
                });
            }
        });
    }

    // Memory (Оперативная память)
    if (config.OHM.Names.Memory.some(memName => data.Text.toLowerCase().includes(memName.toLowerCase()))) {
        result.Memory = result.Memory || { Load: [] };
        data.Children.forEach(child => {
            if (child.Text.toLowerCase().includes('load') && config.OHM.Show.Load) {
                result.Memory.Load.push(...(parseMetrics(child.Children)));
            }
        });
    }

    // CPU
    if (config.OHM.Names.Cpu.some(cpuName => data.Text.toLowerCase().includes(cpuName.toLowerCase()))) {
        result.Cpu = result.Cpu || { Temp: [], Clock: [], Load: [], Power: [] };
        data.Children.forEach(child => {
            if (child.Text.toLowerCase().includes('clock') && config.OHM.Show.Clock) {
                result.Cpu.Clock.push(...parseMetrics(child.Children));
            }
            if (child.Text.toLowerCase().includes('temperature') && config.OHM.Show.Temp) {
                result.Cpu.Temp.push(...parseMetrics(child.Children));
            }
            if (child.Text.toLowerCase().includes('load') && config.OHM.Show.Load) {
                result.Cpu.Load.push(...parseMetrics(child.Children));
            }
            if (child.Text.toLowerCase().includes('power') && config.OHM.Show.Power) {
                result.Cpu.Power.push(...parseMetrics(child.Children));
            }
        });
    }

    // GPU
    if (config.OHM.Names.Gpu.some(gpuName => data.Text.toLowerCase().includes(gpuName.toLowerCase()))) {
        result.Gpu = result.Gpu || { Temp: [], Clock: [], Load: [], Power: [], FanSpeed: [] };
        data.Children.forEach(child => {
            if (child.Text.toLowerCase().includes('temperature') && config.OHM.Show.Temp) {
                result.Gpu.Temp.push(...(parseMetrics(child.Children)));
            }
            if (child.Text.toLowerCase().includes('clock') && config.OHM.Show.Clock) {
                result.Gpu.Clock.push(...(parseMetrics(child.Children)));
            }
            if (child.Text.toLowerCase().includes('load') && config.OHM.Show.Load) {
                result.Gpu.Load.push(...(parseMetrics(child.Children)));
            }
            if (child.Text.toLowerCase().includes('powers') && config.OHM.Show.Power) {
                result.Gpu.Power.push(...(parseMetrics(child.Children)));
            }
            if (child.Text.toLowerCase().includes('fan') && config.OHM.Show.Fan) {
                result.Gpu.FanSpeed.push(...(parseMetrics(child.Children)));
            }
        });
    }

    // Disks (Диски)
    if (config.OHM.Names.Disk.some(diskName => data.Text.toLowerCase().includes(diskName.toLowerCase()))) {
        result.Disks = result.Disks || [];

        const diskData = {
            Name: data.Text || 'N/A',
            Temp: [],
            Load: []
        };

        data.Children.forEach(child => {
            // Обрабатываем метрики температуры
            if (child.Text.toLowerCase().includes('temperature') && config.OHM.Show.Temp) {
                diskData.Temp.push(...(parseMetrics(child.Children)));
            }
            // Обрабатываем метрики загрузки
            if (child.Text.toLowerCase().includes('load') && config.OHM.Show.Load) {
                diskData.Load.push(...(parseMetrics(child.Children)));
            }
        });

        result.Disks.push(diskData);
    }


    // Рекурсия для дочерних элементов
    if (data.Children) {
        data.Children.forEach(child => parseSensorData(child, result));
    }

    return result;
};

// Вспомогательная функция для сбора метрик
function parseMetrics(children) {
    return children.map(metric => ({
        Name: metric.Text || "N/A",
        Value: metric.Value || "N/A",
        Min: metric.Min || "N/A",
        Max: metric.Max || "N/A"
    }));
};

// Обновление данных и получение актуальных данных с датчиков
async function saveJsonData() {
    try {
        const response = await axios.get(`http://localhost:${config.OHM.Port}/data.json`); // Адрес API Open Hardware Monitor
        const jsonData = response.data;
        const parsedData = parseSensorData(jsonData);
        return parsedData
    } catch (err) {
        writeLog(`Error - ${err}`)
    }
};

// Остановка сервера
async function stopServer() {
    if (server) {
        global.server.close()
        await writeLog(`Сервер остановлен\n`)
    }
};

// Вывод настроек программы
async function WriteSettings () {
    // Проверка на показ настроек
    if (!config.App.WriteSettings) {
        return false;
    }

    // Отделение записей
    await writeLog(`-------------------------------------------------------------------------------`);

    if (config.Backup.SaveConfig || config.Backup.SaveApp || config.Backup.SaveLog) {
        await writeLog(`НАСТРОЙКИ ТАЙМЕРОВ:`);
    }
    // Проверка на таймеры бекапа
    if (config.Backup.SaveConfig) {
        await ConfigFileBackup();
    }
    if (config.Backup.SaveApp) {
        await AppFileBackup();
    }
    if (config.Backup.SaveLog) {
        await LogFileUpdate();
    }
    if (config.Backup.UpdateData) {
        await writeLog(`    Обновление при старте - ${config.Backup.UpdateDataOnStart}`);
        await writeLog(`    Интервал обновлений - ${config.Backup.UpdateDataInterval} min`);
    }

    // Вывод настроек программы
    await writeLog(`НАСТРОЙКИ ПРОГРАММЫ:`);
    await writeLog(`    Версия программы - ${config.App.Version}`);
    await writeLog(`    Запись логов - ${config.App.LogWrite}, Запись в консоль - ${config.App.LogWriteConsole}`);
    await writeLog(`    Запись даты - ${config.App.LogDate}, Контраст даты - ${config.App.ContrastDate}`);
    await writeLog(`    Системная задержка - ${config.App.SystemRestart} sec, Программная задержка - ${config.App.AppRestart} sec`);
    await writeLog(`    Очистка логов при старте - ${config.App.LogClearOnStart}`);
    
    // Вывод настроек безопасности
    await writeLog(`НАСТРОЙКИ ЗАЩИТЫ:`);
    await writeLog(`    Защита от некорректного токена - ${config.Security.BlockToken}`);
    await writeLog(`    Защита от изменений - ${config.Security.BlockMoreRequest}`);
    await writeLog(`    Защита от инъекций - ${config.Security.BlockInjection}`);
    await writeLog(`    Защита от спама - ${config.Security.BlockMoreRequest}`);
    
    // Вывод настроек сервера
    await writeLog(`НАСТРОЙКИ СЕРВЕРА:`);
    await writeLog(`    Порт сервера - ${config.Server.Port}, Кол-во спам запросов - ${config.Server.RequestLimit}/min`);
    await writeLog(`    Блокировка токена - ${config.Server.BlockDurationToken} min, Блокировка спама - ${config.Server.BlockDuration} min`);
    
    // Вывод настроек OHM
    await writeLog(`НАСТРОЙКИ OHM:`);
    await writeLog(`    Порт программы - ${config.OHM.Port}`);
    await writeLog(`    Путь программы - "${config.OHM.Path}"`);
    await writeLog(`    ОТОБРАЖЕНИЕ OHM:`);
    await writeLog(`        Температура - ${config.OHM.Show.Temp}, Вентиляторы - ${config.OHM.Show.Fan}`);
    await writeLog(`        Частота - ${config.OHM.Show.Clock}, Загрузка - ${config.OHM.Show.Load}`);
    await writeLog(`        Мощность - ${config.OHM.Show.Power}, Напряжение - ${config.OHM.Show.Voltage}`);

    // Отделение записей
    await writeLog(`-------------------------------------------------------------------------------\n`);
};

// Функция для проверки, содержит ли команда опасные операции
function isCommandSafe(command) {
    const forbiddenCommands = [
        'del',        // Удаление файлов
        'erase',      // Альтернативная команда удаления
        'rmdir',      // Удаление директорий
        'shutdown',   // Остановка системы
        'taskkill',   // Остановка процессов
        'net stop',   // Остановка служб
        'format',     // Форматирование дисков
        'diskpart',   // Управление разделами
        'bcdedit',    // Изменение загрузочной конфигурации
        'sc delete',  // Удаление служб
        'rm',         // Удаление файлов (для совместимости с Unix)
        'poweroff',   // Выключение системы
        'mv',         // Перемещение файлов
        'cp',         // Копирование файлов
        'wget',       // Скачивание файлов
        'curl',       // Скачивание файлов
        'powershell', // Выполнение PowerShell скриптов
        'cmd',        // Запуск командной строки
        'sudo',       // Привилегии администратора (для Unix систем)
        '&&',         // Выполнение нескольких команд
        '|',          // Пайплайн для передачи данных между командами
        '>',          // Перенаправление вывода
        'shutdown',   // Остановка системы
        'restart',    // Перезагрузка системы
        '/&/',        // Символ выполнения нескольких команд
        '/\|/',       // Пайплайн
        '/>/',        // Перенаправление вывода
        '/`/',        // Обратные кавычки для выполнения команд
        '/;/',        // Разделитель команд
        '/\n/',       // Перенос строки
        '/\r/'        // Возврат каретки
    ];
    return !forbiddenCommands.some(forbidden => command.toLowerCase().includes(forbidden));
}

// Функция запуска сервера
async function startServer() {
    const app = express();
    app.use(express.json());

    // Запросы для умного дома
    app.get('/power/status/Alice', async (req, res) => {
        try {
            res.json({
                value: true
            });
        }
        catch (err) {
            writeLog(`Error "/${subRoute1}/${subRoute2}" - ${err}`);
        }
    });
    app.get('/power/off/Alice', async (req, res) => {
        try {
            writeLog(`Запрос "/power/off/Alice от Умного Дома Яндекс`)
            writeLog(`Выключение ПК через ${config.App.SystemRestart} sec`);
            if (os.platform() === 'win32') {
                exec(`shutdown /s /t ${config.App.SystemRestart} /f`);
            }
            else {
                exec('sudo shutdown -h now');
            }
            
        }
        catch (err) {
            writeLog(`Error "/power/off/Alice" - ${err}`);
        }
    });

    // Запросы GET
    app.get('/:subRoute1?/:subRoute2?/:subRoute3?/:subRoute4?', async (req, res) => {
        const { subRoute1, subRoute2, subRoute3, subRoute4 } = req.params;
        const clientIp = req.ip;
        const token = req.headers['token'] || req.query.token;
        
        // Проверка на правильный токен
        if (config.Security.BlockToken && !blockInvalidToken(clientIp, token)) {
            res.json({Error: `Некорректный токен. Вы были заблокированы на ${config.Server.BlockDurationToken} min`});
        }
        
        // Проверка на спам
        if (config.Security.BlockMoreRequest && !checkRequestLimit(clientIp)) {
            res.json({Error: `Слишком много запросов от вас. Вы были заблокированы на ${config.Server.BlockDuration} min`});
        }

        // Обработка путей
        switch (subRoute1) {
            case 'info': {
                switch (subRoute2) {
                    // Запрос информации о Материнской плате
                    case 'board': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const ohmData = await saveJsonData();
                            const BoardData = ohmData.Mainboard;
                            const staticData = await getStaticData();

                            res.json({
                                Name: staticData.board.Name,
                                MemSlots: staticData.board.MemSlots,
                                MemMax: staticData.board.MemMax,
                                Serial: staticData.board.Serial,
                                BiosVendor: staticData.board.BiosVendor,
                                BiosVersion: staticData.board.BiosVersion,
                                Temp: BoardData.Temp || 'N/A',
                                Voltage: BoardData.Voltage || 'N/A',
                                FanSpeed: BoardData.FanSpeed || 'N/A',
                            })
                        }
                        catch (err) {
                            writeLog(`Error /${subRoute1}/${subRoute2} - ${err}`);
                            res.json({Error: `${err}`});
                            return false;
                        }
                        break;
                    };   
                    // Запрос информации о ЦП
                    case 'cpu': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const staticData = await getStaticData();
                            const ohmData = await saveJsonData();
                            const CpuData = ohmData.Cpu;
                            const cores = CpuData.Clock.filter(core => core.Name.toLowerCase().includes('core'));

                            res.json({
                                Name: staticData.cpu.CPUname,
                                Cores: staticData.cpu.CPUcores,
                                Threads: staticData.cpu.CPUthreads,
                                Temp: (CpuData.Temp[(CpuData.Temp).length - 1].Value).replace(',', '.'),
                                TempMax: (CpuData.Temp[(CpuData.Temp).length - 1].Max).replace(',', '.'),
                                Load: (CpuData.Load[(CpuData.Load).length - 1].Value).replace(',', '.'),
                                LoadMax: (CpuData.Load[(CpuData.Load).length - 1].Max).replace(',', '.'),
                                SpeedCores: (cores.reduce((sum, core) => sum + parseFloat(core.Value.replace(',', '.')), 0) / cores.length).toFixed(1),
                                SpeedCoresMax: (cores.reduce((max, core) => Math.max(max, parseFloat(core.Max.replace(',', '.'))), 0)).toFixed(1),
                                SpeedBus: (CpuData.Clock[0].Value).replace(',', '.'),
                                Power: (CpuData.Power[0].Value).replace(',', '.'),
                                PowerMax: (CpuData.Power[0].Max).replace(',', '.'),
                                FanSpeed: ohmData.Mainboard.FanSpeed[0].Value,
                                FanSpeedMax: ohmData.Mainboard.FanSpeed[0].Max,
                                L2: staticData.cpu.CPUl2,
                                L3: staticData.cpu.CPUl3
                            });
                            return true;
                        }
                        catch(err) {
                            writeLog(`Error /${subRoute1}/${subRoute2} - ${err}`);
                            res.json({Error: `${err}`});
                            return false;
                        };
                        break;
                    };
                    // Запрос информации о ГП
                    case 'gpu': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const staticData = await getStaticData();
                            const ohmData = await saveJsonData();
                            const GpuData = ohmData.Gpu;

                            res.json({
                                Name: staticData.gpu.GPUname,
                                Driver: staticData.gpu.GPUdriver,
                                MemoryAll: staticData.gpu.GPUTotalMemory,
                                CoreClock: (GpuData.Clock[0].Value).replace(',', '.'),
                                MemoryClock: (GpuData.Clock[1].Value).replace(',', '.'),
                                CoreTemp: (GpuData.Temp[0].Value).replace(',', '.'),
                                CoreTempMax: (GpuData.Temp[0].Max).replace(',', '.'),
                                FanSpeed: (GpuData.FanSpeed[0].Value).replace(',', '.'),
                                CoreLoad: (GpuData.Load[0].Value).replace(',', '.'),
                                CoreLoadMax: (GpuData.Load[0].Max).replace(',', '.'),
                                MemoryLoad: (GpuData.Load[GpuData.Load.length - 1].Value).replace(',', '.'),
                                MemoryLoadMax: (GpuData.Load[GpuData.Load.length - 1].Max).replace(',', '.'),
                                Power: (GpuData.Power[0].Value).replace(',', '.'),
                                PowerMax: (GpuData.Power[0].Max).replace(',', '.'),

                            });
                        } catch(err) {
                            writeLog(`Error /${subRoute1} - ${err}`)
                            res.json({Error: `${err}`})
                            return false;
                        }
                        break;
                    };
                    // Запрос информации о ОЗУ
                    case 'ram': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const memory = await systemInfo.mem();
                            const staticData = await getStaticData();

                            // Основные данные
                            const freeMemoryGB = (memory.free / (1024 ** 3)).toFixed(2) + 'Gb';
                            const freeMemoryPercentage = ((memory.free / memory.total) * 100).toFixed(2) + '%';

                            res.json({
                                totalMemory: staticData.memory.RAMtotal,
                                freeMemory: freeMemoryGB,
                                freeMemoryPercentage: freeMemoryPercentage,
                                Speed: staticData.memory.RAMspeed,
                                Type: staticData.memory.RAMtype,
                                ModuleSize: staticData.memory.RAMSizeModule,
                                NumberModules: staticData.memory.RAMNumbersModule,
                                Voltage: staticData.memory.RAMvoltage
                            });
                            return true;
                        } catch(err) {
                            writeLog(`Error /system/${subRoute1} - ${err}`)
                            res.json({Error: `${err}`})
                            return false;
                        }
                        break;
                    };
                    // Запрос информации о ПЗУ
                    case 'disks': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const diskInfo = await systemInfo.diskLayout();
                            const fsInfo = await systemInfo.fsSize();
                            const staticData = await getStaticData();
                            const ohmData = await saveJsonData();
                            const DisksData = ohmData.Disks;

                             // Функция для поиска данных о диске в ohm.json
                            function findDiskInOHM(diskName) {
                                return ohmData.Disks.find(ohmDisk => 
                                    ohmDisk.Name.toLowerCase().includes(diskName.toLowerCase())
                                );
                            }

                            const diskData = diskInfo.map((disk, index) => {
                                const staticDisk = staticData.disks[index] || {};  // Статическая информация о диске
                                const ohmDisk = findDiskInOHM(disk.name.replace('NVMe ', ''));  // Поиск диска в ohm.json
                                if (!ohmDisk) {
                                    return {
                                        Name: staticDisk.Name || 'N/A',  // Имя диска из systemInfo
                                        Type: staticDisk.Type || 'N/A',  // Тип диска из статических данных
                                        Format: staticDisk.Format || 'N/A',  // Формат диска
                                        Size: staticDisk.Size || 'N/A',  // Размер диска из статических данных
                                    };
                                }
                                else {                    
                                    return {
                                        Name: ohmDisk.Name || 'N/A',  // Имя диска из systemInfo
                                        Type: staticDisk.Type || 'N/A',  // Тип диска из статических данных
                                        Format: staticDisk.Format || 'N/A',  // Формат диска
                                        Size: staticDisk.Size || 'N/A',  // Размер диска из статических данных
                                        SizeFilled: ohmDisk.Load[0].Value,
                                        Temp: ohmDisk.Temp[0].Value,  // Текущая температура
                                        TempMax: ohmDisk.Temp[0].Max,  // Максимальная температура
                                    };
                                }
                                
                            });
                            res.json(diskData);
                            //res.json({Response: true});
                            return true;
                        } catch(err) {
                            writeLog(`Error /${subRoute1}/${subRoute2} - ${err}`)
                            res.json({Error: `${err}`})
                            return false;
                        }
                        break;
                    };
                    // Запрос информации о сетевых адаптерах
                    case 'network': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const staticData = await getStaticData();
                            const EthernatData = staticData.ethernet

                            const adapters = EthernatData.map((iface) => ({
                                Name: iface.Name,
                                Speed: iface.Speed,
                                Ip: iface.IPv4,
                                Mac: iface.Mac,
                            }));
                            res.json(adapters)
                            return true;
                        } catch(err) {
                            writeLog(`Error /system/${subRoute1} - ${err}`)
                            res.json({Error: `${err}`})
                            return false;
                        }
                        break;
                    };
                    // Запрос информации о системе
                    case 'oc': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const staticData = await getStaticData();
                            const uptime = systemInfo.time();

                            const days = Math.floor(uptime.uptime / 86400);
                            const hours = ("0" + (Math.floor((uptime.uptime % 86400) / 3600))).slice(-2);
                            const minutes = ("0" + (Math.floor((uptime.uptime % 3600) / 60))).slice(-2);
                            const seconds = ("0" + (Math.floor(uptime.uptime % 60))).slice(-2);

                            const hostYandex = 'yandex.ru';
                            const hostGoogle = 'google.com'
                            const pingYandex = await ping.promise.probe(hostYandex);
                            const pingGoogle = await ping.promise.probe(hostGoogle);

                            res.json({
                                OS: staticData.info.OSname,
                                Kernel: staticData.info.OSkernel,
                                Name: staticData.info.OSdevice,
                                Serial: staticData.info.OSserialnumber,
                                Time: uptime.current,
                                UpTime: `${days}:${hours}:${minutes}:${seconds}`,
                                Ip: staticData.info.OSIPv4,
                                Mac: staticData.info.OSmac,
                                PingYandex: pingYandex.alive ? `${pingYandex.host} - ${pingYandex.time}ms` : 'Ping failed',
                                PingGoolge: pingGoogle.alive ? `${pingGoogle.host} - ${pingGoogle.time}ms` : 'Ping failed'
                            });
                            return true;
                        } catch(err) {
                            writeLog(`Error /system/${subRoute1} - ${err}`)
                            res.json({Error: `${err}`})
                            return false;
                        }
                        break;
                    };
                    // Запрос информации о пользователях
                    case 'users': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const usersInfo = await systemInfo.users(); // Получаем информацию о пользователях

                            // Форматируем данные для каждого пользователя
                            const formattedUsersInfo = usersInfo.map(user => ({
                                Name: user.user || 'N/A',
                                Tty: user.tty || 'N/A',
                                Time: `${user.date}. ${user.time}` || 'N/A',
                                Ip: user.ip || 'N/A',
                                LastCommand: user.command || 'N/A'
                            }));

                            res.json(formattedUsersInfo);
                            return true;
                        } catch(err) {
                            writeLog(`Error /system/${subRoute1} - ${err}`)
                            res.json({Error: `${err}`})
                            return false;
                        }
                        break;
                    };
                    // Запрос информации о системных службах 
                    case 'services': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            const staticData = await getStaticData();
                            res.json({
                                kernel: staticData.apps.kernel,
                                node: staticData.apps.node,
                                npm: staticData.apps.npm,
                                python: staticData.apps.python,
                                python3: staticData.apps.python3,
                                pip: staticData.apps.pip,
                                pip3: staticData.apps.pip3,
                                gcc: staticData.apps.gcc,
                                java: staticData.apps.java,
                                git: staticData.apps.git,
                                docker: staticData.apps.docker,
                                apache: staticData.apps.apache,
                                mysql: staticData.apps.mysql,
                                virtualbox: staticData.apps.virtualbox,
                                bash: staticData.apps.bash,
                                zsh: staticData.apps.zsh,
                                powershell: staticData.apps.powershell,
                                dotnet: staticData.apps.dotnet,
                            });
                            return true;
                        } catch(err) {
                            writeLog(`Error /system/${subRoute1} - ${err}`)
                            res.json({Error: `${err}`})
                            return false;
                        }
                        break;
                    };
                    // Обновление статических данных
                    case 'data': {
                        switch (subRoute3) {
                            case 'update': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                try {
                                    // Ответ клиенту отправляем сразу
                                    res.json({ 
                                        Reboot: 'Начат процесс обновления статических данных',
                                        Time: '13 секунд'
                                    });
                            
                                    // Останавливаем сервер
                                    await stopServer();
                            
                                    // Обновляем статические данные
                                    await updateStaticData();
                            
                                    // Запускаем сервер снова
                                    startServer();
                                } catch (err) {
                                    writeLog(`Error /${subRoute1}/${subRoute2}/${subRoute3} - ${err}`)
                                    res.json({Error: 'Error updating static data' });
                                    return false;
                                }
                                break;
                            };
                        };
                        break;
                    };
                    
                    default: {
                        writeLog(`Некорректный запрос "/${subRoute1}/${subRoute2}" от ${clientIp}`)
                        res.json({Error: 'Некорректный запрос'})
                    };
                };
                break;
            };
            case 'app': {
                switch (subRoute2) {
                    // Перезапуск всей программы
                    case 'reboot': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        writeLog(`Начат перезапуск программы`)
                        restartApp(res);
                        break;
                    };
                    // Работа с конфигурационными файлами
                    case 'config': {
                        switch (subRoute3) {
                            // Получение информации о настройках программы
                            case 'get': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                res.json(config)
                                break;
                            };
                            case 'backup': {
                                switch (subRoute4) {
                                    case 'show': {
                                        writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}/${subRoute4}" от пользователя ${clientIp}`)
                                        try {                                
                                            // Проверяем существует ли папка
                                            if (!fs.existsSync(config.Path.ArchiveConfig)) {
                                                writeLog(`Папка с бэкапами config не найдена`)
                                                return res.json({ Response: 'Папка с бэкапами config не найдена' });
                                            }
                                    
                                            // Читаем содержимое директории
                                            fs.readdir(config.Path.ArchiveConfig, (err, files) => {
                                                if (err) {
                                                    writeLog(`Ошибка чтения директории - ${err}`)
                                                    return res.json({ Response: 'Ошибка чтения папки с бэкапами' });
                                                }
                                    
                                                // Если папка пустая
                                                if (files.length === 0) {
                                                    return res.json({ Response: 'Бэкапов config.json не найдено'});
                                                }
                                    
                                                // Возвращаем список файлов
                                                res.json({ Response: files });
                                            });
                                        } catch (error) {
                                            writeLog(`Ошибка при выполнении запроса - ${err}`)
                                            res.json({ Response: 'Ошибка сервера' });
                                        }
                                        break;
                                    };

                                    default: {
                                        writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                        createBackupConfig('./config.json')
                                        res.json({Response: 'Бекап успешной создан'})
                                    }
                                }
                                break;
                            };
                        };
                        break;
                    };
                    // Возвращается информацию о программе
                    case 'info': {
                        switch (subRoute3) {
                            case 'command': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                // Фильтруем только те команды, у которых значение true
                                const filteredCommands = Object.fromEntries(
                                    Object.entries(config.Commands).filter(([key, value]) => value === true)
                                );
                                
                                // Возвращаем отфильтрованные команды
                                res.json(filteredCommands);
                                break;
                            };

                            default: {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                                res.json({
                                    Version: config.App.Version,
                                    Date: config.App.DateUpdate,
                                    Windows: true,
                                    Linux: false,
                                    Status: true
                                })
                                break;
                            }
                        }
                        break;
                    };
                    //
                    case 'backup': {
                        switch (subRoute3) {
                            case 'show': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)

                                // Проверяем существует ли папка
                                if (!fs.existsSync(config.Path.ArchiveApp)) {
                                    writeLog(`Папка с бэкапами программы не найдена`);
                                    return res.json({ Response: 'Папка с бэкапами программы не найдена' });
                                }

                                // Читаем содержимое директории
                                fs.readdir(config.Path.ArchiveApp, (err, files) => {
                                    if (err) {
                                        writeLog(`Ошибка чтения директории - ${err}`);
                                        return res.json({ Response: 'Ошибка чтения папки с бэкапами' });
                                    }

                                    // Фильтруем только папки
                                    const folders = files.filter(file => {
                                        const fullPath = path.join(config.Path.ArchiveApp, file);
                                        return fs.statSync(fullPath).isDirectory();  // Проверяем, является ли элемент папкой
                                    });

                                    // Если папок нет
                                    if (folders.length === 0) {
                                        return res.json({ Response: 'Бэкапов программы не найдено' });
                                    }

                                    // Возвращаем список папок
                                    res.json({ Response: folders });
                                });
                                break;
                            };

                            default: {
                                res.json({Status: 'Backup program is processed', Wait: '10 seconds'})
                                BackupApp()
                            }
                        }
                        break;
                    };
                    default: {
                        writeLog(`Некорректный запрос "/${subRoute1}/${subRoute2}" от ${clientIp}`)
                        res.json({Error: 'Некорректный запрос'}) 
                        break;
                    };
                };
                break;
            };
            case 'server': {
                switch (subRoute2) {
                    // Перезапуск локального сервера
                    case 'reboot': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        res.json({Result: `Сервер перезапускается, ожидание - ${config.App.AppRestart + 2} sec`})

                        // Останавливаем сервер
                        await stopServer();

                        // Запускаем сервер снова
                        startServer();
                        break;
                    };
                    // Работа с портом сервера
                    case 'port': {
                        switch (subRoute3) {
                            case 'get': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                res.json({Port: config.Server.Port})
                                break;
                            };
                        }
                        break;
                    };
                    case 'logs': {
                        switch (subRoute3) {
                            case 'get': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                res.sendFile(path.join(config.Path.ActiveLog))
                                break;
                            };
                            case 'clean': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                createBackupLog()
                                await clearLogFile()
                                res.json('Лог файл успешно очищен')
                                break;
                            };
                            case 'backup': {
                                switch (subRoute4) {
                                    case 'show': {
                                        writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}/${subRoute4}" от пользователя ${clientIp}`)
                                        try {                                
                                            // Проверяем существует ли папка
                                            if (!fs.existsSync(config.Path.ArchiveLog)) {
                                                writeLog(`Папка с бэкапами logs.log не найдена`)
                                                return res.json({ Response: 'Папка с бэкапами logs.log не найдена' });
                                            }
                                    
                                            // Читаем содержимое директории
                                            fs.readdir(config.Path.ArchiveLog, (err, files) => {
                                                if (err) {
                                                    writeLog(`Ошибка чтения папки с логами - ${err}`)
                                                    return res.json({ Response: 'Ошибка чтения папки с логами' });
                                                }
                                    
                                                // Если папка пустая
                                                if (files.length === 0) {
                                                    return res.json({ Response: 'Бэкапов logs.log не найдено'});
                                                }
                                    
                                                // Возвращаем список файлов
                                                res.json({ Response: files });
                                            });
                                        } catch (error) {
                                            writeLog(`Ошибка при выполнении запроса - ${err}`)
                                            res.json({ Response: 'Ошибка сервера' });
                                        }
                                        break;
                                    };

                                    default: {
                                        writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                        createBackupLog()
                                        res.json({Response: 'Бекап успешной создан'})
                                    };
                                };
                                break;
                            };
                        }
                        break;
                    };
                }
                break;
            };
            case 'ohm': {
                switch (subRoute2) {
                    case 'get': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        try {
                            data = await saveJsonData()
                            res.json(data);
                        } 
                        catch (err) {
                            writeLog(`Ошибки при работе с OHM - ${err}`)
                            res.json({Error: `Ошибки при работе с OHM - ${err}`});
                        }
                        break;
                    };
                    case 'reboot': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        if (!config.OHM.Path || !fs.existsSync(config.OHM.Path)) {
                            writeLog(`Путь до OHM неверный или не существует`)
                            return;
                        }

                        res.json({Response: 'Начат перезапуск OHM', Wait: '3 sec'})

                        // Пытаемся завершить программу
                        try {
                            exec('taskkill /F /IM OpenHardwareMonitor.exe')
                            writeLog(`Остановлена программа OHM`)
                        }
                        catch {
                            writeLog(`Ошибка завершения программы - ${err}`)
                        }
                        
                        // Ожидаем 5 секунд перед повторным запуском
                        setTimeout(() => {
                            try {
                                exec(`start "" "${config.OHM.Path}"`)
                                writeLog(`Программа OHM запущена повторно`)
                            }
                            catch {
                                writeLog(`Ошибка при запуске OHM - ${err}`)
                            }
                        }, 5000);
                        break;
                    };
                }
                break;
            };
            case 'power': {
                switch (subRoute2) {
                    // Выключение ПК
                    case 'off': {
                        try {
                            writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                            writeLog(`Выключение ПК через ${config.App.SystemRestart} sec`);
                            res.json({
                                Response: `ПК будет выключен через ${config.App.SystemRestart} sec`
                            });
                            if (os.platform() === 'win32') {
                                exec(`shutdown /s /t ${config.App.SystemRestart} /f`);
                            }
                            else {
                                exec('sudo shutdown -h now');
                            }
                            
                        }
                        catch (err) {
                            writeLog(`Error "/${subRoute1}/${subRoute2}" - ${err}`);
                        }
                        break;
                    };
                    // Перезапуск ПК
                    case 'reboot': {
                        try {
                            writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                            writeLog(`Перезапуск ПК через ${config.App.SystemRestart} sec`);
                            res.json({
                                Response: `ПК будет перезапущен через ${config.App.SystemRestart} sec`
                            });
                            if (os.platform() === 'win32') {
                                exec(`shutdown /r /t ${config.App.SystemRestart} /f`);
                            }
                            else {
                                exec('sudo reboot');
                            }
                        }
                        catch (err) {
                            writeLog(`Error "/${subRoute1}/${subRoute2}" - ${err}`);
                        }
                        break;
                    };
                    // Перевод в спящий режим
                    case 'sleep': {
                        try {
                            writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                            writeLog(`Перевод пк в спящий режим`);
                            res.json({
                                Response: `ПК переходит в спящий режим`
                            });
                            if (os.platform() === 'win32') {
                                exec(`rundll32.exe powrprof.dll,SetSuspendState 0,1,0`);
                            }
                            else {
                                exec('systemctl suspend');
                            }
                        }
                        catch (err) {
                            writeLog(`Error "/${subRoute1}/${subRoute2}" - ${err}`);
                        }
                        break;
                    };
                    // Перевод в режим гибернации
                    case 'hyber': {
                        try {
                            writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                            writeLog(`Перевод пк в режим гибернации через ${config.App.SystemRestart} sec`);
                            res.json({
                                Response: `ПК уйдет в режим гибернации через ${config.App.SystemRestart} sec`
                            });
                            if (os.platform() === 'win32') {
                                exec(`shutdown /h /t ${config.App.SystemRestart}`);
                            }
                            else {
                                exec('systemctl hibernat');
                            }
                        }
                        catch (err) {
                            writeLog(`Error "/${subRoute1}/${subRoute2}" - ${err}`);
                        }
                        break;
                    };
                    // Выход из системы
                    case 'out': {
                        try {
                            writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                            writeLog(`Выход из системы`);
                            res.json({
                                Response: `ПК выходит из системы`
                            });
                            if (os.platform() === 'win32') {
                                exec(`shutdown /l`);
                            }
                        }
                        catch (err) {
                            writeLog(`Error "/${subRoute1}/${subRoute2}" - ${err}`);
                        }
                        break;
                    };
                }
                break;
            };
            default: {
                writeLog(`Некорректный запрос "/${subRoute1}" от ${clientIp}`)
                res.json({Error: 'Некорректный запрос'})
                break;
            };
        }
    });

    // Запросы POST
    app.post('/:subRoute1?/:subRoute2?/:subRoute3?/:subRoute4?', async (req, res) => {
        const { subRoute1, subRoute2, subRoute3, subRoute4 } = req.params;
        const clientIp = req.ip;
        const token = req.headers['token'] || req.query.token;
        
        // Проверка на правильный токен
        if (!blockInvalidToken(clientIp, token) && config.Security.BlockToken) {
            res.json({Error: `Некорректный токен. Вы были заблокированы на ${config.Server.BlockDurationToken} min`});
        }
        
        // Проверка на спам
        if (!checkRequestLimit(clientIp) && config.Security.BlockMoreRequest) {
            res.json({Error: `Слишком много запросов от вас. Вы были заблокированы на ${config.Server.BlockDuration} min`});
        }

        // Обработка путей
        switch (subRoute1) {
            case 'app': {
                switch (subRoute2) {
                    case 'config': {
                        switch (subRoute3) {
                            case 'set': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                writeLog(`Выполняется процесс установки новых параметров программы`)
                                const configPath = './config.json';

                                try {
                                    // Создаем бекап config.json
                                    createBackupconfig(configPath);

                                    // Перезаписываем конфиг
                                    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 4), 'utf8');
                                    writeLog(`Изменение параметров прошло упсешно`)

                                    // Перезапуск программы
                                    restartServer(res);
                                } catch (err) {
                                    writeLog(`Error /app/config/set - ${err}`)
                                    res.status(500).send('Ошибка при обновлении конфигурации');
                                }
                                break;
                            };
                        };
                        break;
                    };
                    case 'cmd': {
                        writeLog(`Запрос "/${subRoute1}/${subRoute2}" от пользователя ${clientIp}`)
                        const { Value } = req.body;

                        // Проверка, что значение value не пустое
                        if (!Value) {
                            return res.json({ error: 'Команда не найдена в запросе' });
                        }

                        // Проверка на опасные команды
                        if (!isCommandSafe(Value) && config.Security.BlockInjection) {
                            writeLog(`Подозрение на опасный запрос от пользователя ${clientIp}`)
                            return res.json({ error: 'Команда запрещена из соображений безопасности' });
                        }

                        // Выполнение команды cmd
                        exec(Value, (error, stdout, stderr) => {
                            if (error) {
                                // Возвращаем ошибку, если команда завершилась с ошибкой
                                writeLog(`Ошибка выполнения команды - ${error.message}`)
                                return res.json({ Response: error.message });
                            }

                            // Если есть вывод ошибок, возвращаем его
                            if (stderr) {
                                writeLog(`Предупреждение - ${stderr}`)
                                return res.json({ Response: stderr });
                            }

                            // Возвращаем стандартный вывод команды
                            res.json({ Response: stdout });
                        });

                        break;
                    };
                }
                break;
            };
            case 'server': {
                switch (subRoute2) {
                    case 'port': {
                        switch (subRoute3) {
                            case 'set': {
                                writeLog(`Запрос "/${subRoute1}/${subRoute2}/${subRoute3}" от пользователя ${clientIp}`)
                                if (!config.Security.BlockChangeSettings) {
                                    const { Value } = req.body;
                                    
                                    // Чтение текущего файла config.json
                                    fs.readFile(config.Path.ActiveConfig, 'utf8', (err, data) => {
                                        if (err) {
                                            writeLog(`Ошибка чтения config.json: ${err}`);
                                            return res.status(500).json({Response: 'Ошибка сервера при чтении конфигурации'});
                                        }
                                        
                                        let configParse;
                                        try {
                                            configParse = JSON.parse(data); // Парсим JSON
                                        } catch (parseErr) {
                                            writeLog(`Ошибка парсинга config.json: ${parseErr}`);
                                            return res.status(500).json({Response: 'Ошибка парсинга конфигурации'});
                                        }
                            
                                        // Изменение порта
                                        configParse.Server.Port = parseInt(Value, 10);
                                        
                                        // Запись обновленного config.json
                                        fs.writeFile(config.Path.ActiveConfig, JSON.stringify(configParse, null, 4), (writeErr) => {
                                            if (writeErr) {
                                                writeLog(`Ошибка записи config.json: ${writeErr}`);
                                                return res.status(500).json({Response: 'Ошибка сервера при записи конфигурации'});
                                            }
                            
                                            writeLog('Порт сервера успешно изменен');
                                            
                                            // Перезапуск приложения
                                            restartApp(res);
                                        });
                                    });
                                } else {
                                    return res.json({Response: 'Запрещено вносить изменения'});
                                }
                                break;
                            };
                            
                        }
                        break;
                    };
                }
                break
            };

            default: {
                writeLog(`Некорректный запрос "/${subRoute1}" от ${clientIp}`)
                res.json({Error: 'Некорректный запрос'})
                break;
            };
        };
    });

    // Запуск сервера
    global.server = app.listen(config.Server.Port, async () => {
        await writeLog(`Сервер запущен по адресу http://localhost:${config.Server.Port}`)
    });

};

// Главная функция запуска приложения
async function main() {
    // Очищаем логи по необходимости
    if (config.App.LogClearOnStart){
        await clearLogFile();
    }

    // Выводим настройки программы
    await WriteSettings()
    
    // Сначала обновляем статические данные
    if (config.Backup.UpdateDataOnStart) {
        await updateStaticData();
    };

    // Включение OHM
    if (config.App.StartOHM) {
        exec(`powershell -Command "Start-Process '${config.OHM.Path}' -Verb RunAs"`)
    }
    
    // После завершения обновления запускаем сервер
    await startServer();

    // Таймер обновления статических данных
    if (config.Backup.UpdateData) {
        setInterval(async () => {
            // Останавливаем сервер перед обновлением данных
            await stopServer();

            // Обновляем данные
            await updateStaticData();

            // Снова запускаем сервер после завершения обновления
            startServer();
        }, config.Backup.UpdateDataInterval * 60 * 1000);
    };
};

// Запускаем главное приложение
main();