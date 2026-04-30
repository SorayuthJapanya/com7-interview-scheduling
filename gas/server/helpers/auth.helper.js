function checkFullnameExists(fullname) {
  if (!fullname) return false;

  const candidateSheet = getCandidateSheet();
  const candidateData = getRowsFromSheet(candidateSheet);

  const isMatch = candidateData.find((data) => {
    return normalizeName(data.Fullname) === normalizeName(fullname);
  });

  return isMatch;
}

function checkEmailExists(email) {
  if (!email) return false;

  const candidateSheet = getCandidateSheet();
  const candidateData = getRowsFromSheet(candidateSheet);

  return candidateData.find((data) => data.Email === email);
}

function checkPhoneExists(phone) {
  if (!phone) return false;

  const candidateSheet = getCandidateSheet();
  const candidateData = getRowsFromSheet(candidateSheet);

  return candidateData.find((data) => data.Phone === phone);
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return Utilities.base64Encode(rawHash);
}

function verifyCandidatePassword(email, password) {
  if (!email || !password) return false;

  const candidateSheet = getCandidateSheet();
  const candidateData = getRowsFromSheet(candidateSheet);
  console.log("email: ", email)
  const candidate = candidateData.find((data) => data.Email === email);
  console.log("candidate: ", candidate)

  return candidate && candidate.Password === hashPassword(password);
}

function normalizeName(value) {
  return value ? String(value).trim().replace(/\s+/g, " ").toLowerCase() : "";
}
