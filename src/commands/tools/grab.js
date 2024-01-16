const { Client, GatewayIntentBits, PermissionFlagsBits, Partials, SlashCommandBuilder } = require('discord.js');
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
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
            let offenderMessage = null;

            for (const [, thread] of threads.threads) {
                // Fetch messages from each thread
                const messages = await thread.messages.fetch({ limit: 50 }); // Adjust the limit as needed

                // Search through messages for the specific content
                for (const [, message] of messages) {
                    if (message.content.toLowerCase().includes(reason) && thread.name.toLowerCase().includes(ign)) {
                        offenderMessage = message;
                        break;
                    }
                }

                if (offenderMessage) break; // Stop searching if you've found the message
            }
            
            // Grabs the messageid from the offenderMessage
            const messageID = offenderMessage.lastMessageID;
            
            offenderMessage = await (forumChannel.threads.cache.find(thread => thread.name.toLowerCase().includes(ign)).messages.fetch(messageID));
            
            
            // Grabs the attachments and links from the offenderMessage
            const attachments = offenderMessage.first().attachments.map(attachment => attachment.url);
            const links = offenderMessage.first().embeds.map(embed => embed.url);

            if (attachments.length > 0 && links.length > 0) {
                // Sends the attachments and links to the user
                await interaction.editReply({ content: `**Attachments:** ${attachments}\n**Links:** ${links}` })
            } else if (attachments.length > 0) {
                await interaction.editReply({ content: `**Attachments:** ${attachments}` })
            } else if (links.length > 0) {
                await interaction.editReply({ content: `**Links:** ${links}` })
            } else {
                await interaction.editReply({ content: `There is no relevant media involving this ticket` })
            }

            clearTimeout(timeout);
        } catch (error) {
            console.error(error);
            await interaction.editReply('There was an error trying to execute that command!');
            clearTimeout(timeout);
        }
    }
}
