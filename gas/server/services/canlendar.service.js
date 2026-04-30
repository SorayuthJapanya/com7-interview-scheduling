const WEBSITE_URL = "https://script.google.com/macros/s/AKfycbxgJs3sRLvQH9ArJzhwimyu1fwkYSEDBHw_CxAfiZHA3jDdOqTHSyFZP09OMcPyMqZj2g/exec";
const MAIN_EMAIL = "sorayuthjaapanya@gmail.com"

function createCalendarEvent(eventData) {
  if (!eventData) {
    return;
  }

  const { slot, eventName, email, fullname, buName, location } =
    eventData;

  const calendar = CalendarApp.getCalendarById(MAIN_EMAIL);

  if (!calendar) {
    Logger.log("Error: ไม่พบปฏิทิน หรือ คุณไม่มีสิทธิ์เข้าถึง");
    return; // จบการทำงานทันที
  }

  const dateBase = normalizeDate(slot.Date)
  const timeStartBase = new Date(slot.Start_Time)
  const timeEndBase = new Date(slot.End_Time)

  const finalStartTime = new Date(dateBase);
  finalStartTime.setHours(timeStartBase.getHours(), timeStartBase.getMinutes(), 0);

  const finalEndTime = new Date(dateBase)
  finalEndTime.setHours(timeEndBase.getHours(), timeEndBase.getMinutes(), 0)

  const thaiDate = finalStartTime.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  const timePeriod = `${Utilities.formatDate(finalStartTime, Session.getScriptTimeZone(), "HH:mm")} - ${Utilities.formatDate(finalEndTime, Session.getScriptTimeZone(), "HH:mm")}`;

  const description = `Comseven Career is confirming your scheduled Interview.

Comseven Career ได้ยืนยันการนัดหมายสัมภาษณ์ของท่าน

หัวข้อ: ${eventName} - ${buName}
วันที่: ${thaiDate}
เวลา: ${timePeriod}
${location ? `สถานที่: ${location}` : ''}
สามารถติดตามผลการสัมภาษณ์ได้ที่: ${WEBSITE_URL ? WEBSITE_URL : '-'}

--
Best regards,

Com7 (Public) Company Limited
549/1 Sanphawut Rd., Bangna Tai, Bangna, Bangkok 10260
02-017-7777 #7211 / 061-013-3805`;

  const title = `${eventName} - ${buName} ${fullname}`

  const newEvent = calendar.createEvent(
    title,
    finalStartTime,
    finalEndTime,
    {
      description: description,
      location: location || ""
    }
  )

  newEvent.addGuest(email);

  return newEvent.getId();
}

function manualCreateCalendarEvent(data) {
  
}

function updateCalendarEvent(updateData) {
  const { calendarId, slot, eventName, fullname, buName, location } =
    updateData;

  if (!calendarId) {
    return { success: false, message: "ไม่พบ Event ID สำหรับแก้ไข" };
  }

  if (!slot) {
    return { success: false, message: "ไม่พบข้อมูลกล็อต" }
  }

  const calendar = CalendarApp.getCalendarById(MAIN_EMAIL);
  if (!calendar) {
    return { success: false, message: "ไม่พบปฏิทินปลายทาง" };
  }

  const event = calendar.getEventById(calendarId);
  if (!event) {
    return { success: false, message: "ไม่พบข้อมูลนัดหมาย (อาจถูกลบไปแล้ว)" };
  }

  let finalStartTime, finalEndTime;

  if (slot) {
    const dateBase = normalizeDate(slot.Date)
    const timeStartBase = new Date(slot.Start_Time)
    const timeEndBase = new Date(slot.End_Time)

    finalStartTime = new Date(dateBase);
    finalStartTime.setHours(timeStartBase.getHours(), timeStartBase.getMinutes(), 0);

    finalEndTime = new Date(dateBase)
    finalEndTime.setHours(timeEndBase.getHours(), timeEndBase.getMinutes(), 0)

    event.setTime(finalStartTime, finalEndTime);
  } else {
    finalStartTime = event.getStartTime();
    finalEndTime = event.getEndTime();
  }

  if (eventName || buName || fullname) {
    const newTitle = `${eventName} - ${buName} (${fullname}) (Rescheduled)`;
    event.setTitle(newTitle);
  }

  if (location) {
    event.setLocation(location);
  }

  const thaiDate = finalStartTime.toLocaleDateString("th-TH", {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const timePeriod = `${Utilities.formatDate(finalStartTime, Session.getScriptTimeZone(), "HH:mm")} - ${Utilities.formatDate(finalEndTime, Session.getScriptTimeZone(), "HH:mm")}`;

  const newDescription = `Comseven Career has updated your interview schedule.
(มีการเปลี่ยนแปลงข้อมูลนัดหมาย)

Comseven Career ได้ยืนยันการเปลี่ยนแปลงนัดหมาย

หัวข้อ: ${eventName} - ${buName}
วันที่: ${thaiDate}
เวลา: ${timePeriod}
${location ? `สถานที่: ${location}` : ''}
สามารถติดตามผลการสัมภาษณ์ได้ที่: ${WEBSITE_URL ? WEBSITE_URL : '-'}

--
Best regards,

Com7 (Public) Company Limited
549/1 Sanphawut Rd., Bangna Tai, Bangna, Bangkok 10260
02-017-7777 #7211 / 061-013-3805`;

  event.setDescription(newDescription);

  return { success: true, message: "อัปเดตข้อมูลเรียบร้อยแล้ว" };
}

function deleteCalendarEvent(calendarId) {
  try {
    const calendar = CalendarApp.getCalendarById(MAIN_EMAIL);
    const event = calendar.getEventById(calendarId);

    if (event) {
      event.deleteEvent(); // ลบออกจากปฏิทินทันที
      return { success: true, message: "ยกเลิกนัดหมายเรียบร้อยแล้ว" };
    } else {
      return { success: false, message: "ไม่พบข้อมูลนัดหมายในระบบ" };
    }
  } catch (err) {
    return { success: false, message: "Error: " + err.toString() };
  }
}

function createNewCalendar() {
  const calendarName = "Test Calendar"
  const newCalendar = CalendarApp.createEvent(calendarName, new Date("2026-02-12T08:00"), new Date("2026-02-12T09:00"))
  newCalendar.addGuest("sorayutheuro@gmail.com")
  Logger.log('Created calendar: ' + newCalendar.getTitle() + ' with ID: ' + newCalendar.getId());
}

function testUpdateCalendar() {
  const eventId = "dtq85rg85i3j8bu3psqlrdeo9c@google.com"
  const start = new Date("2026-02-11T09:00")
  const end = new Date("2026-02-11T10:00")

  try {
    const event = CalendarApp.getEventById(eventId);

    if (event) {
      event.setTime(start, end);
      console.log("Event updated successfully!");
    } else {
      console.error("Event not found. Check your Event ID.");
    }
  } catch (err) {
    console.error("Error: " + err.message)
  }
}

