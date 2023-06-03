require("dotenv").config();
const { test } = require("@playwright/test");
const axios = require("axios");
const { PSPlusFriend } = require("./PSPlusFriend");

test("Extract the data", async ({ page }, testInfo) => {
  const rawData = await axios.get(process.env.REMOTE_DATA_URL);
  const oldData = rawData.data;

  const psPlusFriend = new PSPlusFriend(page);

  const nextMonth = psPlusFriend.getNextMonth(oldData);

  const lastPSPlusPost = await psPlusFriend.getLastPSPlusPost(nextMonth);

  const data = await psPlusFriend.getPostData(lastPSPlusPost);

  await psPlusFriend.saveJSON(data, oldData, testInfo);
});
