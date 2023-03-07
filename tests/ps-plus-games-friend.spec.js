const { test } = require("@playwright/test");
const axios = require("axios");
const {
  saveJSON,
  getPostData,
  getNextMonth,
  getLastPSPlusPost,
} = require("./utils");

test("Extract the data", async ({ page }, testInfo) => {
  const rawData = await axios.get(process.env.REMOTE_DATA_URL);
  const oldData = rawData.data;

  const nextMonth = getNextMonth(oldData);

  await page.goto("https://blog.playstation.com/category/ps-plus/");

  const lastPSPlusPost = await getLastPSPlusPost(page, nextMonth);

  const data = await getPostData(page, lastPSPlusPost);

  await saveJSON(data, oldData, testInfo);
});
