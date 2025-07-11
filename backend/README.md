# Mamo_back

Инструкция по запуску Docker контейнера backend
Предварительные требования

Установленный Docker Engine
Установленный Docker Compose
Файл docker-compose.yml в корневой директории проекта
Dockerfile для сервиса backend

Шаги по запуску
1. Сборка образа контейнера
bashCopydocker compose build backend
Эта команда:

Читает конфигурацию из docker-compose.yml
Находит секцию для сервиса backend
Использует соответствующий Dockerfile для сборки образа
Устанавливает все зависимости и выполняет инструкции из Dockerfile
Создает готовый к использованию образ

2. Запуск контейнера
bashCopydocker compose up -d backend
Эта команда:

Запускает контейнер на основе собранного образа
Флаг -d (detached mode) запускает контейнер в фоновом режиме
Настраивает сети и тома согласно docker-compose.yml
Применяет все переменные окружения и другие настройки

Полезные команды для управления

Просмотр логов контейнера:

bashCopydocker compose logs backend

Остановка контейнера:

bashCopydocker compose stop backend

Удаление контейнера:

bashCopydocker compose down backend
Возможные проблемы и их решение

Если сборка не удается:

Проверьте наличие всех необходимых файлов
Убедитесь, что Dockerfile корректно написан
Проверьте права доступа к файлам


Если контейнер не запускается:

Проверьте логи командой docker compose logs
Убедитесь, что порты не заняты другими сервисами
Проверьте корректность переменных окружения


Если контейнер запускается, но приложение недоступно:

Проверьте настройки сети в docker-compose.yml
Убедитесь, что все зависимые сервисы запущены
Проверьте файрвол и настройки безопасности