const e = require('cors');
const { MongoClient } = require('mongodb');
const { TextEncoder } = require('util');
const {processItems} = require("./textToSpeech.js")


const connectionString = "mongodb+srv://mkandeshwara:1234@cluster0.tefxjrp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(connectionString);

//Created by Shuto
//Updated by Jason 5/7/2024
//Updated to update student metrics when a new assignment is created
async function createAssignment(className, assignmentName, assignmentArray) {
    let language = await getClassLanguage(className)
    let urlsAddedArray = await processItems(assignmentArray, "languagemasterreference", language)
    let createdAssignment = false;
    try {
        await client.connect();
        const db = client.db(className);
        const assignmentsCollection = db.collection("assignments");
        const studentsCollection = db.collection("students");
        const metricsCollection = db.collection("metrics");

        if ((await assignmentsCollection.find({ assignment: assignmentName }).toArray()).length === 0 && assignmentArray.length > 0) {
            const flashcards = convertAssignmentToDtbForm(assignmentName, urlsAddedArray);
            for (const flashcard of flashcards) {
                await assignmentsCollection.insertOne(flashcard);
            }
            createdAssignment = true;

            // Fetch all enrolled students
            const students = await studentsCollection.find().toArray();

            // Update metrics for all enrolled students
            const metricsUpdatePromises = students.map(student => {
                return flashcards.map(flashcard => {
                    const metricQuery = {
                        studentEmail: student.email,
                        assignment: assignmentName,
                        card: flashcard.card
                    };
                    const metricUpdate = {
                        $setOnInsert: { timesPracticed: 0, score: 0 }
                    };
                    return metricsCollection.updateOne(metricQuery, metricUpdate, { upsert: true });
                });
            }).flat();

            await Promise.all(metricsUpdatePromises);
        }
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
    return createdAssignment;
}

// Quoc
function checkValid(className) {
    const regex = /^[^ ]+\_[^ ]{1,6}$/;
    if (className.match(regex)) {
        return true;
    }
    return false;
}

// Shuto

// Shuto
function convertAssignmentToDtbForm(assignmentName, assignmentArray) {
    return assignmentArray.map((flashcard, index) => ({
        assignment: assignmentName,
        card: index,
        text: flashcard.wordName,  // Changed from flashcard.text to flashcard.wordName
        translation: flashcard.englishTranslation,  // Changed from flashcard.translation to flashcard.englishTranslation
        audio: flashcard.audioFile  // Changed from flashcard.audio to flashcard.audioFile
    }));
}

// Maya
async function addToAssignment(className, assignmentName, card) {
    let inserted = false;
    try {
        await client.connect();
        const db = client.db(className);
        let col = db.collection("teachers");
        const teachers = await col.find().toArray();
        if(teachers.length === 0){
            throw("Class does not exist");
        }
        col = db.collection("assignments");
        const cardNum = (await col.find({ assignment: assignmentName }).toArray()).length;
        if(cardNum === 0){
            throw("Assignment does not exist");
        }
        await col.insertOne({ assignment: assignmentName, card: cardNum, ...card });

        col = db.collection("students");
        let students = await col.find().toArray();

        col = db.collection("metrics");

        for(let i = 0; i < students.length; i++){
            await col.insertOne({studentEmail: students[i].email, assignment: assignmentName, card: cardNum, timesPracticed: 0, score: 0});
        }

        inserted = true;
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
    return inserted;
}

//Jason
async function getAllAssignments(className) {
    let assignmentSummary = [];
    try {
        await client.connect();
        const db = client.db(className);
        const col = db.collection("assignments");

        // Aggregation pipeline to group by assignment and count terms
        assignmentSummary = await col.aggregate([
            {
                $group: {
                    _id: "$assignment",  // Grouping by the assignment name
                    termCount: { $count: {} }  // Counting the number of documents (cards) in each group
                }
            },
            {
                $project: {
                    _id: 0, // Excluding the _id from the results
                    name: "$_id", // Mapping the _id (which is the assignment name) to 'name'
                    termCount: 1 // Including the term count
                }
            }
        ]).toArray();

        if (assignmentSummary.length === 0) {
            throw new Error("No assignments found");
        }
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
    return assignmentSummary;
}

// Maya
async function viewAssignment(className, assignmentName) {
    let cards = [];
    try {
        await client.connect();
        const db = client.db(className);
        let col = db.collection("teachers");
        const teachers = await col.find().toArray();
        // If there are no teachers assigned to the class, then it doesn't exist
        if(teachers.length === 0){
            throw("Class does not exist");
        }
        col = db.collection("assignments");
        cards = await col.find({ assignment: assignmentName }).toArray();
        if (cards.length === 0) {
            throw("Assignment does not exist");
        }
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
    return cards.map(e => ({ wordName: e.text, englishTranslation: e.translation, audioFile: e.audio }));
}

// Quoc
async function deleteAssignment(className, assignmentName) {
    try {
        await client.connect();
        const db = client.db(className);
        const col = db.collection("assignments");
        const col1 = db.collection("metrics");
        if ((await col.find({ assignment: assignmentName }).toArray()).length > 0) {
            await col.deleteMany({ assignment: assignmentName });
            await col1.deleteMany({assignment : assignmentName});
            console.log("The assignment has been deleted");
        } else {
            throw("Assignment does not exist");
        }

    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
}


// Quoc
async function deleteFromAssignment(className,assignmentName,flashcard_Object){
    try{
      await client.connect();
      if(checkValid(className)){
        db = client.db(className);
        col = await db.collection("assignments");
        const presence = await col.find({assignment: assignmentName}).toArray();
        if(presence.length >0){
          await col.deleteMany({$and: [{assignment: assignmentName},{text: flashcard_Object.text}, {translation: flashcard_Object.translation},{audio: flashcard_Object.audio}]})
        console.log("Done!!!");
        }
        else{
          throw("No data");
        }
      }
      else{
        throw("Invalid className");
      }

    }
    catch(err){
      console.log(err);
    }
    finally{
      await client.close();
    }

  }

//   Maya Kandeshwarath 4/30/2024
// Input: className: String, exact name of class in the database
//        assignmentName: String, exact name of assignment in the database
// Output: array of objects {studentEmail, wordName, englishTranslation, grade}
async function getAllStudentData(className, assignmentName){
    let grades = [];
    try{
        await client.connect();
        let db = client.db(className);

        // Check if there are teachers to tell if the class exists
        let col = db.collection("teachers");
        if((await col.find().toArray()).length === 0){
            throw("Class does not exist");
        }

        // Check that the assignment exists
        col = db.collection("metrics");
        if((await col.find({assignment: assignmentName}).toArray()).length === 0){
            throw("Assignment does not exist");
        }
        const pipeline = [{$lookup: {from: "assignments", pipeline: [{$match: {assignment: assignmentName}}], localField: "card", foreignField: "card", as: "grades"}}, {$replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$grades", 0 ] }, "$$ROOT" ] } }}, {$match: {assignment: assignmentName}}, {$project: {_id: 0, grades: 0, audio: 0, timesPracticed: 0, assignment: 0, card: 0}}];

        let g = await col.aggregate(pipeline);
        while(await g.hasNext()){
            grades.push(await g.next());
        }

    }
    catch(err){
        console.log(err);
    }
    finally{
        await client.close();
        return grades.map(e => {return {studentName: e.studentEmail, wordName: e.text, englishTranslation: e.translation, grade: e.score};});
    }
}

async function viewStudentAssignment(className, assignmentName, email){
    let grades = [];
    try{
        await client.connect();
        let db = client.db(className);

        // Check if there are teachers to tell if the class exists
        let col = db.collection("teachers");
        if((await col.find().toArray()).length === 0){
            throw("Class does not exist");
        }

        // Check that the assignment exists
        col = db.collection("metrics");
        if((await col.find({assignment: assignmentName}).toArray()).length === 0){
            throw("Assignment does not exist");
        }
        const pipeline = [{$match: {studentEmail: email}}, {$lookup: {from: "assignments", pipeline: [{$match: {assignment: assignmentName}}], localField: "card", foreignField: "card", as: "grades"}}, {$replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$grades", 0 ] }, "$$ROOT" ] } }}, {$match: {assignment: assignmentName}}, {$project: {_id: 0, grades: 0, assignment: 0, card: 0, studentEmail: 0, timesPracticed: 0}}];

        let g = await col.aggregate(pipeline);
        while(await g.hasNext()){
            grades.push(await g.next());
        }

    }
    catch(err){
        console.log(err);
    }
    finally{
        await client.close();
        return grades.map(e => {return {wordName: e.text, englishTranslation: e.translation, audioFile: e.audio, score: e.score};});
    }
}


async function getClassLanguage(className) {
    console.log(className)
    try {
        await client.connect();
        const db = client.db(className);
        const col = db.collection("teachers");

        // Fetch the last document in the "teachers" collection
        const lastEntry = await col.find().sort({_id: -1}).limit(1).toArray();
        if (lastEntry.length > 0) {
            languageName = lastEntry[0].language_name;
        }
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
    console.log(languageName)
    return languageName;
}

module.exports = {
    createAssignment, getClassLanguage, addToAssignment, viewAssignment, deleteAssignment, getAllAssignments, convertAssignmentToDtbForm, deleteFromAssignment, getAllStudentData, viewStudentAssignment
};
