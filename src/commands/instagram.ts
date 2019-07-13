import {Command, flags} from "@oclif/command";
import {Browser, Page, launch} from "puppeteer";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import cli from "cli-ux";
import {config} from "dotenv";

export default class Instagram extends Command {
	static description = "Command for scarping Instagram post files.";
	static args = [{name: "post"}];
	static flags = {
		headless: flags.boolean({char: "h", description: "Toggle for background scraping."})
	};
	srcs: string[] = [];
	startScarpingTime = 0;
	fileCount = 0;
	currentFileIndex = 0;

	async run() {
		config({path: `${__dirname}/../../.env`});
		const {INSTAGRAM} = process.env;
		if (!JSON.parse(INSTAGRAM!)) {
			console.error("You are not authenticated.");
		} else if (JSON.parse(INSTAGRAM!)) {
			try {
				const {args, flags} = this.parse(Instagram);
				const {browser, page} = (await beginScrape(userAgent, flags.headless))!
				const urls = [...(new Set<string>(await detectFiles(browser, page, args.post)))];
				for (const url of urls) {
					if (url.includes(".jpg")) await this.downloadFile(browser, url, ".jpg");
					if (url.includes(".mp4")) await this.downloadFile(browser, url, ".mp4");
				}
			} catch (error) { console.error(error.message); }
		}
	}

	downloadFile(browser: Browser, URL: string, fileType: ".jpg" | ".mp4") {
		const path = `${process.cwd()}/${basename(URL).split("?")[0]}`
		return new Promise(async (resolve, reject) => {
			console.log(`${fileType} ${this.currentFileIndex + 1}\n${URL}`);
			var file = createWriteStream(path);
			cli.action.start("Download began.");
			const request = get(URL, response => {
				if (response.statusCode !== 200) throw console.error("Download failed.");
				response.on("end", () => cli.action.stop()).pipe(file);
			});
			file.on("finish", () => {
				cli.action.stop();
				file.close();
				resolve();
			});
			request.on("error", error => {
				unlink(path, null!);
				console.error(error.message);
				reject();
			});
			this.currentFileIndex += 1;
			if (this.currentFileIndex === this.fileCount && this.startScarpingTime !== 0) {
				await browser.close();
				console.log(`Scrape time: ${(Date.now() - this.startScarpingTime)/1000}s`);
			}
		});
	}
}

export const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";

export async function beginScrape(userAgent: string, background: boolean): Promise<{browser: Browser, page: Page} | undefined> {
	cli.action.start("Opening Puppeteer...");
	try {
		const browser = await launch({
			headless: background,
			userDataDir: `${__dirname}/../../Chrome`,
			devtools: !background,
			defaultViewport: null
		});
		cli.action.stop();
		const page = (await browser.pages())[0];
		await page.setUserAgent(userAgent);
		cli.action.start("Searching for files...");
		return {browser, page};
	} catch (error) { console.error(error.message); }
}

export async function detectFiles(browser: Browser, page: Page, id: string): Promise<string[]> {
	cli.action.start("Searching for files...");
	var srcs: string[] = [];
	try {
		await page.goto(`https://www.instagram.com/p/${id}`, {waitUntil: "domcontentloaded"});
		const errorLabelSelector = "body > div > div.page.-cx-PRIVATE-Page__body.-cx-PRIVATE-Page__body__ > div > div";
		if ((await page.$("div.error-container")) !== null) {
			console.error(`Failed to find post ${id}`);
			await browser.close();
		}
		await page.waitForSelector("div.ZyFrc", {visible: true});
		var nextButtons = await page.$("div.coreSpriteRightChevron");
		do {
			const videosDuplicates = await page.$$eval("video.tWeCl", videos => videos.map(video => video.getAttribute("src")));
			const imagesDuplicates = await page.$$eval("img.FFVAD", images => images.map(image => image.getAttribute("src")));
			imagesDuplicates.forEach(duplicate => { if (duplicate) srcs.push(duplicate); });
			videosDuplicates.forEach(duplicate => { if (duplicate) srcs.push(duplicate); });
			await page.click("div.coreSpriteRightChevron");
			nextButtons = await page.$("div.coreSpriteRightChevron");
		} while (nextButtons !== null);
		cli.action.stop();
	} catch (error) {
		return [...(new Set<string>(srcs))!];
	}
	await browser.close();
	return [...(new Set<string>(srcs))!];
}