import { Command, flags } from "@oclif/command";
import { Browser } from "puppeteer-core";
import { config } from "dotenv";
import cli from "cli-ux";
import { randomBytes } from "crypto";
import { writeEnviornmentVariables, beginScrape, environmentVariablesFile } from "../shared";

export default class LogOut extends Command {
	static description = "Command for supported social network log-out.";
	static flags = {
		// vsco: flags.boolean({char: "v", description: "Toggle for VSCO log-out"}),
		instagram: flags.boolean({char: "i", description: "Toggle for Instagram log-out."})
	};

	async run() {
		config({path: environmentVariablesFile});
		try {
			cli.action.start("Opening browser");
			const {browser, page} = (await beginScrape(true))!;
			cli.action.stop();
			const {flags} = this.parse(LogOut);
			if (flags.instagram) return await this.instagramLogOut(browser);
			// if (flags.vsco) return await this.vscoLogOut(browser);
		} catch (error) { console.error(error.message); }
	}

	async instagramLogOut(browser: Browser) {
		try {
			if (!JSON.parse(process.env.INSTAGRAM!)) {
				await browser.close();
				return console.log("You are already signed-out.");
			}
			cli.action.start("Signing out from your Instagram account");
			const page = (await browser.pages())[0];
			await page.goto(`https://www.instagram.com/${randomBytes(5).toString("hex")}/`);
			const profileButton = "#link_profile > a";
			await page.waitForSelector(profileButton);
			await page.click(profileButton);
			const settingsButton = "#react-root > section > main > div > header > section > div.nZSzR > div > button";
			await page.waitForSelector(settingsButton, {visible: true});
			await page.click(settingsButton);
			const logOutButton = "body > div.RnEpo.Yx5HN > div > div > div > button:nth-child(9)";
			await page.waitForSelector(logOutButton, {visible: true});
			await page.click(logOutButton);
			await page.waitForNavigation();
			var environmentFileData: string;
			const {VSCO} = process.env;
			if (VSCO !== undefined) {
				environmentFileData = `VSCO=${VSCO}\nINSTAGRAM=${false}`;
				writeEnviornmentVariables(environmentFileData);
				cli.action.stop();
				await browser.close();
			} else if (VSCO === undefined) {
				environmentFileData = `VSCO=${false}\nINSTAGRAM=${false}`;
				writeEnviornmentVariables(environmentFileData);
				cli.action.stop();
				await browser.close();
			}
		} catch (error) { console.error(error.message); }
	}
	async vscoLogOut(browser: Browser) {
		try {
			if (!JSON.parse(process.env.VSCO!)) {
				await browser.close();
				return console.log("You are already signed-out.");
			}
			cli.action.start("Signing out from your VSCO account");
			const page = (await browser.pages())[0];
			page.on("framenavigated", async frame => {
				if (frame.url() === "https://vsco.co/feed") {
					var environmentFileData: string;
					const {INSTAGRAM} = process.env;
					if (INSTAGRAM !== undefined) {
						environmentFileData = `VSCO=${false}\nINSTAGRAM=${INSTAGRAM}`;
						writeEnviornmentVariables(environmentFileData);
						console.log("Log-out successful.");
						await browser.close();
					} else if (INSTAGRAM === undefined) {
						environmentFileData = `VSCO=${false}\nINSTAGRAM=${false}`;
						writeEnviornmentVariables(environmentFileData);
						console.log("Log-out successful.");
						await browser.close();
					}
				}
			});
			await page.goto("https://vsco.co/user/account");
			await page.waitForSelector("#signout > button");
			await page.click("#signout > button");
		} catch (error) { console.error(error.message); }
	}
}