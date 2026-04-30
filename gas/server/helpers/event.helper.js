const SHEEET_STUCTURE = [
  {
    name: "Interviews",
    headers: [
      "Interview_Id",
      "Slot_Id",
      "Candidate_Id",
      "Interview_Date",
      "Interview_Period",
      "Bu_Name",
      "Fullname",
      "Nickname",
      "Birthdate",
      "Age",
      "Gender",
      "Weight",
      "Height",
      "Nationality",
      "National_Id",
      "Marital_Status",
      "Military_Status",
      "Current_Address",
      "Phone_Number",
      "Email",
      "Line_Id",
      "Highest_Education",
      "Institution",
      "Faculty",
      "Major",
      "Work_Location",
      "Work_Period",
      "Work_Position",
      "Work_Description",
      "Sales_Experience",
      "Position_Type",
      "Position_Applied",
      "Preferred_Province",
      "Preferred_District",
      "Expected_Salary",
      "Available_Start_Date",
      "Resume_Url",
      "Status",
      "Calendar_Id",
      "TimeStamp",
      "Interview_Link",
      "Participation_Status",
      "Result_Bu",
      "Result_Store_Id",
      "Result_Position",
    ],
  },
  {
    name: "Slots",
    headers: [
      "Slot_Id",
      "Date",
      "Start_Time",
      "End_Time",
      "Bu_Name",
      "Capacity",
    ],
  },
  {
    name: "History",
    headers: ["TimeStamp", "Name", "Action"],
  },
  {
    name: "Transaction",
    headers: [
      "TimeStamp",
      "Interview_Id",
      "Username",
      "Name",
      "Candidate_Name",
      "Status_Changes",
      "Description",
    ],
  },
];

function filteredEventByQuery(eventData, query, userRole) {
  const { search, status } = query;
  let statusValue;
  const searchValue = search ? String(search).toLowerCase() : "";
  const roleValue = userRole ? userRole : "USER";

  if (roleValue !== "USER") {
    statusValue = status ? String(status).toLowerCase() : "all";
  }

  const isUser = roleValue === USER_ROLE;
  const now = new Date();

  return eventData.filter((event) => {
    // filer by status
    if (
      statusValue &&
      statusValue !== "" &&
      statusValue !== "all" &&
      String(event["Status"]).toLowerCase() !== statusValue
    )
      return false;

    // filter time if not admin
    if (isUser && now < normalizeDate(event["Opening_At"])) return false;

    if (isUser && now > normalizeDate(event["Closing_At"])) return false;

    if (
      isUser &&
      String(event["Status"]).toLowerCase() !==
        String(EVENT_STATUS[0]).toLowerCase()
    )
      return false;

    // filter by search
    if (search && searchValue !== "") {
      const matchesSearch = Object.values(event).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchValue);
      });

      if (!matchesSearch) return false;
    }
    return true;
  });
}

function createSpreadSheet(eventData) {
  const { eventName } = eventData;

  // Create spreadsheet
  const ss = SpreadsheetApp.create(eventName);
  ss.setSpreadsheetLocale("th");
  const ss_id = ss.getId();
  const ss_url = ss.getUrl();

  //   Move spreadsheet to events folder
  const file = DriveApp.getFileById(ss_id);
  const folder = DriveApp.getFolderById(EVENTS_FOLDER_ID);
  file.moveTo(folder);

  // Allow all access
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);

  //   Add sheets
  SHEEET_STUCTURE.forEach((config, index) => {
    let sheet;

    if (index === 0) {
      sheet = ss.getSheets()[0];
      sheet.setName(config.name).clear();
    } else {
      sheet = ss.insertSheet(config.name);
    }

    // Headers
    if (config.headers && config.headers.length > 0) {
      const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
      headerRange.setValues([config.headers]);

      headerRange.setFontWeight("bold").setBackground("#e0e0e0");
      sheet.setFrozenRows(1);
    }
  });

  return { ss_id, ss_url };
}

function checkEventNameExists(eventName) {
  const eventSheet = getEventSheet();
  const eventData = getRowsFromSheet(eventSheet);
  return eventData.some((event) => event["Event_Name"] === eventName);
}

