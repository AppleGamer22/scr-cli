import { Command, flags } from "@oclif/command";
import { config } from "dotenv";
import cli from "cli-ux";
import {Browser, Page, launch} from "puppeteer-core";

export default class Facebook extends Command {
	static description = "Command for scarping Facebook post files.";
	startScarpingTime = 0;
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};
	static args = [{name: "post"}];
	readonly userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";

	async run() {
		// const { args, flags } = this.parse(Facebook);
		config({path: `${__dirname}/../../.env`});
		await this.beginScrape("", false)
	}

	async beginScrape(id: string, background: boolean) {
		cli.action.start("Opening Puppeteer...");
		try {
// tslint:disable-next-line: no-shadowed-variable
			const {args, flags} = this.parse(Facebook);
			const browser = await launch({
				headless: false,
				defaultViewport: null,
				userDataDir: `${__dirname}/../../Chrome`,
				// executablePath: "/Applications/Google Chrome.app/"
			});
			cli.action.stop();
			this.startScarpingTime = Date.now();
			const page = (await browser.pages())[0];
			await page.setUserAgent(this.userAgent);
			await page.goto(`https://www.facebook.com/${args.post}`, {waitUntil: "domcontentloaded"});
			cli.action.start("Searching for files...");
			await page.waitForSelector("video");
			await page.click("video");
			page.on("response", async res => {
				if (res.request().resourceType() === "xhr" && res.request().url().includes(".xx.fbcdn.net")) {
					cli.action.stop();
					console.log(res.request().url());
					await browser.close();
				}
			});
			// await this.detectFiles(browser, page, id);
		} catch (error) { console.error(error.message); }
	}
}
