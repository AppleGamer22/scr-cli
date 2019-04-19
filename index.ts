import {Browser, Page, launch} from "puppeteer";
import {get} from "https";
import {createWriteStream, WriteStream} from "fs";
import {Answers, prompt} from "inquirer";

var srcs: string[] = [];
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36";
var count = 0;
var i = 0;

async function auth() {
	const answers: Answers = await prompt([{type: "input", name: "username"}, {type: "password", name: "password"}, {type: "input", name: "id"}]);
	// console.log(answers);
	scrape(answers.username, answers.password, answers.id);
}

async function scrape(username: string, password: string, id: string) {
	try {
		const browser = await launch({headless: true});
		const page = await browser.newPage();
		await page.setUserAgent(userAgent);
		await page.goto('https://www.instagram.com/accounts/login/');
		await page.waitForSelector('input[name="username"]');
		await page.type('input[name="username"]', username);
		await page.type('input[name="password"]', password);
		await page.click('button[type="submit"]');
		await page.waitForSelector("img._6q-tv");
		await page.goto(`https://www.instagram.com/p/${id}`);
		await page.waitForSelector('div.ZyFrc');
		//video.tWeCl
		clickNext(browser, page, id);
	} catch (error) { console.error(error.message) }
}
async function clickNext(browser: Browser, page: Page, id: string) {
	try {
		const videosDuplicates = await page.$$eval('video[src].tWeCl', videos => videos.map(video => video.getAttribute('src')));
		const imagesDuplicates = await page.$$eval('img[src].FFVAD', images => images.map(image => image.getAttribute('src')));
		imagesDuplicates.forEach(duplicate => srcs.push(duplicate));
		videosDuplicates.forEach(duplicate => srcs.push(duplicate));
		await page.click("div.coreSpriteRightChevron");
		clickNext(browser, page, id);
	} catch (error) {
		const URLs = Array.from(new Set(srcs));//[...new Set<string>(srcs)];
		count = URLs.length;
		for (let i = 0; i < URLs.length; i++) {
			const url = URLs[i];
			downloadFile(browser, url, id);
		}
		return;
	}
}
async function downloadFile(browser: Browser, URL: string, id: string) {
	try {
		const page2 = await browser.newPage();
		await page2.setUserAgent(userAgent);
		await page2.goto(URL, { waitUntil: "networkidle0" });
		// fs.mkdir(`${__dirname}/${id}`, {}, (error) => {if (error) throw error});
		var file: WriteStream;
		if (URL.includes(".mp4")) file = createWriteStream(`${process.cwd()}/${i}-${id}.mp4`);
		if (URL.includes(".jpg")) file = createWriteStream(`${process.cwd()}/${i}-${id}.jpg`);
		get(URL, (res) => res.pipe(file));
		console.log(URL);
		i += 1;
		console.log(i);
		if (i === count) await browser.close();
		return;
	} catch (error) { console.error(error.message) }
}
auth();