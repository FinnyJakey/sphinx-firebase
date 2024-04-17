const admin = require('../firebase-admin-init');
const {onRequest} = require("firebase-functions/v1/https");

exports.getAllProjects = onRequest((request, response) => {
    admin.firestore().collection("projects").doc(request.query["uuid"].trim()).collection("tasks").orderBy("createdAt", "desc").get().then((snapshot) => {
        const projects = Array();

        snapshot.docs.map((value, index, array) => {
            projects.push(value.data());
        });

        response.status(200).send(projects);
    }).catch((error) => {
        response.status(400).send(error);
    });
});
