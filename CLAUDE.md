# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SGS Bot is a Chrome/Edge/Firefox browser extension (Manifest V3) that streamlines grade entry for the Student Grading System (SGS) at `sgs.bopp-obec.info`. The extension enables teachers to bulk import grade data from Google Sheets clipboard into the web-based grading interface.

The extension supports all 3 grade entry pages:
- `Edit-TblTranscripts-Table.aspx` — ตลอดภาค (full term)
- `Edit-TblTranscripts1-Table.aspx` — ก่อนกลาง (pre-midterm, may be time-restricted/forbidden)
- `Edit-TblTranscripts2-Table.aspx` — หลังกลาง (post-midterm)

## Architecture

### Core Components

**background.js** - Service worker that handles:
- Extension icon clicks to navigate to SGS page
- `EXECUTE_POSTBACK` messages from content script: runs `__doPostBack` via `chrome.scripting.executeScript({ world: 'MAIN' })` to bypass the SGS site's Content Security Policy (CSP blocks inline scripts)

**src/core/ExtensionCore.js** - Main coordinator:
- Detects page type, loads shared services, loads page controller
- Handles forbidden pages (time-restricted grade entry periods) with Thai notification

**src/core/SGSPageDetector.js** - Page detection:
- Matches all 3 grade entry URLs via regex `/Edit-TblTranscripts\d*-Table\.aspx/`
- `isForbiddenPage()` detects access-denied redirects and returns `'forbidden'` from `waitForPageReady()`

**src/core/BasePageController.js** - Base class for all page controllers

**src/pages/gradeEntry/GradeEntryController.js** - Main grade entry logic:
- Two fill modes: `'row'` (position-based) and `'id'` (student number match), persisted in `localStorage`
- Auto page-size: if clipboard rows > visible students, triggers postback to show more rows, resumes via `sessionStorage`
- Auto column-enable: if columns unchecked, checks them all and triggers one postback, resumes via `sessionStorage`
- Progress callback passed to `FieldUpdater.updateGrades()`

**src/pages/gradeEntry/ColumnDetector.js** - Detects enabled grade columns from DOM inputs

**src/pages/gradeEntry/ClipboardHandler.js** - Clipboard reading and parsing:
- `processForGradeEntry()` — row-order mode: N columns must match N enabled columns
- `processForGradeEntryById()` — ID mode: first column = student number, remaining = grades

**src/pages/gradeEntry/FieldUpdater.js** - Grade field population:
- `updateGrades(processedData, onProgress)` — row-order fill
- `updateGradesByStudentId(processedData, onProgress)` — ID-match fill
- `buildStudentNumberMap()` — maps student number → fields by reading `td[3]` of parent row
- `extractStudentNumberForRow()` — `input.closest('td.ttc').closest('tr').querySelectorAll(':scope > td')[3]`

**src/pages/gradeEntry/GradeEntryUI.js** - Floating control panel:
- Page navigation buttons (ตลอดภาค / ก่อนกลาง / หลังกลาง) with active page highlight
- Fill mode toggle button (↕ เรียงแถว / ⚡ จับคู่รหัส)
- Progress indicator shown during fill operations
- Draggable panel, minimize/restore states

**src/shared/constants/SGSSelectors.js** - All DOM selectors and patterns:
- `checkboxColumnMap`: Check1–Check18, CheckM, CheckF, CheckRG, CheckRpG, CheckR
- `skipFields`: `['TotalPercent', 'Gr', 'ScoreFinal', 'ScoreTotal', 'Midterm']` (read-only computed columns)
- `'grade-entry-nav'` key: navigation URLs for the 3 pages

**src/shared/constants/Messages.js** - All Thai user-facing strings

**src/shared/utils/SGSFormHandler.js** - ASP.NET postback handler:
- Primary: `chrome.runtime.sendMessage({ type: 'EXECUTE_POSTBACK' })` → background.js executes in page context
- Fallback: direct `window.__doPostBack` if available
- Fallback: form submission with hidden `__EVENTTARGET` / `__EVENTARGUMENT` fields
- **No inline script injection** — SGS CSP blocks it; background.js handles everything

**popup.html/popup.js** - Simple extension popup with "Open SGS" button

**manifest.json** - Extension configuration

### Key Technical Patterns

**SGS Page DOM Structure** (grade entry rows):
- Each student occupies a `<tr>` in the outer table
- Cells: `[0]` blank, `[1]` seq, `[2]` seq, `[3]` **student number (เลขประจำตัว)**, `[4]` student name, `[5+]` grade input columns
- Grade inputs are nested: `TD.ttc > DIV > SPAN > TABLE > TR > TD > input`
- Reach parent student row from any grade input: `input.closest('td.ttc').closest('tr')`
- Student number for ID-match: `parentRow.querySelectorAll(':scope > td')[3].textContent.trim()`
- Student system ID (9-digit internal): 4th quoted param in `onchange` attribute of grade inputs

**Dynamic Column Detection**: Scans first student row for enabled (non-disabled, non-readonly) text inputs matching `*_ctl##_ColumnName`. Extracts weights from `onchange` attributes or header cell text. Column checkboxes in the header control which columns are enabled.

**ASP.NET Postback Handling**: The SGS site's CSP blocks inline scripts. The only working method is `chrome.scripting.executeScript({ world: 'MAIN' })` in background.js, which runs in the page's JS context and is exempt from CSP.

**Fill Mode — Row Order** (`'row'`, default):
- Clipboard columns N must equal enabled columns N
- Rows matched by position (clipboard row 1 → page student 1)

**Fill Mode — Student ID Match** (`'id'`):
- Clipboard column 1 = student number (5-digit เลขประจำตัว), columns 2..N+1 = grades
- Each clipboard row is matched to the page student with the same number
- Row order in spreadsheet does not need to match page order

**SessionStorage Resume Pattern** (auto page-size / auto column-enable):
- Before triggering a postback that reloads the page, set `sessionStorage.setItem('sgsbot_pending_fill', '1')`
- On initialization, `GradeEntryController.checkPendingFill()` detects the flag and auto-retriggers fill

## Development Commands

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

### Testing
- Run `npm run validate` to check code structure
- Manual testing on live SGS system required
- Use `?debug=true` URL parameter to enable debug mode

## Extension Permissions

- `clipboardRead`: Access clipboard for grade data import
- `activeTab`, `tabs`, `scripting`: Page interaction and navigation
- Host permission: `https://sgs.bopp-obec.info/*` only
