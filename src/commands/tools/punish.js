const { Client, GatewayIntentBits, PermissionFlagsBits, Partials, SlashCommandBuilder } = require('discord.js');
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
require('dotenv').config();

const forumID = process.env.FORUMID;

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
        )
        .addAttachmentOption(option =>
            option.setName("attachment")
            .setDescription("The proof of the punishment (e.g., a screenshot)")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("link")
            .setDescription("The proof of the punishment (e.g., a link to a screenshot)")
            .setRequired(false)
        ),

    async execute(interaction) {
        
        await interaction.deferReply();

        const timeout = setTimeout(async () => {
            await interaction.editReply('The operation has timed out.');
        }, 10000); // Set timeout for 10 seconds


        try {
            const ign = interaction.options.getString("ign");
            const type = interaction.options.getString("type");
            const reason = interaction.options.getString("reason");
            const duration = interaction.options.getString("duration");

            const forumChannel = await interaction.client.channels.fetch(forumID);

            // Goes to mcuuid and gets the UUID of the player
            const browser = await puppeteer.launch({ headless: "new" });
            const page = await browser.newPage();
            const url = `https://mcuuid.net/?q=${ign}`;
            await page.goto(url);
            const html = await page.content();
            const $ = cheerio.load(html);

            // Looks for an input with the id of results_id and gets the value of the first one
            const uuid = $("#results_id").val();
            // Closes the browser
            await browser.close();

            // Makes a new post in the forum using the forum id
            const messageTitle = `${ign} (${uuid}) `;
            const link = interaction.options.getString("link");
            let messageContent;

            if (link) {
                messageContent = `${reason}. ${duration} ${type} \n \n ${link}`;
            } else {
                messageContent = `${reason}. ${duration} ${type}`;
            }
            
            

            // Adds the attachment and link to the post if there is one
            const attachment = interaction.options.getAttachment("attachment");

            let thread;
            if (attachment) {

                thread = await forumChannel.threads.create({
                    name: messageTitle,
                    autoArchiveDuration: 1440,
                    reason: "New punishment",
                    message: {
                        content: messageContent,
                        files: [attachment]
                    }
                });

            } else {
                
                thread = await forumChannel.threads.create({
                    name: messageTitle,
                    autoArchiveDuration: 1440,
                    reason: "New punishment",
                    message: {
                        content: messageContent
                    }
                });
            }

            // Grabs the message link of the newly made thread
            const threadLink = thread.url;

            await interaction.editReply(`Punishment logged at ${threadLink}`);
            clearTimeout(timeout);
        } catch (error) {
            console.log(error);
            await interaction.editReply("An error has occured. Please try again later.");
            clearTimeout(timeout);
        }
    }
}