import * as puppeteer from "puppeteer";
import * as https from "https";
import * as fs from "fs";
import * as uuidv4 from "uuid/v4";
import {Answers, prompt} from "inquirer";

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
		const browser = await puppeteer.launch({headless: true});
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
		var srcs: string[] = [];
		async function downloadFile(URL: string) {
			try {
				const page2 = await browser.newPage();
				await page2.setUserAgent(userAgent);
				await page2.goto(URL, { waitUntil: "networkidle0" });
				// fs.mkdir(`${__dirname}/${id}`, {}, (error) => {if (error) throw error});
				var file: fs.WriteStream;
				if (URL.includes(".mp4")) file = fs.createWriteStream(`${__dirname}/${i}-${id}.mp4`);
				if (URL.includes(".jpg")) file = fs.createWriteStream(`${__dirname}/${i}-${id}.jpg`);
				https.get(URL, (res) => res.pipe(file));
				console.log(URL);
				i += 1;
				console.log(i);
				if (i === count) await browser.close();
				return;
			} catch (error) { console.error(error.message) }
		}

		async function clickNext() {
			try {
				const videosDuplicates = await page.$$eval('video[src].tWeCl', videos => videos.map(video => video.getAttribute('src')));
				const imagesDuplicates = await page.$$eval('img[src].FFVAD', images => images.map(image => image.getAttribute('src')));
				imagesDuplicates.forEach(duplicate => srcs.push(duplicate));
				videosDuplicates.forEach(duplicate => srcs.push(duplicate));
				await page.click("div.coreSpriteRightChevron");
				clickNext();
			} catch (error) {
				const URLs = [...new Set(srcs)];
				count = URLs.length;
				for (let i = 0; i < URLs.length; i++) {
					const url = URLs[i];
					downloadFile(url);
				}
				return;
			}
		}

		clickNext();
	} catch (error) { console.error(error.message) }
}
auth();