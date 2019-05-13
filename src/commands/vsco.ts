import { Command, flags } from "@oclif/command";
import {Browser, Page, launch} from "puppeteer";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import {Answers, prompt} from "inquirer";
import {config} from "dotenv";

export default class Vsco extends Command {
	static description = "describe the command here";
	readonly userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";

	async run() {
		config({path: `${__dirname}/../../.env`});
		const {VSCO_USERNAME, VSCO_PASSWORD} = process.env;
		if (VSCO_USERNAME === undefined || VSCO_PASSWORD === undefined) {
			console.log("Please make sure that you enter the correct Instagram creditentials and post ID...");
			const answers: Answers = await prompt([
				{
					type: "input",
					name: "username",
					message: "Your VSCO username:"
				},{
					type: "password",
					name: "password",
					message: "Your VSCO password:"
				},{
					type: "input",
					name: "id",
					message: "Wanted VSCO post ID (after https://vsco.co/):"
				},{
					type: "confirm",
					name: "background",
					message: "Do you want to see the browser?"
				}
			]);
			await this.beginScrape(answers.username, answers.password, answers.id, !answers.background);
		} else if (VSCO_USERNAME !== undefined && VSCO_PASSWORD !== undefined) {
			const answers: Answers = await prompt([
				{
					type: "input",
					name: "id",
					message: "Wanted VSCO post ID (after https://vsco.co/):"
				},{
					type: "confirm",
					name: "background",
					message: "Do you want to see the browser?"
				}
			]);
			await this.beginScrape(VSCO_USERNAME, VSCO_PASSWORD, answers.id, !answers.background);
		}
	}

	async beginScrape(username: string, password: string, id: string, background: boolean) {
		console.log("Opening Puppeteer...");
		try {
			const browser = await launch({headless: background, defaultViewport: null});
			const page = (await browser.pages())[0];
			await page.setUserAgent(this.userAgent);
			await page.goto("https://vsco.co/user/login");
			await page.waitForSelector("input#login");
			await page.type("input#login", username);
			await page.type("input#password", password);
			await page.click("button#loginButton");
			await page.waitForSelector("#root > div > main > header > nav > div.Nav-loggedInOptions");
			await this.detectFiles(browser, page, id);
			// await page.waitFor(2500);
			// const isError = await page.$("#errorBar");
			// if (isError !== null) {
			// 	console.error("Wrong VSCO credentials were entered.");
			// 	await browser.close();
			// } else if (isError === null) {
			// 	console.log("Signed-in...");
			// 	await page.waitForSelector("#root > div > main > header > nav > div.Nav-loggedInOptions");
			// 	await this.detectFiles(browser, page, id);
			// }
		} catch (error) {
			console.error(error.message);
		}
	}

	async detectFiles(browser: Browser, page: Page, id: string) {
		try {
			await page.goto(`https://vsco.co/${id}`);
			if ((await page.$("#root > div > main > div > p")) !== null) {
				console.error(`Failed to find post ${id}`);
				return;
			}
			await page.waitForSelector("img", {visible: true});
			const imageURL = await page.$eval("img", image => image.getAttribute("src"));
			await this.downloadFile(browser, `https:${imageURL!.split("?")[0]}`, id.split("/")[2]);
		} catch (error) {
			console.error(error.message);
		}
	}

	async downloadFile(browser: Browser, URL: string, id: string) {
		const path = `${process.cwd()}/${id}${basename(URL)}`;
		try {
			console.log("Download began.");
			var file = createWriteStream(path);
			const request = get(URL, response1 => {
				const realURL = response1.headers.location!;
				console.log(realURL);
				get(realURL, response2 => {
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
			await browser.close();
		} catch (error) {
			console.error(error.message);
		}
	}
}
