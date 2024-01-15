const { Client, GatewayIntentBits, PermissionFlagsBits, Partials, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("punish")
        .setDescription("Punish a user")
        .addUserOption(option => 
            option.setName("user")
            .setDescription("The user to punish")
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("type")
            .setDescription("The type of punishment")
            .setRequired(true)
            .addChoices({ name: "Warn", value: "warn"}, { name: "Mute", value: "mute"}, { name: "Ban", value: "ban"})
        )
        .addIntegerOption(option =>
            option.setName("duration")
            .setDescription("The duration of the punishment")
            .setRequired(false)
        )
        .addStringOption(option => 
            option.setName("reason")
            .setDescription("The reason for the punishment")
            .setRequired(true)
        ),

    async execute(interaction) {
        interaction.reply(`${interaction.options.getString("type")} ${interaction.options.getUser("user")} for ${interaction.options.getString("duration")} for ${interaction.options.getString("reason")}`);
    }
}