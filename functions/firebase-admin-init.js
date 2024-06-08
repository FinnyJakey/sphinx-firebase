const admin = require('firebase-admin');
const serviceAccount = require('./config/sphinx-910e5-firebase-adminsdk-hgtv9-1ffc617ace.json');

const firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
    apiKey: "AIzaSyADbdle1sCg2wwj0wacs20lBuwUnIy4XJI",
    authDomain: "sphinx-910e5.firebaseapp.com",
    projectId: "sphinx-910e5",
    storageBucket: "sphinx-910e5.appspot.com",
    messagingSenderId: "889505063634",
    appId: "1:889505063634:web:d146bd2d21821bc06c030b",
    measurementId: "G-4WTVRHZFLC"
};

admin.initializeApp(firebaseConfig);

module.exports = admin;