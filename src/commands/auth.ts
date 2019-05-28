import {launch} from "puppeteer";
import { Command, flags } from "@oclif/command";
import {writeFile} from "fs";
import {config} from "dotenv";
import cli from "cli-ux";

export default class Auth extends Command {
	static description = "describe the command here";
	static flags = {
		help: flags.help({char: "h"}),
		headless: flags.boolean({char: "h"}),
		vsco: flags.boolean({char: "v", description: "Provide VSCO credentials."}),
		instagram: flags.boolean({char: "i", description: "Provide Instagram credentials."})
	};

	async run() {
		config({path: `${__dirname}/../../.env`});
// tslint:disable-next-line: no-shadowed-variable
		const {flags} = this.parse(Auth);
		if (flags.instagram) return await this.instagram();
		if (flags.vsco) return await this.vsco();
	}

	async instagram() {
		console.log("Sign-in to you Instagram account.")
		try {
			const browser = await launch({
				headless: false,
				userDataDir: `${__dirname}/../../Chrome`
			});
			const page = (await browser.pages())[0];
			await page.goto("https://www.instagram.com/accounts/login/");
			page.on("framenavigated", async frame => {
				if (frame.url() === "https://www.facebook.com/instagram/login_sync/") {
					var environmentFileData: string;
					const INSTAGRAM = process.env.INSTAGRAM;
					const VSCO = process.env.VSCO;
					if (VSCO !== undefined) {
						environmentFileData = `INSTAGRAM=${true}
INSTAGRAM_PASSWORD=${VSCO}`;
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
	async vsco() {
		var environmentFileData: string;
		const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME;
		const INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD;
		if (INSTAGRAM_USERNAME !== undefined && INSTAGRAM_PASSWORD !== undefined) {
			environmentFileData = `INSTAGRAM_USERNAME="${process.env.INSTAGRAM_USERNAME}"
INSTAGRAM_PASSWORD="${process.env.INSTAGRAM_PASSWORD}"
VSCO_USERNAME="${await cli.prompt("username", {type: "normal", prompt: "Your VSCO username: "})}"
VSCO_PASSWORD="${await cli.prompt("password", {type: "hide", prompt: "Your VSCO password: "})}"`;
			writeFile(`${__dirname}/../../.env`, environmentFileData, error => {
				if (error) return console.error(error.message);
			});
		} else if (INSTAGRAM_USERNAME === undefined && INSTAGRAM_PASSWORD === undefined) {
			environmentFileData = `VSCO_USERNAME="${await cli.prompt("username", {type: "normal", prompt: "Your VSCO username: "})}"
VSCO_PASSWORD="${await cli.prompt("password", {type: "hide", prompt: "Your VSCO password: "})}"`;
			writeFile(`${__dirname}/../../.env`, environmentFileData, error => {
				if (error) return console.error(error.message);
			});
		}
	}
	writeEnviornmentVariables(env: string) {
		writeFile(`${__dirname}/../../.env`, env, error => {
			if (error) return console.error(error.message);
		});
	}
}