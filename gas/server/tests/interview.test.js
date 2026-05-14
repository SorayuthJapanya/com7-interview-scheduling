function testAddNewInterview() {
  const data = {
    eventId: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    slotId: "5c3ed038-3cbe-43da-9eac-56712068d993",
    candidateId: "8e83b99e-d032-42de-b06b-0d305d2f457d",
    fullname: "นายสมชาย ไอทีดี",
    nickname: "เก่ง",
    birthdate: "2000-01-15",
    age: 26,
    gender: "ชาย",
    weight: 75,
    height: 180,
    nationality: "ไทย",
    nationalId: "1109900445566",
    maritalStatus: "โสด",
    militaryStatus: "ผ่านการเกณฑ์ทหารแล้ว",
    currentAddress:
      "88/9 คอนโดไอวี่ ถ.มะลิวัลย์ ต.ในเมือง อ.เมือง ขอนแก่น 40000",
    phoneNumber: "0623334455",
    email: "sorayutheuro@gmail.com",
    lineId: "keng_dev",
    highestEducation: "ปริญญาตรี",
    institution: "มหาวิทยาลัยขอนแก่น",
    faculty: "วิศวกรรมศาสตร์",
    major: "คอมพิวเตอร์",
    workLocation: "Tech Solution Co., Ltd.",
    workPeriod: "2022-2025 (3 ปี)",
    workPosition: "Full Stack Developer",
    workDescription:
      "พัฒนา Web Application ด้วย React และ Node.js, ดูแลระบบ Database MongoDB",
    saleExperience: "ไม่มี",
    positionType: "งานประจำ",
    positionApplied: "Software Engineer",
    preferredProvince: "ขอนแก่น",
    preferredDistrict: "เมือง",
    expectedSalary: "45,000",
    availableStartDate: "2026-04-01",
  };

  const response = createInterview(data);
  console.log(JSON.stringify(response, null, 2));
}
function testGetAllInterview() {
  const userRole = "ADMIN";
  const query = {
    search: "",
    candidateId: "",
    eventName: "",
    province: "",
    permissionType: ""
  };

  const response = getAllInterviews(query, userRole);
  console.log(JSON.stringify(response, null, 2));
}

function testGetAllInterviewByEventId() {
  const getData = {
    eventId: "1Xu0AGBLWHl-xeFXxgfb2CFuLA4-jITMOBvx6LD4i8NM",
    interviewId: "70d9ac6d-d056-49a3-abe4-f3b821cb8623", //
    candidateId: "73855ab6-6530-4bdd-b661-daab43cbaaab",
    userRole: "USER",
  };

  const response = getInterviewsById(getData);
  console.log(JSON.stringify(response, null, 2));
}

function testUpdateDetailInterview() {
  const data = {
    userRole: "USER",
    userId: "73855ab6-6530-4bdd-b661-daab43cbaaab",
    eventId: "17AkvY2reG-Jr2U7WSfl7rv8QhpcB11eKa4qHTMNm2Tc",
    interviewId: "c981053a-aaa5-4678-88c3-c75eb1c35e67",
    fullname: "นายสมชาย ใจดี",
    nickname: "ชาย",
    birthdate: "1995-05-15",
    age: 31,
    gender: "ชาย",
    weight: 75,
    height: 178,
    nationality: "ไทย",
    nationalId: "1100100000011",
    maritalStatus: "สมรส",
    militaryStatus: "ผ่านการเกณฑ์ทหารแล้ว",
    currentAddress: "123/45 หมู่บ้านสุขใจ ถ.สุขุมวิท เขตวัฒนา กรุงเทพฯ 10110",
    phoneNumber: "0812345678",
    email: "somchai.j@example.com",
    lineId: "somchai_chay",
    highestEducation: "ปริญญาตรี",
    institution: "มหาวิทยาลัยเกษตรศาสตร์",
    faculty: "บริหารธุรกิจ",
    major: "การจัดการ",
    workExperience: "6 ปี",
    saleExperience: "3 ปี",
    positionType: "งานประจำ",
    positionApplied: "Sales Manager",
    preferredProvince: "กรุงเทพ",
    preferredDistrict: "บางนา",
    expectedSalary: "45,000",
    availableStartDate: "2026-02-01",
  };

  const response = updateDetailInterview(data);
  console.log(JSON.stringify(response, null, 2));
}

function testChangeSlotInterview() {
  const data = {
    eventId: "1E1eQu3ghgM3qNU8A7fBV0jBCDFoVEGaaHFDRVjFlBHc",
    interviewId: "61cdfaeb-6b31-4acf-9531-4d16980c2415",
    slotId: "6f9c5fb1-1851-4866-aab3-8035d0dce2da",
  };

  const response = updateSlotInterview(data);
  console.log(JSON.stringify(response, null, 2));
}

function testUpdateStatusInterview() {
  const data = {
    eventId: "17AkvY2reG-Jr2U7WSfl7rv8QhpcB11eKa4qHTMNm2Tc",
    interviewId: "c981053a-aaa5-4678-88c3-c75eb1c35e67",
    userName: "TEST1",
    userRole: "MANAGER",
    status: "ไม่ผ่าน",
  };

  const response = updateStatusInterview(data);
  console.log(JSON.stringify(response, null, 2));
}

function testDeleteInterview() {
  const data = {
    eventId: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    interviewIds: ["35a0fb3c-9f8f-4e9f-a983-1956ea305420"], //
    userName: "TEST1",
    userRole: "SUPERADMIN",
    userId: "d1e293c1-f989-44eb-b610-5ee2088bf453",
    description: "",
  };

  const resposne = deleteInterview(data);
  console.log("resposne: ", JSON.stringify(resposne, null, 2));
}

function testAddLinktoInterview() {
  const data = {
    eventName: "Online Interview True",
    interviewIds: [
      "3452dcc6-480c-4663-8c31-b3d27c245c21",
      "f063eaea-c336-499a-8fd3-95e0224d12d1",
    ],
    interviewLink:
      "https://teams.live.com/meet/9315900849081?p=8gHfrCbDXGZhrclRfM",
  };

  const resposne = addLinktoSheet(data);
  console.log("resposne: ", JSON.stringify(resposne, null, 2));
}

function testGetAllInterviewsWithoutInterviewLink() {
  const query = {
    eventName: "Online Interview True",
    buName: "ตะวันออก",
    page: 1,
    limit: 10,
  };

  const resposne = getAllInterviewsWithoutInterviewLink(query);
  console.log("resposne: ", JSON.stringify(resposne, null, 2));
}

function testUpdateParticipationStatus() {
  const data = {
    eventId: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    interviewId: "35a0fb3c-9f8f-4e9f-a983-1956ea305420",
    candidateName: "นาย Akegawich",
    userName: "123456",
    fullName: "สรยุทธ จาปัญญะ",
    userRole: "SUPERADMIN",
    status: "เข้าร่วม",
  };

  const response = updateParticipationInterview(data);
  console.log(JSON.stringify(response, null, 2));
}