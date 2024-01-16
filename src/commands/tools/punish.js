const { Client, GatewayIntentBits, PermissionFlagsBits, Partials, SlashCommandBuilder } = require('discord.js');
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

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
        // Defers the reply so the bot doesn't time out
        await interaction.deferReply();
        // Goes to mcuuid and gets the UUID of the player
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        const url = `https://mcuuid.net/?q=${interaction.options.getString("ign")}`;
        await page.goto(url);
        const html = await page.content();
        const $ = cheerio.load(html);

        // Looks for an input with the id of results_id and gets the value of the first one
        const uuid = $("#results_id").val();
        // Closes the browser
        await browser.close();
        console.log(uuid);

        interaction.editReply(
        `Punishment type: ${interaction.options.getString("type")} 
IGN: ${interaction.options.getString("ign")}
UUID: ${uuid}
Duration: ${interaction.options.getString("duration")}
Reason: ${interaction.options.getString("reason")}`);
    }
}