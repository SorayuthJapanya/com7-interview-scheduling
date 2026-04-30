/**
 * @module controllers/auth.controller
 * @function loginUser
 * @function registerUser
 * @function forgotPassword
 * @function getAllTaData
 * @function updateTaData
 * @function delateTaData
 * @function loginAdmin
 * @function registerAdmin
 * @function getAllManagerData
 * @function deleteManager
 * @function updateManager
 * @function loginManager
 * @function registerManager
 * @description User Auth and Interviewer Auth Controller
 */

const USER_ROLE = "USER";
const ADMIN_ROLE = "ADMIN";
const SUPER_ADMIN_ROLE = "SUPERADMIN";
const MANAGER_ROLE = "MANAGER";
const AUTH_ROLES = [USER_ROLE, ADMIN_ROLE, MANAGER_ROLE, SUPER_ADMIN_ROLE];

/**
 * @function getTASheet
 * @returns
 */
function getTASheet() {
  return SpreadsheetApp.openById(MAIN_SS_ID).getSheetByName(MAIN_SHEETS.TA);
}

/**
 * @function getManagerSheet
 * @returns
 */
function getManagerSheet() {
  return SpreadsheetApp.openById(MAIN_SS_ID).getSheetByName(
    MAIN_SHEETS.MANAGERS,
  );
}

function getCandidateSheet() {
  return SpreadsheetApp.openById(MAIN_SS_ID).getSheetByName(
    MAIN_SHEETS.CANDIDATES,
  );
}

