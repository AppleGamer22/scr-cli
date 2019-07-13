import { expect, test } from "@oclif/test";
import { execSync, exec } from "child_process";
import {beginScrape, detectFiles, userAgent} from "./../../src/commands/instagram";

describe("Instagram", () => {
	test.timeout(10000).it("scrapes Bz2MPhPhOQu & gets to JPEGs", async (context, done) => {
		try {
			const {browser, page} = (await beginScrape(userAgent, false))!;
			const urls = await detectFiles(browser, page, "BtqB_I6FWNC");
			console.log(urls);
			done();
			for (const url of urls) expect(url).to.include(".jpg");
		} catch (error) { console.error(error.message); }
	});
});
