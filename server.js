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
    }
    else if (type === 'file') {
      if (sessionClients[sessionKey]) {
        const fileChunks = [];
        const chunkSize = 64 * 1024; // Размер части (64 КБ)
  
        for (let i = 0; i < payload.data.length; i += chunkSize) {
          const chunk = payload.data.slice(i, i + chunkSize);
          fileChunks.push(chunk);
        }
  
        const fileName = payload.name;
        const fileType = payload.type;
  
        // Проходимся по частям файла и отправляем их клиентам
        fileChunks.forEach((chunk, index) => {
          sessionClients[sessionKey].forEach((client) => {
            // Проверяем, чтобы не отправлять часть файла обратно отправителю
            if (client !== ws) {
              const fileChunkMessage = JSON.stringify({
                type: 'file',
                payload: {
                  name: fileName,
                  type: fileType,
                  chunk: Array.from(new Uint8Array(chunk)),
                  index: index,
                  totalChunks: fileChunks.length,
                  type_client: "receiver"
                }
              });
              client.send(fileChunkMessage);
            }
          });
        });
  
        console.log(`Файл передан в сессию частями: ${sessionKey}`);
      }
    }

  });
});

server.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
