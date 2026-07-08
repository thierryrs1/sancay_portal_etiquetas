const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');
const inspector = require('inspector');
const debug = inspector.url();
const tz = process.env.TZ;

function getLogFileName() {
  const logDir = path.resolve(__dirname, "..", "..", "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const fileName = path.resolve(logDir, moment().tz(tz).format('YYYY-MM-DD') + ".log");
  return fileName;
}

module.exports = {
  log(txt) {
    const tm = moment().tz(tz).format('YYYY-MM-DD HH:mm:ss.SSS');
    const msg = `${tm}   LOG: ${txt}`;
    if (debug) {
      console.log(msg);
      return;
    }
    const fileName = getLogFileName();
    fs.appendFileSync(fileName, `${msg}\r\n`);
  },
  logDebug(txt) {
    const tm = moment().tz(tz).format('YYYY-MM-DD HH:mm:ss.SSS');
    const msg = `${tm} DEBUG: ${txt}`;
    if (debug) {
      console.log(msg);
      return;
    }
    if (!process.env.LOG_DEBUG || process.env.LOG_DEBUG == 0)
      return;
    const fileName = getLogFileName();    
    fs.appendFileSync(fileName, `${msg}\r\n`);
  },
  logError(txt) {    
    const tm = moment().tz(tz).format('YYYY-MM-DD HH:mm:ss.SSS');
    const msg = `${tm} ERROR: ${txt}`;
    if (debug) {
      console.log(msg);
      return;
    }
    if (!process.env.LOG_ERROR || process.env.LOG_ERROR == 0)
      return;
    const fileName = getLogFileName();
    fs.appendFileSync(fileName, `${msg}\r\n`);
  }
}