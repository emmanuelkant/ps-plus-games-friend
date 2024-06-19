require("dotenv").config();
const fs = require("fs");
const { test } = require("@playwright/test");

test("Extract the data", async ({ page }, testInfo) => {
  await page.goto(process.env.GAMES_URL);

  const contentBlock = page.locator(
    ".cmp-experiencefragment--your-latest-monthly-games .content-grid"
  );

  const result = [];

  for (const game of await contentBlock.locator(">*").all()) {
    const sourceElement = game.locator("source").last();
    const imgSrc = await sourceElement.getAttribute("srcset");

    const title = await game.locator("h3").innerText();
    const description = await game.locator("p").innerText();

    result.push({
      title,
      imgSrc,
      description,
    });
  }

  const date = new Date();

  const file = testInfo.outputPath(
    `ps-plus-monthly-games-${date.getFullYear()}${
      date.getMonth() + 1
    }${date.getDate()}.json`
  );

  const fullDate = {
    annoucementDate: date.getTime(),
    data: result,
  };

  await fs.promises.writeFile(file, JSON.stringify(fullDate), "utf8");
});
