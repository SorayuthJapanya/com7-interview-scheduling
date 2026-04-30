function testGetAllEvent() {
  const query = {
    // search: "Interviews",
    // status: "false"
  };
  const userRole = "ADMIN";
  const response = getEventsData(query, userRole);
  console.log(JSON.stringify(response, null, 2));
}

function testGetAllEventHistory() {
  const id = "1cGS1Taoq9hoRYPRebo3cQhylNYf5fO1zzfUHknriuQU";
  const response = getHistoryByEventId(id);
  console.log(JSON.stringify(response, null, 2));
}

function testCreateEvent() {
  const data = {
    eventName: "JobFair2026",
    openingDate: "2026-01-7",
    openningTime: "09:00",
    closingDate: "2026-01-17",
    closingTime: "18:00",
    location: "ศูนย์การประชุมแห่งชาติสิริกิติ์",
    userRole: "ADMIN",
    type: "ONSITE",
  };
  const response = createEvent(data);
  console.log(JSON.stringify(response, null, 2));
}

function testGetEventById() {
  const id = "1I19dRSYwCJxwwvn4IYGOWBwO8VWdI7cubqk19AXlZlY";
  const response = getEventById(id);
  console.log(JSON.stringify(response, null, 2));
}

function testUpdateEventData() {
  const id = "1cGS1Taoq9hoRYPRebo3cQhylNYf5fO1zzfUHknriuQU";
  const data = {
    eventName: "JobFair2026",
    eventType: "ONSITE",
    eventStatus: "false",
    openingDate: "2026-01-5",
    openningTime: "09:00",
    closingDate: "2026-01-10",
    closingTime: "18:00",
    location: "Where",
    jobType: "พนักงานประจำหน้าร้านสาขา",
    userName: "admin",
    userRole: "ADMIN",
    action: "แก้ไขชื่อชีทเวลาเปิดรับ",
  };

  const response = updateEventData(id, data);
  console.log(JSON.stringify(response, null, 2));
}

function testDeleteEventData() {
  const data = {
    eventId: "1iCtZGEfo3sSc-GZq2curlJwNzme6KcrsVa5tqNVH28Y",
    userRole: "ADMIN",
  };
  const response = deleteEventData(data);
  console.log(JSON.stringify(response, null, 2));
}
