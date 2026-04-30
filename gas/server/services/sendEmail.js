const FETCH_SEND_EMAIL_URL = "https://api-send-mail-com7.vercel.app/api/mail/send-mail"

function sendEmail(data) {
  if (!data) {
    return {
      success: false,
      message: "No data provided",
    };
  }

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(data),
    muteHttpExceptions: true, 
  };

  const response = UrlFetchApp.fetch(FETCH_SEND_EMAIL_URL, options);

  const statusCode = response.getResponseCode();
  const bodyText = response.getContentText();

  let body;
  try {
    body = JSON.parse(bodyText);
  } catch (e) {
    body = { message: bodyText };
  }

  return {
    success: statusCode >= 200 && statusCode < 300,
    message: body.message || "Unknown error",
    statusCode,
  };
}
