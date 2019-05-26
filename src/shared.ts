export function userDataDirs(): string {
	var userDataDir = "";
	switch (process.platform) {
		case "darwin":
			userDataDir = "~/Library/Application Support/Google/Chrome";
			break;
		case "win32":
			userDataDir =  "%LOCALAPPDATA%\Google\Chrome\User Data";
		case "linux":
			userDataDir =  "~/.config/google-chrome";
			break;
	}
	return userDataDir;
}