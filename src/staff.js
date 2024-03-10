const fs = require('fs');
const path = require('path');
const logoPath = path.join(__dirname, 'logo', '/lifestealogo.png'); 
const { EmbedBuilder } = require('discord.js');

module.exports = { updateStaffEmbedMessage };

/**
 * Creates an embed of all online staff seen by Comlink. Sent live updates from Comlink and
 * will separate Online staff members with Comlink from AFK staff with Comlink from staff members without
 * Comlink. Will send one message in the specified channel if one is not sent already, and then saves the
 * messageID of that message so it can be edited later.
 */

// Path to the JSON file
const messageIdFilePath = path.join(__dirname, 'embedMessageId.json');

async function sendAndSaveNewStaffMessage(channel, embed) {
    try {
        // Send a new message with the embed
        const message = await channel.send({
            embeds: [embed], // Pass the embed as part of the array
        });

        // Save the ID of the new message
        writeMessageId(message.id);
        console.log('New staff embed message sent and ID saved.');
    } catch (error) {
        console.error('Error sending new staff embed message:', error);
    }
}


// Function to read the message ID from the file
function readMessageId() {
    if (fs.existsSync(messageIdFilePath)) {
        const data = fs.readFileSync(messageIdFilePath, 'utf8');
        const json = JSON.parse(data);
        return json.messageId;
    }
    return null;
}

// Function to write the message ID to the file
function writeMessageId(messageId) {
    const data = JSON.stringify({ messageId }, null, 4);
    fs.writeFileSync(messageIdFilePath, data, 'utf8');
}

async function getStaffData() {
    // Mock data, replace with your actual data fetching logic
    const comlinkStaff = [
        { name: 'Hunter_cookie21', time: '11:14', status: '' },
        { name: 'MaxerRackham', time: '9:23', status: '' },
    ];

    const nonComlinkStaff = [
        { name: 'AgentDuck007', time: '', status: '' },
    ];

    const afkStaff = [
        { name: 'Candycup', time: '12:53', status: 'AFK' },
    ];

    return { comlinkStaff, nonComlinkStaff, afkStaff };
}

// Function to create or update the embed message
async function updateStaffEmbedMessage(channel) {
    
    const { comlinkStaff, nonComlinkStaff, afkStaff } = await getStaffData();

    

    const embed = new EmbedBuilder()
        .setTitle('🛡️ Online Staff 🛡️')
        .setColor(0x1E90FF)
        .setThumbnail('attachment://your-logo-filename.png')
        .setTimestamp();

    // Generate the Comlink Staff section
    let comlinkStaffText = comlinkStaff.map(staff => `• ${staff.name} (since ${staff.time}) ${staff.status}`).join('\n');
    if (!comlinkStaff.length) comlinkStaffText = 'No staff currently online.';

    // Generate the Non-Comlink Staff section
    let nonComlinkStaffText = nonComlinkStaff.map(staff => `• ${staff.name}`).join('\n');
    if (!nonComlinkStaff.length) nonComlinkStaffText = 'No staff currently online.';

    let afkStaffText = afkStaff.map(staff => `• ${staff.name} (since ${staff.time})`).join('\n');
    if (!afkStaff.length) afkStaffText = 'No staff currently online.';

    embed.addFields(
        { name: 'Online Comlink Staff', value: comlinkStaffText },
        { name: '\u200B', value: '\u200B' },
        { name: 'AFK Staff', value:  afkStaffText},
        { name: '\u200B', value: '\u200B' },
        { name: 'Online Staff without Comlink (limited coverage)', value: nonComlinkStaffText }
    );

    
    
    const messagePayload = {
        embeds: [embed],
        files: [{
            attachment: logoPath,
            name: 'your-logo-filename.png' // This should match the filename used in the thumbnail URL
        }]
    };

    const messageId = readMessageId();

    if (messageId) {
        try {
            const message = await channel.messages.fetch(messageId);
            await message.edit({ embeds: [embed] });
            console.log('Staff embed message updated.');
        } catch (error) {
            console.error('Failed to fetch or edit the existing staff embed message:', error);
            sendAndSaveNewStaffMessage(channel, embed); // Use the correct function for staff embed
        }
    } else {
        sendAndSaveNewStaffMessage(channel, embed); // If no message ID is stored, send a new message
    }

    // Combines all staff member names from comlinkStaff, afkStaff, and nonComlinkStaff into an array
    const onlineStaff = comlinkStaff.map(staff => staff.name).concat(afkStaff.map(staff => staff.name)).concat(nonComlinkStaff.map(staff => staff.name));

    // Writes the names of all online staff members to a new file
    fs.writeFileSync(path.join(__dirname, 'onlineStaff.txt'), onlineStaff.join('\n'));
}