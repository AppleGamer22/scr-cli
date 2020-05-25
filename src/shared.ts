import { homedir } from "os";
import { promisify } from "util";
import { basename } from "path";
import { get } from "superagent";
import { red, green, blue, yellow, underline } from "chalk";
import cli from "cli-ux";
import { Browser, Page, launch } from "puppeteer-core";
import { writeFileSync, writeFile } from "fs";

export const chromeUserDataDirectory = `${homedir()}/.scr-cli/`;
export const environmentVariablesFile = `${homedir()}/.scr-cli/env.env`;

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

export async function beginScrape(background: boolean, incognito: boolean = false): Promise<{browser: Browser, page: Page} | undefined> {
	try {
		const args = ["--mute-audio"];
		if (incognito) args.push("--incognito");
		const browser = await launch({
			headless: background,
			userDataDir: chromeUserDataDirectory,
			executablePath: chromeExecutable(),
			devtools: !background,
			defaultViewport: null,
			ignoreDefaultArgs: ["--enable-automation"],
			args
		});
		const page = (await browser.pages())[0];
		await page.evaluateOnNewDocument(() => {
			// @ts-ignore
			delete navigator.__proto__.webdriver;
		});
		return {browser, page};
	} catch (error) { alert(error.message, "danger"); }
}

export async function downloadInstagramFile(url: string, username: string, fileType: ".jpg" | ".mp4", fileNumber: number) {
	try {
		const path = `${process.cwd()}/${username}_${basename(url).split("?")[0]}`;
		const { body, status } = await get(url).responseType("blob");
		if (status === 200) {
			alert(underline(`File #${fileNumber} (${fileType})`), "log");
			cli.url(underline(url), url);
			writeFileSync(path, body, {encoding: "binary"});
			alert(`File saved at ${path}`, "success");
		}
	} catch (error) {
		alert(error.message, "danger");
	}
}

export interface ScrapePayload {
	username: string,
	urls: string[]
}