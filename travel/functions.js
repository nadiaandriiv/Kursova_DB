const fs = require('fs');

module.exports.log =
function log(request, action, status) {
    let date = new Date();
    let message = `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] Method: ${request.method}; User: ${request.body.email}; Action: ${action}; Status: ${status}\n`;
    fs.appendFile('server.log', message, function() {});
}

module.exports.createUser = function createUser(email, login, password) {
    var content = fs.readFileSync("users.json", "utf-8");
    content = JSON.parse(content);
    var user_new = {email: email,
        login: login,
        password: password};
    content.push(user_new);
    content = JSON.stringify(content);
    fs.writeFileSync("users.json", content);
}

module.exports.validate = function validate(req) {
    var errors = [];

    if(req.body.login == '') errors.push('Login is required!');
    if(req.body.email == '' || !req.body.email.includes('@')) errors.push('Email is required!');
    if(req.body.password == '') errors.push('Password is required!');
    else if(req.body.confirmPassword != req.body.password) errors.push('Password mismatch!');

    return errors;
}