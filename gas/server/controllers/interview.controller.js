const INTERVIEW_STATUS = [
  "รอการพิจารณา",
  "ผ่าน",
  "ไม่ผ่าน",
  "เก็บไว้พิจารณา",
  "ไม่ผ่านการพิจารณา",
];

const PARTICIPATION_STATUS = ["เข้าร่วม", "Walk-In", "ไม่เข้าร่วม"];

function createInterview(interviewData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const {
      eventId,
      slotId,
      candidateId,
      fullname,
      nickname,
      birthdate,
      age,
      gender,
      weight,
      height,
      nationality,
      nationalId,
      maritalStatus,
      militaryStatus,
      currentAddress,
      phoneNumber,
      email,
      lineId,
      highestEducation,
      institution,
      faculty,
      major,
      workLocation,
      workPeriod,
      workPosition,
      workDescription,
      saleExperience,
      positionType,
      positionApplied,
      preferredProvince,
      preferredDistrict,
      expectedSalary,
      availableStartDate,
      shop,
      file,
    } = interviewData;

    // Validate data
    if (!eventId || !slotId) {
      return { success: false, message: "ไม่พบห้องสัมภาษณ์นี้" };
    }

    const ss = SpreadsheetApp.openById(eventId);
    if (!ss) {
      return { success: false, message: "ไม่พบชีทนี้" };
    }

    const slotSheet = ss.getSheetByName(EVENT_SHEETS.SLOTS);
    if (!slotSheet) {
      return { success: false, message: "ไม่พบชีทนี้" };
    }
    const slotData = getRowsFromSheet(slotSheet);
    const slot = slotData.find((slot) => slot.Slot_Id === slotId);
    if (!slot) {
      return { success: false, message: "สล็อคนี้ยังไม่เปิดให้สัมภาษณ์" };
    }

    // Validate date
    const now = new Date();
    const formattedNowDate = now.toLocaleString("th-TH");

    const slotDate = Utilities.formatDate(
      normalizeDate(slot.Date),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );
    const targetDate = combineDateTime(
      slotDate,
      formatTimeTh(new Date(slot.End_Time)),
    );

    if (now > targetDate) {
      return { success: false, message: "ช่วงเวลนี้ปิดแล้ว" };
    }

    // Validate user
    const candidateSheet = getCandidateSheet();
    const candidateData = getRowsFromSheet(candidateSheet);
    const candidate = candidateData.find(
      (data) => data.Candidate_Id === candidateId,
    );
    if (!candidate) {
      return { success: false, message: "ไม่พบผู้สมัครนี้" };
    }

    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
    const interviewDataAll = getRowsFromSheet(interviewSheet);

    const isUserExists = interviewDataAll.find(
      (row) => row.Candidate_Id === candidateId && row.Slot_Id === slotId,
    );
    if (isUserExists) {
      return { success: false, message: "คุณได้ลงทะเบียนแล้ว" };
    }

    const isFullnameExists = interviewDataAll.find(
      (row) => row.Fullname === fullname,
    );
    if (isFullnameExists) {
      return { success: false, message: "ชื่อนี้ถูกลงทะเบียนไปแล้ว" };
    }

    if (nationalId.length !== 13) {
      return { success: false, message: "เลขบัตรประชาชนไม่ถูกต้อง" };
    }

    const isNationalIdExists = interviewDataAll.find(
      (row) => row.National_Id === nationalId,
    );
    if (isNationalIdExists) {
      return { success: false, message: "เลขบัตรประชาชนนี้ถูกลงทะเบียนไปแล้ว" };
    }

    if (phoneNumber.length !== 10) {
      return { success: false, message: "เบอร์โทรศัพท์ไม่ถูกต้อง" };
    }

    const isPhoneNumberExists = interviewDataAll.find(
      (row) => row.Phone_Number === phoneNumber,
    );
    if (isPhoneNumberExists) {
      return { success: false, message: "เบอร์โทรศัพท์นี้ถูกลงทะเบียนไปแล้ว" };
    }

    const isEmailExists = interviewDataAll.find((row) => row.Email === email);
    if (isEmailExists) {
      return { success: false, message: "อีเมลนี้ถูกลงทะเบียนไปแล้ว" };
    }

    const isLineIdExists = interviewDataAll.find(
      (row) => row.Line_Id === lineId,
    );
    if (isLineIdExists) {
      return { success: false, message: "ไอดีไลน์นี้ถูกลงทะเบียนไปแล้ว" };
    }

    // ----- อัปโหลดไฟล์ หรือ ถ่วงสร้าง PDF -----
    let previewUrl = "";
    let shouldGeneratePDF = false;

    // หากอัปโหลด File ใช้เวลาแค่ไม่กี่วิ อนุโลมให้ทำเลย
    if (file && file.base64Data && file.fileName && file.mimeType) {
      try {
        const fileUrl = uploadFileToDrive(
          file.base64Data,
          file.fileName,
          file.mimeType,
        );
        if (fileUrl) {
          previewUrl = fileUrl.embedUrl;
        }
      } catch (e) {
        console.error("Error in uploadFileToDrive: ", e);
      }
    } else {
      // Deferred PDF Generation (เพราะช้ามากก ~15s) ให้รันใน Background API
      shouldGeneratePDF = true;
    }

    // create payload
    const interviewId = Utilities.getUuid();

    const interviewDate = normalizeDate(new Date(slot.Date)).toLocaleDateString(
      "th-Th",
    );

    const startTime = Utilities.formatDate(
      new Date(slot.Start_Time),
      Session.getScriptTimeZone(),
      "HH:mm",
    );
    const endTime = Utilities.formatDate(
      new Date(slot.End_Time),
      Session.getScriptTimeZone(),
      "HH:mm",
    );

    const timePeriod = `${startTime}-${endTime}`;
    const buName = `'${slot.Bu_Name}`;
    const emailValue = String(email).toLowerCase();
    const formattedBirthDate = new Date(birthdate).toLocaleDateString("th-Th");

    const formattedAvailableStartDate = availableStartDate
      ? new Date(availableStartDate).toLocaleDateString("th-TH")
      : "";

    // Create new interview initial row (without calendar_id first)
    const newInterview = [
      interviewId,
      slotId,
      candidateId,
      interviewDate,
      timePeriod,
      shop || "",
      buName,
      fullname,
      nickname,
      formattedBirthDate,
      age,
      gender,
      weight,
      height,
      nationality,
      nationalId,
      maritalStatus,
      militaryStatus,
      currentAddress,
      "'" + phoneNumber,
      emailValue,
      "'" + lineId,
      highestEducation,
      institution,
      faculty,
      major,
      workLocation,
      workPeriod,
      workPosition,
      workDescription,
      saleExperience,
      positionType,
      positionApplied,
      preferredProvince,
      preferredDistrict,
      expectedSalary,
      formattedAvailableStartDate,
      previewUrl,
      INTERVIEW_STATUS[0],
      "", // calendar_id placeholder
      formattedNowDate,
      "", // interview link
      PARTICIPATION_STATUS[2],
    ];

    interviewSheet.appendRow(newInterview);

    const capacityStore = Number(slot.Capacity);
    if (capacityStore > 0) {
      // update capacity
      const rowIndex = findRowIndex(slotSheet, slotId, "Slot_Id");
      const capacity = Number(capacityStore) - 1;
      slotSheet.getRange(rowIndex + 2, 6).setValue(capacity);
    }

    SpreadsheetApp.flush(); // ยืนยันการบันทึกข้อมูลด่วน

    // Return ทันทีเพื่อให้ Web ตอบสนองต่ำกว่า 10 วิ ก่อนส่ง Background Tasks
    return {
      success: true,
      message: "ทะเบียนสัมภาษณ์สําเร็จเสร็จสิ้น",
      pendingExtras: true,
      extrasPayload: {
        interviewId: interviewId,
        eventId: eventId,
        slotId: slotId,
        candidateId: candidateId,
        shouldGeneratePDF: shouldGeneratePDF,
      },
    };
  } catch (error) {
    console.error("Error in createInterview: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  } finally {
    lock.releaseLock();
  }
}

