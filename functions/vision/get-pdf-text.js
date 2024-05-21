const {onRequest} = require("firebase-functions/v1/https");
const vision = require('@google-cloud/vision').v1;
const Busboy = require('busboy');

const client = new vision.ImageAnnotatorClient();

exports.getPdfText = onRequest(async (request, response) => {
    const busboy = Busboy({ headers: request.headers });

    let fileData = null;
    let fileStream = null;
    let title = null;

    busboy.on('field', (fieldName, val) => {
        if (fieldName === 'title') {
            title = val;
        }
    });

    busboy.on('file', (fieldName, file, filename, encoding, mimetype) => {
        if (fieldName === 'file') {
            file.on('data', (data) => {
                if (!fileData) {
                    fileData = data;
                    fileStream = file;
                } else {
                    fileData = Buffer.concat([fileData, data]);
                    fileStream = file;
                }
            });
        }
    });

    busboy.on('finish', async () => {
        if (fileData) {
            try {
                const [result] = await client.textDetection(fileData);
                const labels = result.textAnnotations;
                // console.log(`Text: ${labels}`);
                labels.forEach(label => console.log(label.description));
                // 여기서 fileData를 사용하여 원하는 작업을 수행할 수 있습니다.

                // 예: Cloud Storage에 파일 저장
                // const file = bucket.file('your-filename.pdf');
                // await file.save(fileData, {
                //     metadata: { contentType: 'application/pdf' },
                // });

                // res.status(200).send('File uploaded successfully');
            } catch (error) {
                console.error('Error:', error);
                // res.status(500).send('Error uploading file');
            }
        } else {
            // res.status(400).send('No file found in request');
        }
    });

    busboy.end(request.rawBody);

    response.status(200).send("DDD");
});



// response.status(400).send("error");
