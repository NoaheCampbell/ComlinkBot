require('dotenv').config();

const token = process.env.TOKEN;
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

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

const staffchannelID = process.env.STAFF_CHANNEL_ID;

client.on('messageCreate', async message => {
    if (message.channel.id === staffchannelID) {
        console.log(message.content);
        // Send message to Comlink API
    }
});

// Mock data function - replace this with actual logic to fetch online staff
function getOnlineStaffMockData() {
    // Example mock data
    return [
        { name: 'StaffMember1', status: 'Online' },
        { name: 'StaffMember2', status: 'Online' }
        // Add more staff members as needed
    ];
}

// Function to create or update the embed message
async function updateStaffEmbedMessage(channel) {
    const onlineStaff = getOnlineStaffMockData();
    const embed = new EmbedBuilder()
        .setTitle('🛡️ Online Staff 🛡️') // Emoji in title for emphasis
        .setDescription('Here is the current list of online staff members on our Minecraft server. Stay safe and have fun!') // More engaging description
        .setColor(0x1E90FF) // A vibrant color
        .setThumbnail('https://example.com/server-logo.png') // Server logo URL
        .setTimestamp() // Shows when the data was last updated
        .setFooter({ text: 'Updated every 5 minutes', iconURL: 'https://example.com/tiny-logo.png' }); // Footer with additional info

    // Adding each staff member with a status icon
    onlineStaff.forEach(member => {
        const statusIcon = member.status === 'Online' ? '🟢' : '🔴'; // Dynamic status icons
        embed.addFields({ name: `${member.name}`, value: `${statusIcon} ${member.status}`, inline: true });
    });

    // Logic to send or update the message
    if (global.staffEmbedMessage) {
        global.staffEmbedMessage.edit({ embeds: [embed] });
    } else {
        const message = await channel.send({ embeds: [embed] });
        global.staffEmbedMessage = message;
    }
}

const onlineStaffChannelID = process.env.ONLINE_STAFF_CHANNEL_ID;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const targetChannel = client.channels.cache.get(onlineStaffChannelID);
    if (!targetChannel) {
        console.error('Target channel not found!');
        return;
    }

    // Update the staff embed message immediately and then every 5 minutes
    updateStaffEmbedMessage(targetChannel);
    setInterval(() => updateStaffEmbedMessage(targetChannel), 5 * 60 * 1000); // 5 minutes
});

client.handleEvents();
client.handleCommands();
client.login(token);