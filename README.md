# Social-Scraper
Instagram web scarper for post file downloads.
#Running/Development Requirements/Recommendations:
- Unix-style terminal/npm capable terminal
- Node.js
- Node Package Manager (NPM)
- TypeScript
# Before Using The CLI:
1. run `./path/to/cli/source auth instagram`.
2. A Chromium broswer will be opened at [https://www.instagram.com/accounts/login/](https://www.instagram.com/accounts/login/).
3. Sign-in to your Instagram account.
4. Your Instagram creddentials will be securly saved in the CLI's private Chroumium instatance.
5. After a 2uccessful Instagram authentication, Chromium will be closed.
# Using The CLI:
1. Run `$ ./path/to/cli/source instagram post_id` in you command line.
2. Wait until the program says:
>Download ended.
# How Does It Work?
1. The user puts his/her Instagram creditials and the desired post ID.
2. A bot Chromium browser is opened.
3. The credentials are are passed to a Puppeteer web scarper that logs in to Instagram as the user.
4. Puppeteer navigates to the post.
5. Puppeteer loads all available files and their URLs.
6. The program downloads the files to the current codebase directory.
7. The bot browser is closed.
# Please Make Sure That:
- The correct Instagram credentials are entered.