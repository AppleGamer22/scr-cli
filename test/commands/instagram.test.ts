import { expect, test } from "@oclif/test";
import { Browser, Page } from "puppeteer-core";
import { detectFiles } from "../../src/commands/instagram";
import { beginScrape } from "../../src/shared";

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
	test.timeout(6000).it("scrapes  ella_1830's Bz2MPhPhOQu & gets 1 public JPEG", async (_, done) => {
		try {
			const { urls, username } = (await detectFiles(browser, page, "Bz2MPhPhOQu"))!;
			done();
			expect(username).to.equal("ella_1830");
			expect(urls.length).to.equal(1);
			console.log(urls[0]);
			expect(urls[0]).to.include("https://");
			expect(urls[0]).to.include(".jpg");
			expect(urls[0].includes("cdninstagram.com") || urls[0].includes("fbcdn.net")).to.equal(true);
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes mikaylademaiter's B6ZImCEFsr2 & gets 1 public JPEG", async (_, done) => {
		try {
			const { urls, username } = (await detectFiles(browser, page, "B6ZImCEFsr2"))!;
			done();
			expect(username).to.equal("mikaylademaiter");
			expect(urls.length).to.equal(1);
			console.log(urls[0]);
			expect(urls[0]).to.include("https://");
			expect(urls[0]).to.include(".mp4");
			expect(urls[0].includes("cdninstagram.com") || urls[0].includes("fbcdn.net")).to.equal(true);
		} catch (error) { console.error(error.message); }
	});
	test.timeout(6000).it("scrapes blakepittman's CB9VU3BFwaChAx-YkjMQqGWhYjiwN0yYnrtYEc0 & gets a private JPEG", async (_, done) => {
		try {
			const { urls, username } = (await detectFiles(browser, page, "CB9VU3BFwaChAx-YkjMQqGWhYjiwN0yYnrtYEc0"))!;
			done();
			expect(username).to.equal("blakepittman");
			expect(urls.length).to.equal(1);
			console.log(urls[0]);
			expect(urls[0]).to.include("https://");
			expect(urls[0]).to.include(".jpg");
			expect(urls[0].includes("cdninstagram.com") || urls[0].includes("fbcdn.net")).to.equal(true);
		} catch (error) { console.error(error.message); }
	});
});
//BkfivDeF0w9