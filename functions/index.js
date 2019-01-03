//const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

"use strict";

const functions = require("firebase-functions");

// Firebase Admin initialization
var admin = require("firebase-admin");
var serviceAccount = require("./support-7fdcd-firebase-adminsdk-wz0xt-ca4b35d87e.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://support-7fdcd.firebaseio.com"
});

// Get Google Sheets instance
const { google } = require("googleapis");
const sheets = google.sheets("v4");

// Create JWT
const jwtClient = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"] // read and write sheets
});

// Get data from RTDB
exports.copyPetrolToSheet = functions.database.ref("/testing/pretest").onUpdate(async change => {
  let data = change.after.val();

  // Convert JSON to Array following structure below
  /* 
  [
    ['COL-A', 'COL-B'],
    ['COL-A', 'COL-B']
  ]
  */
  var itemArray = [];
  var valueArray = [];
  Object.keys(data).forEach((key, index) => {
    itemArray.push(key);
    itemArray.push(data[key]);
    valueArray[index] = itemArray;
    itemArray = [];
  });

  let maxRange = valueArray.length + 1;

  // Do authorization
  await jwtClient.authorize();
  
  // Create Google Sheets request
  let request = {
    auth: jwtClient,
    spreadsheetId: "1OJ1Y63p3_aEs4YNLfsHJ6q_q-4QHAF8gaDprczgtWzE",
    range: "Pretest!A2:T" + maxRange,
    valueInputOption: "RAW",
    requestBody: {
      values: valueArray
    }
  };
  
  // Update data to Google Sheets
  await sheets.spreadsheets.values.update(request, {});
});