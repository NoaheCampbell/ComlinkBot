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
        ),

    async execute(interaction) {
        
        await interaction.deferReply();

        const timeout = setTimeout(async () => {
            await interaction.editReply('The operation has timed out.');
        }, 10000); // Set timeout for 10 seconds

        const ign = interaction.options.getString("ign");

        try {

            // Goes to the forumid channel and looks for a post with the offender's ign
            const forumChannel = await interaction.client.channels.fetch(forumID);
            const messages = await forumChannel.threads.fetch({ limit: 100 });
            let offenderMessage;

            for (const message of messages.threads) {
                // if the current message contains the offender's ign, set the offenderMessage to that message
                if (message[1].name.includes(ign)) {
                    offenderMessage = message[1];
                    break;
                }
            }
            
            // Grabs the messageid from the offenderMessage
            const messageID = offenderMessage.lastMessageID;
            
            offenderMessage = await (forumChannel.threads.cache.find(thread => thread.name.includes(ign)).messages.fetch(messageID));
            
            
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
