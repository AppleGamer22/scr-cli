import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { Browser, Page, launch } from "puppeteer-core";
import axios from "axios";
import { underline } from "chalk";
import { writeFileSync } from "fs";
import { alert, beginScrape, ScrapePayload } from "../shared";

export default class TikTok extends Command {
	static description = "Command for scraping TikTok post file.";
	static args = [
		{
			name: "user",
			required: true
		},{
			name: "post",
			required: true
		}
	];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		try {
			const { args, flags } = this.parse(TikTok);
			if (args.user && args.post) {
				const now = Date.now();
				cli.action.start("Opening browser");
				const { browser, page } = (await beginScrape(flags.headless, true))!;
				cli.action.stop();
				cli.action.start("Searching for files");
				const payload = await detectFile(browser, page, args.user, args.post);
				cli.action.stop();
				if (payload) {
					const { username, urls } = payload;
					alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
					cli.action.start("Downloading");
					await this.downloadFile(urls[0], username, args.post);
					cli.action.stop();
				}
				await browser.close();
			} else return alert("Please provide a POST argument!", "danger");
		} catch (error) { alert(error.message, "danger"); }
	}

	async downloadFile(url: string, username: string, id: string) {
		try {
			const path = `${process.cwd()}/${username}_${id}.mp4`;
			const { data, status } = await axios.get(url, {responseType: "arraybuffer"});
			if (status	 === 200) {
				alert(underline(".mp4"), "log");
				cli.url(underline(url), url);
				writeFileSync(path, data, {encoding: "binary"});
				alert(`File saved at ${path}`, "success");
			}
		} catch (error) {
			alert(error.message, "danger");
		}
	}
}
/**
 * Scrapes TikTok post files
 * @param browser Puppeteer browser
 * @param page Puppeteer page
 * @param user post owner
 * @param post post ID
 * @returns URL string array
 */
export async function detectFile(browser: Browser, page: Page, user: string, post: string): Promise<ScrapePayload | undefined> {
	try {
		await page.goto(`https://www.tiktok.com/@${user}/video/${post}`, {waitUntil: "domcontentloaded"});
		if ((await page.$("div.error-page")) !== null) {
			alert(`Failed to find ${user}'s post ${post}`, "danger");
			await browser.close();
		}
		await page.waitForSelector("h3.author-uniqueId", {visible: true});
		const username = await page.evaluate(() => {
			const a = document.querySelectorAll("h3.author-uniqueId")[0] as HTMLHeadingElement;
			return a.innerText;
		});
		await page.waitForSelector("video", {visible: true});
		const videoURL = await page.$eval("video", video => video.getAttribute("src"));
		if (videoURL) return {urls: [videoURL.replace("-web", "")], username};
	} catch (error) {
		alert(error.message, "danger");
	}
}