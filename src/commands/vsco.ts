import {Command, flags} from "@oclif/command";
import {Browser, Page, launch} from "puppeteer-core";
import {load} from "cheerio";
import {get} from "https";
import {createWriteStream, unlinkSync} from "fs";
import {basename} from "path";
import cli from "cli-ux";
import {config} from "dotenv";
import {chromeExecutable, chromeUserDataDirectory, environmentVariablesFile, userAgent} from "../shared";

export default class Vsco extends Command {
	static description = "Command for scarping VSCO post file.";
	static args = [{name: "post"}];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		config({path: environmentVariablesFile});
		const {VSCO} = process.env;
		if (VSCO! !== "true") {
			console.error("You are not authenticated.");
		} else if (JSON.parse(VSCO!)) {
			const {args, flags} = this.parse(Vsco);
			const post: string  = args.post;
			if (!post.includes("/media/")) return console.error("Please provide a valid post ID.")
			const now = Date.now();
			cli.action.start("Opening Puppeteer...");
			const {browser, page} = (await beginScrape(flags.headless))!;
			cli.action.stop();
			cli.action.start("Searching for files...");
			const url = await detectFile(page, post);
			cli.action.stop();
			console.log(`Scrape time: ${(Date.now() - now)/1000}s`);
			cli.action.start("Downloading...");
			await this.downloadFile(url!, post.split("/")[2]);
			cli.action.stop();
			await browser.close();
		}
	}

	async downloadFile(redirectURL: string, id: string) {
		const path = `${process.cwd()}/${id}${basename(redirectURL)}`;
		return new Promise((resolve, reject) => {
			var file = createWriteStream(path);
			const request = get(redirectURL, response1 => {
				if (redirectURL.includes(".jpg")) {
					const realURL = response1.headers.location!;
					console.log(`.jpg\n${realURL}`);
					get(realURL, response2 => {
						if (response2.statusCode !== 200) throw console.error("Download failed.");
						response2.on("end", () => console.log("Download ended.")).pipe(file);
					});
				} else {
					console.log(`.mp4\n${redirectURL}`);
					response1.on("end", () => console.log("Download ended.")).pipe(file);
				}
			});
			file.on("finish", () => {
				resolve();
				file.close();
			});
			request.on("error", error => {
				unlinkSync(path);
				console.error(error.message);
				reject(error.message);
			});
		});
	}
}

export async function beginScrape(background: boolean): Promise<{browser: Browser, page: Page} | undefined> {
	cli.action.start("Opening Puppeteer...");
	try {
		const browser = await launch({
			headless: background,
			devtools: !background,
			defaultViewport: null,
			executablePath: chromeExecutable(),
			userDataDir: chromeUserDataDirectory
		});
		cli.action.stop();
		const page = (await browser.pages())[0];
		await page.setUserAgent(userAgent());
		return {browser, page};
	} catch (error) { console.error(error.message); }
}

export async function detectFile(page: Page, id: string): Promise<string | undefined> {
	try {
		await page.goto(`https://vsco.co/${id}`, {waitUntil: "domcontentloaded"});
		const $ = load(await page.content());
		const videoURL = $(`meta[property="og:video"]`).attr("content");
		if (videoURL !== undefined) return videoURL;
		const imageURL = $(`meta[property="og:image"]`).attr("content");
		if (imageURL !== undefined) return imageURL.split("?")[0];
	} catch (error) { console.error(error.message); }
}