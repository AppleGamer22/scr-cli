import {Command, flags} from "@oclif/command";
import {Browser, Page, launch} from "puppeteer-core";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import cli from "cli-ux";
import {config} from "dotenv";
import {chromeExecutable, chromeUserDataDirectory, environmentVariablesFile, userAgent} from "../shared";

export default class Instagram extends Command {
	static description = "Command for scarping Instagram post files.";
	static args = [{name: "post"}];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		config({path: environmentVariablesFile});
		const {INSTAGRAM} = process.env;
		if (INSTAGRAM! !== "true") {
			console.error("You are not authenticated.");
		} else if (JSON.parse(INSTAGRAM!)) {
			try {
				const {args, flags} = this.parse(Instagram);
				const now = Date.now();
				cli.action.start("Opening Puppeteer...");
				const {browser, page} = (await beginScrape(userAgent, flags.headless))!;
				cli.action.stop();
				cli.action.start("Searching for files...");
				const urls = [...(new Set<string>(await detectFiles(browser, page, args.post)))];
				cli.action.stop();
				console.log(`Scrape time: ${(Date.now() - now)/1000}s`);
				for (var i = 0; i < urls.length; i += 1) {
					const url = urls[i];
					cli.action.start("Downloading...");
					if (url.includes(".jpg")) await this.downloadFile(url, ".jpg", i +1);
					if (url.includes(".mp4")) await this.downloadFile(url, ".mp4", i +1);
					cli.action.stop();
				}
				await browser.close();
			} catch (error) { console.error(error.message); }
		}
	}

	downloadFile(URL: string, fileType: ".jpg" | ".mp4", fileNumber: number) {
		const path = `${process.cwd()}/${basename(URL).split("?")[0]}`
		return new Promise((resolve, reject) => {
			console.log(`${fileType} ${fileNumber}\n${URL}`);
			var file = createWriteStream(path);
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
		});
	}
}

export async function beginScrape(userAgent: string, background: boolean): Promise<{browser: Browser, page: Page} | undefined> {
	try {
		const browser = await launch({
			headless: background,
			userDataDir: chromeUserDataDirectory,//`${__dirname}/../../Chrome`,
			executablePath: chromeExecutable(),
			devtools: !background,
			defaultViewport: null
		});
		const page = (await browser.pages())[0];
		await page.setUserAgent(userAgent);
		return {browser, page};
	} catch (error) { console.error(error.message); }
}

export async function detectFiles(browser: Browser, page: Page, id: string): Promise<string[]> {
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
	} catch (error) {
		return [...(new Set<string>(srcs))!];
	}
	return [...(new Set<string>(srcs))!];
}