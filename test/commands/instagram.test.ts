import {expect, test} from "@oclif/test";
import {Browser, Page} from "puppeteer-core";
import {detectFiles} from "../../src/commands/instagram";
import {beginScrape} from "../../src/shared";

describe("Instagram", () => {
	let browser: Browser, page: Page;
	beforeEach(async () => {
		try {
			const puppeteerSuite = (await beginScrape(true))!;
			browser = puppeteerSuite.browser;
			page = puppeteerSuite.page;
		} catch (error) { console.error(error.message); }
	});
	afterEach(async () => await browser.close());
	test.timeout(6000).it("scrapes Bz2MPhPhOQu & gets 1 public JPEG", async (_, done) => {
		try {
			const urls = (await detectFiles(browser, page, "Bz2MPhPhOQu"))!;
			done();
			expect(urls.length).to.equal(1);
			console.log(urls[0]);
			expect(urls[0]).to.include("https://");
			expect(urls[0]).to.include(".jpg");
			expect(urls[0]).to.include("cdninstagram.com");
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes B2VA_gNg2EQ & gets 1 public MP4", async (_, done) => {
		try {
			const urls = (await detectFiles(browser, page, "B2VA_gNg2EQ"))!;
			done();
			expect(urls.length).to.equal(1);
			console.log(urls[0]);
			expect(urls[0]).to.include("https://");
			expect(urls[0]).to.include(".mp4");
			expect(urls[0]).to.include("cdninstagram.com");
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes BqWkJemlFJb & gets a public MP4 & a public JPEG", async (_, done) => {
		try {
			const urls = (await detectFiles(browser, page, "BqWkJemlFJb"))!;
			done();
			expect(urls.length).to.equal(2);
			console.log(urls[0]);
			expect(urls[0]).to.include("https://");
			expect(urls[0]).to.include(".mp4");
			expect(urls[0]).to.include("cdninstagram.com");
			console.log(urls[1]);
			expect(urls[1]).to.include("https://");
			expect(urls[1]).to.include(".jpg");
			expect(urls[1]).to.include("cdninstagram.com");
		} catch (error) { console.error(error.message); }
	});
});
//BkfivDeF0w9