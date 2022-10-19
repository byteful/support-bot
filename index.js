require('dotenv').config()
const Discord = require('discord.js');
const PayPal = require('paypal-node-sdk');
const fs = require('fs');
const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, ModalBuilder, TextInputBuilder, TextInputStyle} = require("discord.js");
const bot = new Discord.Client({intents: 32767});
const config = JSON.parse(fs.readFileSync("config.json", {encoding: "UTF-8"}));

bot.on(Events.ClientReady, async () => {
    let c = await bot.channels.fetch(config["verify-channel-id"])
    let msgId = config["verify-message-id"];
    if(!msgId || !(await doesMessageExist(c, msgId))) {
        sendVerifyMessage()
    }
});

bot.on(Events.InteractionCreate, interaction => {
    if (interaction.customId === 'verify-form') {
        interaction.reply({ content: 'The provided information will now be processed. If valid, you will receive a role soon!', ephemeral: true });
        const transactionId = interaction.fields.getTextInputValue('transactionId');
        console.log(transactionId);
    }

    if(interaction.customId === 'verify-button') {
        const modal = new ModalBuilder()
            .setCustomId('verify-form')
            .setTitle('Premium Plugin Verification');

        const transactionIdInput = new TextInputBuilder()
            .setCustomId('transactionId')
            .setLabel("Please provide your PayPal transaction ID.")
            .setStyle(TextInputStyle.Short);

        const transactionId = new ActionRowBuilder().addComponents(transactionIdInput);

        // Add inputs to the modal
        modal.addComponents(transactionId);

        interaction.showModal(modal);
    }
});

bot.login(process.env["BOT_TOKEN"]).then(() => console.log("Logged in!"));

function saveConfig() {
    fs.writeFileSync("config.json", JSON.stringify(config), {encoding: "UTF-8"})
}

async function doesMessageExist(c, id) {
    try {
        await c.messages.fetch(id)
        return true;
    } catch (ignored) {
        return false;
    }
}

function sendVerifyMessage() {
    bot.channels.fetch(config["verify-channel-id"]).then(c => {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify-button')
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Primary)
            );

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('**Verification for Premium Resource Support**')
            .setDescription('Hello! Here you can verify yourself that you have purchased a certain resource so you may receive support. If you make a ticket, and you have not verified, I will ask you to do so before I help you. You will need to type the PayPal transaction ID.');

        c.send({ ephemeral: true, embeds: [embed], components: [row] }).then(msg => {
            config["verify-message-id"] = msg.id;
            saveConfig()
        });
    });
}