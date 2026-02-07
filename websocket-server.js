const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('.'));

wss.on('connection', (ws) => {
    console.log('Клиент подключен');
    
    ws.send('Сервер: Вы подключены!');
    
    ws.on('message', (message) => {
        console.log('Получено:', message.toString());
        
        const response = `Сервер получил: ${message.toString()}`;
        console.log('Отправлено:', response);
        ws.send(response);
    });
    
    ws.on('close', () => {
        console.log('Клиент отключился');
    });
    
    ws.on('error', (error) => {
        console.log('Ошибка:', error.message);
    });
});

server.listen(8080, () => {
    console.log('Сервер запущен на http://localhost:8080');
    console.log('WebSocket сервер на ws://localhost:8080');
});
