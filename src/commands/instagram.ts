import { Command } from "@oclif/command";
import {Browser, Page, launch} from "puppeteer";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import {Answers, prompt} from "inquirer";
import {config} from "dotenv";

export default class Instagram extends Command {
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
			const answers: Answers = await prompt([
				{
					type: "input",
					name: "username",
					message: "Your Instagram username:"
				},{
					type: "password",
					name: "password",
					message: "Your Instagram password:"
				},{
					type: "input",
					name: "id",
					message: "Wanted Instagram post ID (after https://www.instagram.com/p/):"
				},{
					type: "confirm",
					name: "background",
					message: "Do you want to see the browser?"
				}
			]);
			await this.beginScrape(answers.username, answers.password, answers.id, !answers.background);
		} else if (INSTAGRAM_USERNAME !== undefined && INSTAGRAM_PASSWORD !== undefined) {
			const answers: Answers = await prompt([
				{
					type: "input",
					name: "id",
					message: "Wanted Instagram post ID (after https://www.instagram.com/p/):"
				},{
					type: "confirm",
					name: "background",
					message: "Do you want to see the browser?"
				}
			]);
			await this.beginScrape(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD, answers.id, !answers.background);
		}
	}

	async beginScrape(username: string, password: string, id: string, background: boolean) {
		console.log("Opening Puppeteer...");
		try {
			const browser = await launch({
				headless: background,
				devtools: !background,
				defaultViewport: null,
				args: ["--disable-notifications"]
			});
			await browser.browserContexts()[0].overridePermissions("https://www.instagram.com", ["notifications"]);
			const page = (await browser.pages())[0];
			await page.setUserAgent(this.userAgent);
			await page.goto("https://www.instagram.com/accounts/login/");
			await page.waitForSelector(`input[name="username"]`);
			await page.type(`input[name="username"]`, username);
			await page.type(`input[name="password"]`, password);
			await page.click(`button[type="submit"]`);
			await page.waitForNavigation();
			await this.detectFiles(browser, page, id);
			// await page.waitFor(2500);
			// const isError = await page.$("p#slfErrorAlert");
			// if (isError !== null) {
			// 	console.error("Wrong Instagram credentials were entered...");
			// 	await browser.close();
			// } else {
			// 	console.log("Signed-in...");
			// 	await page.waitForNavigation();
			// 	await this.detectFiles(browser, page, id);
			// }
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
		console.log("Found files.");
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
			console.log("Download began.");
			var file = createWriteStream(path);
			const request = get(URL, response => {
				if (response.statusCode !== 200) throw console.error("Download failed.");
				response.on("end", () => console.log("Download ended.")).pipe(file);
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
