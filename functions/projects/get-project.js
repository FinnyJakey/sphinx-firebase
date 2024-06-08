const {onRequest} = require("firebase-functions/v1/https");
const admin = require("../firebase-admin-init");

exports.getProject = onRequest((request, response) => {
    admin.firestore().collection("projects").doc(request.query["uuid"].trim()).collection("tasks").doc(request.query["projectId"].trim()).get().then((snapshot) => {
        response.status(200).send(snapshot.data());
    }).catch((error) => {
        response.status(400).send(error);
    });
});
