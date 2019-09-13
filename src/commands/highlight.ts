import {Command, flags} from "@oclif/command";
import {Browser, Page, launch} from "puppeteer-core";
import {chromeExecutable, chromeUserDataDirectory, environmentVariablesFile, userAgent, alert} from "../shared";
import {config} from "dotenv";
import cli from "cli-ux";
import {basename} from "path";
import {createWriteStream, unlink} from "fs";
import chalk from "chalk";
import {get} from "https";

export default class Highlight extends Command {
	static description = "Command for scarping Instagram highlight files.";
	static args = [
		{
			name: "highlight",
			required: true
		},{
			name: "type",
			required: true,
			options: ["image", "video"]
		},{
			name: "item",
			required: true
		}];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		config({path: environmentVariablesFile});
		const {INSTAGRAM} = process.env;
		if (INSTAGRAM! !== "true") {
			alert("You are not authenticated.", "danger");
		} else if (JSON.parse(INSTAGRAM!)) {
			try {
				const {args, flags} = this.parse(Highlight);
				if (args.highlight !== undefined && args.highlight !== null) {
					const now = Date.now();
					cli.action.start("Opening Puppeteer...");
					const {browser, page} = (await beginScrape(flags.headless))!;
					cli.action.stop();
					cli.action.start("Searching for files...");
					const URL = await detectFiles(page, args.highlight, args.type , Number(args.item));
					const userName = await page.evaluate(() => document.querySelector("div.yn6BW > a")!.innerHTML);
					cli.action.stop();
					alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
					if (URL) {
						cli.action.start("Downloading...");
						if (URL.includes(".jpg")) await this.downloadFile(URL, userName, ".jpg");
						if (URL.includes(".mp4")) await this.downloadFile(URL, userName, ".mp4");
						cli.action.stop();
					}
					await browser.close();
				} else return alert("Please provide a POST argument!", "danger");
			} catch (error) { alert(error.message, "danger"); }
		}
	}
	downloadFile(URL: string, userName: string, fileType: ".jpg" | ".mp4") {
		const path = `${process.cwd()}/${userName}_${basename(URL).split("?")[0]}`
		return new Promise((resolve, reject) => {
			alert(chalk.underline(`${fileType}\n${URL}`), "log");
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
export async function detectFiles(page: Page, highlight: string, type: "image" | "video", item: number): Promise<string | undefined> {
	try {
		await page.goto(`https://www.instagram.com/stories/highlights/${highlight}`, {waitUntil: "networkidle2"});
		for (var i = 0; i < item - 1; i += 1) {
			await page.waitForSelector("div.coreSpriteRightChevron", {visible: true});
			await page.click("div.coreSpriteRightChevron");
		}
		if (type === "video") {
			const video = await detectVideo(page);
			if (video !== undefined) return video;
		} else if (type === "image") {
			const image = await detectImage(page);
			if (image !== undefined) return image;
		}
	} catch (error) { alert(error.message, "danger"); }
}
async function detectImage(page: Page): Promise<string | undefined> {
	try {
		//.VO0ra.i1HvM.y-yJ5
		await page.waitForSelector("div.qbCDp > img", {visible: true});
		const imageURLs = await page.$eval("div.qbCDp > img", img => img.getAttribute("srcset"));
		if (imageURLs) return imageURLs.split(",")[0].split(" ")[0];
	} catch (error) { alert(error.message, "danger"); }
}
async function detectVideo(page: Page): Promise<string | undefined> {
	try {
		await page.waitForSelector("video > source");
		const videoURL = await page.$eval("video > source", source => source.getAttribute("src"));
		if (videoURL) return videoURL;
	} catch (error) { alert(error.message, "danger"); }
}
