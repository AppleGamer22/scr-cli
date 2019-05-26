import {Command, flags} from "@oclif/command";
import {Browser, Page, launch} from "puppeteer";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import cli from "cli-ux";
import {config} from "dotenv";
import { userDataDirs } from "../shared";

export default class Instagram extends Command {
	static args = [{name: "post"}];
	static flags = {headless: flags.boolean({char: "h"})};
	srcs: string[] = [];
	count = 0;
	I = 0;
	static description = "describe the command here";
	readonly userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";

	async run() {
		config({path: `${__dirname}/../../.env`});
		const {INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD} = process.env;
		if (INSTAGRAM_USERNAME === undefined || INSTAGRAM_PASSWORD === undefined) {
			console.log("Please make sure that you enter the correct Instagram creditentials and post ID...");
			const username: string = await cli.prompt("username", {type: "normal", prompt: "Your Instagram username: "});
			const password: string = await cli.prompt("password", {type: "hide", prompt: "Your Instagram password: "});
			const id: string = await cli.prompt("id", {type: "normal", prompt: "Instagram post ID (after https://www.instagram.com/p/): "});
			const background: boolean = await cli.confirm("Do you want to see the browser?");
			await this.beginScrape(id, !background);
		} else if (INSTAGRAM_USERNAME !== undefined && INSTAGRAM_PASSWORD !== undefined) {
			const {args, flags} = this.parse(Instagram);
			const startScarpingTime = Date.now();
			await this.beginScrape(args.post, flags.headless);
			console.log(`Scrape time: ${(Date.now() - startScarpingTime)/1000}s`);
		}
	}

	async beginScrape(id: string, background: boolean) {
		cli.action.start("Opening Puppeteer...");
		try {
			const browser = await launch({
				headless: background,
				userDataDir: userDataDirs(),
				devtools: !background,
				defaultViewport: null,
			});
			cli.action.stop();
			cli.action.start("Signing-in...");
			await browser.browserContexts()[0].overridePermissions("https://www.instagram.com", ["notifications"]);
			const page = (await browser.pages())[0];
			await page.setUserAgent(this.userAgent);
			await page.goto("https://www.instagram.com/");
			cli.action.stop();
			cli.action.start("Searching for files...");
			await this.detectFiles(browser, page, id);
		} catch (error) {
			console.error(error.message);
			// process.exit();
		}
	}
	async detectFiles(browser: Browser, page: Page, id: string) {
		try {
			await page.goto(`https://www.instagram.com/p/${id}`);
			if ((await page.$("div.error-container")) !== null) {
				console.error(`Failed to find post ${id}`);
				return;
			}
			await page.waitForSelector("div.ZyFrc", {visible: true});
			var nextButtons = await page.$("div.coreSpriteRightChevron");
			do {
				const videosDuplicates = await page.$$eval("video[src].tWeCl", videos => videos.map(video => video.getAttribute("src")));
				const imagesDuplicates = await page.$$eval("img[src].FFVAD", images => images.map(image => image.getAttribute("src")));
				imagesDuplicates.forEach(duplicate => this.srcs.push(duplicate!));
				videosDuplicates.forEach(duplicate => this.srcs.push(duplicate!));
				await page.click("div.coreSpriteRightChevron");
				nextButtons = await page.$("div.coreSpriteRightChevron");
			} while (nextButtons !== null);
			this.organiseFiles(browser, id);
		} catch (error) {
			console.error(error.message);
			await this.organiseFiles(browser, id);
		}
	}
	async organiseFiles(browser: Browser, id: string) {
		cli.action.stop();
		try {
			const URLs = Array.from(new Set(this.srcs));
			this.count = URLs.length;
			for (const url of URLs) if (url.includes(".jpg") || url.includes(".mp4")) await this.downloadFile(browser, url);
			return;
		} catch (error) {console.error(error.message)}
	}

	async downloadFile(browser: Browser, URL: string) {
		const path = `${process.cwd()}/${basename(URL).split("?")[0]}`
		try {
			console.log(URL);
			cli.action.start("Download began.");
			var file = createWriteStream(path);
			const request = get(URL, response => {
				if (response.statusCode !== 200) throw console.error("Download failed.");
				response.on("end", () => cli.action.stop()).pipe(file);
				// const length = parseInt(response.headers['content-length'], 10);
				// var current = 0;
				// response.on("data", chunk => {
				// 	current += chunk.length;
				// 	console.log(`Downloaded %${(100 * current / length).toFixed(2)}`);
				// });
			});
			file.on("finish", () => file.close());
			request.on("error", error => {
				unlink(path, null!);
				console.error(error.message);
			});
			this.I += 1;
			if (this.I === this.count) await browser.close();
		} catch (error) {
			console.error(error.message);
		}
	}
}
