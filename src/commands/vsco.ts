import { Command, flags } from "@oclif/command";
import {Browser, Page, launch} from "puppeteer";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import cli from "cli-ux";
import {config} from "dotenv";

export default class Vsco extends Command {
	startScarpingTime = 0;
	static args = [{name: "post"}];
	static flags = {headless: flags.boolean({char: "h"})};
	static description = "describe the command here";
	readonly userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";

	async run() {
		config({path: `${__dirname}/../../.env`});
		const {VSCO} = process.env;
		if (!JSON.parse(VSCO!)) {
			console.log("Please make sure that you enter the correct Instagram creditentials and post ID...");
			const username: string = await cli.prompt("username", {type: "normal", prompt: "Your VSCO username: "});
			const password: string = await cli.prompt("password", {type: "hide", prompt: "Your VSCO password: "});
			const id: string = await cli.prompt("id", {type: "normal", prompt: "VSCO post ID (after https://vsco.co/): "});
			const background: boolean = await cli.confirm("Do you want to see the browser?");
			// await this.beginScrape(username, password, id, !background);
		} else if (JSON.parse(VSCO!)) {
// tslint:disable-next-line: no-shadowed-variable
			const {args, flags} = this.parse(Vsco);
			await this.beginScrape(args.post, flags.headless);
		}
	}

	async beginScrape(id: string, background: boolean) {
		cli.action.start("Opening Puppeteer...");
		try {
			const browser = await launch({
				headless: background,
				devtools: !background,
				defaultViewport: null
			});
			cli.action.stop();
			this.startScarpingTime = Date.now();
			const page = (await browser.pages())[0];
			await page.setUserAgent(this.userAgent);
			await page.goto(`https://vsco.co/${id}`, {waitUntil: "domcontentloaded"});
			cli.action.start("Searching for files...");
			await this.detectFiles(browser, page, id);
		} catch (error) { console.error(error.message); }
	}

	async detectFiles(browser: Browser, page: Page, id: string) {
		try {
			if ((await page.$("#root > div > main > div > p")) !== null) {
				console.error(`Failed to find post ${id}`);
				return;
			}
			await page.waitForSelector("img", {visible: true});
			const imageURL = await page.$eval("img", image => image.getAttribute("src"));
			cli.action.stop();
			await this.downloadFile(browser, `https:${imageURL!.split("?")[0]}`, id.split("/")[2]);
		} catch (error) {
			console.error(error.message);
		}
	}

	async downloadFile(browser: Browser, URL: string, id: string) {
		const path = `${process.cwd()}/${id}${basename(URL)}`;
		try {
			cli.action.start("Download began.");
			var file = createWriteStream(path, {});
			const request = get(URL, response1 => {
				const realURL = response1.headers.location!;
				console.log(realURL);
				get(realURL, response2 => {
					response2.headers["last-modified"] = new Date().toUTCString();
					if (response2.statusCode !== 200) throw console.error("Download failed.");
					response2.on("end", () => console.log("Download ended.")).pipe(file);
				});
				// response1.on("end", () => console.log("Download ended.")).pipe(file);
			});
			file.on("finish", () => file.close());
			request.on("error", error => {
				unlink(path, null!);
				console.error(error.message);
			});
			cli.action.stop();
			if (this.startScarpingTime !== 0) console.log(`Scrape time: ${(Date.now() - this.startScarpingTime)/1000}s`);
			await browser.close();
		} catch (error) {
			console.error(error.message);
		}
	}
}
