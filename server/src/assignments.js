const { MongoClient } = require('mongodb');
const { TextEncoder } = require('util');

const connectionString = "mongodb+srv://mkandeshwara:0CgF5I8hwXaf88dy@cluster0.tefxjrp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&ssl=true";
const client = new MongoClient(connectionString);

// Quoc
function checkValid(className) {
   const regex = /^[^ ]+\_[^ ]{1,6}$/;
    if (className.match(regex)) {
        return true;
    }
    return false;
}
// Shuto
async function createAssignment(className, assignmentName, assignmentArray) {
    let createdAssignment = false;
    try {
        await client.connect();
        const db = client.db(className);
        const col = db.collection("assignments");
        if ((await col.find({ assignment: assignmentName }).toArray()).length === 0 && assignmentArray.length > 0) {
            for (const flashcard of convertAssignmentToDtbForm(assignmentName, assignmentArray)) {
                await col.insertOne(flashcard);
            }
            createdAssignment = true;
        }
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
    return createdAssignment;
}

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

module.exports = {
    createAssignment, addToAssignment, viewAssignment, deleteAssignment, getAllAssignments, convertAssignmentToDtbForm, deleteFromAssignment
};
