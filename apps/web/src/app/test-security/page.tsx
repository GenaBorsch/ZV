'use client';

import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SecurityTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const createMaliciousFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  };

  const testMaliciousFiles = async () => {
    const tests = [
      {
        name: 'Подделка MIME-типа (.exe как image/png)',
        file: createMaliciousFile('malware.exe', 'MZ\x90\x00\x03\x00\x00\x00\x04\x00', 'image/png'),
        shouldFail: true
      },
      {
        name: 'Подделка расширения (malware.png с .exe содержимым)',
        file: createMaliciousFile('malware.png', 'MZ\x90\x00\x03\x00\x00\x00\x04\x00', 'image/png'),
        shouldFail: true
      },
      {
        name: 'Валидное PNG изображение',
        file: new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])], 'valid.png', { type: 'image/png' }),
        shouldFail: false
      },
      {
        name: 'Batch файл с подделкой (.bat как image/jpeg)',
        file: createMaliciousFile('script.bat', '@echo off\ndel /f /q C:\\*', 'image/jpeg'),
        shouldFail: true
      }
    ];

    for (const test of tests) {
      try {
        // Имитируем загрузку через FormData
        const formData = new FormData();
        formData.append('file', test.file);
        formData.append('type', 'avatar');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (test.shouldFail) {
          if (response.ok) {
            addTestResult(`❌ ПРОВАЛ: ${test.name} - файл загружен, но должен был быть отклонен!`);
          } else {
            addTestResult(`✅ УСПЕХ: ${test.name} - файл корректно отклонен: ${result.error}`);
          }
        } else {
          if (response.ok) {
            addTestResult(`✅ УСПЕХ: ${test.name} - валидный файл загружен`);
          } else {
            addTestResult(`❌ ПРОВАЛ: ${test.name} - валидный файл отклонен: ${result.error}`);
          }
        }
      } catch (error) {
        addTestResult(`❌ ОШИБКА: ${test.name} - ${error}`);
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Тестирование безопасности загрузки файлов</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Автоматические тесты безопасности</h2>
          <button
            onClick={testMaliciousFiles}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md mb-4"
          >
            🧪 Запустить тесты безопасности
          </button>

          <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-md">
            <h3 className="font-semibold">Результаты тестов:</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-500">Нажмите кнопку выше для запуска тестов</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Ручное тестирование</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Загрузка аватара</h3>
              <FileUpload
                type="avatar"
                onUpload={(result) => {
                  addTestResult(`📁 Аватар загружен: ${result.url}`);
                }}
                onError={(error) => {
                  addTestResult(`❌ Ошибка загрузки аватара: ${error}`);
                }}
              />
            </div>

            <Alert>
              <AlertDescription>
                <strong>Попробуйте загрузить:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Файл .exe переименованный в .png</li>
                  <li>Текстовый файл с расширением .jpg</li>
                  <li>Файл .bat с MIME-типом image/jpeg</li>
                  <li>Очень большой файл (&gt;5МБ)</li>
                </ul>
                Все эти файлы должны быть отклонены системой безопасности.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Информация о безопасности</h2>
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">🛡️ Реализованные меры защиты:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Проверка MIME-типа:</strong> Проверяем заголовок Content-Type файла</li>
            <li><strong>Проверка расширения:</strong> Валидируем расширение файла</li>
            <li><strong>Магические байты:</strong> Проверяем первые байты файла для определения реального типа</li>
            <li><strong>Ограничение размера:</strong> Максимальный размер файлов (5МБ для аватаров, 10МБ для документов)</li>
            <li><strong>Права доступа:</strong> Проверка ролей пользователя для разных типов загрузки</li>
            <li><strong>Автоудаление:</strong> Старые файлы автоматически удаляются при обновлении</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
