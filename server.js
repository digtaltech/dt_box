const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Переменная для хранения активных сессий
const sessions = {};

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
      sessions[sessionKey] = ws;
      console.log(`Клиент присоединился к сессии: ${sessionKey}`);
    } else if (type === 'file') {
      if (sessions[sessionKey]) {
        // Преобразование ArrayBuffer в Buffer перед отправкой
        const arrayBuffer = new Uint8Array(payload.data).buffer;
        sessions[sessionKey].send(JSON.stringify({ type: 'file', payload: { name: payload.name, type: payload.type, data: Array.from(new Uint8Array(arrayBuffer)) } }));


        console.log(`Файл передан в сессию: ${sessionKey}`);
      }
    }
  });
});



server.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
