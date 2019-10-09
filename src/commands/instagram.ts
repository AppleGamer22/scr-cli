import {Command, flags} from "@oclif/command";
import {Browser, Page} from "puppeteer-core";
import cli from "cli-ux";
import {config} from "dotenv";
import {environmentVariablesFile, alert, beginScrape, downloadInstagramFile} from "../shared";

declare global {
	interface Window {
		_sharedData: any
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
				const {args, flags} = this.parse(Instagram);
				if (args.post !== undefined && args.post !== null) {
					const now = Date.now();
					cli.action.start("Opening browser");
					const {browser, page} = (await beginScrape(flags.headless))!;
					cli.action.stop();
					cli.action.start("Searching for files");
					const urls = [...(new Set<string>(await detectFiles(browser, page, args.post)))];
					const userName = await page.evaluate(() => document.querySelector("a.FPmhX.notranslate.nJAzx")!.innerHTML);
					cli.action.stop();
					alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
					for (var i = 0; i < urls.length; i += 1) {
						const url = urls[i];
						cli.action.start("Downloading");
						if (url.includes(".jpg")) await downloadInstagramFile(url, userName, ".jpg", i +1);
						if (url.includes(".mp4")) await downloadInstagramFile(url, userName, ".mp4", i +1);
						cli.action.stop();
					}
					await browser.close();
				} else return alert("Please provide a POST argument!", "danger");
			} catch (error) { alert(error.message, "danger"); }
		}
	}
}

export async function detectFiles(browser: Browser, page: Page, id: string): Promise<string[] | undefined> {
	var srcs: string[] = [];
	try {
		await page.goto(`https://www.instagram.com/p/${id}`, {waitUntil: "domcontentloaded"});
		if ((await page.$("div.error-container")) !== null) {
			alert(`Failed to find post ${id}`, "danger");
			await browser.close();
		}
		const sources = await page.evaluate(() => {
			return window._sharedData.entry_data.PostPage[0].graphql.shortcode_media;
		});
		var urls: string[] = [];
		if (sources.edge_sidecar_to_children) {
			for (let edge of sources.edge_sidecar_to_children.edges) {
				if (!edge.node.is_video) urls.push(edge.node.display_url);
				if (edge.node.is_video) urls.push(edge.node.video_url);
			}
		} else {
			if (!sources.is_video) urls.push(sources.display_url);
			if (sources.is_video) urls.push(sources.video_url);
		}
		return urls;
	} catch (error) { alert(error.message, "danger"); }
}