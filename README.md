# @applegamer22/scr-cli
|Network|Github|NPM|
|-|-|-|
|license|![GitHub license](https://img.shields.io/github/license/AppleGamer22/scr-cli?logo=github)|![NPM license](https://img.shields.io/npm/l/@applegamer22/scr-cli?logo=npm)|
|relase|![GitHub release](https://img.shields.io/github/v/release/AppleGamer22/scr-cli?logo=Github)|![NPM relase](https://img.shields.io/npm/v/@applegamer22/scr-cli?label=release&logo=npm)|
|build status|![publish-image](https://github.com/AppleGamer22/scr-cli/workflows/publish-package/badge.svg)||
|downloads|![GitHub downloads](https://img.shields.io/github/downloads/AppleGamer22/scr-cli/total?&logo=github)|![NPM downloads](https://img.shields.io/npm/dt/@applegamer22/scr-cli?&logo=npm)|
|people|![GitHub contributors](https://img.shields.io/github/contributors/AppleGamer22/scr-cli?logo=github)|![NPM collaborators](https://img.shields.io/npm/collaborators/@applegamer22/scr-cli?label=collaborators&logo=npm)|
|code size|![GitHub code size](https://img.shields.io/github/languages/code-size/AppleGamer22/scr-cli?logo=GitHub)|
|forks|![GitHub forks](https://img.shields.io/github/forks/AppleGamer22/scr-cli?logo=github)|
|stars|![GitHub stars](https://img.shields.io/github/stars/AppleGamer22/scr-cli?logo=github)|
|watchers|![GitHub watchers](https://img.shields.io/github/watchers/AppleGamer22/scr-cli?logo=github)|
## Description
Instagram web scraper for social post file(s) downloads.
## Installation
```bash
$ sudo npm i -g @applegamer22/scr-cli
```
## Contributing
* Separate Git branch to the master branch
  * After reviewing the changes, this branch will be merged to the main branch.
* Separate fork to this repository
## Usage Responsibilities
* You should use this software with responsibility and with accordance to [Instagram's terms of use](https://help.instagram.com/581066165581870):
> * **You can't attempt to create accounts or access or collect information in unauthorized ways.**
> This includes creating accounts or collecting information in an automated way without our express permission.
* You should use this software with responsibility and with accordance to [TikTok's terms of use](https://www.tiktok.com/legal/terms-of-use):
> You may not:
> * use automated scripts to collect information from or otherwise interact with the Services;
* You should use this software with responsibility and with accordance to [VSCO's terms of use](https://vsco.co/about/terms_of_use):
> **C Service Rules**
> You agree not to engage in any of the following prohibited activities:
> * **(I)** copying, distributing, or disclosing any part of the Service in any medium, including without limitation by any automated or non-automated “scraping”,
> * **(II)** using any automated system, including without limitation “robots,” “spiders,” “offline readers,” etc., to access the Service in a manner that sends more request messages to the VSCO servers than a human can reasonably produce in the same period of time by using a conventional on-line web browser (except that VSCO grants the operators of public search engines revocable permission to use spiders to copy materials from vsco.co for the sole purpose of and solely to the extent necessary for creating publicly available searchable indices of the materials but not caches or archives of such materials),
> * **(XI)** accessing any content on the Service through any technology or means other than those provided or authorized by the Service,
> * **(XII)** bypassing the measures we may use to prevent or restrict access to the Service, including without limitation features that prevent or restrict use or copying of any content or enforce limitations on use of the Service or the content therein.
## Prerequisites
* [Google Chrome web browser](https://www.google.com/chrome/)
* A command-line with:
  * [NPM](https://npmjs.com)
  * [Node.js](https://nodejs.org/)
## Before Using The CLI:
### Development
1. Clone this repository by running `$ git clone https://github.com/AppleGamer22/Social-Scraper.git` in your command-line.
2. Run `$ npm install` in the root directory of the downloaded copy.
## Using The CLI:
1. Run `$ scr auth --instagram` before using `instagram`, `highlight` or `story`.
2. Run `$ scr <command> --<flags> post_id` in you command line.
3. Wait until the program says:
> Downloading...Done.
## How Does It Work?
1. The user puts Instagram/VSCO credentials ahead of post scraping.
2. The Chromium bot will remember the credentials entered the login form of the selected social network.
3. The user specifies the social network and the desired post ID.
4. The Chromium bot browser is opened.
5. Puppeteer navigates to the post.
6. Puppeteer loads all available files and their URLs.
7. The CLI downloads the files to the current codebase directory.
8. The bot browser is closed.
9. The command is terminated by the Node.js runtime.
