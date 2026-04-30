function filterSlotsByQuery(eventId, query) {
  const { date, startTime } = query;

  const dateValue = date
    ? String(new Date(date).toLocaleDateString())
    : "";

  const startTimeValue =
    startTime instanceof Date
      ? Utilities.formatDate(startTime, "Asia/Bangkok", "HH:mm")
      : String(startTime);

  //    Get slot sheet
  const slotSheet = SpreadsheetApp.openById(eventId).getSheetByName(
    EVENT_SHEETS.SLOTS
  );

  //    Get slot values
  const slotsData = slotSheet.getDataRange().getValues().slice(1);

  const formattedSlotValues = slotsData.map((slot) => {
    return {
      Slot_Id: slot[0],
      Date: slot[1],
      Start_Time:
        slot[2] instanceof Date
          ? Utilities.formatDate(slot[2], "Asia/Bangkok", "HH:mm")
          : slot[2],
      End_Time:
        slot[3] instanceof Date
          ? Utilities.formatDate(slot[3], "Asia/Bangkok", "HH:mm")
          : slot[3],
      Bu_Name: slot[4],
      Capacity: slot[5],
    };
  });

  //    Filter slot values
  const filteredSlotValues = formattedSlotValues.filter((slot) => {
    if (dateValue === "") {
      const now = new Date();
      const slotDate = normalizeDate(slot.Date);
      return slotDate >= now;
    } else {
      const normalizeSlotDate = normalizeDate(slot.Date).toLocaleDateString()
      if (normalizeSlotDate !== dateValue) return false;
    }

    if (startTime && startTimeValue !== "") {
      if (slot.Start_Time !== startTimeValue) return false;
    }

    return true;
  });

  return filteredSlotValues;
}

function formatTime(timeValue) {
  return new Date(timeValue).toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getMergedSlotsData() {
  const eventSheet = getEventSheet();
  const eventData = getRowsFromSheet(eventSheet);

  const activeEvents = eventData.filter(
    (event) => event.Status !== EVENT_STATUS[1]
  );
  if (activeEvents.length === 0) return [];

  const token = ScriptApp.getOAuthToken();
  const slotsRange = encodeURIComponent(EVENT_SHEETS.SLOTS);

  const requests = activeEvents.map((event) => ({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${event.Sheet_ID}/values/${slotsRange}?valueRenderOption=FORMATTED_VALUE`,
    method: "get",
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
  }));

  const responses = UrlFetchApp.fetchAll(requests);

  return activeEvents.map((event, index) => {
    const eventObj = {
      sheetId: event.Sheet_ID,
      eventName: event.Event_Name,
      eventType: event.Event_Type,
      location: event.Location || "",
      imageUrl: event.Image_Url,
      dates: [],
    };

    try {
      const res = responses[index];
      if (res.getResponseCode() !== 200) return eventObj;

      const json = JSON.parse(res.getContentText());
      if (!json.values || json.values.length <= 1) return eventObj;

      const groupedByDate = {};
      json.values.slice(1).forEach((row) => {
        const date = String(row[1] || "");
        const startTime = String(row[2] || "");
        const endTime = String(row[3] || "");
        const capacity = row[5] || 0;

        if (!date) return;
        if (!groupedByDate[date]) groupedByDate[date] = [];
        groupedByDate[date].push({ startTime, endTime, capacity });
      });

      for (const [date, slots] of Object.entries(groupedByDate)) {
        eventObj.dates.push({ date, slots });
      }
    } catch (e) {
      console.warn(
        `Cannot fetch slots for ${event.Event_Name}: ${e.message}`
      );
    }

    return eventObj;
  });
}

function validateSlotData(eventId, slots, date) {
  const eventSheet = getEventSheet();
  const eventData = getRowsFromSheet(eventSheet);
  const event = eventData.find((event) => event.Sheet_ID === eventId);
  if (!event) {
    return {
      success: false,
      message: "ไม่พบชีทนี้",
    };
  }

  const storeOpeningAt = normalizeDate(event.Opening_At);
  const storeClosingAt = normalizeDate(event.Closing_At);
  const requestDate = toDateOnly(new Date(date));

  if (requestDate < toDateOnly(storeOpeningAt) || requestDate > toDateOnly(storeClosingAt)) {
    return {
      success: false,
      message: "กรุณาเลือกวันที่ที่อยู่ในช่วงเปิดรับผู้สมัคร",
    };
  }

  // Insert to sheet
  const slotSheet = SpreadsheetApp.openById(eventId).getSheetByName(
    EVENT_SHEETS.SLOTS
  );
  if (!slotSheet) {
    return {
      success: false,
      message: "ไม่พบชีทนี้",
    };
  }

  const slotData = getRowsFromSheet(slotSheet);

  for (const slot of slots) {
    if (!slot.startTime || !slot.endTime) {
      return {
        success: false,
        message: "ข้อมูลไม่ครบ",
      };
    }

    // Check exists slots
    const isExistsSlot = slotData.find((storeSlot) => {
      const exists = normalizeDate(storeSlot.Date).toLocaleDateString() === new Date(date).toLocaleDateString() && formatTimeTh(new Date(storeSlot.Start_Time)) === slot.startTime && formatTimeTh(new Date(storeSlot.End_Time)) === slot.endTime
      return !!exists
    })
    if (isExistsSlot) {
      return {
        success: false,
        message: "สล็อตนี้ถูกสร้างเปิดแล้ว",
        date: `${new Date(date).toLocaleDateString("th-TH")} ${slot.startTime} - ${slot.endTime}`
      }
    }

    const startSlotDate = combineDateTime(date, slot.startTime);
    const endSlotDate = combineDateTime(date, slot.endTime);

    if (startSlotDate < storeOpeningAt) {
      return {
        success: false,
        message: "ไม่สามารถเปิดสล็อตก่อนเวลาเปิดอีเวนต์ได้",
        date: `${new Date(date).toLocaleDateString("th-TH")} ${slot.startTime}`,
      };
    }

    if (startSlotDate >= storeClosingAt) {
      return {
        success: false,
        message: "ไม่สามารถเปิดสล็อตหลังเวลาเปิดอีเวนต์ได้",
        date: `${new Date(date).toLocaleDateString("th-TH")} ${slot.startTime}`,
      };
    }

    if (endSlotDate > storeClosingAt) {
      return {
        success: false,
        message: "ไม่สามารถเปิดสล็อตช่วงเวลานี้ได้เนื่องจากเกินเวลาเปิดอีเวนต์",
        date: `${new Date(date).toLocaleDateString("th-TH")} ${slot.startTime} - ${slot.endTime}`,
      };
    }
  }

  return true
}
