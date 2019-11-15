import { Command, flags } from "@oclif/command";
import { Page, Browser } from "puppeteer-core";
import { environmentVariablesFile, alert, downloadInstagramFile, beginScrape, ScrapePayload } from "../shared";
import { config } from "dotenv";
import cli from "cli-ux";

export default class Story extends Command {
	static description = "Command for scraping Instagram story files.";
	static args = [{name: "user", required: true}, {name: "item", required: true}];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		config({path: environmentVariablesFile});
		const {INSTAGRAM} = process.env;
		if (INSTAGRAM! !== "true") {
			alert("You are not authenticated.", "danger");
		} else if (JSON.parse(INSTAGRAM!)) {
			try {
				const { args, flags } = this.parse(Story);
				if (args.user !== undefined && args.user !== null) {
					const now = Date.now();
					cli.action.start("Opening browser");
					const { browser, page } = (await beginScrape(flags.headless))!;
					cli.action.stop();
					cli.action.start("Searching for files");
					const payload = await detectFiles(browser, page, args.user, Number(args.item));
					if (payload) {
						const { urls, username } = payload;
						cli.action.stop();
						alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
						cli.action.start("Downloading");
						if (urls && urls.length === 2 && urls[1].includes(".mp4")) {
							await downloadInstagramFile(username[1], username, ".mp4", 1);
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
export async function detectFiles(browser: Browser, page: Page, user: string, item: number): Promise<ScrapePayload | undefined> {
	try {
		await page.goto(`https://www.instagram.com/${user}`);
		await page.goto(`https://www.instagram.com/stories/${user}`, {waitUntil: "domcontentloaded"});
		if ((await page.$("div.error-container")) !== null) {
			alert(`Failed to find ${user}'s story feed.`, "danger");
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
		await page.waitForSelector("div.uL8Hv", {visible: true});
		await page.click("div.uL8Hv");
		var urls: string[] = [];
		await page.waitForSelector("div.qbCDp", {visible: true});
		const imageURL = (await page.$$eval("div.qbCDp > img", images => images.map(image => image.getAttribute("srcset"))))[0];
		if (imageURL) urls.push(imageURL.split(",")[0].split(" ")[0]);
		const videoURL = (await page.$$eval("video > source", sources => sources.map(source => source.getAttribute("src"))))[0];
		if (videoURL) urls.push(videoURL);
		return { username, urls };
	} catch (error) { alert(error.message, "danger"); }
}
