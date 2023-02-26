const fs = require("fs");
require("dotenv").config();







const closeCookiesAlert = async (page) => {
  const concentCookiesButton = page.locator(
    "#cookiedialogcontent .RightButton .BigButtonText"
  );
  await concentCookiesButton?.click();
};

const typeCredentials = async (page) => {
  const { EMAIL_ACCOUNT = "", PASSWORD_ACCOUNT = "" } = process.env;

  const emailInput = page.locator("input[name=loginemail]");
  await emailInput?.type(EMAIL_ACCOUNT);
  const passwordInput = page.locator("input[name=loginpassword]");
  await passwordInput?.type(PASSWORD_ACCOUNT);
};

const clickLoginButton = async (page) => {
  const loginButton = page.locator(
    "td.LoginButtons .BigButtonText[value=Login]"
  );
  await loginButton?.click();
};

const goToManageAccount = async (page) => {
  const manageAccountButton = page.locator(
    '.BigButtonText[value="Manage Account"]'
  );
  await manageAccountButton?.click();
};

const goToCoinsHistory = async (page) => {
  const coinsViewHistoryButton = page.locator(
    'tbody tr:nth-child(3) .BigButtonText[value="View History"]'
  );
  await coinsViewHistoryButton?.click();
};

const getRowData = async (page) => {
  const tableRows = page.locator(".LabelH ~ tr");
  return await tableRows.allInnerTexts();
};

const goToNextTablePage = async (page, pageCount, pageIndex) => {
  await pageCount.at(pageIndex)?.click();
  await page.waitForTimeout(10000);
};

const getDataFromHistoryCoinsTable = async (page) => {
  const pageCount = await page.locator(".PageLink").all();

  const data = {};

  for (let pageIndex = 1; pageIndex <= pageCount.length; pageIndex++) {
    const allRowData = await getRowData(page);

    allRowData.pop(); // Excluding the last item since it alwasy will be the table navigation

    allRowData.forEach((rowData) => {
      const [id, date, description, character, balance] = rowData.split("\t");

      if (description.toLowerCase().includes("gifted to")) {
        const [from, to] = description.split("gifted to");

        data[id] = {
          date,
          transference: { from: from.trim(), to: to.trim() },
          character,
          balance,
        };
      }
    });

    await goToNextTablePage(page, pageCount, pageIndex);
  }

  return data;
};

const saveOnFile = async (testInfo, data) => {
  const file = testInfo.outputPath("tibia-coins-history.json");
  await fs.promises.writeFile(file, JSON.stringify(data), "utf8");
};

module.exports = {
  saveOnFile,
  typeCredentials,
  goToCoinsHistory,
  clickLoginButton,
  closeCookiesAlert,
  goToManageAccount,
  getDataFromHistoryCoinsTable,
};
