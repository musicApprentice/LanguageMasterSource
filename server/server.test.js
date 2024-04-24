const request = require('supertest');
const app = require('./index.js'); 

jest.mock('mongoose')

describe('the function should add new teacher',() =>{
  it('Test create teacher', async() => {
    mongo = require('./function.js');
    const fisrName = "huy";
    const lastName = "Gu";
    const email = "hugy@gmaki.sut";
  const password = "uhkjhku";
  
  await mongo.createTeacher(fisrName, lastName, email, password);
  let re = await mongo.verifyTeacher(email, password);
  expect(re).toEqual(true);
  });
});
 describe('the function should verify teacher',() =>{
   it('Test existing teacher with wrong password', async() => {
     mongo = require('./function.js');
     const email = "James.Moore@gmail.com";
   const password = "wemKmh";
   let re = await mongo.verifyTeacher(email, password);
   expect(re).toEqual(false);
   });
   it('Test existing teacher with wrong email', async() => {
    mongo = require('./function.js');
    const email = "JamesMoore@gmail.com";
  const password = "wemKmhTh"
  let re = await mongo.verifyTeacher(email, password);
  expect(re).toEqual(false);
  });
  it('Test existing teacher with wrong email and password', async() => {
    mongo = require('./function.js');
    const email = "JamesMoore@gmail.com";
  const password = "wemKmh"
  let re = await mongo.verifyTeacher(email, password);
  expect(re).toEqual(false);
  });
  it('Test existing teacher', async() => {
    mongo = require('./function.js');
    const email = "James.Moore@gmail.com";
  const password = "wemKmhTh";
  let re = await mongo.verifyTeacher(email, password);
  expect(re).toEqual(true);
  });
 });

 const { getGoogleTranscription } = require('./googleSpeech.js');
 const fs = require('fs');
const { describe } = require('node:test');
   
 describe('getGoogleTranscription function should return the string correctly', () => {
   it('transcribes audio file from URL', async () => {
     const audioUrl = 'https://www2.cs.uic.edu/~i101/SoundFiles/preamble10.wav';
     const expectedTranscription = 'we the people of the United States in order to form a more perfect union establish justice insure domestic tranquility provide for the common defense';   
     const transcription = await getGoogleTranscription(audioUrl);
     expect(transcription).toEqual(expectedTranscription);
   });
 });

 describe('getClassesTeacher', () => {
  it('should return an array of classes for a teacher', async () => {
    const classes = await getClassesTeacher('johndoe@gmail.com');
    expect(Array.isArray(classes)).toBe(true);
  });

  it('should return an empty array if teacher does not exist', async () => {
    const classes = await getClassesTeacher('nonexistentteacher');
    expect(classes).toEqual([]);
  });
});

describe('getClassesStudent', () => {
  it('should return an array of classes for a student', async () => {
    const classes = await getClassesStudent('Stephen.Calderon@gmail.com');
    expect(Array.isArray(classes)).toBe(true);
  });

  it('should return an empty array if student does not exist', async () => {
    const classes = await getClassesStudent('nonexistentstudent');
    expect(classes).toEqual([]);
  });
});

describe('createAssignment', () => {
  it('should create an assignment in an existing class', async () => {
    const className = "English235_JHBWXD";
    const assignmentName = "Assignment1";
    const cards = [];
    const result = await mongo.createAssignment(className, assignmentName, cards);
    expect(result).toBe(true);
    try {
      await client.connect();
      const ret = await mongo.client.db(className).collection("assignments").find({ name: assignmentName }).toArray();
      expect(ret.length).toEqual(1);
      expect(ret[0].assignment).toEqual(assignmentName);
      expect(ret[0].card).toEqual(0);
    } finally {
      await mongo.client.close();
    }
  });

  it ('should throw an error if the assignment already exists', async () => {
    const className = "English235_JHBWXD";
    const assignmentName = "Assignment1";
    const cards = [];
    const result = await mongo.createAssignment(className, assignmentName, cards);
    expect(result).rejects.toThrow("Assignment already exisits");
  });
})


