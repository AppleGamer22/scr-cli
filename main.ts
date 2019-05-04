import {Browser, Page, launch} from "puppeteer";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {basename} from "path";
import {Answers, prompt} from "inquirer";
import { url } from "inspector";

var srcs: string[] = [];
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";
var count = 0;
var I = 0;

async function init() { 
	console.log("Please make sure that you enter the correct Instagram creditentials and post ID...");
	const answers: Answers = await prompt([
		{
			type: "input",
			name: "username",
			message: "Your Instagram username:"
		},{
			type: "password",
			name: "password",
			message: "Your Instagram password:"
		},{
			type: "input",
			name: "id",
			message: "Wanted Instagram post ID (https://www.instagram.com/p/:ID):"
		},{
			type: "confirm",
			name: "background",
			message: "Do you want to see the browser?"
		}
	]);
	await beginScrape(answers.username, answers.password, answers.id, !answers.background);
}

async function beginScrape(username: string, password: string, id: string, background: boolean) {
	console.log("Opening Puppeteer...");
	try {
		const browser = await launch({headless: background, devtools: true, defaultViewport: null});
		const page = (await browser.pages())[0];
		await page.setUserAgent(userAgent);
		await page.goto("https://www.instagram.com/accounts/login/");
		await page.waitForSelector('input[name="username"]');
		await page.type('input[name="username"]', username);
		await page.type('input[name="password"]', password);
		await page.click('button[type="submit"]');
		await page.waitFor(2500);
		const isError = await page.$("p#slfErrorAlert");
		if (isError !== null) {
			console.error("Wrong Instagram credentials were entered.");
			await browser.close();
		} else console.log("Signed-in...");
		await page.waitForSelector("img._6q-tv");
		await page.goto(`https://www.instagram.com/p/${id}`);
		await page.waitForSelector('div.ZyFrc', {visible: true});
		await detectFiles(browser, page, id);
	} catch (error) {
		console.error(error.message);
		process.exit();
	}
}
async function detectFiles(browser: Browser, page: Page, id: string) {
	try {
		var nextButtons = await page.$("div.coreSpriteRightChevron");
		do {
			const videosDuplicates = await page.$$eval("video[src].tWeCl", videos => videos.map(video => video.getAttribute('src')));
			const imagesDuplicates = await page.$$eval("img[src].FFVAD", images => images.map(image => image.getAttribute('src')));
			imagesDuplicates.forEach(duplicate => srcs.push(duplicate));
			videosDuplicates.forEach(duplicate => srcs.push(duplicate));
			await page.click("div.coreSpriteRightChevron");
			nextButtons = await page.$("div.coreSpriteRightChevron");
		} while (nextButtons !== null);
		organiseFiles(browser, id);
	} catch (error) {
		console.error(error.message);
		await organiseFiles(browser, id);
	}
}
async function organiseFiles(browser: Browser, id: string) {
	console.log("Found files.");
	try {
		const URLs = Array.from(new Set(srcs));
		count = URLs.length;
		for (let i = 0; i < URLs.length; i++) {
			const url = URLs[i];
			if (url.includes(".jpg") || url.includes(".mp4")) await downloadFile(browser, url);
		}
		return;
	} catch (error) { console.error(error.message) }
}

async function downloadFile(browser: Browser, URL: string) {
	const path = `${process.cwd()}/${basename(URL).split("?")[0]}`
	try {
		console.log(URL);
		console.log("Download began.");
		var file = createWriteStream(path);
		const request = get(URL, response => {
			if (response.statusCode !== 200) throw console.error("Download failed.");
			response.on("end", () => console.log("Download ended.")).pipe(file);
			// const length = parseInt(response.headers['content-length'], 10);
			// var current = 0;
			// response.on("data", chunk => {
			// 	current += chunk.length;
			// 	console.log(`Downloaded %${(100 * current / length).toFixed(2)}`);
			// });
		});
		file.on("finish", () => file.close());
		request.on("error", error => {
			unlink(path, null);
			console.error(error.message);
		});
		I += 1;
		if (I === count) await browser.close();
	} catch (error) { console.error(error.message) }
}
init();
