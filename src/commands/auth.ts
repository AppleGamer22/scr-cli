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
		if (JSON.parse(process.env.INSTAGRAM!)) return console.log("You are already signed-in.");
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
					const {VSCO} = process.env;
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
		if (JSON.parse(process.env.VSCO!)) return console.log("You are already signed-in.");
		console.log("Sign-in to you VSCO account.")
		try {
			const browser = await launch({headless: false, userDataDir: `${__dirname}/../../Chrome`, defaultViewport: null});
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
		writeFile(`${__dirname}/../../.env`, env, error => {
			if (error) return console.error(error.message);
			return console.log("Sign-in sucessful.");
		});
	}
}