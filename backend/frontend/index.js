
import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js"
const socket = io({
    auth: {
        serverOffset: 0
    }
});
const messages = document.getElementById('messages')
const form = document.getElementById('form')
const input = document.getElementById('input')
form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
})
socket.on('chat message', (msg, serverOffset) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item)
    window.scrollTo(0, document.body.scrollHeight)
    socket.auth.serverOffset = serverOffset;
});