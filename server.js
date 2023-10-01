const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Переменные для хранения активных сессий и клиентов в сессиях
const sessions = {};
const sessionClients = {};

app.use(express.static(__dirname + '/public'));

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON', e);
      return;
    }

    const { sessionKey, type, payload } = data;

    if (type === 'join') {
      if (!sessionClients[sessionKey]) {
        sessionClients[sessionKey] = [];
      }
      sessions[sessionKey] = ws;
      sessionClients[sessionKey].push(ws);
      console.log(`Клиент присоединился к сессии: ${sessionKey}`);
    } else if (type === 'file') {
      if (sessionClients[sessionKey]) {
        // Преобразование ArrayBuffer в Buffer перед отправкой
        const arrayBuffer = new Uint8Array(payload.data).buffer;

        // Создаем заглушку для отправителя
        const placeholderMessage = JSON.stringify({ type: 'file', payload: { name: `${payload.name}`, type: payload.type, type_client: "sender" } });
        ws.send(placeholderMessage);

        // Отправляем файл всем остальным клиентам в данной сессии
        sessionClients[sessionKey].forEach((client) => {
          // Проверяем, чтобы не отправлять файл обратно отправителю
          if (client !== ws) {
            const fileMessage = JSON.stringify({ type: 'file', payload: { name: payload.name, type: payload.type, data: Array.from(new Uint8Array(arrayBuffer)) } });
            client.send(fileMessage);
          }
        });

        console.log(`Файл передан в сессию: ${sessionKey}`);
      }
    }

  });
});

server.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
