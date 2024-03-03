require('dotenv').config();

const { updateGraphMessage } = require('./graph');
const { updateStaffEmbedMessage } = require('./staff');
const token = process.env.TOKEN;
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logoPath = path.join(__dirname, 'logo', '/lifestealogo.png'); 
const cron = require('node-cron');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.commands = new Collection();
client.commandArray = [];

const functionFolders = fs.readdirSync('./src/functions');
for (const folder of functionFolders) {
    const functionFiles = fs.readdirSync(`./src/functions/${folder}`).filter(file => file.endsWith('.js'));

    for (const file of functionFiles) {
        require(`./functions/${folder}/${file}`)(client);
    }
}

const onlineStaffChannelID = process.env.ONLINE_STAFF_CHANNEL_ID;

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const targetChannel = client.channels.cache.get(onlineStaffChannelID);
    if (!targetChannel) {
        console.error('Target channel not found!');
        return;
    }

    // Attempt to update the staff embed message immediately
    updateStaffEmbedMessage(targetChannel).then(() => {
        // Then continue to update every 5 minutes
        setInterval(() => updateStaffEmbedMessage(targetChannel), 5 * 60 * 1000); // 5 minutes
    });

    // Immediately generate and update (or send) the graph message upon startup
    await updateGraphMessage(targetChannel);

    // Then, continue to update every 5 minutes for the staff embed message as an example
    setInterval(() => updateStaffEmbedMessage(targetChannel), 5 * 60 * 1000);

    // Schedule the daily graph update
    cron.schedule('0 0 * * *', async () => { // This will run at midnight every day
        await updateGraphMessage(targetChannel); // Reuse the graph update logic for scheduled updates
    });

});

/**
 * Gets messages sent from staff chat
 * TODO: sends messages to Comlink API, and send messages recieved from Comlink into staff chat
 */

const staffchannelID = process.env.STAFF_CHANNEL_ID;

client.on('messageCreate', async message => {
    if (message.channel.id === staffchannelID) {
        console.log(message.content);
        // Send message to Comlink API
    }
});

client.handleEvents();
client.handleCommands();
client.login(token);