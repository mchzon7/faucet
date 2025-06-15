
const {google} = require("googleapis");
const keys = require("../procollect-90c23bbfcb88.json");

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({version: "v4", auth});

const appendToSheet = async (dataArray) => {
  const sheetId = process.env.GoogleId;
  const range = "Sheet1!A1"; // Adjust if needed

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "RAW",
    resource: {
      values: [dataArray],
    },
  });
};

module.exports = appendToSheet;
