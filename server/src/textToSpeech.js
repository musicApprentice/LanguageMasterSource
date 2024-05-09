const textToSpeech = require('@google-cloud/text-to-speech');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const util = require('util');

const keyFilename = path.join(__dirname, 'key.json'); // Path to your JSON key file
const client = new textToSpeech.TextToSpeechClient({ keyFilename });
const storage = new Storage({ keyFilename });

// Language configurations as you defined
const languageConfigs = {
    'Arabic': { languageCode: 'ar-SA', sampleRate: 16000, encoding: 'LINEAR16' },
    'Chinese (Simplified)': { languageCode: 'zh-CN', sampleRate: 16000, encoding: 'LINEAR16' },
    'Chinese (Traditional)': { languageCode: 'zh-TW', sampleRate: 16000, encoding: 'LINEAR16' },
    'Danish': { languageCode: 'da-DK', sampleRate: 16000, encoding: 'LINEAR16' },
    'Dutch': { languageCode: 'nl-NL', sampleRate: 16000, encoding: 'LINEAR16' },
    'English (Australia)': { languageCode: 'en-AU', sampleRate: 16000, encoding: 'LINEAR16' },
    'English (United Kingdom)': { languageCode: 'en-GB', sampleRate: 16000, encoding: 'LINEAR16' },
    'English (India)': { languageCode: 'en-IN', sampleRate: 16000, encoding: 'LINEAR16' },
    'English (United States)': { languageCode: 'en-US', sampleRate: 25050, encoding: 'LINEAR16' },
    'Finnish': { languageCode: 'fi-FI', sampleRate: 16000, encoding: 'LINEAR16' },
    'French': { languageCode: 'fr-FR', sampleRate: 16000, encoding: 'LINEAR16' },
    'German': { languageCode: 'de-DE', sampleRate: 16000, encoding: 'LINEAR16' },
    'Greek': { languageCode: 'el-GR', sampleRate: 16000, encoding: 'LINEAR16' },
    'Hebrew': { languageCode: 'he-IL', sampleRate: 16000, encoding: 'LINEAR16' },
    'Hindi': { languageCode: 'hi-IN', sampleRate: 16000, encoding: 'LINEAR16' },
    'Hungarian': { languageCode: 'hu-HU', sampleRate: 16000, encoding: 'LINEAR16' },
    'Indonesian': { languageCode: 'id-ID', sampleRate: 16000, encoding: 'LINEAR16' },
    'Italian': { languageCode: 'it-IT', sampleRate: 16000, encoding: 'LINEAR16' },
    'Japanese': { languageCode: 'ja-JP', sampleRate: 16000, encoding: 'LINEAR16' },
    'Korean': { languageCode: 'ko-KR', sampleRate: 16000, encoding: 'LINEAR16' },
    'Norwegian': { languageCode: 'no-NO', sampleRate: 16000, encoding: 'LINEAR16' },
    'Polish': { languageCode: 'pl-PL', sampleRate: 16000, encoding: 'LINEAR16' },
    'Portuguese (Brazil)': { languageCode: 'pt-BR', sampleRate: 16000, encoding: 'LINEAR16' },
    'Portuguese (Portugal)': { languageCode: 'pt-PT', sampleRate: 16000, encoding: 'LINEAR16' },
    'Romanian': { languageCode: 'ro-RO', sampleRate: 16000, encoding: 'LINEAR16' },
    'Russian': { languageCode: 'ru-RU', sampleRate: 16000, encoding: 'LINEAR16' },
    'Spanish (Spain)': { languageCode: 'es-ES', sampleRate: 16000, encoding: 'LINEAR16' },
    'Spanish (Mexico)': { languageCode: 'es-MX', sampleRate: 16000, encoding: 'LINEAR16' },
    'Swedish': { languageCode: 'sv-SE', sampleRate: 16000, encoding: 'LINEAR16' },
    'Thai': { languageCode: 'th-TH', sampleRate: 16000, encoding: 'LINEAR16' },
    'Turkish': { languageCode: 'tr-TR', sampleRate: 16000, encoding: 'LINEAR16' },
    'Vietnamese': { languageCode: 'vi-VN', sampleRate: 16000, encoding: 'LINEAR16' },

};

/**
 * Converts text to audio and uploads it to Google Cloud Storage.
 * @param {Array} items - The items to process.
 * @param {string} bucketName - The name of the Google Storage bucket.
 * @returns {Promise<Array>} - The updated items with audio URLs.
 */
async function processItems(items, bucketName, language) {
    for (const item of items) {
        const config = languageConfigs[language];
        const request = {
            input: { text: item.wordName },
            voice: { languageCode: config.languageCode, ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: config.sampleRate },
        };

        try {
            // Convert text to speech
            const [response] = await client.synthesizeSpeech(request);

            // Create a buffer for the audio content
            const audioBuffer = Buffer.from(response.audioContent, 'binary');

            // Upload the buffer directly
            const fileName = `audio-${Date.now()}.wav`;
            const file = storage.bucket(bucketName).file(fileName);
            await file.save(audioBuffer);

            // Generate public URL for the uploaded file
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

            // Update the item with the audio file URL
            item.audioFile = publicUrl;
            console.log(`Processed and uploaded ${item.wordName}`);
        } catch (error) {
            console.error('Error processing item:', item, error);
        }
    }
    return items;
}

// Example usage: replace 'your-bucket-name' with your actual bucket name
const items = [
    {
        wordName: '採菊東籬下，悠然見南山 。\n',
        englishTranslation: 'I pick the chrysanthemums under the eastern fence, leisurely, I see the south mountain',
        audioFile: null
    },
    {
        wordName: '山氣日夕佳，飛鳥相與還 。\n',
        englishTranslation: 'The mountain mist at dusk is sublime, the flying birds, with me return home',
        audioFile: null
    }
];

processItems(items, 'languagemasterreference').then(updatedItems => {
    console.log('All items processed:', updatedItems);
}).catch(console.error);

module.exports = {processItems}
