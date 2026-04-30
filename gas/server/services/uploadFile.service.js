function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    // --- Cut header base64data ---
    const splitBase64 = base64Data.split(",");
    const data = splitBase64.length > 1 ? splitBase64[1] : splitBase64[0];

    // --- decode base64file ---
    const decoded = Utilities.base64Decode(data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);

    // 2. เข้าถึงโฟลเดอร์
    const folder = DriveApp.getFolderById(RESUME_FOLDER_ID);

    // 3. สร้างไฟล์
    const file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const normalUrl = file.getUrl();
    const embedUrl = normalUrl.replace(/\/view.*/, "/preview");
    const downloadUrl = file.getDownloadUrl();

    return {
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      viewUrl: normalUrl,
      embedUrl: embedUrl,
      downloadUrl: downloadUrl,
    };
  } catch (error) {
    console.error("Upload Error: ", error);
    return { success: false, message: "อัปโหลดไฟล์ล้มเหลว" };
  }
}

function uploadProfileToDrive(base64Data, fileName, mimeType) {
  try {
    // --- Cut header base64data ---
    const splitBase64 = base64Data.split(",");
    const data = splitBase64.length > 1 ? splitBase64[1] : splitBase64[0];

    // --- decode base64file ---
    const decoded = Utilities.base64Decode(data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);

    // 2. เข้าถึงโฟลเดอร์
    const folder = DriveApp.getFolderById(PROFILE_FOLDER_ID);

    // 3. สร้างไฟล์
    const file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const normalUrl = file.getUrl();
    const embedUrl = normalUrl.replace(/\/view.*/, "/preview");
    const directUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

    return {
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      viewUrl: normalUrl,
      embedUrl: embedUrl,
      directUrl: directUrl,
    };
  } catch (error) {
    console.error("Upload Error: ", error);
    return { success: false, message: "อัปโหลดไฟล์ล้มเหลว" };
  }
}

function uploadJobHiringToDrive(base64Data, fileName, mimeType) {
  try {
    // --- Cut header base64data ---
    const splitBase64 = base64Data.split(",");
    const data = splitBase64.length > 1 ? splitBase64[1] : splitBase64[0];

    // --- decode base64file ---
    const decoded = Utilities.base64Decode(data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);

    // --- access folder ---
    const folder = DriveApp.getFolderById(JOB_HIRING_FOLDER_ID);

    // --- create file ---
    const file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const normalUrl = file.getUrl();
    const embedUrl = normalUrl.replace(/\/view.*/, "/preview");
    const directUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

    return {
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      viewUrl: normalUrl,
      embedUrl: embedUrl,
      directUrl: directUrl,
    };
  } catch (error) {
    console.error("Upload Error: ", error);
    return { success: false, message: "อัปโหลดไฟล์ล้มเหลว" };
  }
}

function deleteFileByUrl(url) {
  if (!url) return false;

  let fileId = null;

  const matchStandard = url.match(/\/d\/([a-zA-Z0-9_-]+)/);

  const matchIdParam = url.match(/id=([a-zA-Z0-9_-]+)/);

  if (matchStandard && matchStandard[1]) {
    fileId = matchStandard[1];
  } else if (matchIdParam && matchIdParam[1]) {
    fileId = matchIdParam[1];
  }

  if (!fileId) {
    console.warn("ไม่สามารถหา File ID จาก URL นี้ได้: " + url);
    return false;
  }

  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true); 
    return true;
  } catch (e) {
    console.error("เกิดข้อผิดพลาดในการลบไฟล์: " + e.toString());
    return false;
  }
}
