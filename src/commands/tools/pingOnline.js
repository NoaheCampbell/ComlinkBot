const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
       .setName('pingonline')
       .setDescription('Pings all registered online staff members.')
       .addStringOption(option =>
            option.setName("message")
            .setDescription("The message to ping online staff members with")
            .setRequired(true)
        ),


    
    async execute(interaction, client) {
        // If the user is not a staff member, return an error message
        if (!interaction.member.roles.cache.some(role => role.name === 'Staff')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Get all online staff members from the onlineStaff.txt file
        const onlineStaff = await getOnlineStaff();

        let message = '';

        // Ping all online staff members in the same message
        onlineStaff.forEach(member => {
            message += `<@${member}> `;
        });

        message += interaction.options.getString('message');

        await interaction.reply({content: message});
    }

    
}

// Function to read the onlineStaff.txt file
async function getOnlineStaff() {
    try {
        const filePath = path.join(__dirname, '..', '..', 'staff.txt');
        const data = await fs.promises.readFile(filePath, 'utf8');

        // each line is separated by a space that separates the ign from the discord id
        // separates based off of new lines first, then gets two collections, one of igns
        // and one of discord ids
        const staff = data.split('\n');
        const staffIgns = staff.map(line => line.split(' ')[0]);
        const staffDiscordIds = staff.map(line => line.split(' ')[1]);

        // Get the online staff member igns from the onlineStaff.txt file
        const onlineStaffFilePath = path.join(__dirname, '..', '..', 'onlineStaff.txt');
        const onlineStaffData = await fs.promises.readFile(onlineStaffFilePath, 'utf8');
        const onlineStaffIgns = onlineStaffData.split('\n');

        // Get the discord ids of all online staff members
        const onlineStaff = [];
        for (let i = 0; i < onlineStaffIgns.length; i++) {
            const ign = onlineStaffIgns[i];
            console.log(ign);
            const discordId = staffDiscordIds[staffIgns.indexOf(ign)];
            onlineStaff.push(discordId);
        }
        console.log(onlineStaff);
        console.log(onlineStaffIgns);
        return onlineStaff;

  } catch (err) {
    console.error(err);
  }
}
