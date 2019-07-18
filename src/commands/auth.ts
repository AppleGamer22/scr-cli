import {launch} from "puppeteer-core";
import { Command, flags } from "@oclif/command";
import {writeFile} from "fs";
import {config} from "dotenv";
import {chromeExecutable, chromeUserDataDirectory, environmentVariablesFile} from "../shared";

export default class Auth extends Command {
	static description = "Command for supported social network(s) authentication.";
	static flags = {
		help: flags.help({char: "h"}),
		headless: flags.boolean({char: "h"}),
		vsco: flags.boolean({char: "v", description: "Toggle for providing VSCO credentials."}),
		instagram: flags.boolean({char: "i", description: "Toggle for providing Instagram credentials."})
	};

	async run() {
		config({path: environmentVariablesFile});
		const {flags} = this.parse(Auth);
		if (flags.instagram) return await this.instagramSignIn();
		if (flags.vsco) return await this.vscoSignIn();
	}

	async instagramSignIn() {
		// if (JSON.parse(process.env.INSTAGRAM!)) return console.log("You are already signed-in.");
		// console.log("Sign-in to you Instagram account.");
		try {
			const browser = await launch({
				headless: false,
				executablePath: chromeExecutable(),
				userDataDir: chromeUserDataDirectory,//`${__dirname}/../../Chrome`,
				defaultViewport: null
			});
			const page = (await browser.pages())[0];
			await page.goto("https://www.instagram.com/accounts/login/");
			page.on("framenavigated", async frame => {
				if (frame.url() === "https://www.facebook.com/instagram/login_sync/") {
					var environmentFileData: string;
					const {VSCO} = process.env;
					if (VSCO !== undefined) {
						environmentFileData = `INSTAGRAM=${true}
VSCO=${VSCO}`;
						this.writeEnviornmentVariables(environmentFileData);
						await browser.close();
					} else if (VSCO === undefined) {
						environmentFileData = `INSTAGRAM=${true}`;
						this.writeEnviornmentVariables(environmentFileData);
						await browser.close();
					}
				}
			});
		} catch (error) { console.error(error.message); }
	}
	async vscoSignIn() {
		// if (JSON.parse(process.env.VSCO!)) return console.log("You are already signed-in.");
		// console.log("Sign-in to you VSCO account.");
		try {
			const browser = await launch({
				headless: false,
				executablePath: chromeExecutable(),
				userDataDir: chromeUserDataDirectory,//`${__dirname}/../../Chrome`,
				defaultViewport: null
			});
			const page = (await browser.pages())[0];
			await page.goto("https://vsco.co/user/login");
			page.on("framenavigated", async frame => {
				if (frame.url() === "https://vsco.co/") {
					var environmentFileData: string;
					const {INSTAGRAM} = process.env;
					if (INSTAGRAM !== undefined) {
						environmentFileData = `VSCO=${true}
INSTAGRAM=${INSTAGRAM}`;
						this.writeEnviornmentVariables(environmentFileData);
						await browser.close();
					} else if (INSTAGRAM === undefined) {
						environmentFileData = `VSCO=${true}`;
						this.writeEnviornmentVariables(environmentFileData);
						await browser.close();
					}
				}
			});
		} catch (error) { console.error(error.message); }
	}
	writeEnviornmentVariables(env: string) {
		writeFile(environmentVariablesFile, env, error => {
			if (error) return console.error(error.message);
			return console.log("Sign-in sucessful.");
		});
	}
}