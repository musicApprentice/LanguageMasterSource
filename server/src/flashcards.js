const { audioRecognition } = require("./transcription/audioToText.js");
const {stringComparisonPercentage} = require("./transcription/stringSimilarity.js")
const {updateFlashcardForStudent} = require("./classes.js")
const {getClassLanguage} = require("./assignments.js")

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const keyFilename = path.join(__dirname, 'key.json');
const storage = new Storage({ keyFilename });

/**
 * Uploads an audio buffer to Google Cloud Storage and returns the file name.
 * @param {Buffer} audioBuffer - The audio buffer to upload.
 * @param {string} bucketName - The name of the bucket where the file should be uploaded.
 * @returns {Promise<string>} A promise that resolves to the file name.
 */
async function uploadAudioToBucket(audioBuffer, bucketName) {
    const fileName = `audio-${Date.now()}.wav`; // Generate a unique file name
    const file = storage.bucket(bucketName).file(fileName);

    try {
        await file.save(audioBuffer);
        console.log('File uploaded successfully:', fileName);
        return fileName;
    } catch (error) {
        console.error('Failed to upload file:', error);
        throw error;
    }
}

async function generateSignedUrl(bucketName, fileName) {
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    };

    try {
        const [url] = await storage
            .bucket(bucketName)
            .file(fileName)
            .getSignedUrl(options);
        
        console.log('Generated signed URL:', url);
        return url;
    } catch (error) {
        console.error('Error generating signed URL', error);
        throw error;
    }
}



async function getFeedback(curWord, audioBuffer, currentAssignment, currentClass, studentEmail) {
    if (audioBuffer === null) {
        return;
    }
    try {
        const fileName = await uploadAudioToBucket(audioBuffer, 'languagemaster');
        let signedUrl = await generateSignedUrl('languagemaster', fileName);
        // const encodings = ['LINEAR16', 'FLAC', 'MULAW', 'AMR', 'AMR_WB', 'OGG_OPUS', 'SPEEX_WITH_HEADER_BYTE'];
        // const sampleRatesHertz = [8000, 12000, 16000, 24000, 48000];
        const language = await getClassLanguage(currentClass)
        console.log("language for class is", language)
        const transcription = await audioRecognition(signedUrl, language, 'LINEAR16', 16000);
        console.log(transcription)
        let newScore = await stringComparisonPercentage(transcription, curWord);
        console.log(newScore)
        newAverage = await updateFlashcardForStudent(currentClass, currentAssignment, curWord, newScore, studentEmail)
        return {attemptScore: newScore, newAverage: newAverage, transcription: transcription}
                   
    } catch (error) {
        console.error('Error in getting feedback:', error);
        return;
    }

    return {};
}


module.exports = { getFeedback };
