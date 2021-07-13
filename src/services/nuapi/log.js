const chalk = require('chalk');
function logMsg(msg, levelStr) {
    if(typeof msg === "object") {
        console.log(msg);
    } else {
        console.log("[nuapi " + levelStr + " " + new Date().toUTCString() + "] " + msg);
    }
}
log = {
    info: (msg) => logMsg(msg, chalk.green("info ")),
    warn: (msg) => logMsg(msg, chalk.yellow("warn ")),
    error: (msg) => logMsg(msg, chalk.red("error")),
    debug: (msg) => logMsg(msg, chalk.blue("debug")),
}
module.exports = log;