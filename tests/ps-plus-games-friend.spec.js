// @ts-check
const { test } = require("@playwright/test");
const fs = require("fs");
const {} = require("./utils");

const currentDate = new Date();
const currentMonthNumber = currentDate.getMonth();
const validMonth = currentMonthNumber === 11 ? -1 : currentMonthNumber + 1;
const nextMonth = new Date(`${validMonth}/1/00`)
  .toLocaleString("en-us", { month: "long" })
  .toLowerCase();

test("Extract the data", async ({ page }, testInfo) => {
  const data = {};
  await page.goto("https://blog.playstation.com/category/ps-plus/");

  await page.screenshot({ path: "psPlus1.png" });
  let lastPSPlusPost = null;

  for (let i = 1; i <= 3; i++) {
    const post = await page.locator(`article:nth-child(${i})`);
    const firstText = post.locator(".post-card__title");
    const postTitle = await firstText.innerText();
    const postTitleLowerCased = postTitle.toLowerCase();

    const isMatched = ["playstation plus", "monthly", nextMonth].every(
      (target) => postTitleLowerCased.includes(target)
    );

    if (isMatched) {
      lastPSPlusPost = post;
      break;
    }
  }

  if (lastPSPlusPost) {
    await lastPSPlusPost?.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "psPlus2.png" });
    const releaseDateTitle = page.locator(".post-single__sub-header-text");
    const releaseDateText = await releaseDateTitle.innerText();
    const releaseDay = releaseDateText
      .replace(/,|\./g, "")
      .split(" ")
      .find((word) => !isNaN(Number(word)));

    data.releaseDate = new Date(
      `${validMonth}/${releaseDay}/${currentDate.getFullYear()}`
    );

    const allGames = await page.locator(".ps-image-modal__wrapper").all();

    const g = await allGames.at(0)?.getByRole("img");
    console.log(g);

    allGames.forEach(async (element) => {
      const img = element.getByRole("img");
      const t = await img.innerHTML();
      // const src = await img.getAttribute('src')
      console.dir(t);
    });

    const file = testInfo.outputPath("tibia-coins-history.json");
    await fs.promises.writeFile(file, JSON.stringify(data), "utf8");
  }
});
