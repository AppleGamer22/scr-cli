import { expect, test } from "@oclif/test";
import { Browser, Page } from "puppeteer-core";
// @ts-ignore
import { beginScrape } from "../../src/shared";
// @ts-ignore
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
});
