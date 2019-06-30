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
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};
	srcs: string[] = [];
	startScarpingTime = 0;
	fileCount = 0;
	currentFileIndex = 0;
	readonly userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";

	async run() {
		config({path: `${__dirname}/../../.env`});
		const {INSTAGRAM} = process.env;
		if (!JSON.parse(INSTAGRAM!)) {
			console.log("Please make sure that you enter the correct Instagram creditentials and post ID...");
			const username: string = await cli.prompt("username", {type: "normal", prompt: "Your Instagram username: "});
			const password: string = await cli.prompt("password", {type: "hide", prompt: "Your Instagram password: "});
			const id: string = await cli.prompt("id", {type: "normal", prompt: "Instagram post ID (after https://www.instagram.com/p/): "});
			const background: boolean = await cli.confirm("Do you want to see the browser?");
			await this.beginScrape(id, !background);
		} else if (JSON.parse(INSTAGRAM!)) {
			const {args, flags} = this.parse(Instagram);
			await this.beginScrape(args.post, flags.headless);
		}
	}

	async beginScrape(id: string, background: boolean) {
		cli.action.start("Opening Puppeteer...");
		try {
			const browser = await launch({
				headless: background,
				userDataDir: `${__dirname}/../../Chrome`,
				devtools: !background,
				defaultViewport: null
			});
			this.startScarpingTime = Date.now();
			cli.action.stop();
			await browser.browserContexts()[0].overridePermissions("https://www.instagram.com", ["notifications"]);
			const page = (await browser.pages())[0];
			await page.setUserAgent(this.userAgent);
			cli.action.start("Searching for files...");
			await this.detectFiles(browser, page, id);
		} catch (error) { console.error(error.message); }
	}
	async detectFiles(browser: Browser, page: Page, id: string) {
		try {
			await page.goto(`https://www.instagram.com/p/${id}`, {waitUntil: "domcontentloaded"});
			const errorLabelSelector = "body > div > div.page.-cx-PRIVATE-Page__body.-cx-PRIVATE-Page__body__ > div > div";
			if ((await page.$("div.error-container")) !== null) {
				console.error(`Failed to find post ${id}`);
				await browser.close();
				return;
			}
			await page.waitForSelector("div.ZyFrc", {visible: true});
			var nextButtons = await page.$("div.coreSpriteRightChevron");
			do {
				const videosDuplicates = await page.$$eval("video.tWeCl", videos => videos.map(video => video.getAttribute("src")));
				const imagesDuplicates = await page.$$eval("img.FFVAD", images => images.map(image => image.getAttribute("src")));
				imagesDuplicates.forEach(duplicate => this.srcs.push(duplicate!));
				videosDuplicates.forEach(duplicate => this.srcs.push(duplicate!));
				await page.click("div.coreSpriteRightChevron");
				nextButtons = await page.$("div.coreSpriteRightChevron");
			} while (nextButtons !== null);
			this.organiseFiles(browser, id);
		} catch (error) {
			if (error.message === "No node found for selector: div.coreSpriteRightChevron") await this.organiseFiles(browser, id);
		}
	}
	async organiseFiles(browser: Browser, id: string) {
		cli.action.stop();
		try {
			const URLs = Array.from(new Set(this.srcs));
			this.fileCount = URLs.length;
			// console.log(URLs);
			for (const url of URLs) {
				if (url.includes(".jpg") || url.includes(".mp4")) {
					await this.downloadFile(browser, url);
				}
			}
		} catch (error) {console.error(error.message)}
	}

	async downloadFile(browser: Browser, URL: string) {
		const path = `${process.cwd()}/${basename(URL).split("?")[0]}`
		try {
			console.log(`${this.currentFileIndex + 1}\n${URL}`);
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
			this.currentFileIndex += 1;
			if (this.currentFileIndex === this.fileCount && this.startScarpingTime !== 0) {
				await browser.close();
				console.log(`Scrape time: ${(Date.now() - this.startScarpingTime)/1000}s`);
			}
		} catch (error) { console.error(error.message); }
	}
}
