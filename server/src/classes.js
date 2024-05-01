const { MongoClient } = require('mongodb');
const { TextEncoder } = require('util');

const connectionString = "mongodb+srv://mkandeshwara:0CgF5I8hwXaf88dy@cluster0.tefxjrp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&ssl=true";
const client = new MongoClient(connectionString);

// Quoc
function checkValid(className) {
    const regex = /^[^ ]{1,}$/;
    if (className.match(regex)) {
        return true;
    }
    return false;
}

// Maya
async function getStudentsInClass(className) {
    let students = [];
    try {
        await client.connect();
        let db = client.db(className);
        const teachers = await db.collection("teachers").find().toArray();
        if (teachers.length === 0) {
            throw("Class does not exist");
        } else {
            let col = db.collection("students");
            students = await col.find().toArray();
        }
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
    return students;
}

// Maya
async function getTeachersInClass(className) {
    let teachers = [];
    try {
        await client.connect();
        let db = client.db(className);
        let col = db.collection("teachers");
        teachers = await col.find().toArray();
        if (teachers.length === 0) {
            throw("Class does not exist");
        }
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
    return teachers;
}
//Quoc
function create_unique_id_for_class(class_name,c_allCourses){
  const default_code = "000000";
  const arr_of_ID = c_allCourses.filter(e =>{
    const index_of_underscore = e.indexOf("_");
    return (index_of_underscore >=0 && Number.isInteger(parseInt(e.substring(index_of_underscore + 1, e.length))));
  }).map(e =>{
    const index_of_underscore = e.indexOf("_");
    return (parseInt(e.substring(index_of_underscore+1, e.length)) - 0);
  });
  const length_of_array_of_course = c_allCourses.length;
  let class_code;
  let i;
  for(i = 0; i<length_of_array_of_course; i++){
    if(arr_of_ID.indexOf(i)== -1){
      class_code = i;
      break;
    }
  }
  if(i == length_of_array_of_course){
    class_code = length_of_array_of_course + 1;
  }
  const modified_code = default_code.substring(0,default_code.length - (class_code + "").length) + class_code + "";
  const unique_id = class_name + "_" + modified_code;
  return unique_id;
}


// Quoc
async function createClass(className, teacherEmail, language){
  // Add class to the teacher's course List
  try{
  await client.connect();
  db = client.db("UserData");
  col = await db.collection("teachers");
  const teacher_info = await col.find({email: teacherEmail}).toArray();

 //console.log(getTeacherInfo[0]);
  const checkTheValidOfClassName = checkValid(className);
  const allCoursesPipeline = [
    {
      $unwind: {
         path: "$courseList",
         preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: null,
        allCourses: {
          "$push": "$courseList"
        }
      }
    },
    {'$addFields': {'courseList': {'$setUnion': ['$fcourseList', []]}}}
  ];

// Use query, set output to courses to be used later
let courses = await col.aggregate(allCoursesPipeline);
// courses is not a variable or list or anything that js can output, it's a MongoDB cursor
// This is part of how to access the info in it
c = await courses.next();
//console.log("The index of the given class name is: " + c.allCourses.indexOf(className));
//console.log(c.allCourses);

if(checkTheValidOfClassName && teacher_info.length ==1){
  await client.connect();
  db = client.db("UserData");
  col = await db.collection("teachers");
  //create a class data base based on the given name

  const className_on_data_base = create_unique_id_for_class(className,c.allCourses);
   await updateClassForGivenTeacher(col, teacherEmail, className_on_data_base);
   MongoClient.connect(connectionString).then(async (client) => {

    //console.log('Database is being created ... ');

    // database name
    const db = client.db(className_on_data_base);

    // collection name
    db.createCollection("assignments");
    db.createCollection("metrics");
    db.createCollection("students");
    db.createCollection("teachers");
    //console.log("Success!!")
    //Add teacher to the new class
    col = db.collection("teachers");
    await col.insertOne(teacher_info[0]);
    await col.insertOne({"language_name" : language});
    await client.close();


   })
}
  else{
    throw("inValid class name");
  }
}
  catch(err){
    throw (err);
  }
  finally{
    await client.close();
  }
}
 

  // Quoc
async function updateClassForGivenTeacher(col, teacherEmail, className) {
    let courseL = await col.find({ email: teacherEmail }).toArray();
    let originalCourse = courseL[0].courseList;
    if (originalCourse.indexOf(className) === -1) {
        originalCourse.push(className);
    }
    await col.updateOne({ email: teacherEmail }, { $set: { courseList: originalCourse } });
}

// Shuto
async function getClassesTeacher(teacherEmail) {
    try {
      await client.connect();
      const db = client.db("UserData");
      const col = db.collection("teachers");
      const result = await col.findOne({email: teacherEmail.trim() });
      if (result) {
        return result.courseList || [];
      } else {
        return [];
      }
    } finally {
      await client.close();
    }
  }
  
  // Shuto
  async function getClassesStudent(studentEmail) {
    try {
      await client.connect();
      const db = client.db("UserData");
      const col = db.collection("students");
      const result = await col.findOne({email: studentEmail.trim() });
      if (result) {
        return result.courseList || [];
      } else {
        return [];
      }
    } finally {
      await client.close();
    }
  }

  // Quoc
  async function find_class_based_on_ID(classID){
    await client.connect();
    db = client.db("UserData");
    col = await db.collection("teachers");
   //console.log(getTeacherInfo[0]);
    const allCoursesPipeline = [
      {
        $unwind: {
           path: "$courseList",
           preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: null,
          allCourses: {
            "$push": "$courseList"
          }
        }
      },
      {'$addFields': {'courseList': {'$setUnion': ['$fcourseList', []]}}}
    ];
  
  // Use query, set output to courses to be used later
  let courses = await col.aggregate(allCoursesPipeline);
  // courses is not a variable or list or anything that js can output, it's a MongoDB cursor
  // This is part of how to access the info in it
  c = await courses.next();
  const test = c.allCourses.filter((e) => {
    const index = e.indexOf("_");
   return e.substring(index+1, e.length) == classID;
  })[0];
  return test;
  }

  // Quoc
async function enrollClass(classID, studentEmail){
  try{
  const neededData =  await find_class_based_on_ID(classID);
   if(neededData && checkValid(neededData)){
    await client.connect();
  db = client.db("UserData");
  col = await db.collection("students");
  db1 = client.db(neededData);
  col1 = await db1.collection("assignments");
  col2 = await db1.collection("metrics");
  array_of_assignment = await col1.find().toArray();
  array_of_assignment = await col1.find().toArray();
  array_of_assignment = array_of_assignment.map(e => {
    const object = {"studentEmail": studentEmail, "assignment": e.assignment, "card" : e.card, "timesPracticed": 0, "score": 0}
    return object;
   });
   if(array_of_assignment.length >0){
  await col2.insertMany(array_of_assignment);
   }
     let student_Data = await col.find({email: studentEmail}).toArray();
     let student_courses = student_Data[0].courseList;
     if(student_courses.indexOf(neededData) == -1){
       student_courses.push(neededData);
        await col.updateOne({email:studentEmail}, {$set:{courseList: student_courses}});
        db1 = client.db(neededData);
        col1 = await db1.collection("students");
        await col1.insertOne(student_Data[0]);
      }
      else{
        throw("The class already exist");
      }

  }
  else{
    throw("Invalid class");
  }
  } catch(err){
  console.log(err);
   }
  finally{
  await client.close();
  }

  }
async function updateFlashcardForStudent(className, assignmentName, flashcardName, newScore, studentEmail){
   try{
    await client.connect();
    db1 = client.db(className);
   col = await db1.collection("assignments");
   col1 = await db1.collection("metrics");
   const flash_card = await col.find({$and:[{"assignment": assignmentName},{"text": flashcardName}]}).toArray();
   const student_flash_card = (await col1.find({$and:[{"assignment": assignmentName},{"card": flash_card[0].card}]}).toArray())[0];
   const new_time_practice = student_flash_card.timesPracticed + 1;
   const update_Score = (student_flash_card.score * student_flash_card.timesPracticed + newScore)/new_time_practice;
   //update flash_card
   await col1.updateOne({$and:[{"studentEmail" : studentEmail},{"assignment": assignmentName},{"card": flash_card[0].card}]},{$set:{"timesPracticed" : new_time_practice, "score": update_Score}});
   }
  catch(err){
    console.log(err);
  }
finally{
  await client.close();
}
  }
module.exports = { create_unique_id_for_class,
    enrollClass, getClassesStudent, getClassesTeacher, createClass, getStudentsInClass, getTeachersInClass, updateClassForGivenTeacher, find_class_based_on_ID, updateFlashcardForStudent
};
