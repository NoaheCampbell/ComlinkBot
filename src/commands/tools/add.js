const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Adds a staff member to the staff list.')
        .addStringOption(option =>
            option.setName("ign")
                .setDescription("The staff member's ign")
                .setRequired(true)
        )
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Optional: Discord ID of the user')
                .setRequired(false)
        ), // Add an optional user field

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(role => role.name === 'Staff')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const ign = interaction.options.getString("ign");
        const staffFilePath = path.join(__dirname, '..', '..', 'staff.txt');

        // Initialize the file if it doesn't exist
        if (!fs.existsSync(staffFilePath)) {
            fs.writeFileSync(staffFilePath, ""); // Create the file if it does not exist
        }

        // Get the optional user or default to the interaction user
        const user = interaction.options.getUser('user') || interaction.user;
        
        // Adds the ign and the (optional or interaction's) user id to the staff list
        const staffData = fs.readFileSync(staffFilePath, 'utf8');
        if (!staffData.includes(ign)) {
            fs.appendFileSync(staffFilePath, `${ign} ${user.id}\n`); // Use template literals for clarity
            return interaction.reply({ content: `This staff member "${ign}" has been added to the staff list.` });
        } else {
            return interaction.reply({ content: 'This staff member is already on the staff list.' });
        }
    }
};