function updateEventDataInMainSheet(eventId, eventData) {
  const {
    eventName,
    eventType,
    eventStatus,
    openingDate,
    openningTime,
    closingDate,
    closingTime,
    location,
    jobType,
  } = eventData;

  const eventSheet = getEventSheet();

  // Check event type
  const formattedEventType = eventType?.toString().toUpperCase();
  if (formattedEventType && !EVENT_TYPE.includes(formattedEventType)) {
    return {
      success: false,
      message: "ประเภทอีเวนต์ไม่ถูกต้อง",
    };
  }

  // validate job type
  const jobTypeSheet = getJobTypeSheet();
  const jobTypeRows = getRowsFromSheet(jobTypeSheet);

  const isJobTypeExists = jobTypeRows.some((job) => job.Name === jobType);
  if (!isJobTypeExists) {
    return {
      success: false,
      message: "ประเภทงานไม่ถูกต้อง",
    };
  }

  // Check eventStatus
  const formattedEventStatus = eventStatus?.toString().toUpperCase();
  if (formattedEventStatus && !EVENT_STATUS.includes(formattedEventStatus)) {
    return {
      success: false,
      message: "สถานะไม่ถูกต้อง",
    };
  }

  // find Index
  const rowIndex = findRowIndex(eventSheet, eventId, "Sheet_ID");
  if (rowIndex === -1) {
    return {
      success: false,
      message: "ไม่พบข้อมูลอีเวนต์",
    };
  }

  const actualRow = rowIndex + 2;

  const storedRow = eventSheet
    .getRange(actualRow, 1, 1, eventSheet.getLastColumn())
    .getValues()[0];

  const COL = {
    SHEET_ID: 1,
    EVENT_NAME: 2,
    EVENT_TYPE: 3,
    OPENING_AT: 4,
    CLOSING_AT: 5,
    LOCATION: 6,
    JOB_TYPE: 7,
    IMG: 9,
    EVENT_STATUS: 10,
  };

  const storedOpeningAt = storedRow[COL.OPENING_AT - 1]
    ? normalizeDate(storedRow[COL.OPENING_AT - 1])
    : null;

  const storedClosingAt = storedRow[COL.CLOSING_AT - 1]
    ? normalizeDate(storedRow[COL.CLOSING_AT - 1])
    : null;

  let newOpeningAt = null;
  let newClosingAt = null;

  // ===== Combine incoming datetime =====
  if (openingDate && openningTime) {
    newOpeningAt = combineDateTime(openingDate, openningTime);
  }

  if (closingDate && closingTime) {
    newClosingAt = combineDateTime(closingDate, closingTime);
  }

  // Case 1: มี opening + closing ใหม่
  if (newOpeningAt && newClosingAt) {
    if (newOpeningAt >= newClosingAt) {
      return {
        success: false,
        message: "วันเวลาเปิดต้องน้อยกว่าวันเวลาปิด",
      };
    }
  }

  // Case 2: มี closing ใหม่ แต่ไม่มี opening ใหม่
  if (!newOpeningAt && newClosingAt && storedOpeningAt) {
    if (storedOpeningAt >= newClosingAt) {
      return {
        success: false,
        message: "วันเวลาเปิดต้องน้อยกว่าวันเวลาปิด",
      };
    }
  }

  // Case 3: มี opening ใหม่ แต่ไม่มี closing ใหม่
  if (!newClosingAt && newOpeningAt && storedClosingAt) {
    if (newOpeningAt >= storedClosingAt) {
      return {
        success: false,
        message: "วันเวลาเปิดต้องน้อยกว่าวันเวลาปิด",
      };
    }
  }

  const updates = [];
  const updateIfChanged = (col, newValue) => {
    console.log("storeRow: ", storedRow[col - 1]);
    console.log("new Value: ", newValue);
    if (
      newValue !== undefined &&
      storedRow[col - 1]?.toString() !== newValue?.toString()
    ) {
      updates.push({ col, value: newValue });
    }
  };

  updateIfChanged(COL.EVENT_NAME, eventName);
  updateIfChanged(COL.EVENT_TYPE, formattedEventType);
  updateIfChanged(COL.EVENT_STATUS, formattedEventStatus);

  if (formattedEventType === EVENT_TYPE[1]) {
    updateIfChanged(COL.LOCATION, "");
    updateIfChanged(COL.IMG, ONLINE_INTERVIEW_IMAGE);
  } else {
    updateIfChanged(COL.LOCATION, location);
    updateIfChanged(COL.IMG, ONSITE_INTERVIEW_IMAGE);
  }

  updateIfChanged(COL.JOB_TYPE, jobType);

  if (newOpeningAt) {
    updateIfChanged(
      COL.OPENING_AT,
      new Date(newOpeningAt).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      }),
    );
  }

  if (newClosingAt) {
    updateIfChanged(
      COL.CLOSING_AT,
      new Date(newClosingAt).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      }),
    );
  }

  console.log(updates);

  if (updates.length === 0) {
    return { success: true, message: "ข้อมูลไม่มีการเปลี่ยนแปลง" };
  }

  updates.forEach(({ col, value }) => {
    storedRow[col - 1] = value;
  });
  eventSheet.getRange(actualRow, 1, 1, storedRow.length).setValues([storedRow]);

  return true;
}

function updateHistoryLogs(ss, userName, userRole, action) {
  if (userRole === USER_ROLE || userRole === MANAGER_ROLE || !userName) {
    return {
      success: false,
      message: "คุณไม่สามารถแก้ไขชีทนี้ได้",
    };
  }

  if (!action) {
    return {
      success: false,
      message: "กรุณาระบุหมายเหตุ",
    };
  }

  const historySheet = ss.getSheetByName(EVENT_SHEETS.HISTORY);
  if (!historySheet) {
    return {
      success: false,
      message: "ไม่พบชีทนี้",
    };
  }

  // Creat payload
  const now = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });
  const payload = [now, userName, action];

  historySheet.appendRow(payload);
  return true;
}

function combineDateTime(date, time) {
  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split(":");

  const dateTime = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  return dateTime;
}
