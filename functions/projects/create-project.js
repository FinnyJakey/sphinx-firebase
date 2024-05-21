const {onRequest} = require("firebase-functions/v1/https");
const Busboy = require("busboy");
const admin = require("../firebase-admin-init");
const {Timestamp} = require("firebase-admin/firestore");
const {OpenAI} = require("openai");

const {v1: vision} = require("@google-cloud/vision");

const openai = new OpenAI({apiKey: "sk-proj-mItkB4i0UWwTmL7xGFuCT3BlbkFJ0R0MMklVee6qolslyeNW"});
const client = new vision.ImageAnnotatorClient();
const bucket = admin.storage().bucket();

exports.createProject = onRequest(async (request, response) => {
    let projectName = null;
    let uuid = null;
    let documentId = null;
    let uploadFile = null;

    const busboy = Busboy({ headers: request.headers });

    busboy.on('field', (fieldName, val) => {
        if (fieldName === 'projectName') {
            projectName = val;
        }

        if (fieldName === 'uuid') {
            uuid = val;
        }
    });

    busboy.on('file', (fieldName, file, filename, encoding, mimetype) => {
        if (fieldName === 'file') {
            file.on('data', (data) => {
                if (!uploadFile) {
                    uploadFile = data;
                } else {
                    uploadFile = Buffer.concat([uploadFile, data]);
                }
            });
        }
    });

    busboy.on('finish', async () => {
        documentId = admin.firestore().collection("projects").doc(uuid).collection("tasks").doc().id;

        // 파일 업로드
        const file = bucket.file(`${uuid}/${documentId}.pdf`);
        const stream = file.createWriteStream();

        // 파일 스트림에 업로드 파일 쓰기
        await new Promise((resolve, reject) => {
            stream.end(uploadFile, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // TODO: PDF -> TEXT 변환
        const text = await getPdfText(uuid, `${documentId}.pdf`);

        // TODO: TEXT -> Summarize
        const summarized = await getSummarizedText(text);

        // TODO: TEXT -> tests
        const tests = JSON.parse(await getTests(text));

        // TODO: Firestore 등록
        await admin.firestore().collection("projects").doc(uuid).collection("tasks").doc(documentId).set({
            "projectName": projectName,
            "file": `${documentId}.pdf`,
            "createdAt": Timestamp.now(),
            "summarized": summarized,
            "tests": [],
        });

        response.status(200).send();

    });

    busboy.end(request.rawBody);

});

async function getPdfText(uuid, fileName) {
    const gcsSourceUri = `gs://sphinx-910e5.appspot.com/${uuid}/${fileName}`;
    const gcsDestinationUri = `gs://sphinx-910e5.appspot.com/${uuid}/`;

    const inputConfig = {
        // Supported mime_types are: 'application/pdf' and 'image/tiff'
        mimeType: 'application/pdf',
        gcsSource: {
            uri: gcsSourceUri,
        },
    };

    const outputConfig = {
        gcsDestination: {
            uri: gcsDestinationUri,
        },
    };

    const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];

    const request = {
        requests: [
            {
                inputConfig: inputConfig,
                features: features,
                outputConfig: outputConfig,
            },
        ],
    };

    const [operation] = await client.asyncBatchAnnotateFiles(request);

    const [filesResponse] = await operation.promise();

    const prefix = `${uuid}/output-`;

    const [files] = await bucket.getFiles({ prefix });

    const file = files[0];

    const [contents] = await file.download();

    await file.delete();

    const jsonData = JSON.parse(contents.toString());

    let text = "";

    jsonData.responses.forEach(response => {
        text += response.fullTextAnnotation.text;
    });

    return text;
}

async function getSummarizedText(text) {
    // let system_prompt = `You are a helpful assistant designed to return summarized text.
    // Please provide a comprehensive summary of the given text.
    // The summary should cover all the key points and main ideas presented in the original text, while also condensing the information into a concise and easy-to-understand format.
    // Please ensure that the summary includes relevant details and examples that support the main ideas, while avoiding any unnecessary information or repetition.
    // The length of the summary should be appropriate for the length and complexity of the original text, providing a clear and accurate overview without omitting any important information.
    // `;
    let system_prompt = `
    Please provide a concise and comprehensive summary of the given text.
    The summary should capture the main points and key details of the text while conveying the author's intended meaning accurately.
    Please ensure that the summary is well-organized and easy to read, with clear headings and subheadings to guide the reader through each section.
    The length of the summary should be appropriate to capture the main points and key details of the text, without including unnecessary information or becoming overly long.
    Identify the language of the given text and provide the summary of that language.
    `;

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: system_prompt,
            },
            {
                role: "user",
                content: text,
            },
        ],
        model: "gpt-3.5-turbo-0125",
    });

    return completion.choices[0].message.content;
}

