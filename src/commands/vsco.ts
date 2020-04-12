import { Command, flags } from "@oclif/command";
import { Page, Browser } from "puppeteer-core";
import { get } from "superagent";
import { writeFileSync } from "fs";
import { basename } from "path";
import cli from "cli-ux";
import { alert, beginScrape, ScrapePayload } from "../shared";
import { underline } from "chalk";

export default class VSCO extends Command {
	static description = "Command for scraping VSCO post file.";
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
			const { args, flags } = this.parse(VSCO);
			if (args.user && args.post) {
				const now = Date.now();
				cli.action.start("Opening browser");
				const { browser, page } = (await beginScrape(flags.headless))!;
				cli.action.stop();
				cli.action.start("Searching for files");
				const payload = await detectFile(browser, page, args.user, args.post);
				cli.action.stop();
				if (payload) {
					const { username, urls } = payload;
					alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
					cli.action.start("Downloading");
					if (urls[0].includes(".jpg")) await this.downloadFile(urls[0], ".jpg", username, args.post);
					if (urls[0].includes(".mp4")) await this.downloadFile(urls[0], ".mp4", username, args.post);
					cli.action.stop();
				}
				await browser.close();
			} else return alert("Please provide a POST argument!", "danger");
		} catch (error) { alert(error.message, "danger"); }
	}

	async downloadFile(url: string, type: ".jpg" | ".mp4", username: string, post: string) {
		try {
			const path = `${process.cwd()}/${username}_${post}${basename(url)}`;
			const { body, status } = await get(url).responseType("blob");
			if (status === 200) {
				writeFileSync(path, body, {encoding: "binary"});
				alert(underline(type), "log");
				cli.url(underline(url), url);
				alert(`File saved at ${path}`, "success");
			}
		} catch (error) {
			alert(error.message, "danger");
		}
	}
}

export async function detectFile(browser: Browser, page: Page, user: string, post: string): Promise<ScrapePayload | undefined> {
	try {
		await page.goto(`https://vsco.co/${user}/media/${post}`, {waitUntil: "domcontentloaded"});
		if ((await page.$("p.NotFound-heading")) !== null) {
			alert(`Failed to find ${user}'s post ${post}`, "danger");
			await browser.close();
		}
		await page.waitForSelector("a.css-9zfgas-UsernameLink", {visible: true});
		const username = await page.evaluate(() => {
			const a = document.querySelector("a.css-9zfgas-UsernameLink") as HTMLAnchorElement;
			return a.innerText;
		});
		const imageURLs = await page.$$eval(`meta[property="og:image"]`, metas => {
			return  metas.map(meta => meta.getAttribute("content"));
		});
		const videoURLs = await page.$$eval(`meta[property="og:video"]`, metas => {
			return metas.map(meta => meta.getAttribute("content"));
		});
		if (videoURLs[0]) return {urls: [videoURLs[0]], username};
		if (imageURLs[0]) return {urls: [imageURLs[0].split("?")[0]], username};
	} catch (error) { alert(error.message, "danger"); }
}