function createSlotEvent(slotData) {
  try {
    if (!slotData) {
      return {
        success: false,
        message: "ข้อมูลไม่ครบ",
      };
    }

    const { eventId, date, slots, userName, userRole } = slotData;

    // Validate the data
    if (!date || !Array.isArray(slots) || slots.length === 0) {
      return {
        success: false,
        message: "ข้อมูลไม่ครบ",
      };
    }

    // Validate user role
    if (userRole === USER_ROLE || userRole === MANAGER_ROLE) {
      return {
        success: false,
        message: "คุณไม่สามารถสร้างชีทนี้ได้",
      };
    }

    // Vadidate opening date and close date
    const validateData = validateSlotData(eventId, slots, date);
    if (validateData && validateData.success === false) {
      return {
        success: false,
        message: validateData.message,
        date: validateData.date ? validateData.date : "",
      };
    }

    const slotSheet = SpreadsheetApp.openById(eventId).getSheetByName(
      EVENT_SHEETS.SLOTS,
    );

    const outputData = [];

    slots.forEach((slot) => {
      slot.bu.forEach((business) => {
        const slotId = Utilities.getUuid();
        outputData.push([
          slotId,
          String(new Date(date).toLocaleDateString("th-TH")),
          String(slot.startTime),
          String(slot.endTime),
          "'" + business.name, // Make sure is string
          Number(business.capacity),
        ]);
      });
    });

    // update in sheet
    if (outputData.length > 0) {
      slotSheet
        .getRange(
          slotSheet.getLastRow() + 1,
          1,
          outputData.length,
          outputData[0].length,
        )
        .setValues(outputData);
    }

    // create log
    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });
    const historySheet = SpreadsheetApp.openById(eventId).getSheetByName(
      EVENT_SHEETS.HISTORY,
    );
    if (!historySheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    historySheet.appendRow([now, userName, `สร้างสล็อต`]);

    return {
      success: true,
      message: "สร้างสล็อตสําเร็จ",
    };
  } catch (error) {
    console.error("Error in createSlotEvent: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function checkSlotStatus(query = {}) {
  try {
    // Get All Event Id
    const mergedData = getMergedSlotsData();

    const { eventName, date } = query;

    if (!date) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    const dateValue = new Date(date).toLocaleDateString();

    const result = mergedData
      .map((event) => {
        // Filter by event name
        if (eventName && event.eventName !== eventName) {
          return null;
        }

        // matching date
        const matchedDate = event.dates.find((dateItem) => {
          const normalizeSlotDate = normalizeDate(
            dateItem.date,
          ).toLocaleDateString();
          return normalizeSlotDate === dateValue;
        });

        if (!matchedDate) {
          return null;
        }

        const totalCapacity = matchedDate.slots
          ? matchedDate.slots.reduce((sum, s) => sum + Number(s.capacity || 0), 0)
          : 0;

        return {
          Sheet_ID: event.sheetId,
          Event_Name: event.eventName,
          Event_Type: event.eventType,
          Location: event.location || "",
          Image_Url: event.imageUrl,
          status: totalCapacity === 0 ? "ไม่ว่าง" : "ว่าง",
        };
      })
      .filter((item) => item !== null);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error in getMergedSlots: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function getAllSlotsData(query = {}, eventId) {
  try {
    if (!eventId) {
      return { success: true, data: { dates: [] } };
    }

    const filteredData = filterSlotsByQuery(eventId, query);

    let groupedMap = {};

    filteredData.forEach((data) => {
      const dateObj = new Date(data["Date"]);
      const dateKey = Utilities.formatDate(
        dateObj,
        "Asia/Bangkok",
        "yyyy-MM-dd",
      );

      const startTime = data["Start_Time"];
      const endTime = data["End_Time"];
      const timeKey = `${startTime}-${endTime}`;

      if (!groupedMap[dateKey]) groupedMap[dateKey] = {}; // แก้โครงสร้างนิดหน่อยเพื่อให้ loop ง่าย
      if (!groupedMap[dateKey][timeKey]) {
        groupedMap[dateKey][timeKey] = {
          startTime: startTime,
          endTime: endTime,
          bu: [],
        };
      }

      groupedMap[dateKey][timeKey].bu.push({
        slotId: data["Slot_Id"],
        name: data["Bu_Name"],
        capacity: data["Capacity"],
      });
    });

    const result = Object.keys(groupedMap)
      .sort()
      .map((dateKey) => {
        const slotsObj = groupedMap[dateKey];
        const slots = Object.values(slotsObj);

        slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

        return {
          date: dateKey,
          slots: slots,
        };
      });

    return {
      success: true,
      data: {
        dates: result,
      },
    };
  } catch (error) {
    console.error("Error in getAllSlotsData: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function getSlotById(eventId, slotId) {
  try {
    if (!eventId || !slotId) {
      return { success: false, message: "ข้อมูลไม่ครบ" };
    }

    const response = Sheets.Spreadsheets.Values.batchGet(eventId, {
      ranges: [EVENT_SHEETS.SLOTS],
      valueRenderOption: "FORMATTED_VALUE",
    });

    if (!response.valueRanges || !response.valueRanges[0].values) {
      return { success: false, message: "ไม่พบชีทนี้" };
    }

    const slotData = mergeMapValuesToRows(response.valueRanges[0].values);
    const slot = slotData.find((slot) => slot["Slot_Id"] === slotId);

    if (!slot) {
      return { success: false, message: "ไม่พบข้อมูลนี้" };
    }

    return {
      success: true,
      data: slot,
    };
  } catch (error) {
    console.error("Error in getSlotById: ", error); // Note typo fixed from getAllSlotsData
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function editSlotEvent(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (!payload || !payload.bu || !Array.isArray(payload.bu)) {
      return {
        success: false,
        message: "รูปแบบข้อมูลไม่ถูกต้อง (Missing BU Array)",
      };
    }

    const {
      eventId,
      date, // ต้องส่ง Date มาด้วยเสมอเพื่อความชัวร์ (YYYY-MM-DD)
      startTime, // เวลาใหม่
      endTime, // เวลาใหม่
      bu, // Array ของ BUs
      userName,
      userRole,
      action,
    } = payload;

    if (userRole === USER_ROLE) {
      return { success: false, message: "Access Denied: คุณไม่มีสิทธิ์แก้ไข" };
    }

    const ss = SpreadsheetApp.openById(eventId);
    const slotSheet = ss.getSheetByName(EVENT_SHEETS.SLOTS);
    if (!slotSheet) return { success: false, message: "ไม่พบชีท Slots" };

    const allData = slotSheet.getDataRange().getValues();

    const incomingSlotIds = bu
      .filter((b) => b.slotId)
      .map((b) => b.slotId.toString());

    let targetRowsIndices = [];
    let originalDateStr = null;
    let originalStartTime = null;
    let originalEndTime = null;

    if (incomingSlotIds.length > 0) {
      const refId = incomingSlotIds[0];
      const refRowIndex = allData.findIndex(
        (row) => row[0].toString() === refId,
      );

      if (refRowIndex !== -1) {
        originalDateStr = formatDateStandard(allData[refRowIndex][1]); // ฟังก์ชันแปลงวันที่
        originalStartTime = allData[refRowIndex][2].toString();
        originalEndTime = allData[refRowIndex][3].toString();
      }
    }

    if (originalDateStr) {
      allData.forEach((row, index) => {
        const rowDate = formatDateStandard(row[1]);
        const rowStart = row[2].toString();
        const rowEnd = row[3].toString();

        if (
          rowDate === originalDateStr &&
          rowStart === originalStartTime &&
          rowEnd === originalEndTime
        ) {
          targetRowsIndices.push({ index: index, data: row });
        }
      });
    }

    const rowsToDelete = [];
    const rowsToUpdate = [];
    const itemsToCreate = [];

    targetRowsIndices.forEach((item) => {
      const dbSlotId = item.data[0].toString();
      if (!incomingSlotIds.includes(dbSlotId)) {
        rowsToDelete.push(item.index + 1);
      }
    });
    // 4.2 ตรวจสอบสิ่งที่ต้อง "อัพเดต" และ "สร้างใหม่"
    bu.forEach((item) => {
      if (item.slotId) {
        const target = targetRowsIndices.find(
          (t) => t.data[0].toString() === item.slotId.toString(),
        );
        if (target) {
          rowsToUpdate.push({
            rowIndex: target.index + 1,
            name: item.name,
            capacity: item.capacity,
          });
        }
      } else {
        itemsToCreate.push({
          name: item.name,
          capacity: item.capacity,
        });
      }
    });

    // 5.1 DELETE (ต้องลบจากล่างขึ้นบน เพื่อไม่ให้ Index เพี้ยน)
    rowsToDelete.sort((a, b) => b - a);
    rowsToDelete.forEach((rowNum) => {
      slotSheet.deleteRow(rowNum);
    });

    // 5.2 UPDATE
    rowsToUpdate.forEach((item) => {
      slotSheet.getRange(item.rowIndex, 5).setValue("'" + item.name);
      slotSheet.getRange(item.rowIndex, 6).setValue(item.capacity);

      if (startTime !== originalStartTime || endTime !== originalEndTime) {
        slotSheet.getRange(item.rowIndex, 3).setValue(startTime); // Col 3
        slotSheet.getRange(item.rowIndex, 4).setValue(endTime); // Col 4
      }
    });

    if (itemsToCreate.length > 0) {
      const newRows = itemsToCreate.map((item) => {
        return [
          Utilities.getUuid(),
          new Date(date).toLocaleDateString("th-TH"),
          startTime,
          endTime,
          "'" + item.name,
          item.capacity,
        ];
      });

      const lastRow = slotSheet.getLastRow();
      slotSheet
        .getRange(lastRow + 1, 1, newRows.length, newRows[0].length)
        .setValues(newRows);
    }

    const historySheet = ss.getSheetByName("History");
    if (historySheet) {
      const timestamp = Utilities.formatDate(
        new Date(),
        "Asia/Bangkok",
        "dd/MM/yyyy HH:mm:ss",
      );
      historySheet.appendRow([
        timestamp,
        userName,
        action,
        `Updated ${bu.length} items`,
      ]);
    }

    return { success: true, message: "บันทึกข้อมูลแบบกลุ่มสำเร็จ" };
  } catch (error) {
    console.error("EditSlot Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาด: " + error.message };
  } finally {
    lock.releaseLock();
  }
}

function formatDateStandard(dateObj) {
  if (!dateObj) return "";
  return Utilities.formatDate(
    new Date(dateObj),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd",
  );
}

function deleteSlotsByTimePeriod(deleteData) {
  try {
    if (!deleteData) {
      return {
        success: false,
        message: "ข้อมูลไม่ครบ",
      };
    }

    const { userName, userRole, eventId, date, startTime, endTime, action } =
      deleteData;

    if (userRole === USER_ROLE || userRole === MANAGER_ROLE) {
      return {
        success: false,
        message: "คุณไม่สามารถลบชีทนี้ได้",
      };
    }

    // get ss
    const ss = SpreadsheetApp.openById(eventId);
    const slotSheet = ss.getSheetByName(EVENT_SHEETS.SLOTS);

    const dataRange = slotSheet.getDataRange();
    const dataValues = dataRange.getValues();

    const targetDate = new Date(date).toLocaleDateString("th-TH");
    const targetStart = startTime;
    const targetEnd = endTime;

    let deleteCount = 0;

    // use for loop to delete
    for (let i = dataValues.length - 1; i >= 0; i--) {
      const row = dataValues[i];

      const storeDate = normalizeDate(row[1]).toLocaleDateString("th-TH");
      const storeStart = formatTimeTh(row[2]);
      const storeEnd = formatTimeTh(row[3]);

      if (
        storeDate === targetDate &&
        storeStart === targetStart &&
        storeEnd === targetEnd
      ) {
        slotSheet.deleteRow(i + 1);
        deleteCount++;
      }
    }

    if (deleteCount > 0) {
      const historySheet = ss.getSheetByName(EVENT_SHEETS.HISTORY);
      const now = new Date().toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      });
      historySheet.appendRow([now, userName, action]);
    }

    return { success: true, message: "ลบสล็อตช่วงเวลานี้สําเร็จ" };
  } catch (error) {
    console.error("EditSlot Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาด: " + error.message };
  }
}

function deleteSlotEvent(slotData) {
  try {
    if (!slotData) {
      return {
        success: false,
        message: "ข้อมูลไม่ครบ",
      };
    }

    const { eventId, slotId, userName, userRole } = slotData;

    if (userRole === USER_ROLE || userRole === MANAGER_ROLE) {
      return {
        success: false,
        message: "คุณไม่สามารถลบชีทนี้ได้",
      };
    }

    const ss = SpreadsheetApp.openById(eventId);

    const slotSheet = ss.getSheetByName(EVENT_SHEETS.SLOTS);
    if (!slotSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    // find slot index
    const allSlotData = slotSheet.getDataRange().getValues();
    const index = allSlotData.findIndex((row) => row[0] === slotId);

    if (index !== -1) {
      const actualRow = index + 1;
      slotSheet.deleteRow(actualRow);
    } else {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    // update log
    const historySheet = ss.getSheetByName(EVENT_SHEETS.HISTORY);
    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    // append
    historySheet.appendRow([now, userName, "ลบสล็อต"]);

    return {
      success: true,
      message: "ลบสล็อตสําเร็จ",
    };
  } catch (error) {
    console.error("Error in deleteSlotEvent: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}
