import {Command, flags } from "@oclif/command";
import { Page, Browser } from "puppeteer-core";
import { environmentVariablesFile, alert, beginScrape, downloadInstagramFile, ScrapePayload } from "../shared";
import { config } from "dotenv";
import cli from "cli-ux";

export default class Highlight extends Command {
	static description = "Command for scraping Instagram highlight files.";
	static args = [
		{
			name: "highlight",
			required: true
		},{
			name: "item",
			required: true
		}
	];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."}),};

	async run() {
		config({ path: environmentVariablesFile });
		const { INSTAGRAM } = process.env;
		if (INSTAGRAM! !== "true") {
			alert("You are not authenticated.", "danger");
		} else if (JSON.parse(INSTAGRAM!)) {
			try {
				const { args, flags } = this.parse(Highlight);
				if (args.highlight !== undefined && args.highlight !== null) {
					const now = Date.now();
					cli.action.start("Opening browser");
					const { browser, page } = (await beginScrape(flags.headless))!;
					cli.action.stop();
					cli.action.start("Searching for files");
					const payload = await detectFiles(browser, page, args.highlight, Number(args.item));
					cli.action.stop();
					if (payload) {
						const { username, urls } = payload;
						alert(`Scrape time: ${(Date.now() - now) / 1000}s`, "info");
						cli.action.start("Downloading");
						if (urls && urls.length === 2 && urls[1].includes(".mp4")) {
							await downloadInstagramFile(urls[1], username, ".mp4", 1);
						} else if (urls && urls.length === 1 && urls[0].includes(".jpg")) {
							await downloadInstagramFile(urls[0], username, ".jpg", 1);
						}
					}
					await browser.close();
				} else return alert("Please provide a POST argument!", "danger");
			} catch (error) { alert(error.message, "danger"); }
		}
	}
}
/**
 * Scrapes Instagram highlight files
 * @param browser Puppeteer browser
 * @param page Puppeteer page
 * @param highlight highlight ID
 * @param item highlight number
 * @returns URL string array
 */
export async function detectFiles(browser: Browser, page: Page, highlight: string, item: number): Promise<ScrapePayload | undefined> {
	try {
		await page.goto(`https://www.instagram.com/stories/highlights/${highlight}`, {waitUntil: "domcontentloaded"});
		await page.waitForSelector("body", {visible: true});
		const potentialError = await page.$eval("body", body => (body as HTMLBodyElement).innerText);
		if (potentialError.includes("Oops, an error occurred.")) {
			alert(`Failed to find highlight ${highlight}.`, "danger");
			await browser.close();
		}
		await page.waitForSelector("div.yn6BW > a", {visible: true});
		const username = await page.evaluate(() => {
			const a = document.querySelector("div.yn6BW > a") as HTMLAnchorElement;
			return a.innerText;
		});
		for (var i = 0; i < item - 1; i += 1) {
			await page.waitForSelector("div.coreSpriteRightChevron", {visible: true});
			await page.click("div.coreSpriteRightChevron");
		}
		if ((await page.$("div._7UhW9")) !== null) await page.click("div._7UhW9");
		await page.keyboard.press("Space");
		var urls: string[] = [];
		await page.waitForSelector("div.qbCDp", {visible: true});
		const imageURL = (await page.$$eval("div.qbCDp > img", images => images.map(image => image.getAttribute("srcset"))))[0];
		if (imageURL) urls.push(imageURL.split(",")[0].split(" ")[0]);
		const videoURL = (await page.$$eval("div.qbCDp > video > source", sources => sources.map(source => source.getAttribute("src"))))[0];
		if (videoURL) urls.push(videoURL);
		return { urls, username };
	} catch (error) { alert(error.message, "danger"); }
}
