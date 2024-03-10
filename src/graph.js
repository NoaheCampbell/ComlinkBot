const moment = require('moment');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');

module.exports = { updateGraphMessage };

/**
 * Creates a graph showing the highest player count on the Lifesteal server
 * across every day. This can be used to track overall player retention and find trends
 * that increase or decrease the active playerbase.
 */

const width = 400; // Width of the graph
const height = 400; // Height of the graph
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

async function generateGraph() {
    // Determine the number of days you want to show in the graph
    const numberOfDays = 7;
    const labels = [];

    // Generate labels for the last numberOfDays days
    for (let i = numberOfDays - 1; i >= 0; i--) {
        labels.push(moment().subtract(i, 'days').format('MM/DD')); // Format the date as you like
    }

    // Example data points - you'll replace this with your actual data fetching logic
    const dataPoints = [5, 10, 15, 10, 20, 30, 25]; // Ensure this array has the same length as `labels`

    const configuration = {
        type: 'line',
        data: {
            labels: labels, // Use the dynamically generated labels
            datasets: [{
                label: 'Daily Points',
                data: dataPoints,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    fs.writeFileSync(path.join(__dirname, 'graph.png'), imageBuffer); // Save the graph image
}

// Defines or uses the existing function to update the graph message
async function updateGraphMessage(channel) {
    await generateGraph(); // Ensure the graph image is up to date
    
    const graphPath = path.join(__dirname, 'graph.png');
    
    // Determine if a new message needs to be sent or an existing one updated
    const messageId = readGraphMessageId();
    if (messageId) {
        try {
            // Try fetching the existing message using the saved ID
            const message = await channel.messages.fetch(messageId);
            // If successful, update the message
            await message.edit({ content: "Highest Player Count per Day:", files: [graphPath] });
            console.log('Graph message updated.');
        } catch (error) {
            // If the message doesn't exist (error code 10008), send a new one
            if (error.code === 10008) {
                console.error('Failed to update the graph message, sending a new one:', error);
                await sendNewGraphMessage(channel, graphPath);
            } else {
                // Log other errors for debugging
                console.error('An error occurred while updating the graph message:', error);
            }
        }
    } else {
        // If no message ID is stored, send a new message
        await sendNewGraphMessage(channel, graphPath);
    }
}


// Define the path to the JSON file
const graphMessageIdFilePath = path.join(__dirname, 'graphMessageId.json');

function readGraphMessageId() {
    // Check if the file exists
    if (fs.existsSync(graphMessageIdFilePath)) {
        // Read the file
        const fileContent = fs.readFileSync(graphMessageIdFilePath, 'utf8');
        try {
            const json = JSON.parse(fileContent);
            return json.graphMessageId; // Return the stored message ID
        } catch (error) {
            console.error('Error parsing JSON from file:', error);
            return null;
        }
    }
    return null; // Return null if the file doesn't exist or reading failed
}

function saveGraphMessageId(messageId) {
    // Create an object to save
    const dataToSave = { graphMessageId: messageId };
    try {
        // Convert the object to a JSON string
        const jsonString = JSON.stringify(dataToSave, null, 4);
        // Write the JSON string to the file
        fs.writeFileSync(graphMessageIdFilePath, jsonString, 'utf8');
        console.log('Graph message ID saved successfully.');
    } catch (error) {
        console.error('Error saving graph message ID:', error);
    }
}

async function sendNewGraphMessage(channel, graphPath) {
    try {
        // Send a new message with the graph image attached
        const message = await channel.send({
            content: "Here's the latest graph:", // Optional: Add any text you want to accompany the graph
            files: [graphPath] // Attach the graph image from the specified path
        });

        // Save the ID of the message for future updates
        saveGraphMessageId(message.id);
        console.log('Graph message sent and ID saved.');
    } catch (error) {
        // Log any errors for debugging
        console.error('Error sending new graph message:', error);
    }
}