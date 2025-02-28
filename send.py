import requests
from prettytable import PrettyTable
from random import randint


table = [
    # Блок с запросами информации [ГОТОВ]
    'get::/info/board::ON',  # Запрос информации о датчиках материнской платы
    'get::/info/cpu::ON',  # Запрос информации о CPU
    'get::/info/gpu::ON',  # Запрос информации о GPU
    'get::/info/ram::ON',  # Запрос информации о RAM
    'get::/info/disks::ON',  # Запрос информации о HDD / SSD
    'get::/info/network::ON',  # Запрос информации о Беспроводных интерфейсах
    'get::/info/oc::ON',  # Запрос информации о системе
    'get::/info/users::ON',  # Запрос информации о пользователях
    'get::/info/services::ON',  # Запрос информации о системных службах
    'get::/info/data/update::ON',  # Обновление статических данных

    # Блок с запросами к Open Hardware Monitor [ГОТОВ]
    'get::/ohm/get::ON', # Запрос информации о всех датчиках компьютера
    'get::/ohm/reboot::ON', # Перезапуск службы Open Hardware Monitor

    # Блок с запросами питания ПК [ГОТОВ]
    'get::/power/off::ON',  # Запрос на выключение ПК
    'get::/power/reboot::ON',  # Запрос на выключение ПК
    'get::/power/sleep::ON',  # Запрос на перевод ПК в спящий режим
    'get::/power/hyber::ON',  # Запрос на перевод пк в режим гибернации
    'get::/power/out::ON',  # Запрос на перевод пк в режим гибернации

    # Блок с запросами Яндекс Алисы [ГОТОВ]
    'get::/power/off/Alice::ON',  # Запрос на выключение ПК
    'get::/power/status/Alice::ON',  # Запрос на перевод пк в режим гибернации
    
    # Блок для работы с программой
    'get::/app/reboot::ON',  # Полная перезагрузка программы [ГОТОВО]
    'post::/app/cmd::ON',  # Ввод команд Windows
    'post::/app/sudo::OFF',  # Ввод команд Linux
    'get::/app/backup::ON',  # Полный бекап программы (логи, настройки, исполняемые файлы) [ГОТОВО]
    'get::/app/backup/show::ON',  # Просмотр всех бекапов программы [ГОТОВО]
    'get::/app/config/get::ON',  # Получение настроек программы [ГОТОВО]
    'post::/app/config/set::ON',  # Установка новых настроек программы [ГОТОВО]
    'get::/app/config/restore::OFF',  # Откат настроек программы (указывается версия бекапа)
    'get::/app/config/backup::ON',  # Бекап настроек программы [ГОТОВО]
    'get::/app/config/backup/show::ON',  # Получение всех бекапов настроек программы [ГОТОВО]
    'get::/app/block/user::OFF',  # Блокировка пользователей навсегда (только если запрос от admin)
    'get::/app/block/network::OFF',  # Блокировка интернет-соединения (только если запрос от admin)
    'get::/app/info::ON',  # Получение статуса работы программы (ОЗУ + Статус) [ГОТОВО]
    'get::/app/info/command::ON',  # Получение всех команд, которые может принимать сервер (только если запрос от admin) [ГОТОВО]
    
    # Блок для работы с локальным сервером
    'get::/server/reboot::ON',  # Перезапуск локального сервера [ГОТОВО]
    'get::/server/port/get::ON',  # Получение порта локального сервера [ГОТОВО]
    'post::/server/port/set::ON',  # Установка нового порта локального сервера [ГОТОВО]
    'get::/server/logs/get::ON',  # Получение актуальных логов программы [ГОТОВО]
    'get::/server/logs/clean::ON',  # Очистка логов програмы [ГОТОВО]
    'get::/server/logs/backup::ON',  # Бекап логов программы [ГОТОВО]
    'get::/server/logs/backup/show::ON',  # Просмотр бекапов логов [ЛОГОВ]
    'get::/server/apps/start::OFF',  # Старт программы (только если программа есть в файле apps.json)
    'get::/server/apps/stop::OFF',  # Остановка работы программ (только если запрос от админа)
    ]


def send_request(method, command, connect='L'):
    try:
        state_table = PrettyTable()
        state_table.field_names = ['Name', 'Info']

        token = 'Fedoskin010220053666!'
        headers = {
            'token': token,
            'login': 'Kkleytt',
            'rules': 'creator',
            'Content-type': 'application/json'
        }

        if connect == 'L':
            url_host = 'localhost'
        elif connect == 'U':
            url_host = '46.160.250.162'
        else:
            return "Не корректный ip-адрес сервера"

        if method == 'get':
            url = f'http://{url_host}:9999' + command
            res = requests.get(url, headers=headers, timeout=10)
            text = res.json()
        elif method == 'post':
            url = 'http://46.160.250.162:9999' + command
            data = {"Value": 'del config.json'}
            res = requests.post(url, json=data, headers=headers, timeout=10)
            text = res.json()
        else:
            text = {
                "Result": "Error method send"
            }

        try:
            for item in text:
                state_table.add_row([item, text[item]])

            text = f'Original message: {text}'
            return text
            #return state_table
        except Exception as ex:
            text = f'Original message: {text}'
            return text
    except ValueError as ex:
        print(f"Error send query - {ex}")
        return False


def create_table():
    command_table = PrettyTable()
    command_table.field_names = ["№", "Method", "URL"]
    for i, command in enumerate(table):
        number = i + 1
        method, command, status = command.split('::')
        if status == 'ON':
            command_table.add_row([number, method, command])
    return command_table


def start(exit_word='exit'):
    command_table = create_table()
    print(command_table)

    url = input('L - Локальный сервер\nU - удаленный сервер\nВведите url-сервера - ')

    while True:
        inp = input('Select command - ')

        # Системные команды
        if inp == exit_word:
            print('Конец операциям')
            exit(0)
        elif inp == 'sh':
            print(command_table)
            continue

        # Обработка событий
        try:
            inp = int(inp)
            text = table[inp - 1]
            method, command, status = text.split('::')
            if method == 'get':
                table_data = send_request(method=method, command=command, connect=url)
                print(table_data)
            elif method == 'post':
                table_data = send_request(method=method, command=command, connect=url)
                print(table_data)
        except ValueError:
            print(command_table)
            continue


if __name__ == '__main__':
    break_word = 'stop'
    start(break_word)