async function getTests(text) {
    let system_prompt = `You are a helpful examiner designed to output this JSON format:
    
    {
        "tests": [
            {
                "question": "<your to the user's question paragraph. The question 1 of the quiz . Must be contained in a single paragraph>"
                "options": [
                    "<your to the user's OPTION number 0 of the question>",
                    "<your to the user's OPTION number 1 of the question>",
                    "<your to the user's OPTION number 2 of the question>",
                    "<your to the user's OPTION number 3 of the question>"
                ],
                "answer": <your to the user's question answer. The single number of the CORRECT OPTION of the question.>
                "explanation": "<yout yo yhe user's answer explanation. The explanation of the answer with up to 400 characters.>"
            },
            {
               "question": "<your to the user's question paragraph. The question 2 of the quiz. Must be contained in a single paragraph>"
                "options": [
                    "<your to the user's OPTION number 0 of the question>",
                    "<your to the user's OPTION number 1 of the question>",
                    "<your to the user's OPTION number 2 of the question>",
                    "<your to the user's OPTION number 3 of the question>"
                ],
                "answer": <your to the user's question answer. The single number of the CORRECT OPTION of the question.>
                "explanation": "<yout yo yhe user's answer explanation. The explanation of the answer with up to 400 characters.>" 
            },
            {
                "question": "<your to the user's question paragraph. The question 3 of the quiz. Must be contained in a single paragraph>"
                "options": [
                    "<your to the user's OPTION number 0 of the question>",
                    "<your to the user's OPTION number 1 of the question>",
                    "<your to the user's OPTION number 2 of the question>",
                    "<your to the user's OPTION number 3 of the question>"
                ],
                "answer": <your to the user's question answer. The single number of the CORRECT OPTION of the question.>
                "explanation": "<yout yo yhe user's answer explanation. The explanation of the answer with up to 400 characters.>"
            },
            {
                "question": "<your to the user's question paragraph. The question 4 of the quiz. Must be contained in a single paragraph>"
                "options": [
                    "<your to the user's OPTION number 0 of the question>",
                    "<your to the user's OPTION number 1 of the question>",
                    "<your to the user's OPTION number 2 of the question>",
                    "<your to the user's OPTION number 3 of the question>"
                ],
                "answer": <your to the user's question answer. The single number of the CORRECT OPTION of the question.>
                "explanation": "<yout yo yhe user's answer explanation. The explanation of the answer with up to 400 characters.>"
            },
            {
                "question": "<your to the user's question paragraph. The question 5 of the quiz. Must be contained in a single paragraph>"
                "options": [
                    "<your to the user's OPTION number 0 of the question>",
                    "<your to the user's OPTION number 1 of the question>",
                    "<your to the user's OPTION number 2 of the question>",
                    "<your to the user's OPTION number 3 of the question>"
                ],
                "answer": <your to the user's question answer. The single number of the CORRECT OPTION of the question.>
                "explanation": "<yout yo yhe user's answer explanation. The explanation of the answer with up to 400 characters.>"
            }
        ]
    }
    
    - Check the text given by the user and create five questions accordingly.
    - The distribution of options and answers should be evenly distributed.
    - The answer of the question should not be too many zeros.
    - Identify the LANGUAGE of the given text and provide the output of that LANGUAGE.
    `;

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: system_prompt,
            },
            {
                role: "user",
                content: text,
            },
        ],
        model: "gpt-3.5-turbo-0125",
        response_format: {
            type: "json_object",
        },
    });

    console.log(completion.choices[0].message.content);

    return completion.choices[0].message.content;
}