// chat/static/chat/js/chat.js

// Получаем данные из шаблона (будем передавать через data-атрибуты)
const chatApp = {
    isAuthenticated: false,
    username: '',
    socket: null,

    init(isAuth, user) {
        this.isAuthenticated = isAuth;
        this.username = user;
        this.connectWebSocket();
        this.attachEventListeners();
    },

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat/`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = (e) => {
            console.log('✅ WebSocket connected');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.addSystemMessage('Connection error. Please refresh the page.');
        };

        this.socket.onclose = (e) => {
            console.log('WebSocket closed:', e);
            this.addSystemMessage('Connection lost. Refreshing in 3 seconds...');
            setTimeout(() => location.reload(), 3000);
        };
    },

    handleMessage(data) {
        switch(data.type) {
            case 'online_count':
                this.updateOnlineCount(data.count);
                break;

            case 'chat_message':
                this.addMessage(data.message, data.username, data.username === this.username);
                break;

            case 'push_notification':
                this.showNotification(data.text, data.sender);
                break;

            case 'user_join':
                this.addSystemMessage(`${data.username} joined the chat`);
                break;

            case 'user_leave':
                this.addSystemMessage(`${data.username} left the chat`);
                break;

            case 'error':
                alert(data.message);
                break;
        }
    },

    isSocketReady() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    },

    sendMessage() {
        if (!this.isAuthenticated) {
            alert('Please login to send messages');
            return;
        }

        if (!this.isSocketReady()) {
            alert('Connection lost. Please refresh the page.');
            return;
        }

        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (message) {
            this.socket.send(JSON.stringify({
                type: 'chat_message',
                message: message
            }));
            input.value = '';
        }
    },

    sendNotification() {
        if (!this.isSocketReady()) {
            alert('Connection lost. Please refresh the page.');
            return;
        }

        const text = prompt('Enter notification text:');
        if (text) {
            this.socket.send(JSON.stringify({
                type: 'push_notification',
                text: text
            }));
        }
    },

    addMessage(text, user, isOwn) {
        const messagesDiv = document.getElementById('messages');
        const div = document.createElement('div');
        div.className = `message ${isOwn ? 'own' : 'other'}`;

        const usernameSpan = document.createElement('div');
        usernameSpan.className = 'message-username';
        usernameSpan.textContent = user;

        const textDiv = document.createElement('div');
        textDiv.textContent = text;

        div.appendChild(usernameSpan);
        div.appendChild(textDiv);
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    addSystemMessage(text) {
        const messagesDiv = document.getElementById('messages');
        const div = document.createElement('div');
        div.className = 'message system';
        div.textContent = text;
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    showNotification(text, sender) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-title">🔔 ${sender}</div>
            <div class="notification-text">${text}</div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    },

    updateOnlineCount(count) {
        const countSpan = document.getElementById('onlineCount');
        if (countSpan) {
            countSpan.textContent = count;
        }
    },

    attachEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const notifyBtn = document.getElementById('notifyBtn');
        const messageInput = document.getElementById('messageInput');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (notifyBtn) {
            notifyBtn.addEventListener('click', () => this.sendNotification());
        }

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }
};

// Экспортируем для использования в шаблоне
window.chatApp = chatApp;