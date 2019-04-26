import {Browser, Page, launch} from "puppeteer";
import {get} from "https";
import {createWriteStream, unlink} from "fs";
import {Answers, prompt} from "inquirer";

var srcs: string[] = [];
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";
var count = 0;
var I = 0;

async function init() {
	const answers: Answers = await prompt([{type: "input", name: "username"}, {type: "password", name: "password"}, {type: "input", name: "id"}]);
	beginScrape(answers.username, answers.password, answers.id);
}

async function beginScrape(username: string, password: string, id: string) {
	try {
		const browser = await launch({headless: false, devtools: true, defaultViewport: null});
		const page = (await browser.pages())[0];
		await page.setUserAgent(userAgent);
		await page.goto('https://www.instagram.com/accounts/login/');
		await page.waitForSelector('input[name="username"]');
		await page.type('input[name="username"]', username);
		await page.type('input[name="password"]', password);
		await page.click('button[type="submit"]');
		await page.waitFor(2500);
		const isError = await page.$("p#slfErrorAlert");
		if (isError !== null) {
			console.error("Wrong Instagram creditials were entered.");
			await browser.close();
		}
		await page.waitForSelector("img._6q-tv");
		await page.goto(`https://www.instagram.com/p/${id}`);
		await page.waitForSelector('div.ZyFrc', {visible: true});
		detectFiles(browser, page, id);
	} catch (error) { console.error(error.message) }
}
async function detectFiles(browser: Browser, page: Page, id: string) {
	try {
		var nextButtons = await page.$("div.coreSpriteRightChevron");
		do {
			const videosDuplicates = await page.$$eval('video[src].tWeCl', videos => videos.map(video => video.getAttribute('src')));
			const imagesDuplicates = await page.$$eval('img[src].FFVAD', images => images.map(image => image.getAttribute('src')));
			imagesDuplicates.forEach(duplicate => srcs.push(duplicate));
			videosDuplicates.forEach(duplicate => srcs.push(duplicate));
			await page.click("div.coreSpriteRightChevron");
			nextButtons = await page.$("div.coreSpriteRightChevron");
		} while (nextButtons !== null);
		organiseFiles(browser, id);
		return;
	} catch (error) {
		console.error(error.message);
		organiseFiles(browser, id);
		return;
	}
}
function organiseFiles(browser: Browser, id: string) {
	console.log("Found files.");
	const URLs = Array.from(new Set(srcs));
	count = URLs.length;
	for (let i = 0; i < URLs.length; i++) {
		const url = URLs[i];
		console.log(url);
		if (url.includes(".mp4")) downloadFile(browser, url, id, `${process.cwd()}/${I}-${id}.mp4`);
		if (url.includes(".jpg")) downloadFile(browser, url, id, `${process.cwd()}/${I}-${id}.jpg`);
	}
	return;
}

async function downloadFile(browser: Browser, URL: string, id: string, path: string) {
	try {
		var file = createWriteStream(path);
		const request = get(URL, (response) => {
			if (response.statusCode !== 200) return console.error("Download failed.");
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
		return;
	} catch (error) { console.error(error.message) }
}
init();