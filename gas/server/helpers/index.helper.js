function getRowsFromSheet(sheet) {
  // --- Get values form sheet
  const values = sheet.getDataRange().getValues();

  // --- Check if sheet is empty
  if (!values || values.length < 2) {
    return [];
  }

  // --- Get header
  const header = values[0];
  const rows = [];

  // --- Get rows
  for (let i = 1; i < values.length; i++) {
    const rowData = values[i];
    if (rowData.join("").trim() === "") continue;

    const rowObj = {};

    // --- Assign values
    header.forEach((header, index) => {
      let rowValue = rowData[index];

      if (rowValue instanceof Date) {
        rowValue = Utilities.formatDate(
          rowValue,
          "Asia/Bangkok",
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        );
      }

      rowObj[header] = rowValue;
    });

    rows.push(rowObj);
  }

  return rows;
}

// For merge map values to rows
const mergeMapValuesToRows = (values) => {
  if (!values || values.length < 2) return [];
  const header = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const rowData = values[i];
    if (rowData.join("").trim() === "") continue;
    const rowObj = {};
    header.forEach((h, colIndex) => {
      rowObj[h] = rowData[colIndex] !== undefined ? rowData[colIndex] : "";
    });
    rows.push(rowObj);
  }
  return rows;
};

function findRowIndex(sheetData, rowValue, columnName) {
  const data = getRowsFromSheet(sheetData);
  const rowIndex = data.findIndex(
    (row) => String(row[columnName]) === String(rowValue),
  );
  return rowIndex;
}

function formatDateTh(dateObj) {
  if (!dateObj || !(dateObj instanceof Date)) return "";
  return Utilities.formatDate(dateObj, "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss");
}

function formatTimeTh(dateObj) {
  if (!dateObj || !(dateObj instanceof Date)) return "";
  return Utilities.formatDate(dateObj, "Asia/Bangkok", "HH:mm");
}

function normalizeDate(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  if (year > 2400) {
    d.setFullYear(year - 543);
  }
  return d;
}

function toDateOnly(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setMilliseconds(0);
  return d;
}

const parseThaiDateTime = (dateString) => {
  if (!dateString) return new Date(0);

  try {
    const parts = dateString.trim().split(" ");
    const datePart = parts[0];
    const timePart = parts[1] || "00:00:00";

    const dateParts = datePart.split("/");
    if (dateParts.length !== 3) return new Date(dateString);

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    let year = parseInt(dateParts[2], 10);

    if (year > 2500) {
      year -= 543;
    }

    const timeParts = timePart.split(":");
    const hours = parseInt(timeParts[0] || "0", 10);
    const minutes = parseInt(timeParts[1] || "0", 10);
    const seconds = parseInt(timeParts[2] || "0", 10);

    return new Date(year, month, day, hours, minutes, seconds);
  } catch (e) {
    return new Date(0); 
  }
};
