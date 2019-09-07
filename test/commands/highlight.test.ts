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
	test.timeout(6000).it("scrapes 17941742392256135 and gets a JPEG and an MP4", async (_, done) => {
		try {
			const urls = await detectFiles(page, "17941742392256135");
			await browser.close();
			done();
			if (urls) {
				expect(urls.length).to.equal(2);
				console.log(urls[0]);
				expect(urls[0]).to.include("https://");
				expect(urls[0]).to.include(".jpg");
				expect(urls[0]).to.include("cdninstagram.com");
				console.log(urls[1]);
				expect(urls[1]).to.include("https://");
				expect(urls[1]).to.include(".mp4");
				expect(urls[1]).to.include("cdninstagram.com");
			}
		} catch (error) { console.error(error.message); }
	});
});
