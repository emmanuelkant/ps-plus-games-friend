const fs = require("fs");

// Types
// eslint-disable-next-line no-unused-vars
const { Page } = require("@playwright/test");

class PSPlusFriend {
  /**
   * Contructor that just stores the page object
   *
   * @param {Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async #getReleaseDate() {
    const releaseDateTitle = this.page.locator(".post-single__sub-header-text");
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
  }

  async #getAnnouncementDate() {
    const announcementDateTitle = this.page.locator(".entry-date.published");
    const announcementDateText = await announcementDateTitle.innerText();

    return new Date(announcementDateText);
  }

  async #getGames() {
    const games = [];
    let game = { image: "", name: "", platform: "", description: [] };

    for (const element of await this.page
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
  }

  #getCurrentDate() {
    const currentDate = new Date();

    return {
      day: currentDate.getDate(),
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    };
  }

  async #findLastPSPlusPost(nextMonth) {
    for (let i = 1; i <= 6; i++) {
      const post = this.page.locator(`article:nth-of-type(${i})`);

      const hasGotSomething = await post.isVisible();

      if (!hasGotSomething) {
        continue;
      }

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
  }

  async #getFromPSNBlogPosts(nextMonth) {
    await this.page.goto("https://blog.playstation.com/category/ps-plus/");

    return await this.#findLastPSPlusPost(nextMonth);
  }

  async #getFromTodayBlogPosts(nextMonth) {
    const { year, month, day } = this.#getCurrentDate();

    await this.page.goto(
      `https://blog.playstation.com/${year}/${month}/${day}/`
    );

    return await this.#findLastPSPlusPost(nextMonth);
  }

  async saveJSON(data, oldData, testInfo) {
    const file = testInfo.outputPath("ps-plus-monthly-games.json");

    const dataToBeSaved = data ?? oldData;

    await fs.promises.writeFile(file, JSON.stringify(dataToBeSaved), "utf8");
  }

  getNextMonth(oldData) {
    const lastMonth = oldData?.releaseDate
      ? new Date(oldData?.releaseDate).getMonth()
      : new Date().getMonth();
    const targetMonth = lastMonth === 11 ? -1 : lastMonth + 2;

    return new Date(`${targetMonth}/1/00`)
      .toLocaleString("en-us", { month: "long" })
      .toLowerCase();
  }

  async getPostData(lastPSPlusPost) {
    if (lastPSPlusPost) {
      const data = {};

      await lastPSPlusPost?.click();
      await this.page.waitForTimeout(2000);

      data.source = this.page.url();
      data.releaseDate = await this.#getReleaseDate();
      data.announcementDate = await this.#getAnnouncementDate();
      data.games = await this.#getGames();

      return data;
    }

    return null;
  }

  async getLastPSPlusPost(nextMonth) {
    let lastPSPlusPost = null;

    lastPSPlusPost = await this.#getFromPSNBlogPosts(nextMonth);

    if (!lastPSPlusPost) {
      lastPSPlusPost = await this.#getFromTodayBlogPosts(nextMonth);
    }

    return lastPSPlusPost;
  }
}

module.exports = { PSPlusFriend };
