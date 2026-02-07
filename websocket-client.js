document.addEventListener('DOMContentLoaded', () => {
    const connectWsBtn = document.getElementById('connectWsBtn');
    const disconnectWsBtn = document.getElementById('disconnectWsBtn');
    const sendWsBtn = document.getElementById('sendWsBtn');
    const wsMessageInput = document.getElementById('wsMessageInput');
    const wsStatus = document.getElementById('wsStatus');
    const wsDataDisplay = document.getElementById('wsDataDisplay');
    const connectionInfo = document.getElementById('connectionInfo');
    
    let socket = null;
    const serverUrl = 'ws://localhost:8080';
    
    const updateStatus = (message, type = 'disconnected') => {
        wsStatus.textContent = message;
        wsStatus.className = `status-${type}`;
        
        if (connectionInfo) {
            connectionInfo.innerHTML = `
                <div class="connection-info">
                    <strong>Сервер:</strong> ${serverUrl}<br>
                    <strong>Время:</strong> ${new Date().toLocaleTimeString()}
                </div>
            `;
        }
    };
    
    const addMessage = (text, type = 'info') => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ws-message ws-${type}`;
        
        const time = new Date().toLocaleTimeString();
        messageDiv.innerHTML = `
            <span class="message-time">[${time}]</span>
            <span class="message-content">${text}</span>
        `;
        
        wsDataDisplay.appendChild(messageDiv);
        wsDataDisplay.scrollTop = wsDataDisplay.scrollHeight;
    };
    
    const connectWebSocket = () => {
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            addMessage('Уже подключено или идет подключение', 'warning');
            return;
        }
        
        updateStatus('Подключение...', 'connecting');
        addMessage(`Подключение к ${serverUrl}...`, 'info');
        
        try {
            socket = new WebSocket(serverUrl);
            
            socket.onopen = (event) => {
                updateStatus('Подключено ✓', 'connected');
                addMessage('Успешно подключено к серверу', 'success');
                
                disconnectWsBtn.disabled = false;
                sendWsBtn.disabled = false;
                wsMessageInput.disabled = false;
                connectWsBtn.disabled = true;
                
                wsMessageInput.focus();
            };
            
            socket.onmessage = (event) => {
                addMessage(`${event.data}`, 'received');
            };
            
            socket.onerror = (error) => {
                updateStatus('Ошибка подключения', 'error');
                addMessage('Ошибка подключения. Убедитесь, что сервер запущен:', 'error');
                addMessage('Запустите: node websocket-server.js', 'info');
                
                disconnectWsBtn.disabled = true;
                sendWsBtn.disabled = true;
                wsMessageInput.disabled = true;
                connectWsBtn.disabled = false;
            };
            
            socket.onclose = (event) => {
                updateStatus('Отключено', 'disconnected');
                addMessage(`Соединение закрыто (код: ${event.code})`, 'info');
                
                disconnectWsBtn.disabled = true;
                sendWsBtn.disabled = true;
                wsMessageInput.disabled = true;
                connectWsBtn.disabled = false;
                
                socket = null;
            };
            
        } catch (error) {
            updateStatus('Ошибка', 'error');
            addMessage(`Ошибка: ${error.message}`, 'error');
        }
    };
    
    const sendMessage = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            addMessage('Нет подключения к серверу', 'error');
            return;
        }
        
        const message = wsMessageInput.value.trim();
        if (!message) {
            addMessage('Введите сообщение', 'error');
            wsMessageInput.focus();
            return;
        }
        
        try {
            socket.send(message);
            addMessage(`Отправлено: ${message}`, 'sent');
            wsMessageInput.value = '';
            wsMessageInput.focus();
        } catch (error) {
            addMessage(`Ошибка отправки: ${error.message}`, 'error');
        }
    };
    
    const disconnectWebSocket = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close(1000, 'Клиент отключился');
            addMessage('Запрос на отключение отправлен', 'info');
        } else {
            addMessage('Нет активного соединения', 'warning');
        }
    };
    
    const init = () => {
        connectWsBtn.addEventListener('click', connectWebSocket);
        disconnectWsBtn.addEventListener('click', disconnectWebSocket);
        sendWsBtn.addEventListener('click', sendMessage);
        
        wsMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendWsBtn.disabled) {
                sendMessage();
            }
        });
        
        updateStatus('Не подключено', 'disconnected');
        addMessage('Нажмите "Подключиться к WebSocket" для начала работы', 'info');
    };
    
    init();
});
