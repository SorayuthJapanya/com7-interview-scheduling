const MAIN_SS_ID = "1n2Quf4pRxFDprIp3hcSwGzWlx3Gf6oUWaMH9dtjW_Ww";
const RESUME_FOLDER_ID = "1f2XkKDc3AJBkGICngNUup4gStGOKbmhx";
const PROFILE_FOLDER_ID = "1mDBAJKcQT5uKv1FqV2xn8aBqWIfwiAee";
const JOB_HIRING_FOLDER_ID = "12LlX4b3rJjK7nB76-M3JwH-vbePcICNO";
const EVENTS_FOLDER_ID = "1a8VHe9i1CF7ZL1NF1B1PnOXtVFcfPKw1";

const MAIN_SHEETS = {
  TA: "TA",
  CANDIDATES: "Candidates",
  MANAGERS: "Managers",
  EVENTS: "Events",
  JOB_TYPE: "Job_Type",
  JOB_HIRING_POSTER: "Job_Hiring_Poster",
  PROVINCE: "Province"
};

const EVENT_SHEETS = {
  INTERVIEWS: "Interviews",
  SLOTS: "Slots",
  HISTORY: "History",
  TRANSACTION: "Transaction"
};

/**
 * @function doGet
 * @returns HTML Content
 */
function doGet() {
  return HtmlService.createTemplateFromFile("client/Index")
    .evaluate()
    .setTitle("ระบบจัดตารางสัมภาษณ์")
    .setFaviconUrl("https://i.postimg.cc/sf7QXHRT/COM7-Logo-svg.png")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * @function include
 * @param {String} filename - file path
 * @returns
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * @function getSpreadsheet
 * @returns
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(MAIN_SS_ID);
}

