# Grade Entry Helper - Browser Extension Installation Guide

## Files Needed

Create a folder called `grade-entry-helper` and add these files:

### 1. manifest.json
Copy the manifest.json content provided above.

### 2. content-script.js  
Copy the content-script.js content provided above.

### 3. Icon Files (Optional)
Create simple icon files or use placeholder images:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels) 
- `icon128.png` (128x128 pixels)

You can create simple PNG files with any color, or download free icons from sites like [Icons8](https://icons8.com) or [Flaticon](https://flaticon.com).

## Installation Steps

### For Chrome/Edge:

1. **Open Browser Extensions Page**
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load Extension**
   - Click "Load unpacked" button
   - Select your `grade-entry-helper` folder
   - The extension should now appear in your extensions list

### For Firefox:

1. Go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from your folder

## Usage

1. **Navigate** to the grading page: `https://sgs.bopp-obec.info/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx`

2. **Copy data** from Google Sheets:
   - Select the grade columns (Assignment 1, Assignment 2, Midterm)
   - Press Ctrl+C to copy

3. **Fill grades**:
   - Click the green "Fill Grades from Clipboard" button that appears in the top-right corner
   - Or press F12 and type `fillGradesFromClipboard()` in the console

## Features

- ✅ **Automatic activation** on the correct page
- ✅ **Data validation** (checks score ranges)
- ✅ **Smart field detection** (finds enabled input fields)
- ✅ **Progress notifications** (success/error messages)
- ✅ **Header detection** (skips header rows automatically)
- ✅ **ASP.NET compatibility** (triggers proper validation events)

## Data Format Expected

The extension expects data in this order:
1. **Column 1**: Assignment 1 scores (0-10)
2. **Column 2**: Assignment 2 scores (0-20)  
3. **Column 3**: Midterm scores (0-20)

Each row represents one student. The extension will match rows to students in the same order they appear on the page.

## Troubleshooting

### Extension not loading
- Check that all files are in the same folder
- Ensure manifest.json has no syntax errors
- Try reloading the extension in the browser

### Button not appearing
- Make sure you're on the correct URL
- Check browser console (F12) for any error messages
- Verify the page has loaded completely

### Clipboard access denied
- The page must be served over HTTPS (which it is)
- Browser may ask for clipboard permission - click "Allow"

## Updating the Extension

To modify the extension:
1. Edit the files in your extension folder
2. Go to your browser's extensions page
3. Click the "Reload" button for your extension
4. Refresh the grading page

## Security Notes

- Extension only works on the specified URL for security
- Only requires clipboard read permission
- No data is sent to external servers
- All processing happens locally in your browser