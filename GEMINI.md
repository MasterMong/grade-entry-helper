# Project: Grade Entry Helper

## Project Overview

This project is a browser extension named "Grade Entry Helper". Its primary purpose is to streamline the process of entering grades into a specific student grading system (SGS) website: `https://sgs.bopp-obec.info/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx`.

The extension allows users to copy grade data from a spreadsheet (like Google Sheets) and paste it directly into the grading form on the website, automating what would otherwise be a manual and error-prone data entry task.

**Core Technologies:**

*   **JavaScript:** The extension is built using JavaScript.
*   **Browser Extension APIs:** It utilizes standard browser extension APIs, as defined in `manifest.json`.

**Architecture:**

*   **`manifest.json`**: This is the main configuration file for the extension. It defines the extension's name, version, permissions, and content scripts.
*   **`content-script.js`**: This script is injected into the target webpage. It is responsible for the core logic of the extension, including creating the UI elements (like the "Fill Grades from Clipboard" button) and handling the data pasting and validation.
*   **`background.js`**: While this file exists, its purpose is not fully defined in the provided context. It might be used for background tasks or managing the extension's state.

## Building and Running

This is a simple browser extension and does not require a complex build process.

**To run the extension:**

1.  **Open your browser's extension management page:**
    *   Chrome: `chrome://extensions/`
    *   Firefox: `about:debugging`
    *   Edge: `edge://extensions/`
2.  **Enable "Developer mode"**.
3.  **Click on "Load unpacked"** (or the equivalent in your browser).
4.  **Select the directory** containing the extension's files (`/home/mong/Github/grade-entry-helper`).

The extension will be installed and active. It will automatically run on the target webpage.

**There are no explicit build or test commands** found in the project files.

## Development Conventions

*   The code is written in plain JavaScript.
*   The extension is designed to be lightweight and has minimal dependencies.
*   The `installation_guide.md` and `plugin_proposal.md` files provide detailed documentation on the extension's functionality, usage, and technical specifications.
*   The code interacts with the DOM of the target page to read the structure of the grading table and to insert the grade data.
