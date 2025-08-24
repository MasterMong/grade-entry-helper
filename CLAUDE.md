# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grade Entry Helper is a Chrome/Edge/Firefox browser extension (Manifest V3) that streamlines grade entry for the Student Grading System (SGS) at `sgs.bopp-obec.info`. The extension enables teachers to bulk import grade data from Google Sheets clipboard into the web-based grading interface.

## Architecture

### Core Components

**background.js** - Service worker that handles:
- Extension icon clicks to navigate to SGS page
- Inter-tab communication to execute scripts in page context (bypasses CSP)
- Message passing between content script and page context for `__doPostBack` execution

**content-script.js** - Main functionality injected into SGS pages:
- Dynamic column detection system that adapts to any grading configuration
- Clipboard data parsing (tab-separated values from Google Sheets)
- Grade validation and field population with ASP.NET event handling
- UI control panel with floating interface
- Row count management and page postback handling

**popup.html/popup.js** - Simple extension popup with "Open SGS" button for quick navigation

**manifest.json** - Extension configuration targeting specific SGS URL with minimal permissions

### Key Technical Patterns

**Dynamic Column Detection**: Extension scans DOM for enabled input fields matching pattern `*_ctl##_ColumnName` and extracts weights from onchange attributes or header cells. Supports any number/type of grade columns.

**ASP.NET Postback Handling**: Multiple fallback methods to trigger `__doPostBack` function:
1. Chrome scripting API execution in page context (primary)
2. Direct `window.__doPostBack` if available  
3. PostMessage communication to injected page script
4. Form submission simulation with hidden fields

**Clipboard Integration**: Uses modern Clipboard API (`navigator.clipboard.readText()`) with tab-separated value parsing to match Google Sheets copy format.

**UI State Management**: Floating control panel with minimize/expand states, real-time column detection status, and MutationObserver for page change detection.

## Development Commands

This is a pure browser extension with no build process. Development workflow:

### Local Development
1. Make code changes directly to source files
2. Go to `chrome://extensions/` (or `edge://extensions/`)  
3. Click "Reload" button for the extension
4. Refresh the SGS page to load updated content script

### Installation
1. Enable "Developer mode" in browser extensions page
2. Click "Load unpacked" and select the project folder
3. Extension auto-activates on `https://sgs.bopp-obec.info/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx`

### Testing
- No automated tests - manual testing required on live SGS system
- Test with various grade column configurations (assignments, midterm, final, etc.)
- Verify clipboard data validation with different score ranges
- Test postback functionality across different browsers

## Extension Permissions

- `clipboardRead`: Access clipboard for grade data import
- `activeTab`, `tabs`, `scripting`: Page interaction and navigation  
- Host permission: `https://sgs.bopp-obec.info/*` only

## Key Functions

**detectEnabledColumns()** - Scans page DOM to build `ENABLED_COLUMNS` object with column weights and display names

**fillGradesFromClipboard()** - Main workflow: validates dropdowns → detects columns → reads clipboard → parses data → populates fields → triggers ASP.NET events

**executeInPageContext()** - Uses Chrome extension APIs to bypass CSP and execute code in page context for `__doPostBack` calls

**updateField()** - Handles individual grade field updates with validation, ASP.NET event triggering, and error handling