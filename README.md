# Social-Scraper
Instagram web scarper for social post file(s) downloads.
## Contributing Requirements
1. Seperate Git branch to the master branch
2. Seperate fork to this repository
## Requirements and/or Recommendations:
- Unix-style terminal and/or npm capable command-line
- Node.js
- Node Package Manager (NPM)
- TypeScript
## Before Using The CLI:
1. Clone this repository by running `$ git clone https://github.com/AppleGamer22/Social-Scraper.git` in your command-line.
2. Run `./path/to/cli/source auth instagram`.
   - This CLI will be published to NPM in the future.
3. A Chromium broswer will be opened at [https://www.instagram.com/accounts/login/](https://www.instagram.com/accounts/login/).
3. Sign-in to your Instagram account.
4. Your Instagram creddentials will be securly saved in the CLI's private Chroumium instatance.
5. After a 2uccessful Instagram authentication, Chromium will be closed.
## Using The CLI:
1. Run `$ ./path/to/cli/source <instagram or vsco> post_id` in you command line.
2. Wait until the program says:
> Download ended.
## Please Make Sure That:
- The correct Instagram credentials are entered when using the auth command.
## How Does It Work?
1. The user puts Instagram/VSCO creditials ahead of post scraping.
2. The bot Chromium will remember the creditials entered the login form of the selected social network.
3. The user specify the social network and the desired post ID.
4. The bot Chromium browser is opened.
5. Puppeteer navigates to the post.
6. Puppeteer loads all available files and their URLs.
7. The CLI downloads the files to the current codebase directory.
8. The bot browser is closed.
9. The command is terminated by the Node.js runtime.
