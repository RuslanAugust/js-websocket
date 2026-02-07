const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 3001;
let clients = [];

app.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    clients.push(res);
    
    console.log(`Новый SSE клиент подключен (всего: ${clients.length})`);
    
    const connectMsg = {
        type: 'connect',
        message: 'Соединение SSE установлено',
        time: new Date().toLocaleTimeString()
    };
    res.write(`data: ${JSON.stringify(connectMsg)}\n\n`);
    
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
        console.log(`SSE клиент отключен (осталось: ${clients.length})`);
        res.end();
    });
});

setInterval(() => {
    if (clients.length > 0) {
        const timeMsg = {
            type: 'time',
            message: 'Автоматическое обновление времени',
            time: new Date().toLocaleTimeString()
        };
        
        const data = `data: ${JSON.stringify(timeMsg)}\n\n`;
        
        clients.forEach(client => {
            try {
                client.write(data);
            } catch (error) {
                console.log('Ошибка отправки клиенту:', error.message);
            }
        });
        
        console.log(`Отправлено время ${timeMsg.time} клиентам: ${clients.length}`);
    }
}, 10000);

app.get('/', (req, res) => {
    res.send('SSE сервер работает. Используйте /sse для подключения');
});

app.listen(PORT, () => {
    console.log(`SSE сервер запущен на http://localhost:${PORT}`);
    console.log(`SSE эндпоинт: http://localhost:${PORT}/sse`);
});
