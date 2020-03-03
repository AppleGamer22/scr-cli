import { Command, flags } from "@oclif/command";
import { Page, Browser } from "puppeteer-core";
import { get } from "superagent";
import { promisify } from "util";
import { writeFileSync } from "fs";
import { basename } from "path";
import cli from "cli-ux";
import { alert, beginScrape, ScrapePayload } from "../shared";
import { underline } from "chalk";
import { IExifElement, TagValues, insert, dump } from "piexif-ts";

export default class VSCO extends Command {
	static description = "Command for scraping VSCO post file.";
	static args = [{name: "post", required: true}];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		try {
			const { args, flags } = this.parse(VSCO);
			const post: string  = args.post;
			if (post !== undefined && post !== null) {
				if (!post.includes("/media/")) return alert("Please provide a valid post ID.", "danger");
				const now = Date.now();
				cli.action.start("Opening browser");
				const { browser, page } = (await beginScrape(flags.headless))!;
				cli.action.stop();
				cli.action.start("Searching for files");
				const payload = await detectFile(browser, page, post);
				cli.action.stop();
				if (payload) {
					const { username, urls } = payload;
					alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
					cli.action.start("Downloading");
					await this.downloadFile(urls[0], username, post.split("/")[2]);
					cli.action.stop();
				}
				await browser.close();
			} else return alert("Please provide a POST argument!", "danger");
		} catch (error) { alert(error.message, "danger"); }
	}

	async downloadFile(url: string, username: string, id: string) {
		try {
			const path = `${process.cwd()}/${username}_${id}${basename(url)}`;
			const { body, status } = await get(url).responseType("blob");
			if (status === 200) {
				if (url.includes(".jpg")) {
					alert(underline(".jpg"), "log");
					cli.url(underline(url), url);
					var exif: IExifElement = {};
					const date = new Date();
					const [month, day, year] = date.toLocaleDateString().split("/");
					const exifDate = `${year}:${month}:${day} ${date.toLocaleTimeString()}`;
					exif[TagValues.ExifIFD.DateTimeOriginal] = exifDate;
					const cleanEXIFBytes = dump({Exif: exif});
					const cleanFile = insert(cleanEXIFBytes, body);
					writeFileSync(path, cleanFile, {encoding: "binary"});
					alert(`File saved at ${path}`, "success");
				} else if (url.includes(".mp4")) {
					alert(underline(".mp4"), "log");
					cli.url(underline(url), url);
					writeFileSync(path, body, {encoding: "binary"});
					alert(`File saved at ${path}`, "success");
				}
			}
		} catch (error) {
			alert(error.message, "danger");
		}
	}
}

export async function detectFile(browser: Browser, page: Page, id: string): Promise<ScrapePayload | undefined> {
	try {
		await page.goto(`https://vsco.co/${id}`, {waitUntil: "domcontentloaded"});
		if ((await page.$("p.NotFound-heading")) !== null) {
			alert(`Failed to find post ${id}`, "danger");
			await browser.close();
		}
		await page.waitForSelector("a.DetailViewUserInfo-username", {visible: true});
		const username = await page.evaluate(() => {
			const a = document.querySelector("a.DetailViewUserInfo-username") as HTMLAnchorElement;
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