function loginUser(loginData) {
  try {
    // validate data
    if (!loginData) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    const { email, password } = loginData;
    if (!email || !password) {
      return {
        success: false,
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      };
    }

    // validate password
    const isMatch = verifyCandidatePassword(email, password);
    if (!isMatch) {
      return {
        success: false,
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      };
    }

    // get candidate
    const candidateSheet = getCandidateSheet();
    const condidateData = getRowsFromSheet(candidateSheet);
    const candidate = condidateData.filter((data) => data.Email === email)[0];

    const data = {
      userId: candidate.Candidate_Id,
      name: candidate.Fullname,
      email: candidate.Email,
      phone: candidate.Phone,
      role: candidate.Role,
      profile: candidate.Profile_Url,
    };

    return {
      success: true,
      message: "เข้าสู่ระบบสําเร็จ",
      data,
    };
  } catch (error) {
    console.log("Error in loginUser controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

/**
 * @function registerUser
 * @param {Object} registerData
 * @returns
 */
function registerUser(registerData) {
  try {
    // validate data
    if (!registerData) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    const { fullname, email, password, phone, profile } = registerData;
    if (!fullname || !email || !password || !phone || !profile) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    // check fullname exists
    const isFullnameExists = checkFullnameExists(fullname);
    if (isFullnameExists) {
      return {
        success: false,
        message: "ชื่อ-นามสกุลนี้ถูกใช้ไปแล้ว",
      };
    }

    // check email exists
    const isEmailExists = checkEmailExists(email);
    if (isEmailExists) {
      return {
        success: false,
        message: "อีเมลนี้ถูกใช้ไปแล้ว",
      };
    }

    if (phone.length !== 10) {
      return {
        success: false,
        message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง",
      };
    }

    // check phone exists
    const isPhoneExists = checkPhoneExists(phone);
    if (isPhoneExists) {
      return {
        success: false,
        message: "เบอร์โทรศัพท์นี้ถูกใช้ไปแล้ว",
      };
    }

    // validate password
    if (password.length < 6) {
      return {
        success: false,
        message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      };
    }

    // hash password
    const hashedPassword = hashPassword(password);

    let previewUrl = "";
    if (profile && profile.base64Data && profile.fileName && profile.mimeType) {
      try {
        const fileUrl = uploadProfileToDrive(
          profile.base64Data,
          profile.fileName,
          profile.mimeType,
        );

        if (fileUrl) {
          previewUrl = fileUrl.directUrl;
        }
      } catch (e) {
        console.error("Error in uploadFileToDrive: ", e);
        return { success: false, message: "อัปโหลดไฟล์ล้มเหลว" };
      }
    }

    // get candidate sheet
    const candidateSheet = getCandidateSheet();
    if (!candidateSheet) {
      return {
        success: false,
        message: "ไม่พบชีทนี้",
      };
    }

    // create new user
    const userId = Utilities.getUuid();
    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    const newUser = [
      userId,
      fullname,
      email,
      hashedPassword,
      "'" + phone,
      USER_ROLE,
      previewUrl,
      now,
    ];

    // append new user
    candidateSheet.appendRow(newUser);

    const data = {
      userId,
      name: fullname,
      email,
      phone,
      role: USER_ROLE,
      profile: previewUrl,
    };

    return {
      success: true,
      message: "สมัครสมาชิกสําเร็จ",
      data,
    };
  } catch (error) {
    console.log("Error in registerUser controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function forgotPassword(data) {
  try {
    if (!data) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    const { email, password, confirmPassword } = data;
    if (!email || !password || !confirmPassword) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        message: "รหัสผ่านไม่ตรงกัน",
      };
    }

    // Get candidate sheet
    const candidateSheet = getCandidateSheet();

    // find row index
    const rowIndex = findRowIndex(candidateSheet, email, "Email");
    if (rowIndex === -1) {
      return {
        success: false,
        message: "ไม่พบอีเมลนี้ในระบบ",
      };
    }

    // hash password
    const hashedPassword = hashPassword(password);
    const targetRow = rowIndex + 2;

    // update password
    candidateSheet.getRange(targetRow, 4, 1, 1).setValue(hashedPassword);

    return {
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    };
  } catch (error) {
    console.log("Error in forgotPassword controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function getAllTaData(userRole) {
  try {
    if (userRole === USER_ROLE || userRole === MANAGER_ROLE) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้อ่านข้อมูลนี้",
      };
    }

    const taSheet = getTASheet();
    const taData = getRowsFromSheet(taSheet);
    return taData;
  } catch (error) {
    console.log("Error in getAllTaData controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function updateTaData(updateData) {
  try {
    if (!updateData) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ไขข้อมูลนี้",
      };
    }

    const { userRole, taUserName, userName } = updateData;

    if (!taUserName || !userName) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ไขข้อมูลนี้",
      };
    }

    if (userRole === USER_ROLE || userRole === MANAGER_ROLE) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ไขข้อมูลนี้",
      };
    }

    const taSheet = getTASheet();
    const taRows = getRowsFromSheet(taSheet);

    const rowIndex = findRowIndex(taSheet, taUserName, "Username");
    if (rowIndex === -1) {
      return {
        success: false,
        message: `ไม่พบ Username: ${taUserName} ในระบบ`,
      };
    }

    const taUser = taRows.find((user) => user.Username === taUserName);
    if (userRole !== SUPER_ADMIN_ROLE && taUser.Fullname !== userName) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ไขข้อมูลนี้",
      };
    }

    const targetRow = rowIndex + 2;

    const targetRange = taSheet.getRange(
      targetRow,
      1,
      1,
      taSheet.getLastColumn(),
    );
    const taData = targetRange.getValues()[0];

    const index = {
      fullname: 0,
      username: 1,
      role: 3,
    };

    if (taUserName !== taData[index.username]) {
      return {
        success: false,
        message: `ไม่พบผู้ใช้งงานในระบบ`,
      };
    }

    // update data
    let modified = false;
    Object.keys(updateData).forEach((key) => {
      if (index[key] !== undefined && updateData[key] !== undefined) {
        const oldValue = taData[index[key]];
        const newValue = updateData[key];

        if (newValue !== oldValue) {
          console.log(`➡️ Updating field: ${key} | ${oldValue} -> ${newValue}`);
          taData[index[key]] = newValue;
          modified = true;
        }
      }
    });

    if (!modified) {
      return {
        success: true,
        message: "ไม่มีการแก้ไขข้อมูล",
      };
    }

    const indicesToFormat = [1, 2];

    indicesToFormat.forEach((i) => {
      if (taData[i] !== undefined && taData[i] !== null && taData[i] !== "") {
        taData[i] = "'" + String(taData[i]);
      }
    });

    targetRange.setValues([taData]);

    return {
      success: true,
      message: `อัปเดตข้อมูลเรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.log("Error in updateDateTaData controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function delateTaData(updateData) {
  try {
    if (!updateData) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ไขข้อมูลนี้",
      };
    }

    const { userRole, taUserName, userName } = updateData;

    if (userRole === USER_ROLE || userRole === MANAGER_ROLE) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ไขข้อมูลนี้",
      };
    }

    const taSheet = getTASheet();
    const taData = getRowsFromSheet(taSheet);

    const rowIndex = findRowIndex(taSheet, taUserName, "Username");
    if (rowIndex === -1) {
      return {
        success: false,
        message: `ไม่พบ Username: ${taUserName} ในระบบ`,
      };
    }

    const taUser = taData.find((user) => user.Username === taUserName);
    if (userRole !== SUPER_ADMIN_ROLE && taUser.Fullname !== userName) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้แก้ไขข้อมูลนี้",
      };
    }

    const targetRow = rowIndex + 2;

    taSheet.deleteRow(targetRow);

    return {
      success: true,
      message: `ลบข้อมูลเรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.log("Error in delateTaData controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

/**
 * @function loginUser
 * @param {Object} loginData
 * @returns
 */
function loginAdmin(loginData) {
  try {
    // validate data
    const { username, password } = loginData;
    if (!username || !password) {
      return {
        success: false,
        message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
      };
    }

    // validate password
    const isMatch = verifyPassword(username, password);
    if (!isMatch) {
      return {
        success: false,
        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      };
    }

    console.log("isMatchData: ", isMatch);

    // get user
    const userSheet = getTASheet();
    const user = getRowsFromSheet(userSheet).find(
      (data) => data.Username === username,
    );

    const data = {
      username: user.Username,
      name: user.Name,
      role: user.Role,
    };

    return {
      success: true,
      message: "เข้าสู่ระบบสําเร็จ",
      data,
    };
  } catch (error) {
    console.log("Error in loginAdmin controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

/**
 * @function registerAdmin
 * @param {Object} registerData
 * @returns
 */
function registerAdmin(registerData) {
  try {
    // validate data
    const { fullname, username, password } = registerData;
    if (!fullname || !username || !password) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    // validate password
    if (password.length < 6) {
      return {
        success: false,
        message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      };
    }

    // check if username already exists
    const isUsernameExists = checkUsernameExists(username);
    if (isUsernameExists) {
      return {
        success: false,
        message: "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว",
      };
    }

    // validate user sheet
    const userSheet = getTASheet();
    if (!userSheet) {
      return {
        success: false,
        message: "ไม่พบชีทผู้ใช้",
      };
    }

    // create payload
    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    // create new user
    const newUser = [fullname, "'" + username, "'" + password, ADMIN_ROLE, now];

    // append new user
    userSheet.appendRow(newUser);

    const data = {
      name: fullname,
      role: ADMIN_ROLE,
    };

    return {
      success: true,
      message: "สมัครสมาชิกสําเร็จ",
      data,
    };
  } catch (error) {
    console.log("Error in registerAdmin controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function getAllManagerData(query = {}, userRole) {
  try {
    const { search, page = 1, limit = 15 } = query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));

    if (userRole === USER_ROLE || userRole === MANAGER_ROLE) {
      return {
        success: false,
        message: "คุณไม่ได้รับอนุญาติให้อ่านข้อมูลนี้",
      };
    }

    const ranges = [MAIN_SHEETS.MANAGERS, MAIN_SHEETS.EVENTS];

    const response = Sheets.Spreadsheets.Values.batchGet(MAIN_SS_ID, {
      ranges: ranges,
      valueRenderOption: "FORMATTED_VALUE",
    });

    const managerValues = response.valueRanges[0].values || [];
    const eventValues = response.valueRanges[1].values || [];

    const managerData = mergeMapValuesToRows(managerValues);
    const eventData = mergeMapValuesToRows(eventValues);

    // filter data
    let filteredData = managerData
      .filter((data) => {
        const searchValue = search
          ? String(search).toLowerCase().replace(/\s+/g, " ")
          : "";

        if (search && searchValue !== "") {
          const matchesSearch = Object.entries(data).some(([key, value]) => {
            if (typeof value === "string") {
              return String(value).toLowerCase().includes(searchValue);
            }
            return false;
          });

          return matchesSearch;
        } else {
          return true;
        }
      })
      .map((data) => {
        const permission = data.Permission;

        // get Event name
        const event = eventData.find((event) => event.Sheet_ID === permission);

        return {
          ...data,
          Event_Name: event ? event.Event_Name : "",
        };
      });

    // Sorting data
    filteredData.sort((a, b) => a.Name.localeCompare(b.Name, "th-TH"));

    // Pagination logic
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Calculate slice indices
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    // Apply pagination
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
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
  } catch (error) {
    console.log("Error in getAllTaData controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function loginManager(loginData) {
  try {
    // validate data
    const { username, password } = loginData;
    if (!username || !password) {
      return {
        success: false,
        message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
      };
    }

    // get manager
    const managerSheet = getManagerSheet();
    const managerData = getRowsFromSheet(managerSheet);
    const manager = managerData.find(
      (manager) =>
        String(manager.Username) === String(username) &&
        String(manager.Password) === String(password),
    );

    if (!manager) {
      return {
        success: false,
        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      };
    }

    const data = {
      username: manager.Username,
      name: manager.Name,
      role: manager.Role,
      permissionType: manager.PermissionType,
    };

    return {
      success: true,
      message: "เข้าสู่ระบบสําเร็จ",
      data,
    };
  } catch (error) {
    console.log("Error in loginManager controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function registerManager(registerData) {
  try {
    // validate data
    const { fullname, username, password, permissionType } = registerData;
    if (!fullname || !username || !password || !permissionType) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    // validate password
    if (password.length < 6) {
      return {
        success: false,
        message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      };
    }

    // append new user
    const userSheet = getManagerSheet();
    if (!userSheet) {
      return {
        success: false,
        message: "ไม่พบชีทผู้ใช้",
      };
    }

    // get rows from sheet
    const userRows = getRowsFromSheet(userSheet);

    // check if username already exists
    const isUsernameExists = userRows.find(
      (user) => String(user.Username) === String(username),
    );
    if (isUsernameExists) {
      return {
        success: false,
        message: "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว",
      };
    }

    // create payload
    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    // create new user
    const newUser = [
      fullname,
      "'" + username,
      "'" + password,
      MANAGER_ROLE,
      permissionType,
      now,
    ];

    // append new user
    userSheet.appendRow(newUser);

    // return
    return {
      success: true,
      message: "สมัครสมาชิกสําเร็จ",
    };
  } catch (error) {
    console.log("Error in registerManager controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function updateManager(updateData) {
  try {
    // validate data
    if (!updateData) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    const { fullname, username, permissionType } = updateData;

    if (!fullname || !username || !permissionType) {
      return {
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      };
    }

    // find user
    const userSheet = getManagerSheet();

    const rowIndex = findRowIndex(userSheet, username, "Username");
    if (rowIndex === -1) {
      return {
        success: false,
        message: "ไม่พบชื่อผู้ใช้นี้ในระบบ",
      };
    }

    const targetRow = rowIndex + 2;

    const index = {
      fullname: 0,
      username: 1,
      password: 2,
      permissionType: 4,
    };

    const maxCol = Math.max(userSheet.getLastColumn(), 5);

    const targetRange = userSheet.getRange(
      targetRow,
      1,
      1,
      maxCol,
    );
    const managerData = targetRange.getValues()[0];

    managerData[index.fullname] = fullname;
    managerData[index.permissionType] = permissionType;

    const indicesToFormat = [1, 2];

    indicesToFormat.forEach((i) => {
      if (managerData[i] !== undefined && managerData[i] !== null && managerData[i] !== "") {
        managerData[i] = "'" + String(managerData[i]);
      }
    });

    targetRange.setValues([managerData]);

    return {
      success: true,
      message: "อัปเดตข้อมูลสําเร็จ",
    };
  } catch (error) {
    console.log("Error in updateManager controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}

function deleteManager(username) {
  try {
    if (!username) {
      return {
        success: false,
        message: "กรุณากรอกชื่อผู้ใช้",
      };
    }

    const userSheet = getManagerSheet();

    const rowIndex = findRowIndex(userSheet, String(username), "Username");
    if (rowIndex === -1) {
      return {
        success: false,
        message: "ไม่พบชื่อผู้ใช้นี้ในระบบ",
      };
    }

    const targetRow = rowIndex + 2;

    userSheet.deleteRow(targetRow);

    return {
      success: true,
      message: "ลบผู้สัมภาษณ์สําเร็จ",
    };
  } catch (error) {
    console.log("Error in deleteManager controller: ", error);
    return {
      success: false,
      message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
    };
  }
}
