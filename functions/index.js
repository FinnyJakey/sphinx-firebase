const {signUp} = require("./auth/sign-up");
const {getUsername} = require("./auth/get-username");
const {getAllProjects} = require("./projects/get-projects");

module.exports = {
    signUp, getUsername, getAllProjects,
};