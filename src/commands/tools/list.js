const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Lists all registered staff members.')
        .addStringOption(option =>
            option.setName("type")
                .setDescription("The type of staff members to list")
                .setRequired(true)
                .addChoices(
                    { name: 'All', value: 'all' }, 
                    { name: 'Online', value: 'online' }
                )
        ),

    async execute(interaction) {
        // If the user is not a staff member, return an error message
        if (!interaction.member.roles.cache.some(role => role.name === 'Staff')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const type = interaction.options.getString('type');
        const filePath = path.join(__dirname, '..', '..', type === 'all' ? 'staff.txt' : 'onlineStaff.txt');
        if (!fs.existsSync(filePath)) {
            return interaction.reply({ content: `No ${type} staff members found.`, ephemeral: true });
        }

        const staffData = fs.readFileSync(filePath, 'utf8').trim();
        const staffList = staffData.split('\n').map(line => {
            const [ign, id] = line.split(' ');
            return ign ? `- ${ign}${id ? ` (ID: ${id})` : ''}` : ''; // Include Discord ID if present
        }).filter(Boolean); // Remove empty entries

        if (staffList.length === 0) {
            return interaction.reply({ content: `No ${type} staff members found.`, ephemeral: true });
        }

        // Create an embed for a more appealing display
        const embed = new EmbedBuilder()
            .setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Staff Members`)
            .setDescription(staffList.join('\n'))
            .setColor(0x0099FF);

        return interaction.reply({ embeds: [embed] });
    }
};
