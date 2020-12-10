import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { Browser, Page, launch } from "puppeteer-core";
import axios from "axios";
import { underline } from "chalk";
import { writeFileSync } from "fs";
import { alert, beginScrape, ScrapePayload } from "../shared";
import { url } from "inspector";

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
	static flags = {
		headless: flags.boolean({
			char: "h",
			description: "Toggle for background scraping."
		})
	};

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
				alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
				if (payload) {
					const { username, data } = payload;
					cli.action.start("Downloading");
					await this.downloadFile(data!, username, args.post);
					cli.action.stop();
				}
				await browser.close();
			} else return alert("Please provide a POST argument!", "danger");
		} catch (error) {
			alert(error.message, "danger");
		}
	}

	async downloadFile(data: Buffer, username: string, id: string) {
		try {
			const path = `${process.cwd()}/${username}_${id}.mp4`;
			writeFileSync(path, data, {encoding: "binary"});
			alert(underline(".mp4"), "log");
			alert(`File saved at ${path}`, "success");
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
export async function detectFile(browser: Browser, page: Page, user: string, post: string) {
	try {
		var data: Buffer | undefined;
		page.on("response", async response => {
			try {
				if (response.url().includes("mp4") && response.ok()) {
					data = await response.buffer();
					alert("Retrieved MP4", "success");
				}
			} catch (error) {
				alert(error.message, "danger");
			}
		});
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
		await page.waitForResponse(response => response.url().includes("mp4") && response.ok());
		await page.waitForSelector("video", {visible: true});
		await page.waitForTimeout(100);
		const duration = await page.evaluate(() => {
			const htmlVideo = document.querySelector("video") as HTMLVideoElement;
			return htmlVideo.duration * 1000;
		});
		console.log(`Video time: ${duration / 1000}s`);
		await page.waitForTimeout(duration);
		return { data, username };
	} catch (error) {
		alert(error.message, "danger");
	}
}