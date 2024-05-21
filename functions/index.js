const {signUp} = require("./auth/sign-up");
const {getUsername} = require("./auth/get-username");
const {getAllProjects} = require("./projects/get-projects");
const {getPdfText} = require("./vision/get-pdf-text");
const {createProject} = require("./projects/create-project");

module.exports = {
    signUp, getUsername, getAllProjects, getPdfText, createProject,
};