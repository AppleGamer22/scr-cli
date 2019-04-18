# Instagram-File-Scraper
Instagram web scarper for post file downloads.
#Running/Development Requirements:
- Unix-style terminal/npm capable terminal
- Node.js
- Node Package Manager (NPM)
- TypeScript
# Launching the program:
`$ npm start`
# How Does It Work?
1. The user puts his/her Instagram creditials and the desired post ID.
2. A bot Chromium browser is opened.
3. The credentials are are passed to a Puppeteer web scarper that logs in to Instagram as the user.
4. Puppeteer navigates to the post.
5. Puppeteer loads all available files and their URLs.
6. The program downloads the files to the current codebase directory.
7. The bot browser closes.