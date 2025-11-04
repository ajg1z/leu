#!/bin/bash

# Leu Framework - Build Script

echo "🔨 Сборка Leu Framework..."

# Создаем папку dist если её нет
if [ ! -d "dist" ]; then
    mkdir dist
fi

# Компилируем TypeScript
echo "📦 Компиляция TypeScript..."
npx tsc

if [ $? -eq 0 ]; then
    echo "✅ Сборка завершена успешно!"
    echo "📁 Файлы созданы в папке dist/"
    echo "🌐 Откройте index.html в браузере для тестирования"
else
    echo "❌ Ошибка при сборке!"
    exit 1
fi
