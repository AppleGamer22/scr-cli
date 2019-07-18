import {homedir} from "os";
import {writeFile} from "fs";

export const chromeUserDataDirectory = `${homedir()}/.social-scraper/`;
export const environmentVariablesFile = `${homedir()}/.social-scraper/env.env`;
export const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";
export function chromeExecutable(): string {
	switch (process.platform) {
		case "darwin":
			return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
		case "win32":
			return "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
		default:
			return "";
	}
}
export function writeEnviornmentVariables(content: string) {
	writeFile(environmentVariablesFile, content, error => {
		if (error) throw new Error(error.message);
		return;
	});
}