document.addEventListener('DOMContentLoaded', () => {
    const connectSseBtn = document.getElementById('connectSseBtn');
    const disconnectSseBtn = document.getElementById('disconnectSseBtn');
    const sseDataDisplay = document.getElementById('sseDataDisplay');
    
    let eventSource = null;
    
    const addMessage = (text, type = 'info') => {
        const div = document.createElement('div');
        div.className = `sse-message sse-${type}`;
        div.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
        sseDataDisplay.appendChild(div);
        sseDataDisplay.scrollTop = sseDataDisplay.scrollHeight;
    };
    
    const connectSSE = () => {
        if (eventSource) {
            addMessage('Уже подключено к SSE', 'warning');
            return;
        }
        
        addMessage('Подключение к SSE серверу...', 'info');
        
        eventSource = new EventSource('http://localhost:3001/sse');
        
        eventSource.onopen = () => {
            addMessage('SSE соединение установлено', 'success');
            connectSseBtn.disabled = true;
            disconnectSseBtn.disabled = false;
        };
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'connect') {
                    addMessage(`Сервер: ${data.message}`, 'received');
                } else if (data.type === 'time') {
                    addMessage(`Время сервера: ${data.time}`, 'time');
                }
            } catch (e) {
                addMessage(`Получено: ${event.data}`, 'received');
            }
        };
        
        eventSource.onerror = () => {
            addMessage('Ошибка SSE соединения', 'error');
            disconnectSSE();
        };
    };
    
    const disconnectSSE = () => {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
            addMessage('SSE соединение закрыто', 'info');
            connectSseBtn.disabled = false;
            disconnectSseBtn.disabled = true;
        }
    };
    
    connectSseBtn.addEventListener('click', connectSSE);
    disconnectSseBtn.addEventListener('click', disconnectSSE);
});
