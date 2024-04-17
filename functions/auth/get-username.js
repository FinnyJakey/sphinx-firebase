const admin = require('../firebase-admin-init');
const {onRequest} = require("firebase-functions/v1/https");

exports.getUsername = onRequest((request, response) => {
    admin.firestore().collection("projects").doc(request.query["uuid"].trim()).get().then((doc) => {
        if (!doc.exists) {
            response.status(400).send("No Documents!");
        } else {
            response.status(200).send(doc.get("username"));
        }
    }).catch((error) => {
        response.status(400).send(error);
    });
});