// Background Task Function ที่จะถูกเรียกใช้จาก Client อย่างลับๆ
function processInterviewExtras(payload) {
  try {
    const { interviewId, eventId, slotId, candidateId, shouldGeneratePDF } =
      payload;

    const ss = SpreadsheetApp.openById(eventId);
    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
    const slotSheet = ss.getSheetByName(EVENT_SHEETS.SLOTS);

    const interviewDataAll = getRowsFromSheet(interviewSheet);
    const interviewRowBase = findRowIndex(
      interviewSheet,
      interviewId,
      "Interview_Id",
    );
    const actualRow = interviewRowBase !== -1 ? interviewRowBase + 2 : -1;

    if (actualRow === -1)
      return { success: false, message: "interview not found" };

    const interview = interviewDataAll[interviewRowBase];
    const slotData = getRowsFromSheet(slotSheet);
    const slot = slotData.find((s) => s.Slot_Id === slotId);

    let previewUrl = interview.Resume_Url;

    // 1. Generate PDF (Slow: ~10-25s)
    if (shouldGeneratePDF) {
      const candidateSheet = getCandidateSheet();
      const candidateData = getRowsFromSheet(candidateSheet);
      const candidate = candidateData.find(
        (c) => c.Candidate_Id === candidateId,
      );

      const dataForPdf = {
        profileImageUrl: candidate ? candidate.Profile_Url : "",
        formattedBirthDate: parseThaiDateTime(interview.Birthdate).toLocaleDateString(
          "th-TH",
          { day: "numeric", month: "long", year: "numeric" },
        ),
        formattedStartDate: parseThaiDateTime(
          interview.Available_Start_Date,
        ).toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        fullname: interview.Fullname,
        nickname: interview.Nickname,
        age: interview.Age,
        gender: interview.Gender,
        weight: interview.Weight,
        height: interview.Height,
        nationality: interview.Nationality,
        nationalId: interview.National_Id,
        maritalStatus: interview.Marital_Status,
        militaryStatus: interview.Military_Status,
        currentAddress: interview.Current_Address,
        phoneNumber: "'" + String(interview.Phone_Number).replace(/'/g, ""),
        email: interview.Email,
        lineId: "'" + String(interview.Line_Id).replace(/'/g, ""),
        highestEducation: interview.Highest_Education,
        institution: interview.Institution,
        faculty: interview.Faculty,
        major: interview.Major,
        workLocation: interview.Work_Location,
        workPeriod: interview.Work_Period,
        workPosition: interview.Work_Position,
        workDescription: interview.Work_Description,
        saleExperience: interview.Sale_Experience,
        positionType: interview.Position_Type,
        positionApplied: interview.Position_Applied,
        preferredProvince: interview.Preferred_Province,
        preferredDistrict: interview.Preferred_District,
        expectedSalary: interview.Expected_Salary,
      };

      const fileUrl = createInterviewPDF(dataForPdf);
      if (fileUrl && fileUrl.success) {
        previewUrl = fileUrl.embedUrl;
        interviewSheet.getRange(actualRow, 38).setValue(previewUrl);
      }
    }

    // 2. Calendar and Email (Modest: ~1-3s)
    const eventSheet = getEventSheet();
    const eventData = getRowsFromSheet(eventSheet);
    const event = eventData.find((data) => data.Sheet_ID === eventId);

    if (event) {
      const emailDate = normalizeDate(new Date(slot.Date)).toLocaleDateString(
        "th-Th",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );

      const calendarPayload = {
        event,
        slot,
        eventName: event.Event_Name,
        email: interview.Email,
        fullname: interview.Fullname,
        buName: slot.Bu_Name,
        location: event.Location,
      };

      const calendar_id = createCalendarEvent(calendarPayload);
      if (calendar_id) {
        interviewSheet.getRange(actualRow, 40).setValue(calendar_id);
      }

      const payloadEmail = {
        to: interview.Email,
        eventName: event.Event_Name,
        buName: slot.Bu_Name,
        fullname: interview.Fullname,
        date: emailDate,
        timePeriod: interview.Interview_Period,
        type: event.Event_Type,
        location: event.Location,
      };
      sendEmail(payloadEmail);
    }

    return { success: true };
  } catch (e) {
    console.error("processInterviewExtras error: ", e);
    return { success: false };
  }
}

function getAllInterviews(query = {}, userRole) {
  try {
    const {
      search,
      candidateId,
      eventName,
      province,
      permissionType,
      page = 1,
      limit = 10,
    } = query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));

    if (!AUTH_ROLES.includes(userRole)) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้อ่านข้อมูล",
      };
    }

    const isUser = userRole === USER_ROLE;
    const isManager = userRole === MANAGER_ROLE;

    if (isUser && !candidateId) {
      return {
        success: true,
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: pageNum,
          limit: limitNum,
        },
      };
    }

    const eventSheet = getEventSheet();
    const eventData = getRowsFromSheet(eventSheet);

    const validEvents = eventData.filter((event) => {
      if (permissionType && permissionType !== event.Permission_Type) {
        return false;
      }
      if (isManager && String(event.Status).toUpperCase() !== "TRUE") {
        return false;
      }
      return true;
    });

    if (validEvents.length === 0) {
      return {
        success: true,
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: pageNum,
          limit: limitNum,
        },
      };
    }

    // --- OPTIMIZATION: PARALLEL HTTP REQUESTS ---
    // Fetch 'Interviews', 'Slots', 'Transaction' from all valid event spreadsheets simultaneously.
    const token = ScriptApp.getOAuthToken();
    const r1 = encodeURIComponent(EVENT_SHEETS.INTERVIEWS);
    const r2 = encodeURIComponent(EVENT_SHEETS.SLOTS);
    const r3 = encodeURIComponent(EVENT_SHEETS.TRANSACTION);

    const requests = validEvents.map((event) => ({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${event.Sheet_ID}/values:batchGet?ranges=${r1}&ranges=${r2}&ranges=${r3}&valueRenderOption=FORMATTED_VALUE`,
      method: "get",
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    }));

    // Perform executing all events concurrently (Typically takes < 2 seconds)
    const responses = UrlFetchApp.fetchAll(requests);

    const mapValuesToRows = (values) => {
      if (!values || values.length < 2) return [];
      const header = values[0];
      const rows = [];
      for (let i = 1; i < values.length; i++) {
        const rowData = values[i];
        if (rowData.join("").trim() === "") continue;
        const rowObj = {};
        header.forEach((h, colIndex) => {
          rowObj[h] = rowData[colIndex] !== undefined ? rowData[colIndex] : "";
        });
        rows.push(rowObj);
      }
      return rows;
    };

    const allInterviews = [];

    responses.forEach((res, index) => {
      if (res.getResponseCode() !== 200) return; // Skip if failed to access sheet

      const event = validEvents[index];
      const json = JSON.parse(res.getContentText());
      if (!json.valueRanges || json.valueRanges.length < 3) return;

      const interviewData = mapValuesToRows(json.valueRanges[0].values);
      const slotData = mapValuesToRows(json.valueRanges[1].values);
      const transactionData = mapValuesToRows(json.valueRanges[2].values);

      const slotMap = {};
      for (let i = 0; i < slotData.length; i++) {
        slotMap[slotData[i].Slot_Id] = slotData[i];
      }

      const transactionMap = {};
      for (let i = 0; i < transactionData.length; i++) {
        const data = transactionData[i];
        if (!transactionMap[data.Interview_Id]) {
          transactionMap[data.Interview_Id] = [];
        }
        transactionMap[data.Interview_Id].push(data);
      }

      for (let i = 0; i < interviewData.length; i++) {
        const interview = interviewData[i];
        allInterviews.push({
          ...interview,
          eventDetail: event,
          slotDetail: slotMap[interview.Slot_Id] || null,
          transactionDetail: transactionMap[interview.Interview_Id] || [],
        });
      }
    });

    const filteredInterviews = allInterviews.filter((interview) => {
      if (isUser && candidateId !== String(interview.Candidate_Id))
        return false;
      if (isManager && interview.Status === "ไม่ผ่านการพิจารณา") return false;
      if (eventName && eventName !== interview.eventDetail.Event_Name)
        return false;
      if (province && province !== interview.Preferred_Province) return false;

      const searchValue = search
        ? String(search).toLowerCase().replace(/\s+/g, "")
        : "";

      if (search && searchValue !== "") {
        const matchesSearch = Object.entries(interview).some(([key, value]) => {
          if (
            typeof value === "object" ||
            value === null ||
            value === undefined
          )
            return false;

          const cleanValue = String(value).toLowerCase().replace(/\s+/g, "");
          return cleanValue.includes(searchValue);
        });

        if (!matchesSearch) return false;
      }
      return true;
    });

    // --- SORTING LOGIC
    filteredInterviews.sort((a, b) => {
      const dateA = parseThaiDateTime(a.TimeStamp);
      const dateB = parseThaiDateTime(b.TimeStamp);

      return dateB.getTime() - dateA.getTime();
    });

    // --- PAGINATION LOGIC
    const totalItems = filteredInterviews.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    // 2. Calculate slice indices
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    // 3. Slice the data
    const paginatedData = filteredInterviews.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedData,
      pagination: {
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  } catch (error) {
    console.error("Error in getAllInterviews: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function getAllInterviewsWithoutInterviewLink(query = {}) {
  try {
    const { eventName, buName, page = 1, limit = 10 } = query;

    if (!eventName || !buName) {
      return {
        success: true,
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          limit: limit,
        },
      };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));

    // 1. Fetch Event DataFrame using API v4
    const responseEvents = Sheets.Spreadsheets.Values.batchGet(MAIN_SS_ID, {
      ranges: [MAIN_SHEETS.EVENTS],
      valueRenderOption: "FORMATTED_VALUE",
    });

    const rawEventData =
      mergeMapValuesToRows(responseEvents.valueRanges[0].values) || [];
    const eventData = rawEventData.find(
      (event) => event.Event_Name === eventName,
    );

    if (!eventData) {
      return { success: false, message: "ไม่พบข้อมูล Event: " + eventName };
    }

    const eventId = eventData.Sheet_ID;

    const ranges = [
      EVENT_SHEETS.INTERVIEWS,
      EVENT_SHEETS.SLOTS,
      EVENT_SHEETS.TRANSACTION,
    ];

    const response = Sheets.Spreadsheets.Values.batchGet(eventId, {
      ranges: ranges,
      valueRenderOption: "FORMATTED_VALUE",
    });

    if (!response.valueRanges || response.valueRanges.length < 3) {
      return {
        success: false,
        message: "ไม่พบข้อมูล Event: " + eventName,
      };
    }

    const interviewData = mergeMapValuesToRows(response.valueRanges[0].values);
    const slotData = mergeMapValuesToRows(response.valueRanges[1].values);
    const transactionData = mergeMapValuesToRows(
      response.valueRanges[2].values,
    );

    const formatBuName = (value = "") => value.trim().toLowerCase();

    const filteredInterviews = interviewData.filter((interview) => {
      if (buName && formatBuName(buName) !== formatBuName(interview.Bu_Name))
        return false;
      if (interview.Status !== "รอการพิจารณา") return false;
      if (!interview.Calendar_Id) return false;
      if (interview.Interview_Link) return false;
      return true;
    });

    // --- SORTING LOGIC
    filteredInterviews.sort((a, b) => {
      const dateA = parseThaiDateTime(a.TimeStamp);
      const dateB = parseThaiDateTime(b.TimeStamp);

      return dateB.getTime() - dateA.getTime();
    });

    // --- PAGINATION LOGIC
    const totalItems = filteredInterviews.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    // 3. Slice the data
    const slicedData = filteredInterviews.slice(startIndex, endIndex);

    const paginatedData = slicedData.map((item) => ({
      ...item,
      eventDetail: eventData,
      slotDetail:
        slotData.find((slot) => slot.Slot_Id === item.Slot_Id) || null,
      transactionDetail: transactionData.filter((transaction) => {
        const isMatch = transaction.Interview_Id === item.Interview_Id;
        return isMatch;
      }),
    }));

    return {
      success: true,
      data: paginatedData,
      pagination: {
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  } catch (error) {
    console.error("Error in getAllInterviews: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function getInterviewsById(getData) {
  try {
    if (!getData) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    const { eventId, interviewId, candidateId, userRole } = getData;

    if (!AUTH_ROLES.includes(userRole)) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้อ่านข้อมูล",
      };
    }

    const ss = SpreadsheetApp.openById(eventId);
    if (!ss) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
    if (!interviewSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const rawData = getRowsFromSheet(interviewSheet);

    let dataObj = {};

    if (userRole === USER_ROLE) {
      const isYourInterview = rawData.find((row) => {
        return (
          row.Interview_Id === interviewId && row.Candidate_Id === candidateId
        );
      });

      if (!isYourInterview) {
        return {
          success: false,
          message: "คุณไม่ได้รับอนุญาติให้อ่านข้อมูล",
        };
      }

      dataObj = isYourInterview;
    } else {
      const filteredData = rawData.filter((row) => {
        return row.Interview_Id === interviewId;
      });

      dataObj = filteredData;
    }

    return {
      success: true,
      data: dataObj,
    };
  } catch (error) {
    console.error("Error in getAllInterviews: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function updateDetailInterview(updateData) {
  try {
    // Validate data
    if (!updateData) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    const { userRole, userId, eventId, interviewId, file } = updateData;

    // Chech userRole
    if (userRole !== USER_ROLE) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ข้อมูล",
      };
    }

    // get interview sheet
    const ss = SpreadsheetApp.openById(eventId);
    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);

    // find index row
    const rowNum = findRowIndex(interviewSheet, interviewId, "Interview_Id");
    const actualRow = rowNum + 2;

    // get interview data
    const interviewRange = interviewSheet.getRange(
      actualRow,
      1,
      1,
      interviewSheet.getLastColumn(),
    );
    const interview = interviewRange.getValues()[0];

    const index = {
      slotId: 1,
      candidateId: 2,
      shop: 5,
      buName: 6,
      nickname: 8,
      birthdate: 9,
      age: 10,
      gender: 11,
      weight: 12,
      height: 13,
      nationality: 14,
      maritalStatus: 16,
      militaryStatus: 17,
      currentAddress: 18,
      highestEducation: 22,
      institution: 23,
      faculty: 24,
      major: 25,
      workLocation: 26,
      workPeriod: 27,
      workPosition: 28,
      workDescription: 29,
      saleExperience: 30,
      positionType: 31,
      positionApplied: 32,
      preferredProvince: 33,
      preferredDistrict: 34,
      expectedSalary: 35,
      availableStartDate: 36,
    };

    if (!interview) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    // check candidate id
    if (userId !== interview[index.candidateId]) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ไขข้อมูล",
      };
    }

    const now = new Date();
    const actualDate = normalizeDate(interview[3]);
    actualDate.setDate(actualDate.getDate() - 3); // normalizeDate(interview[3]) - 3 day

    // check date
    if (now > actualDate) {
      return {
        success: false,
        message: "หมดเขตการแก้ไชข้อมูลแล้ว",
      };
    }

    const storeData = {};
    const newData = {};

    let modified = false;

    // if have file
    if (file) {
      // delete old file
      if (interview[37]) {
        deleteFileByUrl(interview[37]);
      }

      // create new file url
      const fileUrl = uploadFileToDrive(
        file.base64Data,
        file.fileName,
        file.mimeType,
      );

      // update resume url directly in the interview row array
      if (fileUrl) {
        interview[37] = fileUrl.embedUrl;
        modified = true;
      }
    }

    // format date
    if (updateData.birthdate) {
      updateData.birthdate = new Date(updateData.birthdate).toLocaleDateString(
        "th-TH",
      );
    }

    // format date
    if (updateData.availableStartDate) {
      updateData.availableStartDate = new Date(
        updateData.availableStartDate,
      ).toLocaleDateString("th-TH");
    }

    // update data
    Object.keys(updateData).forEach((key) => {
      if (index[key] !== undefined) {
        if (updateData[key] !== interview[index[key]]) {
          console.log(`➡️ Updating field: ${key}`);

          storeData[key] = interview[index[key]];
          newData[key] = updateData[key];

          console.log(`📝 ${key}: ${storeData[key]} -> ${newData[key]}`);

          interview[index[key]] = updateData[key];
          modified = true;
        }
      }
    });

    if (interview[19]) {
      const rawPhone = String(interview[19]).replace(/^'+/, "");
      interview[19] = `'${rawPhone}`;
    }

    // if not modified
    if (!modified) {
      return {
        success: false,
        message: "ไม่มีการแก้ไขข้อมูล",
      };
    }

    // set new data
    interviewRange.setValues([interview]);

    // response
    return {
      success: true,
      message: "แก้ไขข้อมูลสําเร็จ",
    };
  } catch (error) {
    console.error("Error in getAllInterviews: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function updateSlotInterview(updateData) {
  try {
    // validate data
    if (!updateData) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    const { eventId, interviewId, slotId } = updateData;

    const mainSheet = SpreadsheetApp.openById(MAIN_SS_ID);

    // get ss
    const ss = SpreadsheetApp.openById(eventId);
    if (!ss) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    // get event name
    const eventSheet = mainSheet.getSheetByName(MAIN_SHEETS.EVENTS);
    const eventRows = getRowsFromSheet(eventSheet);
    const event = eventRows.find((data) => data.Sheet_ID === eventId);

    const eventName = event.Event_Name;
    const location = event.Location;
    const type = event.Event_Type;

    // get interviewSheet
    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
    if (!interviewSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    // get slotSheet
    const slotSheet = ss.getSheetByName(EVENT_SHEETS.SLOTS);

    // get slot Data
    const slotData = getRowsFromSheet(slotSheet);
    const slot = slotData.find((slot) => slot.Slot_Id === slotId);
    if (!slot) {
      return {
        success: false,
        message: "สล็อคนี้ยังไม่เปิดให้สัมภาษณ์",
      };
    }

    // Validate date
    const now = new Date();
    const slotDate = Utilities.formatDate(
      normalizeDate(slot.Date),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );
    const targetDate = combineDateTime(
      slotDate,
      formatTimeTh(new Date(slot.End_Time)),
    );

    if (now > targetDate) {
      return {
        success: false,
        message: "ช่วงเวลนี้ปิดแล้ว",
      };
    }

    const rowNum = findRowIndex(interviewSheet, interviewId, "Interview_Id");
    if (rowNum === -1) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้ในระบบ",
      };
    }
    const actualRow = rowNum + 2;

    const interviewRange = interviewSheet.getRange(
      actualRow,
      1,
      1,
      interviewSheet.getLastColumn(),
    );
    const interview = interviewRange.getValues()[0];

    const index = {
      slotId: 1,
      interviewDate: 3,
      interviewPeriod: 4,
      buName: 5,
    };

    const storeSlotId = interview[index.slotId];

    if (storeSlotId === slotId) {
      return {
        success: false,
        message: "คุณได้ลงทะเบียนแล้ว",
      };
    }

    const interviewDate = normalizeDate(new Date(slot.Date)).toLocaleDateString(
      "th-Th",
    );

    const startTime = Utilities.formatDate(
      new Date(slot.Start_Time),
      Session.getScriptTimeZone(),
      "HH:mm",
    );
    const endTime = Utilities.formatDate(
      new Date(slot.End_Time),
      Session.getScriptTimeZone(),
      "HH:mm",
    );
    const timePeriod = `${startTime}-${endTime}`;

    const newData = {
      slotId: slotId,
      interviewDate: interviewDate,
      interviewPeriod: timePeriod,
      buName: slot.Bu_Name,
    };

    let modified = false;
    Object.keys(newData).forEach((key) => {
      if (index[key] !== undefined) {
        const colIndex = index[key];

        const oldValue = interview[colIndex];
        const newValue = newData[key];

        if (String(oldValue) !== String(newValue)) {
          console.log(`➡️ Updating field: ${key}`);
          console.log(`📝 Change: ${oldValue} -> ${newValue}`);

          interview[colIndex] = newValue;
          modified = true;
        }
      }
    });

    // if not modified
    if (!modified) {
      return {
        success: false,
        message: "ไม่มีการแก้ไขข้อมูล",
      };
    }

    if (interview[19]) {
      const rawPhone = String(interview[19]).replace(/^'+/, "");
      interview[19] = `'${rawPhone}`;
    }

    // update new capacity in old slot
    const oldSlotRowIndex = findRowIndex(slotSheet, storeSlotId, "Slot_Id");
    const oldSlotRange = slotSheet.getRange(
      oldSlotRowIndex + 2,
      1,
      1,
      slotSheet.getLastColumn(),
    );
    const oldSlotData = oldSlotRange.getValues()[0];

    // update new capacity
    oldSlotData[5] = Number(oldSlotData[5]) + 1;
    oldSlotData[4] = "'" + String(oldSlotData[4]); // make sure it string
    oldSlotRange.setValues([oldSlotData]);

    // update new capacity in old slot
    const newSlotRowIndex = findRowIndex(slotSheet, slotId, "Slot_Id");
    const newSlotRange = slotSheet.getRange(
      newSlotRowIndex + 2,
      1,
      1,
      slotSheet.getLastColumn(),
    );
    const newSlotData = newSlotRange.getValues()[0];

    // update new capacity
    newSlotData[5] = Math.max(0, Number(newSlotData[5]) - 1);
    newSlotData[4] = "'" + String(newSlotData[4]); // make sure it string
    newSlotRange.setValues([newSlotData]);

    // payload
    const email = interview[19];
    const fullname = interview[6];
    const calendarId = interview[38];
    const emailDate = normalizeDate(new Date(slot.Date)).toLocaleDateString(
      "th-Th",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
    console.log(calendarId);

    // edit google calendar
    const updateCalandarPayload = {
      calendarId,
      slot,
      eventName,
      email,
      fullname,
      buName: slot.Bu_Name,
      location,
    };

    // update calendar
    updateCalendarEvent(updateCalandarPayload);

    // send mail
    const sendMailPayload = {
      to: email,
      eventName,
      buName: slot.Bu_Name,
      fullname,
      date: emailDate,
      timePeriod,
      type,
      location,
    };

    // send email
    sendEmail(sendMailPayload);

    // set new value
    interviewRange.setValues([interview]);

    return {
      success: true,
      message: "เปลี่ยนเวลาสัมภาษณ์เสร็จสิ้น",
    };
  } catch (error) {
    console.error("Error in updateSlotInter: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function updateStatusInterview(updateData) {
  try {
    const {
      eventId,
      interviewId,
      candidateName,
      userName,
      fullName,
      userRole,
      status,
      result_bu,
      result_store_id,
      result_position,
      description,
    } = updateData;

    if (userRole === USER_ROLE) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้อ่านข้อมูล",
      };
    }

    const mainSS = getSpreadsheet();
    const eventSheet = mainSS.getSheetByName(MAIN_SHEETS.EVENTS);
    const eventData = getRowsFromSheet(eventSheet);

    // get event data
    const event = eventData.find((item) => eventId === item["Sheet_ID"]);
    const event_job_type = event["Job_Type"];

    const isStore =
      event_job_type === "พนักงานประจำหน้าร้านสาขา True" ||
      event_job_type === "พนักงานประจำหน้าร้านสาขา Studio7 BaNANA";

    if (!INTERVIEW_STATUS.includes(status)) {
      return {
        success: false,
        message: "สถานะไม่ถูกต้อง",
      };
    }

    if (status === INTERVIEW_STATUS[3] && !description) {
      return {
        success: false,
        message: "กรุณากรอกเหตุผล",
      };
    }

    if (status === INTERVIEW_STATUS[1] && isStore) {
      if (!result_bu) {
        return {
          success: false,
          message: "กรุณากรอกหน่วยงาน",
        };
      }
      if (!result_store_id) {
        return {
          success: false,
          message: "กรุณากรอกสาขา",
        };
      }
      if (!result_position) {
        return {
          success: false,
          message: "กรุณากรอกตำแหน่ง",
        };
      }
    }

    const ss = SpreadsheetApp.openById(eventId);
    if (!ss) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
    if (!interviewSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const index = findRowIndex(interviewSheet, interviewId, "Interview_Id");
    const actualIndex = index + 2;
    if (index === -1) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    const row = interviewSheet
      .getRange(actualIndex, 1, 1, interviewSheet.getLastColumn())
      .getValues()[0];

    // update status
    interviewSheet.getRange(actualIndex, 38).setValue(status);

    // if status is pass
    if (status === INTERVIEW_STATUS[1]) {
      // update result bu
      interviewSheet.getRange(actualIndex, 43).setValue(result_bu);

      // update result store id
      interviewSheet.getRange(actualIndex, 44).setValue(result_store_id);

      // update result position
      interviewSheet.getRange(actualIndex, 45).setValue(result_position);
    }

    // create payload
    const interviewName = row[6];

    // update logs in transaction sheet
    const transactionSheet = ss.getSheetByName(EVENT_SHEETS.TRANSACTION);

    const now = new Date().toLocaleString("th-TH");

    const newHistory = [
      now,
      interviewId,
      "'" + userName,
      fullName,
      candidateName,
      status,
      description,
    ];

    transactionSheet.appendRow(newHistory);

    const responseMessage = `คุณได้บันทึกข้อมูลสําเร็จเสร็จสิ้น ชื่อผู้สมัคร: ${interviewName} สถานะ: ${status} ${
      status === INTERVIEW_STATUS[3] ? `หมายุเหตุ: ${description}` : ""
    }`;

    return {
      success: true,
      message: responseMessage,
    };
  } catch (error) {
    console.error("Error in updateInterview: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function updateParticipationInterview(updateData) {
  try {
    const {
      eventId,
      interviewId,
      candidateName,
      userName,
      fullName,
      userRole,
      status,
    } = updateData;

    if (userRole === USER_ROLE || userRole === MANAGER_ROLE) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้อ่านข้อมูล",
      };
    }

    const ss = SpreadsheetApp.openById(eventId);
    if (!ss) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    if (!PARTICIPATION_STATUS.includes(status)) {
      return {
        success: false,
        message: "สถานะไม่ถูกต้อง",
      };
    }

    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
    if (!interviewSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const index = findRowIndex(interviewSheet, interviewId, "Interview_Id");
    const actualIndex = index + 2;
    if (index === -1) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    // update status
    interviewSheet.getRange(actualIndex, 42).setValue(status);

    // update logs in transaction sheet
    const transactionSheet = ss.getSheetByName(EVENT_SHEETS.TRANSACTION);

    const now = new Date().toLocaleString("th-TH");

    const newHistory = [
      now,
      interviewId,
      "'" + userName,
      fullName,
      candidateName,
      status,
    ];

    transactionSheet.appendRow(newHistory);

    const responseMessage = `เช็คชื่อเสร็จสิ้น ชื่อผู้สมัคร: ${candidateName} สถานะ: ${status}`;

    return {
      success: true,
      message: responseMessage,
    };
  } catch (error) {
    console.error("Error in updateInterview: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function deleteInterview(deleteData) {
  try {
    const { userRole, userName, userId, eventId, interviewIds, description } =
      deleteData;

    const isUser = userRole === USER_ROLE;

    const targetIds = Array.isArray(interviewIds)
      ? interviewIds
      : [interviewIds];

    if (targetIds.length === 0 || !eventId) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    // ถ้าเป็น User ต้องบังคับกรอกเหตุผล
    if (isUser && !description) {
      return {
        success: false,
        message: "กรุณากรอกเหตุผล",
      };
    }

    const ss = SpreadsheetApp.openById(eventId);
    if (!ss) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
    const slotSheet = ss.getSheetByName(EVENT_SHEETS.SLOTS);
    const historySheet = ss.getSheetByName(EVENT_SHEETS.HISTORY);
    const transactionSheet = ss.getSheetByName(EVENT_SHEETS.TRANSACTION);

    if (!interviewSheet || !slotSheet || !historySheet) {
      return { success: false, message: "ไม่พบชีทที่ต้องการ" };
    }

    const interviewData = getRowsFromSheet(interviewSheet);
    const slotData = getRowsFromSheet(slotSheet);

    // Build index maps once — avoids N+1 sheet reads inside the loop
    const interviewIndexMap = {};
    interviewData.forEach((row, i) => { interviewIndexMap[row.Interview_Id] = i; });

    const slotIndexMap = {};
    slotData.forEach((row, i) => { slotIndexMap[row.Slot_Id] = i; });

    const rowsToDelete = []; // สำหรับ User (ลบทิ้ง)
    const rowsToChangeStatus = []; // สำหรับ Admin (แก้สถานะ)
    const logsToAppend = [];

    for (const id of targetIds) {
      const interview = interviewData[interviewIndexMap[id]];

      if (!interview) continue;

      const candidateName = interview.Fullname;
      const candidateEmail = interview.Email;
      const candidateCalendarId = interview.Calendar_Id;

      if (isUser && interview.Candidate_Id !== userId) {
        return {
          success: false,
          message: `คุณไม่ได้รับอนุญาตให้ลบข้อมูล ID: ${id}`,
        };
      }

      const slotId = interview.Slot_Id;
      const slotIndex = slotIndexMap[slotId];

      if (slotIndex !== undefined) {
        const slotActualIndex = slotIndex + 2;
        const currentCapacity = Number(slotData[slotIndex]["Capacity"]);
        slotSheet.getRange(slotActualIndex, 6).setValue(currentCapacity + 1);
        slotData[slotIndex]["Capacity"] = currentCapacity + 1;
      }

      // เตรียม Log
      const now = new Date().toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      });

      let message = "";

      if (isUser) {
        message = `${userName} ได้ทำการยกเลิกการสมัครสัมภาษณ์เนื่องจาก ${description}`;
        logsToAppend.push([now, userName, message]);
      } else {
        message = `${userName} ได้ทำการแก้ไขสถานะสมัครสัมภาษณ์เนื่องจาก ${description}`;
      }

      const rowIndex = interviewIndexMap[id];
      if (rowIndex !== undefined) {
        const actualRow = rowIndex + 2;
        if (isUser) {
          rowsToDelete.push(actualRow);
        } else {
          rowsToChangeStatus.push(actualRow);
        }
      }

      // delete calendar
      if (candidateCalendarId && candidateCalendarId !== "") {
        deleteCalendarEvent(candidateCalendarId);
      }

      // send Mail && save transaction
      if (!isUser) {
        const payload = {
          to: candidateEmail,
          fullname: candidateName,
        };

        // send mail
        sendEmail(payload);

        const taSheet = getTASheet();
        const taData = getRowsFromSheet(taSheet);
        const taUser = taData.find((user) => {
          return user.Name === userName;
        });

        const now = new Date().toLocaleString("th-TH");
        const interviewId = interview.Interview_Id;
        const status = INTERVIEW_STATUS[4];

        const newHistory = [
          now,
          interviewId,
          taUser.Username,
          userName,
          candidateName,
          status,
          description,
        ];

        transactionSheet.appendRow(newHistory);
      }
    }

    if (logsToAppend.length > 0) {
      logsToAppend.forEach((log) => historySheet.appendRow(log));
    }

    if (rowsToDelete.length > 0) {
      rowsToDelete.sort((a, b) => b - a);
      rowsToDelete.forEach((row) => {
        interviewSheet.deleteRow(row);
      });
    }

    if (rowsToChangeStatus.length > 0) {
      rowsToChangeStatus.sort((a, b) => b - a);
      rowsToChangeStatus.forEach((row) => {
        interviewSheet.getRange(row, 38).setValue(INTERVIEW_STATUS[4]);
      });
    }

    return {
      success: true,
      message: isUser
        ? "ยกเลิกการสมัครเสร็จสิ้น"
        : "อัปเดตสถานะเป็นไม่ผ่านการพิจารณาเสร็จสิ้น",
    };
  } catch (error) {
    console.error("Error in deleteInterview: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function addLinktoSheet(data) {
  try {
    if (!data) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    const { eventName, interviewIds, interviewLink } = data;

    if (
      !eventName ||
      !interviewIds ||
      interviewIds.length === 0 ||
      !interviewLink
    ) {
      return {
        success: false,
        message: "ข้อมูลไม่ครบ",
      };
    }

    // Ensure interviewIds are array
    const targetIds = Array.isArray(interviewIds)
      ? interviewIds
      : [interviewIds];

    const mainSS = SpreadsheetApp.openById(MAIN_SS_ID);
    const eventSheet = mainSS.getSheetByName(MAIN_SHEETS.EVENTS);
    const eventData = getRowsFromSheet(eventSheet).find(
      (event) => event.Event_Name === eventName,
    );

    if (!eventData) {
      return { success: false, message: "ไม่พบ Event Name นี้ในระบบ" };
    }

    const eventId = eventData["Sheet_ID"];
    const ss = SpreadsheetApp.openById(eventId);
    if (!ss) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const interviewSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
    if (!interviewSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const lastRow = interviewSheet.getLastRow();
    if (lastRow < 2) return { success: false, message: "ไม่มีข้อมูลในชีท" };

    const headers = interviewSheet
      .getRange(1, 1, 1, interviewSheet.getLastColumn())
      .getValues()[0];

    const interviewIdIndex = headers.indexOf("Interview_Id");
    const interviewLinkIndex = headers.indexOf("Interview_Link");
    const fullNameIndex = headers.indexOf("Fullname");
    const emailIndex = headers.indexOf("Email");
    const statusIndex = headers.indexOf("Status");
    const calendarIdIndex = headers.indexOf("Calendar_Id");
    const interviewDateIndex = headers.indexOf("Interview_Date");

    if (
      interviewIdIndex === -1 ||
      interviewLinkIndex === -1 ||
      fullNameIndex === -1 ||
      emailIndex === -1 ||
      statusIndex === -1 ||
      interviewDateIndex === -1
    ) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    const interviewIdRange = interviewSheet.getRange(
      2,
      interviewIdIndex + 1,
      lastRow - 1,
      1,
    );
    const linkRange = interviewSheet.getRange(
      2,
      interviewLinkIndex + 1,
      lastRow - 1,
      1,
    );
    const emailRange = interviewSheet.getRange(
      2,
      emailIndex + 1,
      lastRow - 1,
      1,
    );
    const statusRange = interviewSheet.getRange(
      2,
      statusIndex + 1,
      lastRow - 1,
      1,
    );
    const calendarIdRange = interviewSheet.getRange(
      2,
      calendarIdIndex + 1,
      lastRow - 1,
      1,
    );
    const interviewDateRange = interviewSheet.getRange(
      2,
      interviewDateIndex + 1,
      lastRow - 1,
      1,
    );

    const interviewIdValues = interviewIdRange.getValues();
    const linkValues = linkRange.getValues();
    const emailValues = emailRange.getValues();
    const statusValues = statusRange.getValues();
    const calendarIdValues = calendarIdRange.getValues();
    const interviewDateValues = interviewDateRange.getValues();

    let updateCount = 0;

    for (let i = 0; i < interviewIdValues.length; i++) {
      const currentId = interviewIdValues[i][0];
      const currentStatus = String(statusValues[i][0]).trim();
      const currentCalendarId = calendarIdValues[i][0];
      const currentLink = linkValues[i][0];

      if (
        targetIds.includes(currentId) &&
        currentStatus === "รอการพิจารณา" &&
        currentCalendarId !== "" &&
        currentLink === ""
      ) {
        linkValues[i][0] = interviewLink;
        updateCount++;

        const recipientEmail = emailValues[i][0];
        const formattedDate = normalizeDate(
          interviewDateValues[i][0],
        ).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        console.log(`Sending mail to: ${recipientEmail} for ID: ${currentId}`);

        if (recipientEmail) {
          const payload = {
            to: recipientEmail,
            eventName,
            date: formattedDate,
            type: "CALL_LINK",
          };

          sendEmail(payload);
        }
      }
    }

    if (updateCount > 0) {
      linkRange.setValues(linkValues);

      return {
        success: true,
        message: `เพิ่มลิงค์สมัครสัมภาษณ์เสร็จสิ้น (${updateCount} รายการ)`,
      };
    } else {
      return {
        success: false,
        message: "ไม่พบข้อมูลที่ตรงเงื่อนไข หรือมีลิงค์อยู่แล้ว",
      };
    }
  } catch (error) {
    console.error("Error in addLinktoSheet: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}
