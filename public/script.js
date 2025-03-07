const socket = new WebSocket('ws://localhost:3000');

let currentBot = "null";
let selectedChannel = ''; // Store the selected channel
const bots = ['bot1', 'bot2', 'bot3'];

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'botOutput') {
        const terminal = document.getElementById(`${data.bot}-terminal`);
        terminal.innerText += `${data.message}\n`;
        terminal.scrollTop = terminal.scrollHeight;
    }

    if (data.type === 'botError') {
        const terminal = document.getElementById(`${data.bot}-terminal`);
        terminal.innerText += `ERROR: ${data.message}\n`;
        terminal.scrollTop = terminal.scrollHeight;
    }
};

function sendCommand(bot) {
    const input = document.getElementById(`${bot}-input`);
    const command = input.value.trim();
    if (command) {
        socket.send(JSON.stringify({ type: 'sendCommand', bot, command }));
        input.value = '';
    }
}

bots.forEach(bot => {
    const startButton = document.getElementById(`start-${bot}`);
    const stopButton = document.getElementById(`stop-${bot}`);

    if (startButton) {
        startButton.addEventListener('click', () => startBot(bot));
    }

    if (stopButton) {
        stopButton.addEventListener('click', () => stopBot(bot));
    }
});

function startBot(botName) {
    socket.send(JSON.stringify({ type: 'startBot', bot: botName }));
}

function stopBot(botName) {
    socket.send(JSON.stringify({ type: 'sendCommand', bot: botName, command: '!exit' }));
}

function muteBot(botName) {
    socket.send(JSON.stringify({ type: 'sendCommand', bot: botName, command: '!mute' }));
}

function unmuteBot(botName) {
    socket.send(JSON.stringify({ type: 'sendCommand', bot: botName, command: '!unmute' }));
}

// Function to highlight the selected channel and store it
function highlightChannel(radio) {
    if (radio.checked) {
        selectedChannel = radio.value;
        updateChannelDisplays(selectedChannel);
    }
}

function sendMessage(bot) {
    const messageInput = document.getElementById(`${bot}-input`);
    const inputMessage = messageInput.value.trim();  // Get the message from the input field

    if (inputMessage !== '' && selectedChannel !== '') {
        // Send the channel and message separately to the server
        sendMessageToServer(bot, selectedChannel, inputMessage);

        // Clear the input fields
        messageInput.value = '';
    } else {
        alert('Please select a channel and type a message before sending!');
    }
}

function sendMessageToServer(botName, selectedChannel, message) {
    socket.send(JSON.stringify({
        type: 'sendCommand',
        bot: botName,
        channel: selectedChannel,
        command: message // Only send the message here, not including !send
    }));
}

function updateChannelDisplays(selectedChannel) {
    const displays = document.querySelectorAll('.selected-channel-name');
    displays.forEach(display => {
        display.textContent = selectedChannel ? `${selectedChannel}` : '<Select channel>';

        // Remove all potential classes first
        let colorRemove = display.classList.remove('grey-text', 'green-text', 'purple-text');

        // Add class based on the selected channel
        if (!selectedChannel) {
            return; 
        } else if (selectedChannel === 'luckydumpl1n') { 
            display.classList.add('green-text'); 
        } else if (selectedChannel === 'the_wizard_12') { 
            display.classList.add('purple-text'); 
        } else if (selectedChannel === 'channel-3') {
            colorRemove; 
        }
    });
}

    document.addEventListener('DOMContentLoaded', function() {
        updateChannelDisplays(selectedChannel); 
});


