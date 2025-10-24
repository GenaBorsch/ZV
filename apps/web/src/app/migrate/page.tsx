'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runMigration = async () => {
    setIsLoading(true);
    setStatus('<div className="info">Начинаем миграцию...</div>');
    
    try {
      const response = await fetch('/api/migrate-story-texts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(`
          <div className="success">
            ✅ Миграция выполнена успешно!<br>
            ${data.message}<br>
            Записей обновлено: ${data.recordsUpdated || 'N/A'}
          </div>
        `);
      } else {
        setStatus(`
          <div className="error">
            ❌ Ошибка миграции:<br>
            ${data.error}<br>
            <pre>${JSON.stringify(data.details, null, 2)}</pre>
          </div>
        `);
      }
    } catch (error) {
      setStatus(`
        <div className="error">
          ❌ Ошибка сети:<br>
          ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkStatus = async () => {
    setIsLoading(true);
    setStatus('<div className="info">Проверяем статус таблицы...</div>');
    
    try {
      const response = await fetch('/api/check-story-texts');
      const data = await response.json();
      
      if (data.success) {
        setStatus(`
          <div className="success">
            ✅ Статус таблицы:<br>
            Колонка title: ${data.hasTitleColumn ? '✅ Существует' : '❌ Отсутствует'}<br>
            Записей в таблице: ${data.recordCount}<br>
            <pre>${JSON.stringify(data.sampleData, null, 2)}</pre>
          </div>
        `);
      } else {
        setStatus(`
          <div className="error">
            ❌ Ошибка проверки:<br>
            ${data.error}
          </div>
        `);
      }
    } catch (error) {
      setStatus(`
        <div className="error">
          ❌ Ошибка сети:<br>
          ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '50px auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#333', textAlign: 'center' }}>
          🔄 Миграция Story Texts
        </h1>
        <p>
          Этот инструмент добавит колонку <code>title</code> в таблицу <code>story_texts</code> и заполнит её данными.
        </p>
        
        <button
          onClick={runMigration}
          disabled={isLoading}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '16px',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            margin: '10px 0',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '⏳ Выполняется миграция...' : '🚀 Запустить миграцию'}
        </button>
        
        <button
          onClick={checkStatus}
          disabled={isLoading}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '16px',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            margin: '10px 0',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '⏳ Проверяем...' : '🔍 Проверить статус'}
        </button>
        
        {status && (
          <div
            dangerouslySetInnerHTML={{ __html: status }}
            style={{ marginTop: '20px' }}
          />
        )}
      </div>
      
      <style jsx>{`
        .info {
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
          padding: 15px;
          border-radius: 5px;
          font-weight: bold;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          padding: 15px;
          border-radius: 5px;
          font-weight: bold;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          padding: 15px;
          border-radius: 5px;
          font-weight: bold;
        }
        pre {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
