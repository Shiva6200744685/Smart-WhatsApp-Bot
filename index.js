const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
require('dotenv').config();

// Initialize WhatsApp client
const client = new Client();

// Create readline interface for terminal input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Store reminders
const reminders = [];

// Simple responses without using OpenAI API
const responses = {
    greetings: ["Hello!", "Hi there!", "Hey! How can I help?", "Greetings!"],
    thanks: ["You're welcome!", "No problem!", "Anytime!", "Glad to help!"],
    goodbye: ["Goodbye!", "See you later!", "Take care!", "Bye!"],
    default: ["I understand.", "Interesting.", "I see.", "Got it."]
};

// Get a random response from a category
function getRandomResponse(category) {
    const options = responses[category] || responses.default;
    return options[Math.floor(Math.random() * options.length)];
}

// Simple message classifier
function classifyMessage(message) {
    message = message.toLowerCase();
    
    if (/\b(hi|hello|hey|greetings|namaste|hola)\b/.test(message)) {
        return 'greetings';
    }
    
    if (/\b(thanks|thank you|thx|ty)\b/.test(message)) {
        return 'thanks';
    }
    
    if (/\b(bye|goodbye|see you|farewell)\b/.test(message)) {
        return 'goodbye';
    }
    
    return 'default';
}

// Parse reminder command: remind me in [time] to [task]
function parseReminder(message, sender) {
    const reminderRegex = /remind me in (\d+) (second|minute|hour|day)s? to (.+)/i;
    const match = message.match(reminderRegex);
    
    if (match) {
        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const task = match[3];
        
        // Calculate milliseconds
        let ms = 0;
        switch (unit) {
            case 'second': ms = amount * 1000; break;
            case 'minute': ms = amount * 60 * 1000; break;
            case 'hour': ms = amount * 60 * 60 * 1000; break;
            case 'day': ms = amount * 24 * 60 * 60 * 1000; break;
        }
        
        // Set reminder
        const now = new Date();
        const reminderTime = new Date(now.getTime() + ms);
        
        const reminder = {
            sender: sender,
            task: task,
            time: reminderTime,
            timeoutId: setTimeout(() => {
                sendReminder(sender, task);
            }, ms)
        };
        
        reminders.push(reminder);
        
        return `I'll remind you to ${task} in ${amount} ${unit}${amount > 1 ? 's' : ''} (at ${reminderTime.toLocaleTimeString()})`;
    }
    
    return null;
}

// Send reminder when time is up
async function sendReminder(sender, task) {
    try {
        await client.sendMessage(sender, `⏰ Reminder: ${task}`);
        console.log(`Reminder sent to ${sender}: ${task}`);
        
        // Remove the reminder from the array
        const index = reminders.findIndex(r => r.sender === sender && r.task === task);
        if (index !== -1) {
            reminders.splice(index, 1);
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
    }
}

// List all active reminders for a user
function listReminders(sender) {
    const userReminders = reminders.filter(r => r.sender === sender);
    
    if (userReminders.length === 0) {
        return "You don't have any active reminders.";
    }
    
    let response = "Your active reminders:\n";
    userReminders.forEach((reminder, index) => {
        response += `${index + 1}. "${reminder.task}" at ${reminder.time.toLocaleTimeString()}\n`;
    });
    
    return response;
}

// Generate and show QR code in terminal
client.on('qr', (qr) => {
    console.log("Scan this QR code:");
    qrcode.generate(qr, { small: true });
});

// When WhatsApp is ready
client.on('ready', () => {
    console.log('WhatsApp Bot is Running!');
    console.log('Type a phone number and message separated by a space to send a message');
    console.log('Example: 911234567890 Hello world');
    
    // Listen for terminal input
    rl.on('line', (input) => {
        const [number, ...messageParts] = input.split(' ');
        const message = messageParts.join(' ');
        
        if (number && message) {
            const chatId = number + "@c.us";
            client.sendMessage(chatId, message)
                .then(() => console.log('Message sent successfully'))
                .catch(err => console.error('Failed to send message:', err));
        } else {
            console.log('Invalid format. Use: [number] [message]');
        }
    });
});

// Listen for incoming messages
client.on('message', async (message) => {
    console.log('Message received:', message.body.substring(0, 50) + (message.body.length > 50 ? '...' : ''));
    
    // Check if message has media
    if (message.hasMedia) {
        try {
            await message.reply('I received your image but I can only process text messages.');
        } catch (error) {
            console.error('Error handling media:', error);
        }
        return;
    }
    
    // Process text messages
    if (message.body) {
        try {
            // Show typing indicator
            const chat = await message.getChat();
            chat.sendStateTyping();
            
            // Check for reminder commands
            if (message.body.toLowerCase().startsWith('remind me in')) {
                const response = parseReminder(message.body, message.from);
                if (response) {
                    await message.reply(response);
                    return;
                }
            }
            
            // Check for list reminders command
            if (message.body.toLowerCase() === 'list reminders') {
                const response = listReminders(message.from);
                await message.reply(response);
                return;
            }
            
            // Add a small delay to simulate thinking
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get response based on message classification
            const category = classifyMessage(message.body);
            const response = getRandomResponse(category);
            
            // Reply with response
            await message.reply(response);
            
        } catch (error) {
            console.error('Error processing message:', error);
            await message.reply("Sorry, I encountered an error processing your message.");
        }
    }
});

// Start the client
client.initialize();