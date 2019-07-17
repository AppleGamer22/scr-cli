# Social-Scraper
Instagram web scarper for social post file(s) downloads.
## Contributing Requirements
1. Separate Git branch to the master branch
2. Separate fork to this repository
## Requirements and/or Recommendations:
- Google Chrome browser
- Unix-style terminal and/or npm capable command-line
- Node.js
- Node Package Manager (NPM)
- TypeScript
## Before Using The CLI:
### General Usage
Install via NPM by running:
- `$ sudo npm i @applegamer22/social-scraper -g` (macOS/Linux)
- `> npm i @applegamer22/social-scraper -g` (Windows)
### Development
1. Clone this repository by running `$ git clone https://github.com/AppleGamer22/Social-Scraper.git` in your command-line.
2. Run `$ npm install` in the root directory of the downloaded copy.
3. Run `./path/to/cli/source auth instagram`.
   - This CLI will be published to NPM in the future.
4. A Chromium broswer will be opened at [https://www.instagram.com/accounts/login/](https://www.instagram.com/accounts/login/).
5. Sign-in to your Instagram account.
6. Your Instagram credentials will be securely saved in the CLI's private Chromium instance.
7. After a successful Instagram authentication, Chromium will be closed.
## Using The CLI:
1. Run `$ ./path/to/cli/source <instagram or vsco> post_id` in you command line.
	- A global local install is possible by running `$ npm install . -g` from the root directory of your downloaded copy.
2. Wait until the program says:
> Download ended.
## Please Make Sure That:
- The correct Instagram credentials are entered when using the auth command.
## How Does It Work?
1. The user puts Instagram/VSCO credentials ahead of post scraping.
2. The bot Chromium will remember the credentials entered the login form of the selected social network.
3. The user specify the social network and the desired post ID.
4. The bot Chromium browser is opened.
5. Puppeteer navigates to the post.
6. Puppeteer loads all available files and their URLs.
7. The CLI downloads the files to the current codebase directory.
8. The bot browser is closed.
9. The command is terminated by the Node.js runtime.
## Known Issues
- Installing the package globally from NPM is currently not possible because of the permission necessary to install Puppeteer globally.
