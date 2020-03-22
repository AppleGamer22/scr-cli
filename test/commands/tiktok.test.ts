import { expect, test } from "@oclif/test";
import { Browser, Page } from "puppeteer-core";
import { beginScrape } from "../../src/shared";
import { detectFile } from "../../src/commands/tiktok";

describe("tiktok", () => {
	let browser: Browser, page: Page;
	beforeEach(async () => {
		try {
			const puppeteerSuite = (await beginScrape(true))!;
			browser = puppeteerSuite.browser;
			page = puppeteerSuite.page;
		} catch (error) { console.error(error.message); }
	});
	afterEach(async () => await browser.close());

	test.timeout(6000).it("scrapes  yaababyk's 6768910148997090566 & gets 1 public MP4", async (_, done) => {
		try {
			const { urls, username } = (await detectFile(browser, page, "yaababyk", "6768910148997090566"))!;
			done();
			expect(username).to.equal("yaababyk");
			expect(urls.length).to.equal(1);
			console.log(urls[0]);
			expect(urls[0]).to.include("https://v16.muscdn.com/");
		} catch (error) { console.error(error.message); }
	});
});
