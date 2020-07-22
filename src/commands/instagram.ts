import { Command, flags } from "@oclif/command";
import { Browser, Page } from "puppeteer-core";
import cli from "cli-ux";
import { config } from "dotenv";
import { environmentVariablesFile, alert, beginScrape, downloadInstagramFile, ScrapePayload } from "../shared";

declare global {
	interface Window {
		_sharedData: any,
		__additionalData: any,
	}
}

export default class Instagram extends Command {
	static description = "Command for scraping Instagram post files.";
	static args = [{name: "post", required: true}];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		config({path: environmentVariablesFile});
		const {INSTAGRAM} = process.env;
		if (INSTAGRAM! !== "true") {
			alert("You are not authenticated.", "danger");
		} else if (JSON.parse(INSTAGRAM!)) {
			try {
				const { args, flags } = this.parse(Instagram);
				if (args.post !== undefined && args.post !== null) {
					const now = Date.now();
					cli.action.start("Opening browser");
					const { browser, page } = (await beginScrape(flags.headless))!;
					cli.action.stop();
					cli.action.start("Searching for files");
					const payload = await detectFiles(browser, page, args.post);
					cli.action.stop();
					alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
					if (payload) {
						const { urls, username } = payload;
						for (var i = 0; i < urls.length; i += 1) {
							const url = urls[i];
							cli.action.start("Downloading");
							if (url.includes(".jpg")) await downloadInstagramFile(url, username, ".jpg", i +1);
							if (url.includes(".mp4")) await downloadInstagramFile(url, username, ".mp4", i +1);
							cli.action.stop();
						}
					}
					await browser.close();
				} else return alert("Please provide a POST argument!", "danger");
			} catch (error) { alert(error.message, "danger"); }
		}
	}
}
/**
 * Scrapes Instagram post files
 * @param browser Puppeteer browser
 * @param page Puppeteer page
 * @param id post ID
 * @returns URL string array
 */
export async function detectFiles(browser: Browser, page: Page, id: string): Promise<ScrapePayload | undefined> {
	try {
		await page.goto(`https://www.instagram.com/p/${id}`, {waitUntil: "domcontentloaded"});
		if ((await page.$("div.error-container")) !== null) {
			alert(`Failed to find post ${id}`, "danger");
			await browser.close();
		}
		const data = (await page.evaluate(() => window.__additionalData))[`/p/${id}/`].data.graphql.shortcode_media;
		const username = data.owner.username;
		var urls: string[] = [];
		if (data.edge_sidecar_to_children) {
			for (let edge of data.edge_sidecar_to_children.edges) {
				if (!edge.node.is_video) urls.push(edge.node.display_url);
				if (edge.node.is_video) urls.push(edge.node.video_url);
			}
		} else {
			if (!data.is_video) urls.push(data.display_url);
			if (data.is_video) urls.push(data.video_url);
		}
		return { urls, username };
	} catch (error) { alert(error.message, "danger"); }
}