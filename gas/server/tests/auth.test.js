function testLoginCandidate() {
  const data = {
    email: "test@hotmail.com.uk",
    password: "0123456",
  };
  const response = loginUser(data);
  console.log(JSON.stringify(response, null, 2));
}

function testRegisterCandidate() {
  const data = {
    fullname: "Test User2",
    email: "test2@gmail.com",
    password: "test222",
    phone: "0987654321",
    profile:
      "https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2558760599.jpg",
  };

  const response = registerUser(data);
  console.log(JSON.stringify(response, null, 2));
}

function testLoginUser() {
  const data = {
    username: "user2",
    password: "password1",
  };
  const response = loginAdmin(data);
  console.log(JSON.stringify(response, null, 2));
}

function testRegisterUser() {
  const users = [
    { fullname: "สุพัตธิดา เจือเจริญ", username: "24163", password: "14172" },
    { fullname: "ธนากร พงษ์ดิลกธรรม", username: "26145", password: "790788" },
    {
      fullname: "กิตติศักดิ์ สืบสกุลคงเมือง",
      username: "27185",
      password: "558928",
    },
    { fullname: "ชนกชนม ธรรมชาติ", username: "28746", password: "338120" },
    { fullname: "จุฑาทิพย์ พวงแฉล้ม", username: "31797", password: "110715" },
    { fullname: "จามจุรี ผาสุราช", username: "32034", password: "341081" },
    { fullname: "นฤพร ชัยโยธา", username: "32720", password: "67050" },
    { fullname: "วศิน ลิ่มรังสรรค์", username: "33267", password: "617651" },
    { fullname: "พรชุตา พุทธรงค์", username: "33289", password: "415717" },
    { fullname: "ภควดี คำเลิศ", username: "20172", password: "633353" },
  ];

  users.forEach((user) => {
    console.log(`กำลังลงทะเบียน ${user.fullname}`);
    const response = registerAdmin(user);
    console.log(JSON.stringify(response, null, 2));
  });
}

function testForgotPassword() {
  const data = {
    email: "sorayuthjaapanya@gmail.com",
    password: "euro300447",
    confirmPassword: "euro300447",
  };

  const response = forgotPassword(data);
  console.log(JSON.stringify(response, null, 2));
}

function testLoginManager() {
  const data = {
    username: "123456",
    password: "123456",
  };
  const response = loginManager(data);
  console.log(JSON.stringify(response, null, 2));
}

