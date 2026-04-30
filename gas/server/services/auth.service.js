const CRYPTO_SECRETE_KEY = "my-super-secret-key";
const SCRIPT_INTERVIEWER_URL = "https://www.google.com";

/**
 * @function verifyPassword
 * @param {String} username
 * @param {String} password
 * @returns
 */
function verifyPassword(username, password) {
  const userSheet = getTASheet();
  const userData = getRowsFromSheet(userSheet);
  const user = userData.find(
    (user) =>
      String(user.Username) === String(username) &&
      String(user.Password) === String(password),
  );
  return !!user;
}

/**
 * @function checkUsernameExists
 * @param {String} username
 * @returns
 */
function checkUsernameExists(username) {
  const userSheet = getTASheet();
  const user = userSheet
    .getRange(1, 3, userSheet.getLastRow(), 1)
    .getValues()
    .find((user) => user[0] === username);
  return !!user;
}

function generateToken(fullname, email) {
  const token = Utilities.getUuid();
  const maxAge = 60 * 60 * 24 * 4; // 4 days

  const expiredAt = new Date(
    new Date().getTime() + maxAge * 1000,
  ).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });
  const payload = { fullname, email, token, expiredAt };

  const cache = CacheService.getScriptCache();

  // format: put(key, value, expirationInSeconds)
  cache.put(token, JSON.stringify(payload), maxAge);

  return { token, expiredAt };
}

function verifyToken(token) {
  const cache = CacheService.getScriptCache();
  const cachedValue = cache.get(token);

  if (cachedValue === null) {
    return false;
  }

  const payload = JSON.parse(cachedValue);
  const expiredAt = payload.expiredAt;
  const now = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });
  if (now > expiredAt) return false;

  return payload;
}

function sendMailService(fullname, email, token) {
  try {
    const email_template = HtmlService.createTemplateFromFile(
      "client/send_email_body",
    );
    email_template.username = fullname;
    email_template.email = email;
    email_template.token = token;
    email_template.loginUrl = SCRIPT_INTERVIEWER_URL;

    const subject = "การแจ้งเตือน: สร้างบัญชีผู้ใช้ใหม่สำหรับผุ้สัมภาษณ์";
    const htmlBody = email_template.evaluate().getContent();

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
    });

    return true;
  } catch (error) {
    console.log("Error in sendMailService: ", error);
    return false;
  }
}
