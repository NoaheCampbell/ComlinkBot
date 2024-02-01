const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
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
            const punisher = await interaction.user.id;
            const isBedrock = ign.startsWith("*");

            let uuid;
            let messageTitle;

            // If the word Alt is detected in the reason, it will ask a follow up ephemeral question about who the main account is and who the alt is
            if (reason.toLowerCase().includes("alt")) {

                await interaction.editReply("Enter the name of the main account:");

                // awaits a response from the user
                await interaction.channel.awaitMessages()
                    .then(async collected => {
                        console.log(collected.first().content);
                        const mainAccount = collected.first().content;

                        await interaction.editReply("Enter the name of the alt account:");

                        await interaction.channel.awaitMessages({ filter: m => m.author.id === interaction.user.id, max: 1, time: 60000, errors: ['time'] })
                            .then(async collected => {
                                const altAccount = collected.first().content;

                                // Makes a GET request to the Mojang API to get the UUID of the player
                                const mainResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${mainAccount}`);
                                const altResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${altAccount}`);

                                const mainUUID = mainResponse.data.id;
                                const altUUID = altResponse.data.id;

                                // Makes a new post in the forum using the forum id
                                messageTitle = `${mainAccount} (${mainUUID}) and ${altAccount} (${altUUID}) `;
                            })
                            .catch(collected => {
                                interaction.editReply('The operation has timed out.');
                                clearTimeout(timeout);
                                return;
                            });
                    })
                   
                clearTimeout(timeout);
                return;
            }

            // Searches to see if the offender already has a ban archive, if so, it will add to the existing thread
            const threads = await forumChannel.threads.fetch();
            for (const [, thread] of threads.threads) {
                if (thread.name.includes(ign)) {
                    const link = thread.url;
                    const messageContent = `Punished by <@${punisher}> for ${reason}. ${duration} ${type}`;
                    await thread.send(messageContent);
                    await interaction.editReply(`Punishment logged at ${link}`);
                    clearTimeout(timeout);
                    return;
                }
            }

            // General punishment message
            if (!isBedrock) {
                // Makes a GET request to the Mojang API to get the UUID of the player
                const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${ign}`);
                
                uuid = response.data.id;

                // Makes a new post in the forum using the forum id
                messageTitle = `${ign} (${uuid}) `;
            } else {
                messageTitle = `${ign}`;
            }
            const link = interaction.options.getString("link");
            let messageContent;

            if (link) {
                messageContent = `Punished by <@${punisher}> for ${reason}. ${duration} ${type} \n \n ${link}`;
            } else {
                messageContent = `Punished by <@${punisher}> for ${reason}. ${duration} ${type}`;
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