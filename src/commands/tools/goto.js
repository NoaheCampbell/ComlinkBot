const { Client, GatewayIntentBits, PermissionFlagsBits, Partials, StringSelectMenuOptionBuilder, SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

const forumID = process.env.FORUMID;

// Grabs the attachments and links from the forum channel relating to the offender's ign
module.exports = {
    data: new SlashCommandBuilder()
        .setName("goto")
        .setDescription("Got to the specified thread")
        .addStringOption(option => 
            option.setName("ign")
            .setDescription("The offender's ign")
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
            .setDescription("The reason for the punishment")
            .setRequired(true)
        ),
    
        // Goes to the forumid channel and looks for a post with the offender's ign and puts the message link in the current channel
    async execute(interaction) {
        await interaction.deferReply();

        const timeout = setTimeout(async () => {
            await interaction.editReply('The operation has timed out.');
        }, 10000); // Set timeout for 10 seconds

        const ign = interaction.options.getString("ign").toLowerCase();
        const reason = interaction.options.getString("reason").toLowerCase();

        try {

            // Goes to the forumid channel and looks for a post with the offender's ign
            const forumChannel = await interaction.client.channels.fetch(forumID);
            const threads = await forumChannel.threads.fetch({ limit: 100 });

            // An array of all the messages that contain the offender's ign and reason
            let offenderMessages = [];

            for (const [, thread] of threads.threads) {
                // Fetch messages from each thread
                const messages = await thread.messages.fetch({ limit: 50 }); // Adjust the limit as needed

                // Search through messages for the specific content, if there are multiple messages with the same content,
                // It will give the user the option to choose which message they want to use, and they will be ordered
                // from oldest to newest by adding it to the offenderMessage array
                for (const [, message] of messages) {
                    // Grabs the thread that the message belongs to

                    if (thread.name.toLowerCase().includes(ign) && message.content.toLowerCase().includes(reason)) {
                        offenderMessages.push(message);
                    }
                }

            }

            // Grabs the messageids from the offenderMessage
            let messageIDs = [];
            for (const message of offenderMessages) {
                messageIDs.push(message.id);
            }

            // Creates a select menu with the message links
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('goto')
                .setPlaceholder('Select a message')
                .addOptions(messageIDs.map((id, index) => new StringSelectMenuOptionBuilder().setLabel(`Message ${index + 1}`).setValue(id).setDescription(`[Message ${index + 1}](${messageIDs[index]})`)));

            const actionRow = new ActionRowBuilder()
                .addComponents(selectMenu);

            await interaction.editReply({ content: 'Select a message', components: [actionRow] });

            const filter = i => i.customId === 'goto' && i.user.id === interaction.user.id;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

            collector.on('collect', async i => {
                await i.deferUpdate();
                await interaction.editReply(`[Message ${messageIDs.indexOf(i.values[0]) + 1}](${i.values[0]})`);
                collector.stop();
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await interaction.editReply('The operation has timed out.');
                }
            }
            );

        } catch (error) {
            console.log(error);
            await interaction.editReply('There was an error trying to execute that command!');
        }
    }
}