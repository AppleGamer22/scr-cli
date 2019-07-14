import {expect, test} from "@oclif/test";
import {beginScrape, detectFiles, userAgent} from "./../../src/commands/instagram";

describe("Instagram", () => {
	test.timeout(6000).it("scrapes Bz2MPhPhOQu & gets to 1 JPEG", async (context, done) => {
		try {
			const {browser, page} = (await beginScrape(userAgent, false))!;
			const urls = await detectFiles(browser, page, "Bz2MPhPhOQu");
			await browser.close();
			console.log(urls);
			done();
			for (const url of urls) expect(url).to.include(".jpg");
		} catch (error) { console.error(error.message); }
	});
});
