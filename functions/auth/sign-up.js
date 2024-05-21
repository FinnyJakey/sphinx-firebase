const admin = require('../firebase-admin-init');
const {onRequest} = require("firebase-functions/v1/https");

exports.signUp = onRequest((request, response) => {
    let data = JSON.parse(request.body);

    admin.firestore().collection("projects").doc(data["uuid"]).set({
        "username": data["username"],
        "createdAt": data["createdAt"],
    }).then(() => {
        admin.firestore().collection("projects").doc(data["uuid"]).collection("tasks").add({
        }).then(r => {
            response.status(200).send("Registered");
        }).catch((error) => {
            response.status(400).send(error);
        });
    }).catch((error) => {
        response.status(400).send(error);
    });
});
