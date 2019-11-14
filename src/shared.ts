import { homedir } from "os";
import { get } from "https";
import { basename } from "path";
import { createWriteStream, writeFile, unlink } from "fs";
import { red, green, blue, yellow, underline } from "chalk";
import cli from "cli-ux";
import { Browser, Page, launch } from "puppeteer-core";
import { interfaces } from "mocha";

const chromeUserDataDirectory = `${homedir()}/.scr/`;
const environmentVariablesFile = `${homedir()}/.scr/env.env`;

export function userAgent(): string {
	switch (process.platform) {
		case "darwin":
			return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";
		case "win32":
			return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36";
		default:
			return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/71.0.3559.6 Chrome/71.0.3559.6 Safari/537.36";
	}
}

export function chromeExecutable(): string {
	switch (process.platform) {
		case "darwin":
			return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
		case "win32":
			return "C:/Program\ Files\ (x86)/Google/Chrome/Application/chrome.exe";
		default:
			return "/opt/google/chrome/google-chrome";
			// or /usr/bin/google-chrome | /usr/lib/google-chrome
	}
}

export function writeEnviornmentVariables(content: string) {
	writeFile(environmentVariablesFile, content, error => {
		if (error) throw new Error(error.message);
		return;
	});
}

export function alert(message: string, type: ("info" | "log" | "success" | "warning" | "danger")) {
	switch (type) {
		case "info":
			return console.info(blue(message));
		case "log":
			return console.log(message)
		case "success":
			return console.info(green(message));
		case "warning":
			return console.warn(yellow(message));
		case "danger":
			return console.error(red(message));
	}
}

export async function beginScrape(background: boolean): Promise<{browser: Browser, page: Page} | undefined> {
	try {
		const browser = await launch({
			headless: background,
			userDataDir: chromeUserDataDirectory,
			executablePath: chromeExecutable(),
			devtools: !background,
			defaultViewport: null
		});
		const page = (await browser.pages())[0];
		await page.setUserAgent(userAgent());
		return {browser, page};
	} catch (error) { alert(error.message, "danger"); }
}

export function downloadInstagramFile(URL: string, userName: string, fileType: ".jpg" | ".mp4", fileNumber: number) {
	const path = `${process.cwd()}/${userName}_${basename(URL).split("?")[0]}`
	return new Promise((resolve, reject) => {
		alert(underline(`File #${fileNumber} (${fileType})`), "log");
		cli.url(underline(URL), URL);
		var file = createWriteStream(path, {autoClose: true});
		const request = get(URL, response => {
			if (response.statusCode !== 200) {
				alert("Download failed.", "danger");
				reject("Download failed.");
			}
			response.on("end", () => cli.action.stop()).pipe(file);
		});
		file.on("finish", () => {
			file.close();
			alert(`File saved at ${path}`, "success");
			resolve();
		});
		request.on("error", error => {
			unlink(path, null!);
			alert(error.message, "danger");
			reject(error.message);
		});
	});
}

export interface ScrapePayload {
	username: string,
	urls: string[]
}