# FB Cookie Manager

Chrome Manifest V3 extension for locally importing and managing cookies on `facebook.com`.

## Features

- Paste `name=value; name2=value2` cookie header.
- Apply cookies to the active Facebook tab.
- List cookies for the active domain.
- Delete individual cookies.
- Search cookies.
- Export the current cookie list as JSON.
- Reload the active tab.
- No remote server, analytics, or cookie upload.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository folder.
6. Open `https://www.facebook.com/` and open the extension.

## Security

Cookie values are not uploaded to any server by this extension. Treat exported cookie files as sensitive credentials and keep them private.

## Scope

The extension is intentionally restricted to Facebook domains in `manifest.json`.
