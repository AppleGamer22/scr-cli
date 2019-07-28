import {expect, test} from "@oclif/test";
import {Browser, Page} from "puppeteer-core";
import {beginScrape, detectFile} from "../../src/commands/vsco";

describe("vsco", () => {
	let browser: Browser, page: Page;
	beforeEach(async () => {
		try {
			const puppeteerSuite = (await beginScrape(true))!;
			browser = puppeteerSuite.browser;
			page = puppeteerSuite.page;
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes darianvoisard/media/5a988983ec256c540d17960a & gets 1 MP4", async (_, done) => {
		try {
			const url = await detectFile(page, "darianvoisard/media/5a988983ec256c540d17960a");
			await browser.close();
			done();
			console.log(url);
			expect(url).to.include("https://");
			expect(url).to.include(".mp4");
			expect(url).to.include("vsco.co");
			expect(url).to.include("aws");
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes darianvoisard/media/5cf82ce5129e4b2929e17d18 & gets 1 JPEG", async (_, done) => {
		try {
			const url = await detectFile(page, "darianvoisard/media/5cf82ce5129e4b2929e17d18");
			await browser.close();
			done();
			console.log(url);
			expect(url).to.include("https://");
			expect(url).to.include(".jpg");
			expect(url).to.include("vsco.co");
			expect(url).to.include("aws");
		} catch (error) { console.error(error.message); }
	});
});
