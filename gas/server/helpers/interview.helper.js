
function checkCandidateExists(eventId, candidateId) {
  const interviewSheet = SpreadsheetApp.openById(eventId).getSheetByName(
    EVENT_SHEETS.INTERVIEWS
  );
  const interviewData = getRowsFromSheet(interviewSheet);
  const interview = interviewData.find(
    (interview) => interview.Candidate_Id === candidateId
  );
  return !!interview;
}

function checkCandidateFullnameExists(eventId, fullname) {
  const interviewSheet = SpreadsheetApp.openById(eventId).getSheetByName(
    EVENT_SHEETS.INTERVIEWS
  );
  const interviewData = getRowsFromSheet(interviewSheet);
  const interview = interviewData.find(
    (interview) => normalizeName(interview.Fullname) === normalizeName(fullname)
  );
  return !!interview;
}

function checkCandidateNationalIdExists(eventId, nationalId) {
  const interviewSheet = SpreadsheetApp.openById(eventId).getSheetByName(
    EVENT_SHEETS.INTERVIEWS
  );
  const interviewData = getRowsFromSheet(interviewSheet);
  const interview = interviewData.find(
    (interview) => interview.National_Id === nationalId
  );
  return !!interview;
}

function checkCandidateEmailExists(eventId, email) {
  const interviewSheet = SpreadsheetApp.openById(eventId).getSheetByName(
    EVENT_SHEETS.INTERVIEWS
  );
  const interviewData = getRowsFromSheet(interviewSheet);
  const interview = interviewData.find(
    (interview) => interview.Email === email
  );
  return !!interview;
}

function checkCandidateLineIdExists(eventId, lineId) {
  const interviewSheet = SpreadsheetApp.openById(eventId).getSheetByName(
    EVENT_SHEETS.INTERVIEWS
  );
  const interviewData = getRowsFromSheet(interviewSheet);
  const interview = interviewData.find(
    (interview) => interview.Line_Id === lineId
  );
  return !!interview;
}

function checkCandidatePhoneNumberExists(eventId, phoneNumber) {
  const interviewSheet = SpreadsheetApp.openById(eventId).getSheetByName(
    EVENT_SHEETS.INTERVIEWS
  );
  const interviewData = getRowsFromSheet(interviewSheet);
  const interview = interviewData.find(
    (interview) => interview.Phone_Number === phoneNumber
  );
  return !!interview;
}
