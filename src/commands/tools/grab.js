const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

const forumID = process.env.FORUMID;

// Grabs the attachments and links from the forum channel relating to the offender's ign
module.exports = {
    data: new SlashCommandBuilder()
        .setName("grab")
        .setDescription("Grab attachments and links from the forum channel relating to the offender's ign")
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
            let messages = [];

            for (const message of offenderMessages) {
                messageIDs.push(message.id);
                messages.push(message.content);
            }
            
            // Sorts the messages from oldest to newest
            offenderMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            // Gives the user the option to choose which message they want to use
            const messageOptions = [];
            for (const message of messages) {
                messageOptions.push({ name: message.createdTimestamp, value: message.id });
            }
            
            // If there is only one message, then it will automatically select that message
            if (messageOptions.length === 1) {
                await interaction.editReply({ content: "Thinking..." })
                // Grabs the attachments and links from the offenderMessage if there are any
                if (offenderMessages[0].attachments.size > 0 && offenderMessages[0].embeds.size > 0) {
                    const attachments = offenderMessages[0].attachments.map(attachment => attachment.url);
                    const links = offenderMessages[0].embeds.map(embed => embed.url);

                    // Sends the attachments and links to the user
                    await interaction.editReply({ content: `**Attachments:** ${attachments}\n**Links:** ${links}` })
                } else if (offenderMessages[0].attachments.size > 0) {
                    const attachments = offenderMessages[0].attachments.map(attachment => attachment.url);

                    // Sends the attachments to the user
                    await interaction.editReply({ content: `**Attachments:** ${attachments}` })
                } else if (offenderMessages[0].embeds.size > 0) {
                    const links = offenderMessages[0].embeds.map(embed => embed.url);

                    // Sends the links to the user
                    await interaction.editReply({ content: `**Links:** ${links}` })
                } else {
                    await interaction.editReply({content: "There are no attachments or links for this offense."});
                }
                clearTimeout(timeout);
                return;
            }

            // Create an array of options for the select menu
            let selectOptions = offenderMessages.map((message, index) => {
                return {
                    label: `Offense #${index + 1}`, // the label shown for the option
                    description: message.content, // a snippet of the message content
                    value: message.id // the unique identifier for the selection
                };
            });
            // Create the select menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-offense')
                .setPlaceholder('Select an offense')
                .addOptions(selectOptions);

            // Create the action row
            const actionRow = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.editReply({ content: "Thinking..." })
            // Send the message with the select menu by sending a new message as opposed to editing it
            await interaction.followUp({ content: 'Select an offense', components: [actionRow], ephemeral: true });

            
            // After the user makes their selection, wait for the interaction
            const filter = i => i.customId === 'select-offense' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

            // When the user makes their selection, collect the interaction and stop collecting
            collector.on('collect', async i => {
                await i.deferUpdate();
                collector.stop();
            }
            );

            // Waits for the user to select an option
            const collected = await collector.next;

            // Grabs the message id from the user's selection
            const selectedMessageID = collected.values[0];
            
            // Grabs the message from the offenderMessage array that matches the user's selection
            const offenderMessage = offenderMessages.filter(message => message.id === selectedMessageID)[0];

            // Grabs the attachments and links from the offenderMessage if there are any
            if (offenderMessage.attachments.size > 0 && offenderMessage.embeds.size > 0) {
                const attachments = offenderMessage.attachments.map(attachment => attachment.url);
                const links = offenderMessage.embeds.map(embed => embed.url);

                // Sends the attachments and links to the user
                await interaction.editReply({ content: `**Attachments:** ${attachments}\n**Links:** ${links}`, components: [] })
            } else if (offenderMessage.attachments.size > 0) {
                const attachments = offenderMessage.attachments.map(attachment => attachment.url);

                // Sends the attachments to the user
                await interaction.editReply({ content: `**Attachments:** ${attachments}`, components: [] })
            } else if (offenderMessage.embeds.size > 0) {
                const links = offenderMessage.embeds.map(embed => embed.url);

                // Sends the links to the user
                await interaction.editReply({ content: `**Links:** ${links}`, components: [] })
            } else {
                await interaction.editReply({content: "There are no attachments or links for this offense.", components: [] });
            }

            clearTimeout(timeout);
        } catch (error) {
            console.error(error);
            await interaction.editReply('There was an error trying to execute that command!');
            clearTimeout(timeout);
        }
    }
}