function testRegisterManager() {
  const datas = [
    {
      name: "พีรวัส ตรีเจริญชัยวัฒน์",
      username: "19526",
      password: "091046",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "จุฑารัตน์ โมบัณฑิต",
      username: "13049",
      password: "276872",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ธนเดช จงประดิษฐ์",
      username: "25620",
      password: "910553",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "น้ำทิพย์ ยันยงค์",
      username: "28497",
      password: "039664",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "วรรณวนัส ไชยพรม",
      username: "2507",
      password: "051510",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "จีรวรรณ แก้วบุษบา",
      username: "13787",
      password: "691147",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "พีระศักดิ์ ปันรส",
      username: "9811",
      password: "082157",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "วีรวัฒน์ โล่กันภัย",
      username: "28451",
      password: "017028",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "สมยศ เมฆพา",
      username: "1959",
      password: "019132",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "กังสดาล ไชยโย",
      username: "27899",
      password: "018506",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ประวิชญา รัตนคช",
      username: "31480",
      password: "252420",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "พีระพัฒน์ แก้วสม",
      username: "8696",
      password: "373558",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "วัชราภรณ์ เพ็ชรแก้ว",
      username: "21715",
      password: "153250",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "จันจิรา ชูกูล",
      username: "63",
      password: "118447",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ณัฐพงษ์ โอเจริญ",
      username: "2794",
      password: "294346",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ทิพวรรณ สุดจิตร",
      username: "15879",
      password: "004446",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ฟัครีย์ บินเตล็บ",
      username: "7818",
      password: "050252",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ยุทธพล ยุทธ์ธนพณิชย์",
      username: "4241",
      password: "977299",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "วรรณฤดี อินทสุรัช",
      username: "26109",
      password: "422508",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "สุบงกช เจริญผล",
      username: "17454",
      password: "016463",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "สุไลมาน มะเส็น",
      username: "4129",
      password: "449771",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "กวี แซ่เอี้ย",
      username: "20518",
      password: "779198",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "โชคชัย ฮังกาสี",
      username: "4900",
      password: "063071",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ทรงกลด อุทัยบุญญะลาภา",
      username: "13173",
      password: "066900",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ทศพล โลกานุวัตรเสถียร",
      username: "12694",
      password: "245891",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ปิติพร เรืองสง่า",
      username: "24",
      password: "397051",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "วงศ์ธวัฒน์ จันทะวงศ์",
      username: "15697",
      password: "930279",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "วินิตย์ เพ็งภา",
      username: "17215",
      password: "001821",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "กิตติทัต อุตสาหะ",
      username: "8851",
      password: "017795",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "สมพงษ์ เหล่าพัฒนานนท์",
      username: "14182",
      password: "086387",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "พีรัชชญาร์ พัฒนาศูนย์",
      username: "1922",
      password: "347393",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ภูมิวัฒน์ บึกขุนทด",
      username: "948",
      password: "339471",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ฤทธิรงค์ วงศ์นาม",
      username: "628",
      password: "020940",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "อาทิตยา ทองมา",
      username: "24218",
      password: "167761",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ฐิติรัตน์ ธรรมสวัสดิ์",
      username: "14070",
      password: "002586",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ณรงค์ ศรีนิ่มนวล",
      username: "3881",
      password: "744700",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ณัฐพงษ์ บุญสาคร",
      username: "8685",
      password: "195860",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "นงนุช​ ปกัญสิทธิ์",
      username: "876",
      password: "016245",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "มนตรี พูลเพิ่ม",
      username: "11699",
      password: "074701",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "จิตรา พิทักษ์ชีพเจริญ",
      username: "12894",
      password: "145859",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "อลิสา ภุมมาจันทร์",
      username: "17278",
      password: "144141",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ณัฐกานต์ แววงาม",
      username: "25753",
      password: "386437",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ธนาพฤทธิ์ รัตนพนัง",
      username: "694",
      password: "149286",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "พงศ์ระวี ทัพน้อย",
      username: "14852",
      password: "055511",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "พงษ์ศักดิ์ สุ่มมาตย์",
      username: "17246",
      password: "827933",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "รัตนา โพธิ์งาม",
      username: "24381",
      password: "017307",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "สกานต์ วิทยาบัณฑิต",
      username: "28578",
      password: "749194",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "อนุพล อ่วมทรัพย์",
      username: "25616",
      password: "025083",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "จีระชาติ สมศักดิ์",
      username: "29071",
      password: "077257",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ณัฏฐฤทธิ์ โพธิขาว",
      username: "4348",
      password: "031764",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ทัดดาว ขวัญกลับ",
      username: "874",
      password: "425079",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "ปรินาท สุขมา",
      username: "5864",
      password: "215823",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "เลิศลักษณ์ ม่วงน้อย",
      username: "17236",
      password: "013451",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "สิริพร สาดอ่ำ",
      username: "32016",
      password: "021765",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "สุมณฑาณัช ถึงการ",
      username: "6061",
      password: "212925",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "สุวิมล ราชรักษ์",
      username: "1353",
      password: "036561",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "พิมพ์ณดา ดวงจันทร์แจ่มฟ้า",
      username: "31627",
      password: "563554",
      permission: "1uZUnn8jBt1EeMiC3jigLCCxyxc81FiQyT34vmXo6_Pw",
    },
    {
      name: "มลิวรรณ ภักตรนิกร",
      username: "2669",
      password: "016477",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF0",
    },
    {
      name: "ทิพย์สุดา โพธิ์ทอง",
      username: "3044",
      password: "481013",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF1",
    },
    {
      name: "เศรษฐลักษณ์ เพ็ชร์มี",
      username: "3271",
      password: "143600",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF2",
    },
    {
      name: "ศศิวิมล พรหมพินิจ",
      username: "3155",
      password: "061427",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF3",
    },
    {
      name: "บุญศิริ เรืองเรน",
      username: "3393",
      password: "309452",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF4",
    },
    {
      name: "ภคมณ ฤดีสุขธนกุล",
      username: "3397",
      password: "013532",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF5",
    },
    {
      name: "ทรงวุฒิ อดุลย์บดี",
      username: "127",
      password: "133681",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF6",
    },
    {
      name: "ทักษญา นิลสมปภากร",
      username: "298",
      password: "559813",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF7",
    },
    {
      name: "อานนท์ พิทยาธรพิทักษ์",
      username: "2594",
      password: "036798",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF8",
    },
    {
      name: "สุนทรี โพธิ์ศรีทอง",
      username: "2868",
      password: "305457",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF9",
    },
    {
      name: "ผุสดี เปี่ยมบุญ",
      username: "2923",
      password: "066443",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF10",
    },
    {
      name: "เฉลิมพล ย่องบุตร",
      username: "1584",
      password: "033962",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF11",
    },
    {
      name: "เสาวลักษณ์ ขาวมะลัง",
      username: "984",
      password: "119841",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF12",
    },
    {
      name: "เริงชัย หนูฉิม",
      username: "518",
      password: "098423",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF13",
    },
    {
      name: "ณิชนันทน์ ประเสริฐสิทธิ์",
      username: "2428",
      password: "149516",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF14",
    },
    {
      name: "สมภพ ไวว่อง",
      username: "3392",
      password: "181470",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF15",
    },
    {
      name: "โยษิตา เขตสระน้อย",
      username: "3391",
      password: "191631",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF16",
    },
    {
      name: "วีรยุทธ จงเชิดชูตระกูล",
      username: "966",
      password: "125998",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF17",
    },
    {
      name: "ภัคธินันท์ ธีระธนันเวทย์",
      username: "3568",
      password: "140494",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF18",
    },
    {
      name: "อัฐภิญญา ขุนชิต",
      username: "320",
      password: "014061",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF19",
    },
    {
      name: "กฤษฎา พรวิริยะกิจ",
      username: "3754",
      password: "364055",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF20",
    },
    {
      name: "อารดา จ้อยรักคุณ",
      username: "3830",
      password: "058902",
      permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF21",
    },
  ];

  datas.forEach((data) => {
    console.log(`กำลังลงทะเบียน ${data.name}`);
    const response = registerManager(data);
    console.log(JSON.stringify(response, null, 2));
  });
}

function testUpdateManager() {
  const data = {
    name: "นาย สรยุทธ จับปา",
    username: "123456",
    permission: "1XxfCMTq2vC_wipkG2mzyWBF-0JEXeZu6D-dpbq54qF0",
  };

  const response = updateManager(data);
  console.log(JSON.stringify(response, null, 2));
}

function testGetAllManager() {
  const query = {
    search: "",
    page: 1,
    limit: 6
  }
  const userRole = "SUPERADMIN"

  const response = getAllManagerData(query, userRole);
  console.log(JSON.stringify(response, null, 2));
}
