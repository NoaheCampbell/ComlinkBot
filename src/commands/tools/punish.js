const { SlashCommandBuilder } = require("discord.js");

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
            option.setName("reason")
            .setDescription("The reason for the punishment")
            .setRequired(true)
        ),
    
}