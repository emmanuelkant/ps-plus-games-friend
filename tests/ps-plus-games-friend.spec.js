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
  const data = { games: [] };
  await page.goto("https://blog.playstation.com/category/ps-plus/");

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

    const releaseDateTitle = page.locator(".post-single__sub-header-text");
    const releaseDateText = await releaseDateTitle.innerText();
    const releaseMonth = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ].find((month) => releaseDateText.toLowerCase().includes(month));

    const releaseDay = releaseDateText
      .replace(/,|\./g, "")
      .split(" ")
      .find((word) => !isNaN(Number(word)));

    data.releaseDate = new Date(
      `${releaseMonth} ${releaseDay}, ${currentDate.getFullYear()}`
    );

    const announcementDateTitle = page.locator(".entry-date.published");

    const announcementDateText = await announcementDateTitle.innerText();
    data.announcementDate = new Date(announcementDateText);

    let game = { image: "", name: "", platform: "", description: [] };

    for (const element of await page
      .locator(".post-single__content.single__content > *")
      .all()) {
      const targetClass = await element.getAttribute("class");

      if (targetClass.trim() === "ps-image-modal__wrapper") {
        const img = element.locator("img");
        const image = await img.getAttribute("data-src");

        game.image = image;

        continue;
      }

      const tagName = await element.evaluate((node) => node.tagName);

      if (Boolean(game.image) && tagName.toLowerCase() === "h2") {
        const fullTitle = await element.innerText();

        const [name, platform] = fullTitle.split("|");
        game.name = name.trim();

        game.platform = platform.replace(/\s/g, "").replace(",", "_");

        continue;
      }

      if (
        [game.image, game.name, game.platform].every(Boolean) &&
        tagName.toLowerCase() === "p"
      ) {
        const description = await element.innerText();
        game.description = [...game.description, description];

        data.games.push(Object.assign({}, game));
        game = { image: "", name: "", platform: "", description: [] };
      }
    }

    const file = testInfo.outputPath("ps-plus-monthly-games.json");
    await fs.promises.writeFile(file, JSON.stringify(data), "utf8");
  }
});
