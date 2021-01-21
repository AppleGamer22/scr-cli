import { homedir } from "os";
import { basename } from "path";
import axios from "axios";
import { red, green, blue, yellow, underline } from "chalk";
import cli from "cli-ux";
import { Browser, Page, launch } from "puppeteer-core";
import { writeFileSync, writeFile } from "fs";

export const chromeUserDataDirectory = `${homedir()}/.scr-cli/`;
export const environmentVariablesFile = `${homedir()}/.scr-cli/env.env`;
/**
 * Finds Chrome binary path
 */
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
/**
 * writes contents to the CLI's enviornment file
 * @param content enviornment content
 */
export function writeEnviornmentVariables(content: string) {
	writeFile(environmentVariablesFile, content, error => {
		if (error) throw new Error(error.message);
		return;
	});
}
/**
 * Logs an error message to the console
 * @param message message text
 * @param type message type
 */
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
/**
 * Initiates Chrome for scraping
 * @param background background mode boolean
 * @param incognito private mode boolean
 * @returns Puppeteer browser & page
 */
export async function beginScrape(background: boolean, incognito: boolean = false): Promise<{browser: Browser, page: Page} | undefined> {
	try {
		const args = ["--mute-audio", "--disable-blink-features=AutomationControlled"];
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
		await page.evaluateOnNewDocument(() => delete Object.getPrototypeOf(navigator).webdriver);
		await page.setBypassCSP(true);
		// await page.setRequestInterception(true);
		return { browser, page };
	} catch (error) {
		alert(error.message, "danger");
	}
}
/**
 * Downloads a file from the provided URL
 * @param url file URL
 * @param username file owner
 * @param fileType type of file
 * @param fileNumber file number in the sequence
 */
export async function downloadInstagramFile(url: string, username: string, fileType: ".jpg" | ".mp4", fileNumber: number) {
	try {
		const path = `${process.cwd()}/${username}_${basename(url).split("?")[0]}`;
		const { data, status } = await axios.get(url, {responseType: "arraybuffer"});
		if (status === 200) {
			alert(underline(`File #${fileNumber} (${fileType})`), "log");
			cli.url(underline(url), url);
			writeFileSync(path, data, {encoding: "binary"});
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