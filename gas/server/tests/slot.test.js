function testCreateSlot() {
  const data = {
    eventId: "17AkvY2reG-Jr2U7WSfl7rv8QhpcB11eKa4qHTMNm2Tc",
    date: "2026-01-19",
    userName: "TEST CREATE SLOT",
    userRole: "ADMIN",
    slots: [
      {
        startTime: "09:00",
        endTime: "09:30",
        bu: [
          { name: "BU-A", capacity: 2 },
          { name: "BU-B", capacity: 5 },
          { name: "BU-C", capacity: 3 },
        ],
      },
      {
        startTime: "09:30",
        endTime: "10:00",
        bu: [
          { name: "BU-A", capacity: 4 },
          { name: "BU-B", capacity: 2 },
          { name: "BU-C", capacity: 2 },
        ],
      },
      {
        startTime: "10:00",
        endTime: "10:30",
        bu: [
          { name: "BU-A", capacity: 3 },
          { name: "BU-B", capacity: 4 },
          { name: "BU-C", capacity: 5 },
        ],
      },
      {
        startTime: "10:30",
        endTime: "11:00",
        bu: [
          { name: "BU-A", capacity: 2 },
          { name: "BU-B", capacity: 2 },
          { name: "BU-C", capacity: 6 },
        ],
      },
      {
        startTime: "11:00",
        endTime: "11:30",
        bu: [
          { name: "BU-A", capacity: 3 },
          { name: "BU-B", capacity: 5 },
          { name: "BU-C", capacity: 2 },
        ],
      },
    ]
  };

  const response = createSlotEvent(data);
  console.log("resposne: ", JSON.stringify(response, null, 2));
}

function testGetAllSlotsByEventId() {
  const eventId = "17AkvY2reG-Jr2U7WSfl7rv8QhpcB11eKa4qHTMNm2Tc";
  const query = {
    date: "",
    startTime: "",
    endTime: "",
  };
  const response = getAllSlotsData(query, eventId);
  console.log("resposne: ", JSON.stringify(response, null, 2));
}

function testEditSlot() {
  const data = {
    eventId: "1VivomqYM7VlnKwIoCztNiHKGQ5211qpQZGKGSKivITg",
    slotId: "9e1ed10b-042e-4724-b6a5-3ca1fc97d89d",
    startTime: "8:00",
    endTime: "9:30",
    buName: "TRUE",
    capacity: 20,
    userName: "TEST1",
    userRole: "ADMIN",
    action: "แก้ไขเวลาและชื่อ BU "
  };

  const resposne = editSlotEvent(data);
  console.log("resposne: ", JSON.stringify(resposne, null, 2));
}

function testDeleteSlot() {
  const data = {
    eventId: "1a3yTe1rBVDPubNVGiJVk0B82EawRIy13KDpCTcEvrOc",
    slotId: "a879da3c-fc5b-4c23-81ad-bd6ade776d56",
    userName: "TSET1",
    userRole: "USER",
  };

  const response = deleteSlotEvent(data);
  console.log("resposne: ", JSON.stringify(response, null, 2));
}

function testCheckStatus() {
  const query = {
    eventName: "", // ถ้าไม่ใส่ จะหาทุก Event ที่มีเวลานี้
    date: "2026-02-18",
  };

  const response = checkSlotStatus(query);
  console.log(JSON.stringify(response, null, 2));
}

function testDeleteSlotsByPeriod() {
  const data = {
    userName: "TEST",
    userRole: "ADMIN",
    eventId: "17AkvY2reG-Jr2U7WSfl7rv8QhpcB11eKa4qHTMNm2Tc",
    date: "2026-01-19",
    startTime: "09:00",
    endTime: "09:30",
    action: "test"
  }

  const response = deleteSlotsByTimePeriod(data)
  console.log(JSON.stringify(response, null, 2));
}


















