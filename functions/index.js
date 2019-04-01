const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require("./key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://codemumps.firebaseio.com"
});
const db = admin.firestore();

exports.validateAnswer = functions.https.onCall((data, context) => {
    return db.collection("solution").doc(data.id).get().then((doc) => {
        var docData = doc.data();
        if (docData.text === data.content) {
            return db.collection("users").doc(context.auth.uid).get();
        } else {
            return false;
        }
    }).then((userInfoItem) => {
        if (userInfoItem === false) { return false; }
        var userInfo = userInfoItem.data();

        if (userInfo.completed === undefined || !userInfo.completed.includes(data.id)) {
            return db.collection("exercise").doc(data.id).get();
        } else {
            return false;
        }
    }).then((exerciseItem) => {
        if (exerciseItem === false) { return false; }

        var exercise = exerciseItem.data();

        return db.collection("users").doc(context.auth.uid).update({
            completed: admin.firestore.FieldValue.arrayUnion(data.id),
            points: admin.firestore.FieldValue.increment(exercise.points)
        });
    }).then((value) => value !== false);
});