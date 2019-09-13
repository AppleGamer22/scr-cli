import { expect, test } from "@oclif/test";
import { Browser, Page } from "puppeteer-core";
import { beginScrape, detectFiles } from "../../src/commands/highlight";

describe("Highlight", () => {
	let browser: Browser, page: Page;
	beforeEach(async () => {
		try {
			const puppeteerSuite = (await beginScrape(true))!;
			browser = puppeteerSuite.browser;
			page = puppeteerSuite.page;
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes 1st 17941742392256135 and gets an MP4", async (_, done) => {
		try {
			const url = await detectFiles(page, "17941742392256135", "video", 1);
			await browser.close();
			done();
			if (url) {
				console.log(url);
				expect(url).to.include("https://");
				expect(url).to.include(".mp4");
				expect(url).to.include("cdninstagram.com");
			}
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes 4th 17912059153309881 and gets a JPEG", async (_, done) => {
		try {
			const url = await detectFiles(page, "17912059153309881", "image", 4);
			await browser.close();
			done();
			if (url) {
				console.log(url);
				expect(url).to.include("https://");
				expect(url).to.include(".jpg");
				expect(url).to.include("cdninstagram.com");
			}
		} catch (error) { console.error(error.message); }
	});
});
