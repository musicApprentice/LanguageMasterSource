const { MongoClient } = require('mongodb');
const { TextEncoder } = require('util');
const connectionString = "mongodb+srv://mkandeshwara:0CgF5I8hwXaf88dy@cluster0.tefxjrp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&ssl=true";
const client = new MongoClient(connectionString);
const {
    enrollClass, getClassesStudent, getClassesTeacher, createClass, getStudentsInClass, getTeachersInClass, updateClassForGivenTeacher
} = require('../src/classes.js')

//TODO:write the IO functions for all functions above
function createClassIO(socket) {
    socket.on('createClass', async (className, teacherEmail) => {
      console.log(className, teacherEmail)
        let classCreated;
        try {
          classCreated = await createClass(className, teacherEmail);
        } catch (error) {
            console.error('Error creating class:', error);
            classCreated = false;
        }
        console.log("classCreated called and returned value of:", classCreated);
        socket.emit("createClassStatus", classCreated);
        return classCreated;
    });
}

function enrollClassIO(socket) {
  socket.on('enrollClass', async (className, classID, studentEmail) => {
    console.log(className, classID, studentEmail)
      let enrolledInClass;
      try {
        enrolledInClass = await enrollClass(className, classID, studentEmail);
      } catch (error) {
          console.error('Error enrolling in class:', error);
          enrolledInClass = false;
      }
      console.log("enroll in class was called and returned", enrolledInClass);
      socket.emit("enrollClassStatus", enrolledInClass);
      return enrolledInClass;
  });
}


function getClassesIO(socket) {
  socket.on('getClasses', async (email, teacherBool) => {
    console.log(email, teacherBool)
      let fetchedClasses;
      try {
        if (teacherBool) {
          fetchedClasses = await getClassesTeacher(email)
        }
        else {
          fetchedClasses = await getClassesStudent(email)
        }
      } catch (error) {
          console.error('Error getting classes:', error);
          fetchedClasses = []
      }
      console.log("getClasses was called and returned", fetchedClasses);
      socket.emit("getClassesStatus", fetchedClasses);
      return fetchedClasses;
  });
}



module.exports= {createClassIO, enrollClassIO, getClassesIO}