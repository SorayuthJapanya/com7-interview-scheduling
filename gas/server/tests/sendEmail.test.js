function testSendEmail() {
  const data = {
    to: "sorayuthjaapanya@gmail.com",
    eventName: "JobFair2024",
    fullname: "นาย สรยุทธ จาปัญญะ",
    date: "20 มกราคม 2569",
    timePeriod: "10:00 - 10:30",
    type: "ONSITE",
    location: "ไบเทค นางนา",
    buName: "เหนือ"
  }

  const response = sendEmail(data);
  console.log(JSON.stringify(response, null, 2))
}

function getAllEmail() {
  const ss = SpreadsheetApp.openById("1eHA6OAdc6qa5xU3-KcCLPhoB_GVaxsMvDwgBBB5Iy5s")
  const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS)
  const interviews = getRowsFromSheet(interviewSheet)

  console.log("Counts: ", interviews.length)

  const emails = interviews.map((interview) => interview["Email"])
  console.log(JSON.stringify(emails, null, 2))
}