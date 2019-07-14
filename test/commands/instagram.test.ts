import {expect, test} from "@oclif/test";
import {Browser, Page} from "puppeteer";
import {beginScrape, detectFiles, userAgent} from "./../../src/commands/instagram";

describe("Instagram", () => {
	let browser: Browser, page: Page;
	beforeEach(async () => {
		try {
			const puppeteerSuite = (await beginScrape(userAgent, false))!;
			browser = puppeteerSuite.browser;
			page = puppeteerSuite.page;
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes Bz2MPhPhOQu & gets 1 JPEG", async (_, done) => {
		try {
			const urls = await detectFiles(browser, page, "Bz2MPhPhOQu");
			await browser.close();
			done();
			expect(urls.length).to.equal(1);
			console.log(urls[0]);
			expect(urls[0]).to.include(".jpg");
			expect(urls[0]).to.include("cdninstagram.com");
		} catch (error) { console.error(error.message); }
	});
});