import {Command, flags} from "@oclif/command";
import {Page} from "puppeteer-core";
import {get} from "https";
import {createWriteStream, unlinkSync} from "fs";
import {basename} from "path";
import cli from "cli-ux";
import {config} from "dotenv";
import {environmentVariablesFile, alert, beginScrape} from "../shared";
import chalk from "chalk";

export default class Vsco extends Command {
	static description = "Command for scraping VSCO post file.";
	static args = [{name: "post", required: true}];
	static flags = {headless: flags.boolean({char: "h", description: "Toggle for background scraping."})};

	async run() {
		config({path: environmentVariablesFile});
		const {VSCO} = process.env;
		if (VSCO! !== "true") {
			alert("You are not authenticated.", "danger");
		} else if (JSON.parse(VSCO!)) {
			try {
				const {args, flags} = this.parse(Vsco);
				const post: string  = args.post;
				if (post !== undefined && post !== null) {
					if (!post.includes("/media/")) return alert("Please provide a valid post ID.", "danger");
					const now = Date.now();
					cli.action.start("Opening Puppeteer...");
					const {browser, page} = (await beginScrape(flags.headless))!;
					cli.action.stop();
					cli.action.start("Searching for files...");
					const url = await detectFile(page, post);
					const userName = await page.evaluate(() => document.querySelector("a.DetailViewUserInfo-username")!.innerHTML);
					cli.action.stop();
					alert(`Scrape time: ${(Date.now() - now)/1000}s`, "info");
					cli.action.start("Downloading...");
					await this.downloadFile(url!, userName, post.split("/")[2]);
					cli.action.stop();
					await browser.close();
				} else return alert("Please provide a POST argument!", "danger");
			} catch (error) { alert(error.message, "danger"); }
		}
	}

	async downloadFile(redirectURL: string, userName: string, id: string) {
		const path = `${process.cwd()}/${userName}_${id}${basename(redirectURL)}`;
		return new Promise((resolve, reject) => {
			var file = createWriteStream(path, {autoClose: true});
			const request = get(redirectURL, response1 => {
				if (redirectURL.includes(".jpg")) {
					const realURL = response1.headers.location!;
					alert(chalk.underline(`.jpg`), "log");
					cli.url(chalk.underline(realURL), realURL);
					get(realURL, response2 => {
						if (response2.statusCode !== 200) throw alert("Download failed.", "danger");
						response2.on("end", () => cli.action.stop()).pipe(file);
					});
				} else if (redirectURL.includes(".mp4")) {
					alert(chalk.underline(`.mp4\n${redirectURL}`), "log");
					response1.on("end", () => cli.action.stop()).pipe(file);
				} else reject("Invalid download URL.");
			});
			file.on("finish", () => {
				file.close();
				alert(`File saved at ${path}`, "success");
				resolve();
			});
			request.on("error", error => {
				unlinkSync(path);
				alert(error.message, "danger");
				reject(error.message);
			});
		});
	}
}

export async function detectFile(page: Page, id: string): Promise<string | undefined> {
	try {
		await page.goto(`https://vsco.co/${id}`, {waitUntil: "domcontentloaded"});
		const url = await page.evaluate(() => {
			const video = document.querySelector(`meta[property="og:video"]`);
			const image = document.querySelector(`meta[property="og:image"]`);
			if (video) {
				const videoURL = video.getAttribute("content");
				if (videoURL) return videoURL;
			} else if (image) {
				const imageURL = image.getAttribute("content");
				if (imageURL) return imageURL.split("?")[0];
			}
		});
		if (url) return url;
	} catch (error) { alert(error.message, "danger"); }
}