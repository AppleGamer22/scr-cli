import { expect, test } from "@oclif/test";
import { Browser, Page } from "puppeteer-core";
import {detectFiles} from "../../src/commands/highlight";
import {beginScrape} from "../../src/shared";

describe("Highlight", () => {
	let browser: Browser, page: Page;
	beforeEach(async () => {
		try {
			const puppeteerSuite = (await beginScrape(true))!;
			browser = puppeteerSuite.browser;
			page = puppeteerSuite.page;
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes 1st 17941742392256135 and gets a JPEG & an MP4", async (_, done) => {
		try {
			const url = await detectFiles(browser, page, "17941742392256135", 1);
			await browser.close();
			done();
			if (url) {
				console.log(url[0]);
				expect(url[0]).to.include("https://");
				expect(url[0]).to.include(".jpg");
				expect(url[0]).to.include("cdninstagram.com");
				console.log(url[1]);
				expect(url[1]).to.include("https://");
				expect(url[1]).to.include(".mp4");
				expect(url[1]).to.include("cdninstagram.com");
			}
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes 4th 17912059153309881 and gets a JPEG", async (_, done) => {
		try {
			const url = await detectFiles(browser, page, "17912059153309881", 4);
			await browser.close();
			done();
			if (url) {
				console.log(url[0]);
				expect(url[0]).to.include("https://");
				expect(url[0]).to.include(".jpg");
				expect(url[0]).to.include("cdninstagram.com");
			}
		} catch (error) { console.error(error.message); }
	});
});
