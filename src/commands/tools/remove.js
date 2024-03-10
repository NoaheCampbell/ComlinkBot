const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
       .setName('remove')
       .setDescription('Removes a staff member to the staff list.')
       .addStringOption(option =>
            option.setName("ign")
               .setDescription("The staff member's ign")
               .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("discordid")
                .setDescription("The id of the staff being removed")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(role => role.name === 'Staff')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const ign = interaction.options.getString("ign");
        const discordId = interaction.options.getString("discordid");

        const staffFilePath = path.join(__dirname, '..', '..','staff.txt');

        // If the file doesnt exist, return
        if (!fs.existsSync(staffFilePath)) {
            return interaction.reply({ content: 'There is no staff list.' });
        }

        // Get the staff list
        const staff = fs.readFileSync(staffFilePath, 'utf8');
        const staffList = staff.split('\n');

        // Remove the staff member from the staff list
        const index = staffList.indexOf(ign + ' ' + discordId);
        console.log(index);
        if (index > -1) {
            staffList.splice(index, 1);
            const newStaffList = staffList.join('\n');
            fs.writeFileSync(staffFilePath, newStaffList);
            return interaction.reply({ content: `The staff member "${ign}" has been removed from the staff list.` });
        } else {
            return interaction.reply({ content: 'This staff member is not on the staff list.' });
        }
    }
}