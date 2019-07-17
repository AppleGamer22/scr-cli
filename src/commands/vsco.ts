import { Command, flags } from "@oclif/command";
import {Browser, Page, launch} from "puppeteer-core";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import cli from "cli-ux";
import {config} from "dotenv";
import {chromeExecutable, chromeUserDataDirectory, environmentVariablesFile, userAgent} from "../shared";

export default class Vsco extends Command {
	static description = "Command for scarping VSCO post files.";
	static args = [{name: "post"}];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		config({path: environmentVariablesFile});
		const {VSCO} = process.env;
		if (!JSON.parse(VSCO!)) {
			console.error("You are not authenticated.");
		} else if (JSON.parse(VSCO!)) {
			const {args, flags} = this.parse(Vsco);
			const post: string  = args.post;
			if (!post.includes("/media/")) return console.error("Please provide a valid post ID.")
			const now = Date.now();
			cli.action.start("Opening Puppeteer...");
			const {browser, page} = (await beginScrape(userAgent, flags.headless))!;
			cli.action.stop();
			cli.action.start("Searching for files...");
			const url = await detectFile(browser, page, post);
			cli.action.stop();
			console.log(`Scrape time: ${(Date.now() - now)/1000}s`);
			cli.action.start("Downloading...");
			await this.downloadFile(`https:${url!.split("?")[0]}`, post.split("/")[2]);
			cli.action.stop();
			await browser.close();
		}
	}

	async downloadFile(redirectURL: string, id: string) {
		const path = `${process.cwd()}/${id}${basename(redirectURL)}`;
		return new Promise((resolve, reject) => {
			var file = createWriteStream(path);
			const request = get(redirectURL, response1 => {
				const realURL = response1.headers.location!;
				console.log(`.jpg\n${realURL}`);
				get(realURL, response2 => {
					response2.headers["last-modified"] = new Date().toUTCString();
					if (response2.statusCode !== 200) throw console.error("Download failed.");
					response2.on("end", () => console.log("Download ended.")).pipe(file);
				});
			});
			file.on("finish", () => {
				resolve();
				file.close()
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
		await page.setUserAgent(userAgent);
		return {browser, page};
	} catch (error) { console.error(error.message); }
}

export async function detectFile(browser: Browser, page: Page, id: string): Promise<string | undefined> {
	try {
		await page.goto(`https://vsco.co/${id}`, {waitUntil: "domcontentloaded"});
		if ((await page.$("#root > div > main > div > p")) !== null) {
			console.error(`Failed to find post ${id}`);
			await browser.close();
		}
		await page.waitForSelector("img", {visible: true});
		const imageURL = await page.$eval("img", async image => {
			const url = image.getAttribute("src");
			if (url !== null && url !== undefined) {
				return url!;
			} else {
				console.error(`Failed to find post ${id}`);
				await browser.close();
			}
		});
		return imageURL;
	} catch (error) { console.error(error.message); }
}