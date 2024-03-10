const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const moment = require('moment');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 400;
const height = 400;

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

module.exports = { updateGraphMessage };

// Generates a line graph image based on dataPoints and labels
async function generateGraph(dataPoints, labels) {

    // Configuration for the graph
    const configuration = {
        type: 'line',
        data: {
            labels, // Horizontal labels
            datasets: [{
                label: 'Daily Player Count',
                data: dataPoints, 
                fill: false, 
                borderColor: '#4B9CD3', 
                tension: 0.4 
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    // Render the graph to a buffer and save as an image file
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    fs.writeFileSync(path.join(__dirname, 'graph.png'), imageBuffer);
}

// Fetches or generates the data for the graph
async function fetchData() {

    // Placeholder for actual data fetching logic
    const numberOfDays = 7;
    const dataPoints = [5, 10, 15, 10, 20, 30, 25]; // mock data
    const labels = Array.from({ length: numberOfDays }, (_, i) => 
        moment().subtract(i, 'days').format('MM/DD')
    ).reverse(); // Generate labels based on the last 7 days
    
    return { dataPoints, labels };
}

// Reads the stored message ID for the graph message from a JSON file
function readGraphMessageId() {
    const graphMessageIdFilePath = path.join(__dirname, 'graphMessageId.json');
    if (fs.existsSync(graphMessageIdFilePath)) {
        const fileContent = fs.readFileSync(graphMessageIdFilePath, 'utf8');
        const json = JSON.parse(fileContent);
        return json.graphMessageId;
    }
    return null;
}

// Saves the message ID for the graph message to a JSON file for future reference
function saveGraphMessageId(messageId) {
    const graphMessageIdFilePath = path.join(__dirname, 'graphMessageId.json');
    const dataToSave = { graphMessageId: messageId };
    fs.writeFileSync(graphMessageIdFilePath, JSON.stringify(dataToSave, null, 4));
}

// Updates or sends a new graph message in the specified channel
async function updateGraphMessage(channel) {
    const { dataPoints, labels } = await fetchData();
    await generateGraph(dataPoints, labels);

    const graphPath = path.join(__dirname, 'graph.png');
    const fileAttachment = new AttachmentBuilder(graphPath);

    // Embed for presenting the graph and additional info
    const embed = new EmbedBuilder()
        .setTitle('Server Activity Overview')
        .setDescription('Daily Player Count on the Lifesteal Server')
        .setColor(0x0099FF) // Embed color
        .setImage('attachment://graph.png'); // Attach the graph image

    // Check if a graph message already exists
    const messageId = readGraphMessageId();

    if (messageId) {
        try {
            // Attempt to fetch and edit the existing message
            const message = await channel.messages.fetch(messageId);
            await message.edit({ 
                content: "Here's the updated graph:", 
                embeds: [embed], 
                files: [fileAttachment]
            });
            console.log('Graph message updated.');
        } catch (error) {
            // If fetching/editing fails, send a new message
            console.error('Failed to update the graph message, sending a new one:', error);
            sendNewGraphMessage(channel, embed, fileAttachment);
        }
    } else {
        // If no existing message ID found, send a new graph message
        sendNewGraphMessage(channel, embed, fileAttachment);
    }
}

// Helper function to send a new graph message and save its message ID
async function sendNewGraphMessage(channel, embed, fileAttachment) {
    const message = await channel.send({ 
        content: "Here's the latest graph:", 
        embeds: [embed], 
        files: [fileAttachment] 
    });
    saveGraphMessageId(message.id); // Save the new message ID for future reference
    console.log('New graph message sent and ID saved.');
}