# Grade Entry Helper - Browser Extension

## Project Overview

This is a browser extension called "Grade Entry Helper" designed to automate grade entry into the Student Grading System (SGS) at `https://sgs.bopp-obec.info/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx`. The extension allows users to copy grade data from spreadsheet applications like Google Sheets and paste it directly into the SGS web interface, eliminating manual data entry.

### Core Technologies
- **JavaScript**: Main programming language
- **Browser Extension APIs**: Uses standard browser extension APIs (Manifest V3)
- **HTML/CSS**: Simple popup interface

### Architecture
- **`manifest.json`**: Extension configuration defining permissions, content scripts, and browser action
- **`content-script.js`**: Core functionality that injects into the SGS webpage to handle grade data import, validation, and UI controls
- **`background.js`**: Background script that handles navigation to the SGS page
- **`popup.html`/`popup.js`**: Simple popup UI with button to open the SGS page
- **`example_page.html`**: Sample of the target SGS grade entry page for reference

## Key Features

1. **Clipboard-Based Data Import**: Imports grade data directly from copied spreadsheet cells
2. **Dynamic Column Detection**: Automatically identifies enabled grade columns on the current page
3. **Smart Data Validation**: Validates grade values against maximum point values for each column
4. **Bulk Clear Functionality**: Safely clears all values from enabled columns with confirmation
5. **Floating Control Panel**: Non-intrusive UI with fill, clear, and info buttons
6. **Real-Time Feedback**: Progress notifications during import process

## Building and Running

This is a simple browser extension that doesn't require a complex build process.

### Installation Steps

1. **Prepare Files**: Ensure all extension files are in a single folder
2. **Open Browser Extensions Page**:
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`
   - Firefox: Go to `about:debugging`
3. **Enable Developer Mode**: Toggle the "Developer mode" switch
4. **Load Extension**:
   - Chrome/Edge: Click "Load unpacked" and select the extension folder
   - Firefox: Click "Load Temporary Add-on" and select the `manifest.json` file

### Usage

1. Navigate to the SGS grade entry page: `https://sgs.bopp-obec.info/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx`
2. Copy grade data from Google Sheets or Excel (columns should match enabled grade columns)
3. Click the "Fill from Clipboard" button that appears in the top-right corner
4. Alternatively, press F12 and type `fillGradesFromClipboard()` in the console

## Development Conventions

### Code Structure
- Plain JavaScript with no external dependencies
- Content script handles all DOM interactions with the SGS page
- Modular design with separate functions for different operations
- Comprehensive error handling and user feedback

### Key Functions in content-script.js
- `fillGradesFromClipboard()`: Main function to import grades from clipboard
- `clearGradeColumns()`: Clears all values from enabled grade columns
- `detectEnabledColumns()`: Dynamically detects all enabled grade columns
- `updateField()`: Updates individual grade fields with validation
- `createControlPanel()`: Creates the floating UI control panel

### Data Format
The extension expects tab-delimited data (as copied from Google Sheets) with:
- Each row representing one student
- Columns in the same order as the enabled grade columns on the page
- Values validated against maximum point values for each column

## Extension Permissions

The extension requires minimal permissions for security:
- `clipboardRead`: To read clipboard data for grade import
- `activeTab`: To interact with the current tab
- `tabs`: To manage navigation to the SGS page

## Target System

The extension is designed specifically for the Thai educational Student Grading System (SGS) at `sgs.bopp-obec.info`. The system uses ASP.NET Web Forms with complex IDs and validation mechanisms that the extension handles automatically.

## Troubleshooting

### Common Issues
1. **Button not appearing**: Ensure you're on the correct URL and the page has loaded completely
2. **Clipboard access denied**: Browser may ask for clipboard permission - click "Allow"
3. **Data not importing**: Check that copied data columns match the enabled columns on the page

### Debugging
- Press F12 to open browser developer tools
- Check the Console tab for error messages
- Use `fillGradesFromClipboard()` or `clearGradeColumns()` functions directly in the console