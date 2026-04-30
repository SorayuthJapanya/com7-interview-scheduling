const MASTER_TEMPLATE_ID = "1Uk6vD_V6Sfs3meY7KzwcE9QrOFLUxeWqa7vBn0urCdQ";
const DESTINATION_FOLDER_ID = RESUME_FOLDER_ID;

function createInterviewPDF(data) {
  try {
    // 1. ตรวจสอบ Template ID
    if (!MASTER_TEMPLATE_ID) throw new Error("ไม่พบ MASTER_TEMPLATE_ID");

    // กำหนด Folder ปลายทาง
    let targetFolder;
    if (DESTINATION_FOLDER_ID) targetFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);

    // ==========================================
    // STEP 1: เข้าถึงต้นฉบับ (Master) และ ทำสำเนา (Copy)
    // ==========================================
    const masterFile = DriveApp.getFileById(MASTER_TEMPLATE_ID);

    // สร้างชื่อไฟล์ชั่วคราว
    const tempFileName = `Template_${data.fullname}_${new Date().toLocaleDateString("th-TH")}`;

    // ⭐️ สำคัญ: สร้าง Copy ลงใน Folder ปลายทาง (ต้นฉบับยังอยู่ที่เดิม ไม่ถูกแตะต้อง)
    const workingDocFile = masterFile.makeCopy(tempFileName, targetFolder);

    // เปิดไฟล์ "สำเนา" ขึ้นมาแก้ไข
    const doc = DocumentApp.openById(workingDocFile.getId());
    const body = doc.getBody();

    // ==========================================
    // STEP 2: ใส่ข้อมูลลงใน "สำเนา" (Working Copy)
    // ==========================================

    // 2.1 จัดการรูปภาพ (Images)
    // key: ชื่อ field ใน data, value: placeholder ใน Google Doc
    const imageMapping = {
      "profileImageUrl": "{{IMAGE_PROFILE}}"
    };

    Object.keys(imageMapping).forEach(dataKey => {
      const imageUrl = data[dataKey];
      const placeholder = imageMapping[dataKey];

      if (imageUrl && body.findText(placeholder)) {
        try {
          // เรียก Helper Function เพื่อแทรกรูป
          replaceTextWithImageInDoc(body, placeholder, imageUrl, 130);
        } catch (e) {
          console.warn(`Cannot insert image for ${dataKey}: ${e.message}`);
          body.replaceText(placeholder, ""); // ลบ placeholder ทิ้งถ้าเอารูปลงไม่ได้
        }
      } else {
        body.replaceText(placeholder, ""); // ลบ placeholder ทิ้งถ้าไม่มี url
      }
    });

    // 2.2 จัดการข้อความ (Text)
    Object.keys(data).forEach(key => {
      // ข้าม key ที่เป็นรูปภาพไป
      if (!imageMapping.hasOwnProperty(key)) {
        const value = data[key] != null ? String(data[key]) : "-";
        // Replace Text ในไฟล์สำเนา
        body.replaceText(`{{${key}}}`, value);
      }
    });

    // บันทึกการแก้ไขลงไฟล์สำเนา
    doc.saveAndClose();

    // ==========================================
    // STEP 3: สร้าง PDF และ ลบสำเนาทิ้ง
    // ==========================================

    // แปลงไฟล์สำเนาเป็น PDF Blob
    const pdfBlob = workingDocFile.getAs(MimeType.PDF);
    pdfBlob.setName(`Resume_${data.fullname}_${new Date().toLocaleDateString("th-TH")}.pdf`);

    // สร้างไฟล์ PDF ตัวจริงลง Folder
    const finalPdfFile = targetFolder.createFile(pdfBlob);

    finalPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // ⭐️ สำคัญ: ลบไฟล์สำเนา (Working Copy) ทิ้ง เพื่อไม่ให้รก
    workingDocFile.setTrashed(true);

    const normalUrl = finalPdfFile.getUrl();
    const embedUrl = normalUrl.replace(/\/view.*/, "/preview");
    const downloadUrl = finalPdfFile.getDownloadUrl();

    return {
      success: true,
      fileUrl: finalPdfFile.getUrl(),
      fileId: finalPdfFile.getId(),
      fileName: finalPdfFile.getName(),
      viewUrl: normalUrl,
      embedUrl: embedUrl,
      downloadUrl: downloadUrl,
    };

  } catch (error) {
    console.error("Error creating PDF:", error);
    return { success: false, error: error.message };
  }
}

// --- Helper Function (เหมือนเดิม) ---
function replaceTextWithImageInDoc(body, placeholderText, imageUrl, targetWidth) {
  const searchResult = body.findText(placeholderText);
  if (searchResult) {
    const element = searchResult.getElement();
    const parentParagraph = element.getParent().asParagraph();

    const imageResponse = UrlFetchApp.fetch(imageUrl);
    const imageBlob = imageResponse.getBlob();

    const textIndex = parentParagraph.getChildIndex(element);
    const insertedImage = parentParagraph.insertInlineImage(textIndex, imageBlob);

    if (targetWidth) {
      const originalWidth = insertedImage.getWidth();
      const originalHeight = insertedImage.getHeight();
      const ratio = originalHeight / originalWidth;
      const newHeight = targetWidth * ratio;
      insertedImage.setWidth(targetWidth);
      insertedImage.setHeight(newHeight);
    }
    parentParagraph.removeChild(element);
  }
}