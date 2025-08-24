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

Modern ES6+ modular architecture with build system:

### Build System
```bash
npm run build          # Production build (minified)
npm run build:dev      # Development build (with source maps)
npm run build:watch    # Development build with file watching
npm run clean          # Clean build artifacts
npm run validate       # Validate code structure and imports
npm run lint           # Run ESLint code quality checks
```

### Local Development
1. Install dependencies: `npm install`
2. Make code changes in `src/` directory
3. Build: `npm run build:dev` or `npm run build:watch`
4. Load `dist/` folder in browser extensions page
5. Refresh SGS page to test changes

### Installation
1. Run `npm run build` to create production build
2. Enable "Developer mode" in browser extensions page
3. Click "Load unpacked" and select the `dist/` folder
4. Extension auto-activates on SGS pages

### Testing
- Run `npm run validate` to check code structure
- Manual testing on live SGS system required
- Use `?debug=true` URL parameter to enable debug mode
- Legacy functions available: `fillGradesFromClipboard()`, `clearGradeColumns()`, `showDetectedColumns()`

## Extension Permissions

- `clipboardRead`: Access clipboard for grade data import
- `activeTab`, `tabs`, `scripting`: Page interaction and navigation  
- Host permission: `https://sgs.bopp-obec.info/*` only

## Key Functions

**detectEnabledColumns()** - Scans page DOM to build `ENABLED_COLUMNS` object with column weights and display names

**fillGradesFromClipboard()** - Main workflow: validates dropdowns → detects columns → reads clipboard → parses data → populates fields → triggers ASP.NET events

**executeInPageContext()** - Uses Chrome extension APIs to bypass CSP and execute code in page context for `__doPostBack` calls

**updateField()** - Handles individual grade field updates with validation, ASP.NET event triggering, and error handling