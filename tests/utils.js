const fs = require("fs");
require("dotenv").config();

const getNextMonth = (oldData) => {
  const lastMonth = oldData?.releaseDate
    ? new Date(oldData?.releaseDate).getMonth()
    : new Date().getMonth();
  const targetMonth = lastMonth === 11 ? -1 : lastMonth + 2;

  return new Date(`${targetMonth}/1/00`)
    .toLocaleString("en-us", { month: "long" })
    .toLowerCase();
};

const getLastPSPlusPost = async (page, nextMonth) => {
  for (let i = 1; i <= 3; i++) {
    const post = page.locator(`article:nth-of-type(${i})`);
    const firstText = post.locator(".post-card__title");
    const postTitle = await firstText.innerText();
    const postTitleLowerCased = postTitle.toLowerCase();

    const isMatched = ["playstation plus", "monthly", nextMonth].every(
      (target) => postTitleLowerCased.includes(target)
    );

    if (isMatched) {
      return post;
    }
  }

  return null;
};

const getReleaseDate = async (page) => {
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
    .find((word) => !isNaN(Number(word)))
    .trim();

  return new Date(`${releaseMonth} ${releaseDay}, 1996`);
};

const getAnnouncementDate = async (page) => {
  const announcementDateTitle = page.locator(".entry-date.published");
  const announcementDateText = await announcementDateTitle.innerText();

  return new Date(announcementDateText);
};

const getGames = async (page) => {
  const games = [];
  let game = { image: "", name: "", platform: "", description: [] };

  for (const element of await page
    .locator(".post-single__content.single__content > *")
    .all()) {
    const targetClass = await element.getAttribute("class");

    const isGameImage = targetClass.trim() === "ps-image-modal__wrapper";

    if (isGameImage) {
      const img = element.locator("img");
      const image = await img.getAttribute("data-src");

      game.image = image;

      continue;
    }

    const tagName = await element.evaluate((node) => node.tagName);
    const hasAlreadGameImage = Boolean(game.image);
    const isGameTitle = tagName.toLowerCase() === "h2";

    if (hasAlreadGameImage && isGameTitle) {
      const fullTitle = await element.innerText();

      const [name, platform] = fullTitle.split("|");
      game.name = name.trim();

      game.platform = platform.replace(/\s/g, "").replace(",", "_");

      continue;
    }

    const isParagraph = tagName.toLowerCase() === "p";
    const hasAlreadyGameBasicAttr = [
      game.image,
      game.name,
      game.platform,
    ].every(Boolean);

    if (hasAlreadyGameBasicAttr && isParagraph) {
      const description = await element.innerText();
      game.description = [
        ...game.description,
        description.trim().replace("\n", ""),
      ];

      games.push(Object.assign({}, game));
      game = { image: "", name: "", platform: "", description: [] };
    }
  }

  return games;
};

const getPostData = async (page, lastPSPlusPost) => {
  if (lastPSPlusPost) {
    const data = {};

    await lastPSPlusPost?.click();
    await page.waitForTimeout(2000);

    data.source = page.url();
    data.releaseDate = await getReleaseDate(page);
    data.announcementDate = await getAnnouncementDate(page);
    data.games = await getGames(page);

    return data;
  }

  return null;
};

const saveJSON = async (data, oldData, testInfo) => {
  const file = testInfo.outputPath("ps-plus-monthly-games.json");

  const dataToBeSaved = data ?? oldData;

  await fs.promises.writeFile(file, JSON.stringify(dataToBeSaved), "utf8");
};

module.exports = {
  saveJSON,
  getPostData,
  getNextMonth,
  getLastPSPlusPost,
};
