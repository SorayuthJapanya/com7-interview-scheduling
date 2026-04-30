function getJobHiringSheet() {
  return SpreadsheetApp.openById(MAIN_SS_ID).getSheetByName(
    MAIN_SHEETS.JOB_HIRING_POSTER,
  );
}

function getAllJobHiringPosterUrl() {
  try {
    const jobHiringSheet = getJobHiringSheet();
    const jobHiringData = getRowsFromSheet(jobHiringSheet);
    return jobHiringData;
  } catch (error) {
    console.log("Error in getAllJobHiringPosterUrl controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function addJobHiringPoster(images) {
  try {
    // validate image
    if (!images || !Array.isArray(images) || images.length === 0) {
      return { success: false, message: "กรุณาแนบไฟล์รูปภาพ" };
    }

    // get sheet
    const jobHiringSheet = getJobHiringSheet();
    if (!jobHiringSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const rowsToAdd = [];

    for (const image of images) {
      if (!image.base64Data || !image.fileName) {
        continue;
      }

      let previewUrl = "";
      if (image && image.base64Data && image.fileName && image.mimeType) {
        try {
          const fileUrl = uploadJobHiringToDrive(
            image.base64Data,
            image.fileName,
            image.mimeType,
          );

          if (fileUrl) {
            previewUrl = fileUrl.directUrl;
          }
        } catch (e) {
          console.error("Error in uploadJobHiringToDrive: ", e);
          return { success: false, message: "อัปโหลดไฟล์ล้มเหลว" };
        }
      }

      rowsToAdd.push([
        new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
        previewUrl,
        image.fileName,
      ]);
    }

    // append row
    if (rowsToAdd.length > 0) {
      const lastRow = jobHiringSheet.getLastRow();
      jobHiringSheet
        .getRange(lastRow + 1, 1, rowsToAdd.length, rowsToAdd[0].length)
        .setValues(rowsToAdd);
    }

    return {
      success: true,
      message: "บันทึกข้อมูลสำเร็จจำนวน " + rowsToAdd.length + " รายการ",
    };
  } catch (error) {
    console.log("Error in addJobHiringImage controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function deleteJobHiringPoster(url) {
  try {
    // validate url
    if (!url) {
      return {
        success: false,
        message: "กรุณาเลือกไฟล์รูปภาพที่ต้องการลบ",
      };
    }

    // get sheet
    const jobHiringSheet = getJobHiringSheet();
    if (!jobHiringSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const rowIndex = findRowIndex(jobHiringSheet, url, "Url");
    const actualRow = rowIndex + 2;

    const isDeleted = deleteFileByUrl(url);
    console.log(isDeleted)
    if (!isDeleted) {
      return {
        success: false,
        message: "ลบไฟล์ล้มเหลว",
      };
    }

    jobHiringSheet.deleteRow(actualRow);

    return {
      success: true,
      message: "ลบรูปภาพสำเร็จ",
    };
  } catch (error) {
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}
