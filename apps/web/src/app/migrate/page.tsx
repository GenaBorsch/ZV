<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Миграция Story Texts</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            margin: 10px 0;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            font-weight: bold;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Миграция Story Texts</h1>
        <p>Этот инструмент добавит колонку <code>title</code> в таблицу <code>story_texts</code> и заполнит её данными.</p>
        
        <button id="migrateBtn" onclick="runMigration()">
            🚀 Запустить миграцию
        </button>
        
        <button id="checkBtn" onclick="checkStatus()">
            🔍 Проверить статус
        </button>
        
        <div id="status"></div>
    </div>

    <script>
        async function runMigration() {
            const btn = document.getElementById('migrateBtn');
            const status = document.getElementById('status');
            
            btn.disabled = true;
            btn.textContent = '⏳ Выполняется миграция...';
            status.innerHTML = '<div class="info">Начинаем миграцию...</div>';
            
            try {
                const response = await fetch('/api/migrate-story-texts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                const data = await response.json();
                
                if (data.success) {
                    status.innerHTML = `
                        <div class="success">
                            ✅ Миграция выполнена успешно!<br>
                            ${data.message}<br>
                            Записей обновлено: ${data.recordsUpdated || 'N/A'}
                        </div>
                    `;
                } else {
                    status.innerHTML = `
                        <div class="error">
                            ❌ Ошибка миграции:<br>
                            ${data.error}<br>
                            <pre>${JSON.stringify(data.details, null, 2)}</pre>
                        </div>
                    `;
                }
            } catch (error) {
                status.innerHTML = `
                    <div class="error">
                        ❌ Ошибка сети:<br>
                        ${error.message}
                    </div>
                `;
            } finally {
                btn.disabled = false;
                btn.textContent = '🚀 Запустить миграцию';
            }
        }
        
        async function checkStatus() {
            const btn = document.getElementById('checkBtn');
            const status = document.getElementById('status');
            
            btn.disabled = true;
            btn.textContent = '⏳ Проверяем...';
            status.innerHTML = '<div class="info">Проверяем статус таблицы...</div>';
            
            try {
                const response = await fetch('/api/check-story-texts');
                const data = await response.json();
                
                if (data.success) {
                    status.innerHTML = `
                        <div class="success">
                            ✅ Статус таблицы:<br>
                            Колонка title: ${data.hasTitleColumn ? '✅ Существует' : '❌ Отсутствует'}<br>
                            Записей в таблице: ${data.recordCount}<br>
                            <pre>${JSON.stringify(data.sampleData, null, 2)}</pre>
                        </div>
                    `;
                } else {
                    status.innerHTML = `
                        <div class="error">
                            ❌ Ошибка проверки:<br>
                            ${data.error}
                        </div>
                    `;
                }
            } catch (error) {
                status.innerHTML = `
                    <div class="error">
                        ❌ Ошибка сети:<br>
                        ${error.message}
                    </div>
                `;
            } finally {
                btn.disabled = false;
                btn.textContent = '🔍 Проверить статус';
            }
        }
    </script>
</body>
</html>
