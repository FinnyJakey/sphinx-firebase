const {onRequest} = require("firebase-functions/v1/https");
const admin = require("../firebase-admin-init");

exports.getOriginalPdf = onRequest(async (request, response) => {
    const uuid = request.query["uuid"].trim();
    const projectId = request.query["projectId"].trim();

    const bucket = admin.storage().bucket();

    const file = bucket.file(`${uuid}/${projectId}.pdf`);

    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',  // Set the expiration date far in the future
    });

    response.status(200).send({ url: url });
});