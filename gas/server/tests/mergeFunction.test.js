function testGetEventAndSlots() {
  const data = {
    eventId: "17AkvY2reG-Jr2U7WSfl7rv8QhpcB11eKa4qHTMNm2Tc",
    dateQuery: "",
  };

  const response = getEventAndSlots(data);
  console.log(JSON.stringify(response, null, 2));
}

function testGetManagerFullStructure() {
  const query = {
    permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    username: "1234556",
    page: 1,
    limit: 10,
  };

  const response = getFullManagerStructure(query);
  console.log(JSON.stringify(response, null, 2));
}

function testGetEventandSlotData() {
  const data = {
    eventId: "1Xu0AGBLWHl-xeFXxgfb2CFuLA4-jITMOBvx6LD4i8NM",
    slotId: "8885d79a-eea9-4a86-b5b1-c96a35ddb55c",
  };

  const response = getEventAndSlotData(data);
  console.log(JSON.stringify(response, null, 2));
}
function runTestDashboard() {
  const queryFull = {
    eventName: "Open House @COM7",
    startDate: "2026-02-10",
    endDate: "2026-02-20",
    buName: "สำนักงานใหญ่",
  };
  const resultAll = getAllDataForDashBoard(queryFull);
  console.log("Result:", JSON.stringify(resultAll, null, 2));
  console.log("---------------------------------------------------");
}

function testFullStructure() {
  const response = getFullEventStructure();
  console.log("Result:", JSON.stringify(response, null, 2));
}
