function getFullEventStructure() {
  try {
    const eventSheet = SpreadsheetApp.openById(MAIN_SS_ID).getSheetByName(
      MAIN_SHEETS.EVENTS,
    );
    const eventRows = getRowsFromSheet(eventSheet);

    const now = new Date();
    const filteredEventRows = eventRows.filter((event) => {
      return (
        now > normalizeDate(event.Opening_At) &&
        now < normalizeDate(event.Closing_At) &&
        String(event.Status).toLowerCase() ===
          String(EVENT_STATUS[0]).toLowerCase()
      );
    });

    if (filteredEventRows.length === 0) {
      return { success: true, data: [] };
    }

    const token = ScriptApp.getOAuthToken();
    const slotsRange = encodeURIComponent(EVENT_SHEETS.SLOTS);

    const requests = filteredEventRows.map((event) => ({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${event.Sheet_ID}/values/${slotsRange}?valueRenderOption=FORMATTED_VALUE`,
      method: "get",
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    }));

    const responses = UrlFetchApp.fetchAll(requests);

    const fullStructure = filteredEventRows.map((data, index) => {
      const eventObj = {
        eventId: data.Sheet_ID,
        eventName: data.Event_Name,
        eventType: data.Event_Type,
        eventJobType: data.Job_Type,
        eventStart: normalizeDate(data.Opening_At),
        eventEnd: normalizeDate(data.Closing_At),
        slots: [],
      };

      try {
        const res = responses[index];
        if (res.getResponseCode() === 200) {
          const json = JSON.parse(res.getContentText());
          if (json.values && json.values.length > 1) {
            const slotValues = json.values.slice(1);
            const slotsMap = new Map();

            slotValues.forEach((row) => {
              const [uuid, date, startTime, endTime, buName, capacity] = row;
              const uniqueSlotKey = `${date}_${startTime}_${endTime}`;

              if (!slotsMap.has(uniqueSlotKey)) {
                slotsMap.set(uniqueSlotKey, {
                  slotId: uniqueSlotKey,
                  date: date,
                  startTime: startTime,
                  endTime: endTime,
                  bus: [],
                });
              }

              slotsMap.get(uniqueSlotKey).bus.push({
                allocationId: uuid,
                buName: buName,
                capacity: parseInt(capacity) || 0,
              });
            });

            eventObj.slots = Array.from(slotsMap.values());
          }
        }
      } catch (innerErr) {
        console.warn(
          `Cannot fetch slots for event ${eventObj.eventName}: ${innerErr.message}`,
        );
      }

      return eventObj;
    });

    return JSON.parse(
      JSON.stringify({
        success: true,
        data: fullStructure,
      }),
    );
  } catch (err) {
    console.error("Error in getEventAndSlots controller: ", err.message);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function getFullManagerStructure(query = {}) {
  const { permission, username, page = 1, limit = 15 } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));

  if (!permission || !username) {
    return {
      success: false,
      message: "ไม่พบข้อมูลนี้",
    };
  }

  try {
    const token = ScriptApp.getOAuthToken();
    const transactionRange = encodeURIComponent(EVENT_SHEETS.TRANSACTION);
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${permission}/values/${transactionRange}?valueRenderOption=FORMATTED_VALUE`;

    const res = UrlFetchApp.fetch(apiUrl, {
      method: "get",
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    });

    if (res.getResponseCode() !== 200) {
      return {
        success: false,
        message: "ดึงข้อมูลจาก Sheet ล่าช้าหรือไม่ตอบสนอง",
      };
    }

    const json = JSON.parse(res.getContentText());
    const transactionRows = mergeMapValuesToRows(json.values);

    const filteredData = transactionRows.filter(
      (data) => String(data.Username) === String(username),
    );

    filteredData.sort((a, b) => {
      const timeA = new Date(normalizeDate(a.TimeStamp)).getTime() || 0;
      const timeB = new Date(normalizeDate(b.TimeStamp)).getTime() || 0;
      return timeB - timeA;
    });

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedData = filteredData.slice(startIndex, endIndex);

    const result = {
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

    return JSON.parse(JSON.stringify(result));
  } catch (err) {
    console.error("Error in getFullManagerSructure: ", err.message);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด: " + err.message,
    };
  }
}

function getEventAndSlots(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(3000);
    const { eventId, dateQuery } = data;
    const event = getEventById(eventId);
    if (!event.success) return event;

    const eventDetail = event.data.eventdata;
    let selectedDate;
    let slotsData;

    if (dateQuery) {
      // Specific date requested — single read
      const slots = getAllSlotsData({ date: dateQuery }, eventId);
      if (!slots.success) return slots;
      const dateData =
        slots.data.dates && slots.data.dates.length > 0
          ? slots.data.dates[0]
          : null;
      slotsData = dateData ? dateData.slots : [];

      if (slotsData.length === 0) {
        // Queried date is now empty (e.g. after deletion) — fall back to earliest available date
        const allSlots = getAllSlotsData({}, eventId);
        if (allSlots.success && allSlots.data.dates && allSlots.data.dates.length > 0) {
          const sortedDates = allSlots.data.dates.sort(
            (a, b) => new Date(a.date) - new Date(b.date),
          );
          selectedDate = sortedDates[0].date;
          slotsData = sortedDates[0].slots;
        } else {
          selectedDate = dateQuery;
        }
      } else {
        selectedDate = dateQuery;
      }
    } else {
      // No date — read once, pick the earliest future date from the result
      const allSlots = getAllSlotsData({}, eventId);
      if (!allSlots.success) return allSlots;

      if (allSlots.data.dates && allSlots.data.dates.length > 0) {
        const sortedDates = allSlots.data.dates.sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        selectedDate = sortedDates[0].date;
        slotsData = sortedDates[0].slots;
      } else {
        selectedDate = new Date().toISOString().split("T")[0];
        slotsData = [];
      }
    }

    return JSON.parse(
      JSON.stringify({
        success: true,
        data: { event: eventDetail, slots: slotsData, selectedDate },
      }),
    );
  } catch (err) {
    console.error("Error in getEventAndSlots controller: ", err.message);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  } finally {
    lock.releaseLock();
  }
}

function getEventAndSlotData(data) {
  try {
    if (!data) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    const { eventId, slotId } = data;
    if (!eventId || !slotId) {
      return {
        success: false,
        message: "ไม่พบข้อมูลนี้",
      };
    }

    const event = getEventById(eventId);
    if (event.success === false) {
      return {
        success: event.success,
        message: event.message,
      };
    }

    const slot = getSlotById(eventId, slotId);
    if (slot.success === false) {
      return {
        success: event.success,
        message: event.message,
      };
    }

    const eventDetail = event.data.eventdata;

    const response = {
      success: true,
      data: {
        event: eventDetail,
        slot: slot.data,
      },
    };

    return JSON.parse(JSON.stringify(response));
  } catch (error) {
    console.error("Error in getEventAndSlotData controller: ", error.message);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function getEventAndBuStructure() {
  try {
    const eventSheet = Sheets.Spreadsheets.Values.batchGet(MAIN_SS_ID, {
      ranges: [MAIN_SHEETS.EVENTS],
      valueRenderOption: "FORMATTED_VALUE",
    });
    const eventData = mergeMapValuesToRows(eventSheet.valueRanges[0].values);

    if (eventData.length === 0) return [];

    const token = ScriptApp.getOAuthToken();
    const slotsRange = encodeURIComponent(EVENT_SHEETS.SLOTS);

    const requests = eventData.map((row) => ({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${row.Sheet_ID}/values/${slotsRange}?valueRenderOption=FORMATTED_VALUE`,
      method: "get",
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    }));

    const responses = UrlFetchApp.fetchAll(requests);

    const payload = eventData.map((row, index) => {
      const eventId = row.Sheet_ID;
      const eventName = row.Event_Name;
      let buList = [];

      try {
        const res = responses[index];
        if (res.getResponseCode() === 200) {
          const json = JSON.parse(res.getContentText());
          const allSlotData = mergeMapValuesToRows(json.values);

          const uniqueBuNames = [
            ...new Set(
              allSlotData
                .map((data) =>
                  data.Bu_Name ? String(data.Bu_Name).trim() : "",
                )
                .filter((name) => name),
            ),
          ];

          buList = uniqueBuNames.map((name) => ({
            buName: name,
          }));
        }
      } catch (e) {
        console.warn(`Error getting BUs for ${eventName}: ${e.message}`);
      }

      return {
        eventId: eventId,
        eventName: eventName,
        bu: buList,
      };
    });

    return payload.sort((a, b) => a.eventName.localeCompare(b.eventName));
  } catch (error) {
    console.error(
      "Error in getEventAndBuStructure controller: ",
      error.message,
    );
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

/**
 * ดึงข้อมูล Dashboard รองรับ Filter: Date, BU, และ EventName
 */
function getAllDataForDashBoard(query = {}) {
  try {
    // Return cached result if available (10-minute TTL)
    const cacheKey =
      "dashboard_" +
      (query.eventName || "") +
      "|" +
      (query.buName || "") +
      "|" +
      (query.startDate || "") +
      "|" +
      (query.endDate || "");
    const cache = CacheService.getScriptCache();
    const cached = cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = {
      kpi: {
        totalEvents: 0,
        totalCandidates: 0,
        totalOffers: 0,
        conversionRate: 0,
        totalCapacity: 0,
        capacityUtilization: 0,
      },
      charts: {
        statusDistribution: {},
        candidateTrend: {
          labels: [],
          data: [],
        },
      },
    };

    const formatDateKey = (dateInput) => {
      if (!dateInput) return null;
      const date = new Date(dateInput);
      return Utilities.formatDate(
        date,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd",
      );
    };

    const filterEventName = query.eventName || null;
    const filterBu = query.buName || null;
    const filterStart = query.startDate
      ? new Date(query.startDate).getTime()
      : null;
    const filterEnd = query.endDate ? new Date(query.endDate).getTime() : null;

    const eventSheet = getEventSheet();
    let eventData = getRowsFromSheet(eventSheet);

    if (!eventData || eventData.length === 0)
      return { success: true, payload: result };

    if (filterEventName) {
      eventData = eventData.filter((e) => e.Event_Name === filterEventName);
    }

    result.kpi.totalEvents = eventData.length;
    const trendMap = {};

    const VALID_STATUSES = new Set([
      "ผ่าน",
      "ไม่ผ่าน",
      "รอการพิจารณา",
      "เก็บไว้พิจารณา",
      "ไม่ผ่านการพิจารณา",
    ]);

    // Use SpreadsheetApp (internal GAS service) instead of UrlFetchApp to avoid
    // REST API bandwidth quota. Only read the 3 columns needed from each sheet:
    //   Slots col 6   → Capacity
    //   Interviews col 6  → Bu_Name
    //   Interviews col 38 → Status
    //   Interviews col 40 → TimeStamp
    eventData.forEach((event) => {
      try {
        const ss = SpreadsheetApp.openById(event.Sheet_ID);

        const slotSheet = ss.getSheetByName(EVENT_SHEETS.SLOTS);
        if (slotSheet) {
          const lastSlotRow = slotSheet.getLastRow();
          if (lastSlotRow > 1) {
            const capValues = slotSheet
              .getRange(2, 6, lastSlotRow - 1, 1)
              .getValues();
            capValues.forEach(([cap]) => {
              result.kpi.totalCapacity += parseInt(cap) || 0;
            });
          }
        }

        const intSheet = ss.getSheetByName(EVENT_SHEETS.INTERVIEWS);
        if (intSheet) {
          const lastIntRow = intSheet.getLastRow();
          if (lastIntRow > 1) {
            const rowCount = lastIntRow - 1;
            const lastCol = intSheet.getLastColumn();

            // Detect column positions from header row — works for both old sheets
            // (no Shop column) and new sheets (Shop added, shifting Bu_Name right by 1).
            const intHeaders = intSheet.getRange(1, 1, 1, lastCol).getValues()[0];
            const buColNum     = intHeaders.indexOf("Bu_Name")   + 1;
            const statusColNum = intHeaders.indexOf("Status")    + 1;
            const tsColNum     = intHeaders.indexOf("TimeStamp") + 1;

            if (!buColNum || !statusColNum || !tsColNum) {
              console.warn("Missing expected headers in interviews sheet for event: " + event.Event_Name);
              return;
            }

            const buCol     = intSheet.getRange(2, buColNum,     rowCount, 1).getValues();
            const statusCol = intSheet.getRange(2, statusColNum, rowCount, 1).getValues();
            const tsCol     = intSheet.getRange(2, tsColNum,     rowCount, 1).getValues();

            for (let i = 0; i < rowCount; i++) {
              const buName = String(buCol[i][0] || "");
              const status = String(statusCol[i][0] || "");
              let tsRaw = tsCol[i][0];
              const timeStampStr =
                tsRaw instanceof Date
                  ? tsRaw.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
                  : String(tsRaw || "");

              if (!status && !timeStampStr) continue;
              if (!VALID_STATUSES.has(status)) continue;

              const cleanTimestamp = timeStampStr.replace(/\s+/g, " ").trim();
              const parsedDate = parseThaiDateTime(cleanTimestamp);
              const interviewDate = isNaN(parsedDate.getTime())
                ? 0
                : parsedDate.getTime();

              const dateValid =
                (!filterStart || interviewDate >= filterStart) &&
                (!filterEnd || interviewDate <= filterEnd);
              const buValid = !filterBu || buName === filterBu;

              if (!dateValid || !buValid) continue;

              result.kpi.totalCandidates++;

              result.charts.statusDistribution[status] =
                (result.charts.statusDistribution[status] || 0) + 1;

              if (status === "ผ่าน") {
                result.kpi.totalOffers++;
              }

              const dateKey = formatDateKey(parsedDate);
              if (dateKey) {
                trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
              }
            }
          }
        }
      } catch (e) {
        console.warn(
          "Error processing event " + event.Event_Name + ": " + e.message,
        );
      }
    });

    const sortedDates = Object.keys(trendMap).sort();
    result.charts.candidateTrend.labels = sortedDates;
    result.charts.candidateTrend.data = sortedDates.map(
      (date) => trendMap[date],
    );

    if (result.kpi.totalCandidates > 0) {
      result.kpi.conversionRate = (
        (result.kpi.totalOffers / result.kpi.totalCandidates) *
        100
      ).toFixed(2);
    }
    if (result.kpi.totalCapacity > 0) {
      result.kpi.capacityUtilization = (
        result.kpi.totalCandidates / result.kpi.totalCapacity
      ).toFixed(2);
    }

    const finalResult = { success: true, payload: result };

    try {
      cache.put(cacheKey, JSON.stringify(finalResult), 600);
    } catch (cacheErr) {
      console.warn("Dashboard cache write failed: " + cacheErr.message);
    }

    return finalResult;
  } catch (error) {
    console.error("Error in getAllDataForDashBoard: ", error.message);
    return { success: false, message: error.message };
  }
}
