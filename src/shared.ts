import {homedir} from "os";
import {writeFile} from "fs";
import chalk from "chalk";

export const chromeUserDataDirectory = `${homedir()}/.scr/`;
export const environmentVariablesFile = `${homedir()}/.scr/env.env`;

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
			return console.info(chalk.blue(message));
		case "log":
			return console.log(message)
		case "success":
			return console.info(chalk.green(message));
		case "warning":
			return console.warn(chalk.yellow(message));
		case "danger":
			return console.error(chalk.red(message));
	}
}