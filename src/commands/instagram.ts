import {Command, flags} from "@oclif/command";
import {Browser, Page, launch} from "puppeteer-core";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import cli from "cli-ux";
import {config} from "dotenv";
import {chromeExecutable, chromeUserDataDirectory, environmentVariablesFile, userAgent, alert} from "../shared";
import chalk from "chalk";

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
					cli.action.start("Opening Puppeteer...");
					const {browser, page} = (await beginScrape(flags.headless))!;
					cli.action.stop();
					cli.action.start("Searching for files...");
					const urls = [...(new Set<string>(await detectFiles(browser, page, args.post)))];
					const userName = await page.evaluate(() => document.querySelector("a.FPmhX.notranslate.nJAzx")!.innerHTML);
					cli.action.stop();
					alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
					for (var i = 0; i < urls.length; i += 1) {
						const url = urls[i];
						cli.action.start("Downloading...");
						if (url.includes(".jpg")) await this.downloadFile(url, userName, ".jpg", i +1);
						if (url.includes(".mp4")) await this.downloadFile(url, userName, ".mp4", i +1);
						cli.action.stop();
					}
					await browser.close();
				} else return alert("Please provide a POST argument!", "danger");
			} catch (error) { alert(error.message, "danger"); }
		}
	}

	downloadFile(URL: string, userName: string, fileType: ".jpg" | ".mp4", fileNumber: number) {
		const path = `${process.cwd()}/${userName}_${basename(URL).split("?")[0]}`
		return new Promise((resolve, reject) => {
			alert(chalk.underline(`File #${fileNumber} (${fileType})\n${URL}`), "log");
			var file = createWriteStream(path, {autoClose: true});
			const request = get(URL, response => {
				if (response.statusCode !== 200) throw alert("Download failed.", "danger");
				response.on("end", () => cli.action.stop()).pipe(file);
			});
			file.on("finish", () => {
				file.close();
				alert(`File saved at ${path}`, "success");
				resolve();
			});
			request.on("error", error => {
				unlink(path, null!);
				alert(error.message, "danger");
				reject();
			});
		});
	}
}

export async function beginScrape(background: boolean): Promise<{browser: Browser, page: Page} | undefined> {
	try {
		const browser = await launch({
			headless: background,
			userDataDir: chromeUserDataDirectory,
			executablePath: chromeExecutable(),
			devtools: !background,
			defaultViewport: null
		});
		const page = (await browser.pages())[0];
		await page.setUserAgent(userAgent());
		return {browser, page};
	} catch (error) { alert(error.message, "danger"); }
}

export async function detectFiles(browser: Browser, page: Page, id: string): Promise<string[]> {
	var srcs: string[] = [];
	try {
		await page.goto(`https://www.instagram.com/p/${id}`, {waitUntil: "domcontentloaded"});
		if ((await page.$("div.error-container")) !== null) {
			alert(`Failed to find post ${id}`, "danger");
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