
// Grade Entry Helper - Browser Extension Content Script
// Automatically fills grade entries from clipboard data copied from Google Sheets

// Wrap the entire script in a try-catch for better error handling
try {

// Check for basic browser compatibility
if (typeof document === 'undefined' || typeof window === 'undefined') {
    throw new Error('Browser environment not available');
}

// Check for required DOM APIs
if (!document.createElement || !document.querySelector || !document.addEventListener) {
    throw new Error('Required DOM APIs not available');
}

// Dynamic column detection - will be populated by scanning the page
let ENABLED_COLUMNS = {};

// Function to check if required dropdowns are selected
function checkRequiredDropdowns() {
    // Get the subject and section dropdowns
    const subjectDropdown = document.getElementById('ctl00_PageContent_ClassSubjectIDFilter');
    const sectionDropdown = document.getElementById('ctl00_PageContent_ClassSectionNoFilter');
    
    // Check if both dropdowns exist
    if (!subjectDropdown || !sectionDropdown) {
        console.log('Required dropdowns not found on page');
        return { valid: false, message: 'Required dropdowns not found on page' };
    }
    
    // Check if subject is selected (not the default "Please select" option)
    const subjectSelected = subjectDropdown.value && subjectDropdown.value !== '--ANY--';
    
    // Check if section is selected (not the default "Please select" option)
    const sectionSelected = sectionDropdown.value && sectionDropdown.value !== '--ANY--';
    
    // If both are selected, return valid
    if (subjectSelected && sectionSelected) {
        return { valid: true };
    }
    
    // If not, return appropriate message
    if (!subjectSelected && !sectionSelected) {
        return { 
            valid: false, 
            message: 'กรุณาเลือก "รายวิชา" และ "กลุ่ม" ก่อนใช้งานปลั๊กอิน' 
        };
    } else if (!subjectSelected) {
        return { 
            valid: false, 
            message: 'กรุณาเลือก "รายวิชา" ก่อนใช้งานปลั๊กอิน' 
        };
    } else {
        return { 
            valid: false, 
            message: 'กรุณาเลือก "กลุ่ม" ก่อนใช้งานปลั๊กอิน' 
        };
    }
}

// Helper function to dynamically detect ALL enabled columns from the page
function detectEnabledColumns() {
    const columns = {};
    
    // Method 1: Scan all enabled input fields directly from the first student row
    const firstStudentRow = document.querySelector('tr:has(input[id*="TblTranscriptsTableControlRepeater_ctl00_"])');
    if (firstStudentRow) {
        const inputs = firstStudentRow.querySelectorAll('input[type="text"]');
        
        for (let input of inputs) {
            if (!input.disabled && !input.readOnly) {
                const inputId = input.id;
                // Extract column name from input ID pattern: ...ctl00_ColumnName
                const match = inputId.match(/_ctl\d+_(\w+)$/);
                if (match) {
                    const columnName = match[1];
                    
                    // Skip calculated fields that shouldn't be manually edited
                    if (['TotalPercent', 'Gr'].includes(columnName)) {
                        continue;
                    }
                    
                    // Get weight from onchange attribute if available
                    let weight = 100; // default fallback
                    const onchangeAttr = input.getAttribute('onchange');
                    if (onchangeAttr) {
                        // Look for weight in CheckValue function call
                        const weightMatch = onchangeAttr.match(/'(\d+)'/g);
                        if (weightMatch && weightMatch.length >= 3) {
                            // Third quoted parameter is usually the weight
                            weight = parseInt(weightMatch[2].replace(/'/g, ''));
                        }
                    }
                    
                    // Get display name by finding the corresponding header
                    let displayName = columnName;
                    const headerCell = findHeaderForColumn(columnName);
                    if (headerCell) {
                        const linkText = headerCell.querySelector('a')?.textContent?.trim();
                        if (linkText) {
                            displayName = linkText;
                        }
                        
                        // Try to get weight from header cell content if not found in onchange
                        if (weight === 100) {
                            const weightMatch = headerCell.textContent.match(/(\d+)\s*$/);
                            if (weightMatch) {
                                weight = parseInt(weightMatch[1]);
                            }
                        }
                    }
                    
                    columns[columnName] = {
                        weight: weight,
                        name: displayName,
                        enabled: true,
                        inputId: inputId
                    };
                }
            }
        }
    }
    
    // Method 2: Also check checkboxes in headers to identify columns with toggleable status
    const headerCells = document.querySelectorAll('th.thc');
    for (let cell of headerCells) {
        const checkbox = cell.querySelector('input[type="checkbox"]');
        if (checkbox && !checkbox.disabled && checkbox.checked) {
            // Try to match checkbox to column name
            const columnName = extractColumnNameFromCheckbox(checkbox.id);
            if (columnName && !columns[columnName]) {
                // Get display name and weight from cell
                const links = cell.querySelectorAll('a');
                const textContent = cell.textContent.trim();
                
                let displayName = columnName;
                if (links.length > 0) {
                    displayName = links[0].textContent.trim();
                }
                
                let weight = 100;
                const weightMatch = textContent.match(/(\d+)\s*$/);
                if (weightMatch) {
                    weight = parseInt(weightMatch[1]);
                }
                
                columns[columnName] = {
                    weight: weight,
                    name: displayName,
                    enabled: true
                };
            }
        }
    }
    
    return columns;
}

// Helper function to find header cell for a given column name
function findHeaderForColumn(columnName) {
    // Look for header cell that might correspond to this column
    const headerCells = document.querySelectorAll('th.thc');
    
    for (let cell of headerCells) {
        // Check if cell contains a link or text that matches column patterns
        const links = cell.querySelectorAll('a');
        const cellText = cell.textContent.trim();
        
        // Try to match by link href containing column name
        for (let link of links) {
            const href = link.getAttribute('href') || '';
            if (href.includes(columnName)) {
                return cell;
            }
        }
        
        // Try to match checkbox ID to column name
        const checkbox = cell.querySelector('input[type="checkbox"]');
        if (checkbox) {
            const matchedName = extractColumnNameFromCheckbox(checkbox.id);
            if (matchedName === columnName) {
                return cell;
            }
        }
    }
    
    return null;
}

// Helper function to extract column name from checkbox ID
function extractColumnNameFromCheckbox(checkboxId) {
    // Handle various checkbox ID patterns
    if (checkboxId.includes('Check1')) return 'S1';
    if (checkboxId.includes('Check2')) return 'S2';
    if (checkboxId.includes('Check3')) return 'S3';
    if (checkboxId.includes('Check4')) return 'S4';
    if (checkboxId.includes('Check5')) return 'S5';
    if (checkboxId.includes('Check6')) return 'S6';
    if (checkboxId.includes('Check7')) return 'S7';
    if (checkboxId.includes('Check8')) return 'S8';
    if (checkboxId.includes('Check9')) return 'S9';
    if (checkboxId.includes('Check10')) return 'S10';
    if (checkboxId.includes('Check11')) return 'S11';
    if (checkboxId.includes('Check12')) return 'S12';
    if (checkboxId.includes('Check13')) return 'S13';
    if (checkboxId.includes('Check14')) return 'S14';
    if (checkboxId.includes('Check15')) return 'S15';
    if (checkboxId.includes('CheckM')) return 'Midterm';
    if (checkboxId.includes('CheckF')) return 'Final';
    if (checkboxId.includes('CheckRG')) return 'ReGr';
    if (checkboxId.includes('CheckRpG')) return 'RepeatGr';
    if (checkboxId.includes('CheckR')) return 'Remark';
    
    // For any other pattern, try to extract the actual name
    const match = checkboxId.match(/Check(\w+)$/);
    if (match) {
        return match[1];
    }
    
    return null;
}

// Helper function to parse clipboard data (tab-separated values from Google Sheets)
function parseClipboardData(text) {
    const lines = text.trim().split('\n');
    const data = [];
    
    for (let line of lines) {
        if (line.trim()) {
            // Split by tabs (Google Sheets format)
            const values = line.split('\t');
            data.push(values);
        }
    }
    
    return data;
}

// Helper function to find all student rows and their input fields
function findStudentInputFields() {
    const students = [];
    let rowIndex = 0;
    
    while (true) {
        const studentFields = {};
        let foundAnyField = false;
        
        // Try to find fields for this student row
        for (let columnName of Object.keys(ENABLED_COLUMNS)) {
            const fieldId = `ctl00_PageContent_TblTranscriptsTableControlRepeater_ctl${rowIndex.toString().padStart(2, '0')}_${columnName}`;
            const field = document.getElementById(fieldId);
            
            if (field && !field.disabled) {
                studentFields[columnName] = field;
                foundAnyField = true;
            }
        }
        
        if (!foundAnyField) {
            break; // No more student rows
        }
        
        students.push({
            rowIndex: rowIndex,
            fields: studentFields
        });
        
        rowIndex++;
    }
    
    return students;
}

// Helper function to update a field and trigger its change event
function updateField(field, value, columnName, weight) {
    if (!field) return false;
    
    // Validate numeric input
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > weight) {
        console.warn(`Invalid value ${value} for ${columnName}. Must be between 0 and ${weight}.`);
        return false;
    }
    
    // Set the value
    field.value = numValue.toFixed(1);
    
    // Trigger change event to update calculations
    // Create a more complete event object for ASP.NET validation
    try {
        if (field.onchange) {
            // Create a synthetic event object that mimics a real browser event
            const fakeEvent = {
                target: field,
                srcElement: field,
                type: 'change',
                bubbles: true,
                cancelable: true,
                preventDefault: function() {},
                stopPropagation: function() {}
            };
            
            // Try calling onchange with the fake event
            field.onchange.call(field, fakeEvent);
        } else {
            // Fallback: try to trigger the specific validation function directly
            if (window.CheckValue && typeof window.CheckValue === 'function') {
                // Extract parameters from the onchange attribute
                const onchangeAttr = field.getAttribute('onchange');
                if (onchangeAttr && onchangeAttr.includes('CheckValue')) {
                    // Parse CheckValue parameters from the onchange string
                    const match = onchangeAttr.match(/CheckValue\(document\.all\('([^']+)'\),'([^']+)','([^']+)','([^']+)','([^']+)','([^']+)'\)/);
                    if (match) {
                        const [, fieldId, type, maxScore, studentId, totalField, gradeField] = match;
                        window.CheckValue(field, type, maxScore, studentId, totalField, gradeField);
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Could not trigger change event for ${columnName}:`, error);
        // Continue anyway - the value is still set
    }
    
    console.log(`Updated ${columnName}: ${numValue}`);
    return true;
}

// Function to clear all values in enabled grade columns
async function clearGradeColumns() {
    try {
        // First, check if required dropdowns are selected
        const dropdownCheck = checkRequiredDropdowns();
        if (!dropdownCheck.valid) {
            showNotification(dropdownCheck.message, 'error');
            return;
        }
        
        // First, detect enabled columns
        ENABLED_COLUMNS = detectEnabledColumns();
        
        if (Object.keys(ENABLED_COLUMNS).length === 0) {
            throw new Error('No enabled grade columns found to clear');
        }
        
        console.log('Clearing enabled columns:', ENABLED_COLUMNS);
        
        // Find student input fields
        const students = findStudentInputFields();
        console.log(`Found ${students.length} student rows with enabled fields`);
        
        if (students.length === 0) {
            throw new Error('No student rows found');
        }
        
        // Confirm with user
        const columnNames = Object.values(ENABLED_COLUMNS).map(col => col.name).join(', ');
        const confirmMessage = `Are you sure you want to clear all values in these columns?\n\n${columnNames}\n\nThis action cannot be undone.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Clear the grades
        let clearedCount = 0;
        
        for (let student of students) {
            for (let columnName of Object.keys(ENABLED_COLUMNS)) {
                const field = student.fields[columnName];
                if (field) {
                    // Clear the value
                    field.value = '';
                    
                    // Trigger change event to update calculations
                    try {
                        if (field.onchange) {
                            const fakeEvent = {
                                target: field,
                                srcElement: field,
                                type: 'change',
                                bubbles: true,
                                cancelable: true,
                                preventDefault: function() {},
                                stopPropagation: function() {}
                            };
                            field.onchange.call(field, fakeEvent);
                        }
                        clearedCount++;
                    } catch (error) {
                        console.warn(`Could not trigger change event for ${columnName}:`, error);
                        clearedCount++;
                    }
                }
            }
        }
        
        console.log(`Successfully cleared ${clearedCount} grade fields`);
        
        // Show success message
        const message = `Successfully cleared ${clearedCount} grade fields!\n\nColumns cleared: ${columnNames}`;
        showNotification(message, 'success');
        
    } catch (error) {
        console.error('Error clearing grades:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Main function to fill grades from clipboard
async function fillGradesFromClipboard() {
    try {
        // First, check if required dropdowns are selected
        const dropdownCheck = checkRequiredDropdowns();
        if (!dropdownCheck.valid) {
            showNotification(dropdownCheck.message, 'error');
            return;
        }
        
        // First, detect enabled columns dynamically
        ENABLED_COLUMNS = detectEnabledColumns();
        
        if (Object.keys(ENABLED_COLUMNS).length === 0) {
            throw new Error('No enabled grade columns found on this page');
        }
        
        console.log('Detected enabled columns:', ENABLED_COLUMNS);
        
        // Check if clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            throw new Error('Clipboard API not available. Make sure you\'re on HTTPS.');
        }
        
        // Read clipboard data
        console.log('Reading clipboard data...');
        const clipboardText = await navigator.clipboard.readText();
        
        if (!clipboardText.trim()) {
            throw new Error('Clipboard is empty');
        }
        
        // Parse the data
        const data = parseClipboardData(clipboardText);
        console.log('Parsed data:', data);
        
        if (data.length === 0) {
            throw new Error('No data found in clipboard');
        }
        
        // Find student input fields
        const students = findStudentInputFields();
        console.log(`Found ${students.length} student rows with enabled fields`);
        
        if (students.length === 0) {
            throw new Error('No enabled grade input fields found');
        }
        
        // Determine data structure
        // Assume first row might be headers, check if it contains column names
        let dataStartRow = 0;
        const firstRow = data[0];
        const hasHeaders = firstRow.some(cell => 
            Object.keys(ENABLED_COLUMNS).includes(cell) || 
            Object.values(ENABLED_COLUMNS).some(col => col.name === cell)
        );
        
        if (hasHeaders) {
            dataStartRow = 1;
            console.log('Headers detected, starting from row 2');
        }
        
        // Get column names in the order they appear
        const columnNames = Object.keys(ENABLED_COLUMNS);
        const columnCount = columnNames.length;
        
        // Validate data width matches column count
        if (data.length > 0 && data[dataStartRow] && data[dataStartRow].length !== columnCount) {
            const message = `Data has ${data[dataStartRow].length} columns but found ${columnCount} enabled grade columns.\n\nEnabled columns: ${columnNames.map(name => ENABLED_COLUMNS[name].name).join(', ')}\n\nPlease ensure your clipboard data matches the enabled columns.`;
            throw new Error(message);
        }
        
        // Fill the grades
        let updatedCount = 0;
        
        for (let i = 0; i < students.length && (dataStartRow + i) < data.length; i++) {
            const student = students[i];
            const rowData = data[dataStartRow + i];
            
            console.log(`Processing student row ${i + 1}:`, rowData);
            
            // Fill each enabled column
            for (let j = 0; j < columnNames.length && j < rowData.length; j++) {
                const columnName = columnNames[j];
                const value = rowData[j];
                const field = student.fields[columnName];
                const weight = ENABLED_COLUMNS[columnName].weight;
                
                if (field && value !== undefined && value !== '') {
                    if (updateField(field, value, columnName, weight)) {
                        updatedCount++;
                    }
                }
            }
        }
        
        console.log(`Successfully updated ${updatedCount} grade fields`);
        
        // Show success message with column info
        const columnInfo = Object.values(ENABLED_COLUMNS).map(col => col.name).join(', ');
        const message = `Successfully updated ${updatedCount} grade fields!\n\nColumns processed: ${columnInfo}`;
        showNotification(message, 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Helper function to show notifications in a dedicated area
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('grade-helper-notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.id = 'grade-helper-notification';
    notification.textContent = message;
    
    const backgroundColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
    
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 10000;
        padding: 12px 16px;
        background: ${backgroundColor};
        color: white;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 350px;
        word-wrap: break-word;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(-100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds with slide-out animation
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Create UI control panel
function createControlPanel() {
    // Check if panel already exists
    if (document.getElementById('grade-helper-panel')) {
        return;
    }
    
    // Create floating control panel
    const panel = document.createElement('div');
    panel.id = 'grade-helper-panel';
    panel.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 220px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Add header
    const header = document.createElement('div');
    header.textContent = 'Grade Entry Helper';
    header.style.cssText = `
        font-size: 14px;
        font-weight: bold;
        color: #333;
        text-align: center;
        margin-bottom: 4px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e0e0e0;
    `;
    
    // Create main fill button
    const fillButton = document.createElement('button');
    fillButton.id = 'grade-helper-fill-btn';
    fillButton.textContent = 'Fill from Clipboard';
    fillButton.style.cssText = `
        padding: 10px 14px;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
    `;
    
    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All Values';
    clearButton.style.cssText = `
        padding: 8px 12px;
        background: linear-gradient(135deg, #ff5722, #e64a19);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(255, 87, 34, 0.3);
    `;
    
    // Create info button
    const infoButton = document.createElement('button');
    infoButton.textContent = 'Show Detected Columns';
    infoButton.style.cssText = `
        padding: 8px 12px;
        background: linear-gradient(135deg, #2196F3, #1976D2);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
    `;
    
    // Create row count input and set button
    const rowControlContainer = document.createElement('div');
    rowControlContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
    `;
    
    const rowLabel = document.createElement('span');
    rowLabel.textContent = 'Rows:';
    rowLabel.style.cssText = `
        font-size: 12px;
        color: #333;
        white-space: nowrap;
    `;
    
    const rowInput = document.createElement('input');
    rowInput.type = 'number';
    rowInput.value = '100';
    rowInput.min = '1';
    rowInput.max = '1000';
    rowInput.style.cssText = `
        width: 60px;
        padding: 4px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 12px;
    `;
    
    const setRowsButton = document.createElement('button');
    setRowsButton.textContent = 'Set';
    setRowsButton.style.cssText = `
        padding: 4px 8px;
        background: linear-gradient(135deg, #9c27b0, #7b1fa2);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(156, 39, 176, 0.3);
    `;
    
    // Create minimize button
    const minimizeButton = document.createElement('button');
    minimizeButton.textContent = '−';
    try {
        minimizeButton.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            width: 24px;
            height: 24px;
            background: #666;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            line-height: 1;
            transition: all 0.2s ease;
        `;
    } catch (cssError) {
        // Fallback for browsers that don't support template literals in some contexts
        minimizeButton.style.position = 'absolute';
        minimizeButton.style.top = '-8px';
        minimizeButton.style.right = '-8px';
        minimizeButton.style.width = '24px';
        minimizeButton.style.height = '24px';
        minimizeButton.style.background = '#666';
        minimizeButton.style.color = 'white';
        minimizeButton.style.border = 'none';
        minimizeButton.style.borderRadius = '50%';
        minimizeButton.style.cursor = 'pointer';
        minimizeButton.style.fontSize = '16px';
        minimizeButton.style.fontWeight = 'bold';
        minimizeButton.style.lineHeight = '1';
        minimizeButton.style.transition = 'all 0.2s ease';
    }
    
    // Create minimized state
    const createMinimizedPanel = () => {
        const miniPanel = document.createElement('div');
        miniPanel.id = 'grade-helper-mini-panel';
        try {
            miniPanel.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                background: #4CAF50;
                color: white;
                border-radius: 50%;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-size: 20px;
                font-weight: bold;
                transition: all 0.2s ease;
            `;
        } catch (cssError) {
            // Fallback for browsers with template literal issues
            miniPanel.style.position = 'fixed';
            miniPanel.style.top = '80px';
            miniPanel.style.right = '20px';
            miniPanel.style.zIndex = '9999';
            miniPanel.style.background = '#4CAF50';
            miniPanel.style.color = 'white';
            miniPanel.style.borderRadius = '50%';
            miniPanel.style.width = '48px';
            miniPanel.style.height = '48px';
            miniPanel.style.display = 'flex';
            miniPanel.style.alignItems = 'center';
            miniPanel.style.justifyContent = 'center';
            miniPanel.style.cursor = 'pointer';
            miniPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            miniPanel.style.fontSize = '20px';
            miniPanel.style.fontWeight = 'bold';
            miniPanel.style.transition = 'all 0.2s ease';
        }
        miniPanel.textContent = 'G';
        miniPanel.title = 'Grade Entry Helper - Click to expand';
        
        miniPanel.addEventListener('click', () => {
            miniPanel.remove();
            createControlPanel();
        });
        
        miniPanel.addEventListener('mouseenter', () => {
            miniPanel.style.transform = 'scale(1.1)';
            miniPanel.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        });
        
        miniPanel.addEventListener('mouseleave', () => {
            miniPanel.style.transform = 'scale(1)';
            miniPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        
        return miniPanel;
    };
    
    // Add hover effects
    fillButton.addEventListener('mouseenter', () => {
        fillButton.style.transform = 'translateY(-1px)';
        fillButton.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.4)';
    });
    
    fillButton.addEventListener('mouseleave', () => {
        fillButton.style.transform = 'translateY(0)';
        fillButton.style.boxShadow = '0 2px 4px rgba(76, 175, 80, 0.3)';
    });
    
    clearButton.addEventListener('mouseenter', () => {
        clearButton.style.transform = 'translateY(-1px)';
        clearButton.style.boxShadow = '0 4px 8px rgba(255, 87, 34, 0.4)';
    });
    
    clearButton.addEventListener('mouseleave', () => {
        clearButton.style.transform = 'translateY(0)';
        clearButton.style.boxShadow = '0 2px 4px rgba(255, 87, 34, 0.3)';
    });
    
    infoButton.addEventListener('mouseenter', () => {
        infoButton.style.transform = 'translateY(-1px)';
        infoButton.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.4)';
    });
    
    infoButton.addEventListener('mouseleave', () => {
        infoButton.style.transform = 'translateY(0)';
        infoButton.style.boxShadow = '0 2px 4px rgba(33, 150, 243, 0.3)';
    });
    
    // Add hover effect for set rows button
    setRowsButton.addEventListener('mouseenter', () => {
        setRowsButton.style.transform = 'translateY(-1px)';
        setRowsButton.style.boxShadow = '0 4px 8px rgba(156, 39, 176, 0.4)';
    });
    
    setRowsButton.addEventListener('mouseleave', () => {
        setRowsButton.style.transform = 'translateY(0)';
        setRowsButton.style.boxShadow = '0 2px 4px rgba(156, 39, 176, 0.3)';
    });
    
    // Event listener for set rows button
    setRowsButton.addEventListener('click', () => {
        const rowCount = parseInt(rowInput.value);
        if (isNaN(rowCount) || rowCount < 1 || rowCount > 1000) {
            showNotification('Please enter a valid number between 1 and 1000', 'error');
            return;
        }
        
        setRowCount(rowCount);
    });
    
    minimizeButton.addEventListener('mouseenter', () => {
        minimizeButton.style.background = '#555';
    });
    
    minimizeButton.addEventListener('mouseleave', () => {
        minimizeButton.style.background = '#666';
    });
    
    // Event listeners
    fillButton.addEventListener('click', fillGradesFromClipboard);
    clearButton.addEventListener('click', clearGradeColumns);
    infoButton.addEventListener('click', showDetectedColumns);
    minimizeButton.addEventListener('click', () => {
        panel.remove();
        document.body.appendChild(createMinimizedPanel());
    });
    
    // Assemble panel
    panel.appendChild(minimizeButton);
    panel.appendChild(header);
    panel.appendChild(fillButton);
    panel.appendChild(clearButton);
    panel.appendChild(infoButton);
    
    // Assemble row control elements
    rowControlContainer.appendChild(rowLabel);
    rowControlContainer.appendChild(rowInput);
    rowControlContainer.appendChild(setRowsButton);
    panel.appendChild(rowControlContainer);
    
    // Add status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'grade-helper-status';
    statusDiv.style.cssText = `
        font-size: 11px;
        color: #666;
        text-align: center;
        margin-top: 4px;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
    `;
    
    // Update status with detected columns count
    const updateStatus = () => {
        // Check if required dropdowns are selected first
        const dropdownCheck = checkRequiredDropdowns();
        if (!dropdownCheck.valid) {
            statusDiv.textContent = 'Please select subject and group first';
            statusDiv.style.color = '#f44336';
            return;
        }
        
        const columns = detectEnabledColumns();
        const count = Object.keys(columns).length;
        statusDiv.textContent = `${count} columns detected`;
        statusDiv.style.color = count > 0 ? '#4CAF50' : '#f44336';
    };
    
    updateStatus();
    panel.appendChild(statusDiv);
    
    // Watch for page changes to update status automatically
    let statusUpdateInterval = null;
    let mutationObserver = null;
    
    // Function to start watching for changes
    const startWatchingForChanges = () => {
        // Clear any existing interval
        if (statusUpdateInterval) {
            clearInterval(statusUpdateInterval);
        }
        
        // Periodically update status to reflect changes after postbacks
        statusUpdateInterval = setInterval(() => {
            if (document.getElementById('grade-helper-panel')) {
                updateStatus();
            } else {
                // Clean up interval if panel is removed
                clearInterval(statusUpdateInterval);
                statusUpdateInterval = null;
                if (mutationObserver) {
                    mutationObserver.disconnect();
                    mutationObserver = null;
                }
            }
        }, 2000); // Update every 2 seconds
        
        // Also watch for DOM changes using MutationObserver
        if (typeof MutationObserver !== 'undefined') {
            mutationObserver = new MutationObserver((mutations) => {
                // Check if any mutations involve grade table or form elements
                let shouldUpdate = false;
                for (let mutation of mutations) {
                    if (mutation.type === 'childList') {
                        // Check if any added nodes contain grade input fields
                        for (let node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.querySelector && node.querySelector('input[id*="TblTranscriptsTableControlRepeater"]')) {
                                    shouldUpdate = true;
                                    break;
                                }
                            }
                        }
                        if (shouldUpdate) break;
                        
                        // Check if any removed nodes contained our panel
                        for (let node of mutation.removedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.id === 'grade-helper-panel') {
                                    shouldUpdate = false;
                                    break;
                                }
                            }
                        }
                        if (shouldUpdate) break;
                    }
                }
                
                if (shouldUpdate) {
                    // Delay update slightly to allow DOM to settle
                    setTimeout(updateStatus, 500);
                }
            });
            
            // Observe changes to the body and grade table area
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    };
    
    // Start watching for changes
    startWatchingForChanges();
    
    // Also update status when dropdowns change
    const subjectDropdown = document.getElementById('ctl00_PageContent_ClassSubjectIDFilter');
    const sectionDropdown = document.getElementById('ctl00_PageContent_ClassSectionNoFilter');
    
    if (subjectDropdown) {
        subjectDropdown.addEventListener('change', () => {
            // Delay update to allow page to refresh
            setTimeout(updateStatus, 1000);
        });
    }
    
    if (sectionDropdown) {
        sectionDropdown.addEventListener('change', () => {
            // Delay update to allow page to refresh
            setTimeout(updateStatus, 1000);
        });
    }
    
    document.body.appendChild(panel);
    
    console.log('Grade Entry Helper: Control panel created');
}

// Function to set the number of rows to display
function setRowCount(rowCount) {
    try {
        // Find the page size input field
        const pageSizeInput = document.querySelector('input[name="ctl00$PageContent$TblTranscriptsPagination$_PageSize"]');
        if (!pageSizeInput) {
            showNotification('Page size input field not found', 'error');
            return;
        }
        
        // Set the value
        pageSizeInput.value = rowCount;
        
        // Find the page size button
        const pageSizeButton = document.getElementById('ctl00_PageContent_TblTranscriptsPagination__PageSizeButton');
        if (!pageSizeButton) {
            showNotification('Page size button not found', 'error');
            return;
        }
        
        // Try to call the __doPostBack function directly if it exists
        if (typeof __doPostBack === 'function') {
            __doPostBack('ctl00$PageContent$TblTranscriptsPagination$_PageSizeButton', '');
            showNotification(`Successfully set display to ${rowCount} rows per page`, 'success');
        } else {
            // Fallback 1: Try to execute the javascript from the href attribute
            const href = pageSizeButton.getAttribute('href');
            if (href && href.startsWith('javascript:')) {
                // Extract the javascript code and execute it
                const jsCode = href.substring('javascript:'.length);
                try {
                    // Create a script element to execute the code in the page context
                    const script = document.createElement('script');
                    script.textContent = jsCode;
                    document.head.appendChild(script);
                    document.head.removeChild(script);
                    showNotification(`Successfully set display to ${rowCount} rows per page`, 'success');
                } catch (execError) {
                    // Fallback 2: Try clicking the button directly
                    pageSizeButton.click();
                    showNotification(`Successfully set display to ${rowCount} rows per page`, 'success');
                }
            } else {
                // Fallback 3: Try clicking the button directly
                pageSizeButton.click();
                showNotification(`Successfully set display to ${rowCount} rows per page`, 'success');
            }
        }
        
    } catch (error) {
        console.error('Error setting row count:', error);
        showNotification(`Error setting row count: ${error.message}`, 'error');
    }
}

// Function to show detected columns info
function showDetectedColumns() {
    // First, check if required dropdowns are selected
    const dropdownCheck = checkRequiredDropdowns();
    if (!dropdownCheck.valid) {
        showNotification(dropdownCheck.message, 'error');
        return;
    }
    
    // Re-detect columns to ensure we have the latest data
    const columns = detectEnabledColumns();
    
    if (Object.keys(columns).length === 0) {
        showNotification('No enabled grade columns detected on this page. Please make sure you have selected a subject and group, and that the page has fully loaded.', 'info');
        return;
    }
    
    let columnInfo = 'Detected Enabled Columns:\n\n';
    const columnList = Object.entries(columns).map(([key, value], index) => {
        return `${index + 1}. ${value.name} (Max: ${value.weight} points)`;
    });
    
    columnInfo += columnList.join('\n');
    columnInfo += '\n\nYour clipboard data should have columns in this exact order.';
    
    // Create a more detailed popup for column info
    showDetailedInfo(columnInfo);
}

// Enhanced notification function for detailed info with better positioning
function showDetailedInfo(message) {
    // Remove existing notification
    const existing = document.getElementById('grade-helper-detailed-info');
    if (existing) {
        existing.remove();
    }
    
    // Create detailed info popup positioned to avoid overlaps
    const popup = document.createElement('div');
    popup.id = 'grade-helper-detailed-info';
    
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        padding: 24px;
        background: white;
        color: #333;
        border-radius: 12px;
        font-size: 14px;
        box-shadow: 0 12px 24px rgba(0,0,0,0.2);
        max-width: 450px;
        max-height: 600px;
        overflow-y: auto;
        white-space: pre-line;
        border: 2px solid #2196F3;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: popupSlideIn 0.3s ease-out;
    `;
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        background: rgba(0,0,0,0.6);
        animation: fadeIn 0.3s ease-out;
    `;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 12px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        line-height: 1;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Detected Grade Columns';
    title.style.cssText = `
        margin: 0 0 16px 0;
        color: #2196F3;
        font-size: 16px;
        font-weight: 600;
        padding-right: 40px;
    `;
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        margin-right: 20px;
        line-height: 1.5;
        color: #555;
    `;
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes popupSlideIn {
            from { 
                transform: translate(-50%, -50%) scale(0.9);
                opacity: 0;
            }
            to { 
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes popupSlideOut {
            from { 
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            to { 
                transform: translate(-50%, -50%) scale(0.9);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    popup.appendChild(closeButton);
    popup.appendChild(title);
    popup.appendChild(messageDiv);
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
    
    // Close handlers with animation
    const closePopup = () => {
        popup.style.animation = 'popupSlideOut 0.3s ease-in';
        backdrop.style.opacity = '0';
        setTimeout(() => {
            if (popup && popup.parentNode) popup.remove();
            if (backdrop && backdrop.parentNode) backdrop.remove();
            if (style && style.parentNode) style.remove();
        }, 300);
    };
    
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = '#d32f2f';
        closeButton.style.transform = 'scale(1.1)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = '#f44336';
        closeButton.style.transform = 'scale(1)';
    });
    
    closeButton.addEventListener('click', closePopup);
    backdrop.addEventListener('click', closePopup);
    
    // Close with Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Auto-close after 15 seconds
    setTimeout(() => {
        if (document.getElementById('grade-helper-detailed-info')) {
            closePopup();
            document.removeEventListener('keydown', escapeHandler);
        }
    }, 15000);
}

// Initialize extension when page loads
function initializeExtension() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
        return;
    }
    
    // Check if we're on the correct page by looking for the grade table
    const gradeTable = document.querySelector('table[cellpadding="0"][cellspacing="0"]');
    if (!gradeTable) {
        console.log('Grade Entry Helper: Grade table not found, extension not activated');
        return;
    }
    
    // Detect enabled columns
    ENABLED_COLUMNS = detectEnabledColumns();
    
    console.log('Grade Entry Helper: Extension loaded');
    console.log('Detected enabled columns:', ENABLED_COLUMNS);
    
    // Create the control panel
    createControlPanel();
    
    // Also expose functions globally for manual calling
    window.fillGradesFromClipboard = fillGradesFromClipboard;
    window.clearGradeColumns = clearGradeColumns;
    window.showDetectedColumns = showDetectedColumns;
    
    // Show initialization notification with detected columns
    setTimeout(() => {
        // Check if required dropdowns are selected
        const dropdownCheck = checkRequiredDropdowns();
        if (!dropdownCheck.valid) {
            showNotification(dropdownCheck.message, 'info');
            return;
        }
        
        // Re-detect enabled columns in case they weren't available during initial load
        ENABLED_COLUMNS = detectEnabledColumns();
        const columnCount = Object.keys(ENABLED_COLUMNS).length;
        
        if (columnCount > 0) {
            const columnNames = Object.values(ENABLED_COLUMNS).map(col => col.name).join(', ');
            showNotification(`Grade Entry Helper ready! Detected ${columnCount} enabled columns.`, 'success');
        } else {
            // If no columns detected, show a message prompting user to select dropdowns
            showNotification('Grade Entry Helper loaded. Please select a subject and group to detect grade columns.', 'info');
        }
    }, 1500);
    
    console.log('Usage:');
    console.log('1. Copy grade data from Google Sheets');
    console.log('2. Click "Fill from Clipboard" button');
    console.log('3. Data columns should match:', Object.values(ENABLED_COLUMNS).map(col => col.name));
}

// Start the extension
initializeExtension();

} catch (error) {
    console.error('Grade Entry Helper: Script execution error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
}