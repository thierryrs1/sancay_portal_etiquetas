const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const moment = require("moment-timezone");
const tz = process.env.TZ;
const k = "spsgroup.com.br";

const escapeHTML = str => str.replace(/[&<>'"]/g,
  tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));

class ConfigSpsService {
  async getConf(conf) {
    const response = process.env[conf];
    return response;
  }

  async parseEnv(envText) {
    const webConf = [];
    const envLines = envText.split(/\r?\n/);
    let session = "";
    let description = "";
    let pw = false;
    let headerFound = false;
    for (let i = 0; i < envLines.length; i++) {
      const line = envLines[i];
      if (!line || !/^(:?#=|[A-Z])/.test(line)) {
        continue;
      }
      if (/^#=!/.test(line)) {
        break;
      }
      if (/^#==/.test(line)) {
        session = line.replace(/^#==/, "");
        continue;
      }
      if (/^#=/.test(line)) {
        let txt = line.replace(/^#=\*?/, "");
        txt = escapeHTML(txt);
        description = description ? `${description}<br/>${txt}` : txt;
        pw = /^#=\*/.test(line);
        headerFound = true;
        continue;
      }
      if (/^[A-Z0-9_]+ ?= ?.*$/.test(line)) {
        if (!headerFound) {
          continue;
        }
        const [dummy, parm, val] = line.match(/^([A-Z0-9_]+) ?= ?(.*)$/);
        if (parm) {
          const conf = {
            session,
            description,
            parm,
            val: pw ? "" : val,
            pw
          }
          webConf.push(conf);
          description = "";
        }
        headerFound = false;
      }
    }

    return webConf;
  }

  async getWebConf() {
    const envText = fs.readFileSync(path.resolve(process.cwd(), ".env")).toString();
    const webConf = await this.parseEnv(envText);
    return webConf;
  }

  async checkConfigLogin(data) {
    const { password } = data;
    if ((!process.env.CONFIG_PASSWORD && password == "ConfigSPS")
      || password == this.decrypt(process.env.CONFIG_PASSWORD)) {
      return { isConfigLogin: true };
    } else {
      throw new Error("Erro autenticando usuário");
    }
  }
  async gravaEnv(conf) {
    const envPath = path.resolve(process.cwd(), ".env");
    const envText = fs.readFileSync(envPath).toString();
    const envConfs = await this.parseEnv(envText);
    const envLines = envText.split(/\r?\n/);
    let alterou = false;
    for (let i = 0; i < envConfs.length; i++) {
      const envConf = envConfs[i];
      const envParm = envConf.parm;
      const pw = envConf.pw;
      const envVal = envConf.val;
      let webVal = conf[envParm];
      if (pw && webVal == "") {
        continue; // senha vazia = mantém
      }
      if (pw && webVal != "") {
        webVal = this.encrypt(webVal);
      }
      if (webVal == envVal) {
        continue; // não mudou
      }
      for (let j = 0; j < envLines.length; j++) {
        const line = envLines[j];
        if (!line.startsWith(`${envParm}=`) && !line.startsWith(`${envParm} `)) {
          continue;
        }
        envLines[j] = `${envParm}=${webVal}`;
        alterou = true;
        break;
      }
    }
    if (alterou) {
      const tm = moment().tz(tz).format('YYYY-MM-DD_HH.mm.ss.SSS');
      const backupFname = `env_backup_${tm}.env`;
      const backupPath = path.resolve(process.cwd(), backupFname);
      fs.copyFileSync(envPath, backupPath);
      fs.writeFileSync(envPath, envLines.join("\r\n"));
      setTimeout(this.exit, 5000);
    }
  }

  exit() {
    process.exit();
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(k).digest('base64').substring(0, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text) {
    try {
      const textParts = text.split(':');
      const iv = Buffer.from(textParts.shift(), 'hex');
      const encryptedData = Buffer.from(textParts.join(':'), 'hex');
      const key = crypto.createHash('sha256').update(k).digest('base64').substring(0, 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = decipher.update(encryptedData);
      const decryptedText = Buffer.concat([decrypted, decipher.final()]);
      return decryptedText.toString();
    } catch {
      return "";
    }
  }



}

module.exports = new ConfigSpsService();
