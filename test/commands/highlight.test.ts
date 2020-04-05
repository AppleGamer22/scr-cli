import { expect, test } from "@oclif/test";
import { Browser, Page } from "puppeteer-core";
import { detectFiles } from "../../src/commands/highlight";
import { beginScrape } from "../../src/shared";

describe("Highlight", () => {
	let browser: Browser, page: Page;
	beforeEach(async () => {
		try {
			const puppeteerSuite = (await beginScrape(true))!;
			browser = puppeteerSuite.browser;
			page = puppeteerSuite.page;
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes brookemillard's 6th 17854701943592281 and gets a an MP4", async (_, done) => {
		try {
			const payload = await detectFiles(browser, page, "17854701943592281", 6);
			await browser.close();
			done();
			if (payload) {
				const { urls, username } = payload;
				expect(username).to.equal("brookemillard");
				console.log(urls[0]);
				expect(urls[0]).to.include("https://");
				expect(urls[0]).to.include(".jpg");
				expect(urls[0].includes("cdninstagram.com") || urls[0].includes("fbcdn.net")).to.equal(true);
				console.log(urls[1]);
				expect(urls[1]).to.include("https://");
				expect(urls[1]).to.include(".mp4");
				expect(urls[1].includes("cdninstagram.com") || urls[1].includes("fbcdn.net")).to.equal(true);
			}
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes emilyyymichele's 4th 17912059153309881 and gets a JPEG", async (_, done) => {
		try {
			const payload = await detectFiles(browser, page, "17912059153309881", 4);
			await browser.close();
			done();
			if (payload) {
				const { urls, username } = payload;
				expect(username).to.equal("emilyyymichele");
				console.log(urls[0]);
				expect(urls[0]).to.include("https://");
				expect(urls[0]).to.include(".jpg");
				expect(urls[0].includes("cdninstagram.com") || urls[0].includes("fbcdn.net")).to.equal(true);
			}
		} catch (error) { console.error(error.message); }
	});
});
