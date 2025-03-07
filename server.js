const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const path = require('path'); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let activeBots = {};

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const { type, bot, channel, command } = JSON.parse(message);

        if (type === 'startBot') {
            console.log(`Start request for bot: ${bot}`);

            // Ensure that botName (bot) is not undefined or empty
            if (!bot) {
                console.error("Bot name is missing in the startBot message.");
                return;
            }

            // If the bot is not active, start it
            if (!activeBots[bot]) {
                console.log(`Starting bot: ${bot}`);
                const botProcess = startBot(bot, ws); // Start the bot and get the process
                activeBots[bot] = { process: botProcess, ws }; // Store the process and WebSocket
            } else {
                console.log(`Bot ${bot} is already active`);
            }
        }   

        if (type === 'sendCommand' && activeBots[bot]) {
            const botProcess = activeBots[bot].process;
        
            if (botProcess && botProcess.stdin) {
                console.log(`Sending command to bot ${bot}: ${command}`);
        
                if (command === '!mute' || command === '!unmute' || command === '!exit') {
                    botProcess.stdin.write(`${command}\n`);
                } else {
                    // Make sure 'channel' exists and is included when sending chat messages
                    if (!channel) {
                        console.error('Channel is required for sending messages');
                        return;
                    }
        
                    botProcess.stdin.write(`!send ${channel} ${command}\n`);
                    console.log(command); 
                }
            } else {
                console.error(`Bot ${bot} process not found or not running.`);
            }
        }
    });        

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function startBot(botName, ws) {
    // Ensure botName is defined before proceeding
    if (!botName) {
        console.error("Bot name is required to start the bot.");
        return;
    }

    // Build the botPath based on the botName
    const botPath = `./bots/${botName}/bot.js`;

    // Check if the botPath exists or is valid
    const fs = require('fs');
    if (!fs.existsSync(botPath)) {
        console.error(`Bot script not found at path: ${botPath}`);
        return;
    }

    // Start the bot process
    const botProcess = spawn('node', [botPath]);

    console.log(`Starting bot: ${botName}`);
    console.log(`Bot Path: ${botPath}`);

    botProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`Output from ${botName}: ${message}`);
        ws.send(JSON.stringify({ type: 'botOutput', bot: botName, message }));
    });
    
    botProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`Error from ${botName}: ${error}`);
        ws.send(JSON.stringify({ type: 'botError', bot: botName, message: `ERROR: ${error}` }));
    });    

    botProcess.on('close', (code) => {
        console.log(`${botName} exited with code ${code}`);
        delete activeBots[botName];
    });

    return botProcess; // Return the bot process to be stored in activeBots
}

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
