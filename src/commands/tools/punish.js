const { Client, GatewayIntentBits, PermissionFlagsBits, Partials, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("punish")
        .setDescription("Log a player punishment")
        .addStringOption(option => 
            option.setName("ign")
            .setDescription("The user to punish")
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("type")
            .setDescription("The type of punishment")
            .setRequired(true)
            .addChoices({ name: "Warn", value: "warn"}, { name: "Mute", value: "mute"}, { name: "Ban", value: "ban"})
        )
        .addStringOption(option => 
            option.setName("reason")
            .setDescription("The reason for the punishment")
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("duration")
            .setDescription("The duration of the punishment (e.g., '2h', '4d', '1w', 'permanent')")
            .setRequired(true)
        ),

    async execute(interaction) {
        interaction.reply(`${interaction.options.getString("type")} ${interaction.options.getString("ign")} for ${interaction.options.getString("duration")} for ${interaction.options.getString("reason")}`);
    }
}