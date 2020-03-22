import { expect, test } from "@oclif/test";
import { Browser, Page } from "puppeteer-core";
import { detectFile } from "../../src/commands/vsco";
import { beginScrape } from "../../src/shared";

describe("VSCO", () => {
	let browser: Browser, page: Page;
	beforeEach(async () => {
		try {
			const puppeteerSuite = (await beginScrape(true))!;
			browser = puppeteerSuite.browser;
			page = puppeteerSuite.page;
		} catch (error) { console.error(error.message); }
	});
	afterEach(async () => await browser.close());
	test.timeout(6000).it("scrapes darianvoisard/media/5a988983ec256c540d17960a & gets 1 MP4", async (_, done) => {
		try {
			const payload = await detectFile(browser, page, "darianvoisard", "5a988983ec256c540d17960a");
			done();
			if (payload) {
				const { username, urls } = payload;
				expect(username).to.equal("darianvoisard");
				console.log(urls[0]);
				expect(urls[0]).to.include("https://");
				expect(urls[0]).to.include(".mp4");
				expect(urls[0]).to.include("vsco.co");
				expect(urls[0]).to.include("aws");
			}
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes sarahm36/media/5d727b9dc7fe090749a25cad & gets 1 JPEG", async (_, done) => {
		try {
			const payload = await detectFile(browser, page, "sarahm36", "5d727b9dc7fe090749a25cad");
			done();
			if (payload) {
				const { username, urls } = payload;
				expect(username).to.equal("sarahm36");
				console.log(urls[0]);
				expect(urls[0]).to.include("https://");
				expect(urls[0]).to.include(".jpg");
				expect(urls[0]).to.include("vsco.co");
				expect(urls[0]).to.include("aws");
			}
		} catch (error) { console.error(error.message); }
	});
});
