# Grade Entry Helper v2.0

A modern, scalable browser extension for streamlined grade entry and management in the SGS (Student Grading System).

## 🚀 Features

- **Multi-page Support**: Extensible architecture supporting multiple SGS pages
- **Smart Column Detection**: Automatically detects and adapts to any grading configuration
- **Clipboard Integration**: Seamless data import from Google Sheets and Excel
- **Bulk Operations**: Fill grades, clear values, and manage data efficiently
- **Real-time Validation**: Input validation with clear error messaging
- **Modern Architecture**: ES6+ modules, async/await, proper error handling

## 📋 Supported Pages

- ✅ **Grade Entry**: Fill grades from clipboard, clear values, column detection
- 🚧 **Student List**: Bulk student management (planned)
- 🚧 **Reports**: Grade reports and export functionality (planned)
- 🚧 **Settings**: Extension configuration (planned)

## 🛠 Development

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/grade-entry-helper.git
cd grade-entry-helper

# Install dependencies
npm install

# Build the extension
npm run build

# For development with hot reload
npm run build:dev --watch
```

### Project Structure

```
src/
├── core/                          # Core extension system
│   ├── ExtensionCore.js           # Main coordinator
│   ├── SGSPageDetector.js         # Page detection
│   └── BasePageController.js      # Base controller class
├── shared/                        # Shared utilities
│   ├── constants/                 # Configuration and constants
│   ├── ui/                        # UI components
│   └── utils/                     # Common utilities
├── pages/                         # Page-specific features
│   ├── gradeEntry/               # Grade entry functionality
│   ├── studentList/              # Student management (planned)
│   └── reports/                  # Reports (planned)
└── content-scripts/              # Entry points
    └── grade-entry.js
```

### Build Commands

```bash
# Production build
npm run build

# Development build with source maps
npm run build:dev

# Watch mode for development
npm run build:watch

# Clean build artifacts
npm run clean

# Validate code and structure
npm run validate

# Run linter
npm run lint
npm run lint:fix
```

## 📦 Installation

### From Source

1. Run `npm run build` to create the `dist/` folder
2. Open Chrome/Edge extensions page (`chrome://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder

### For Firefox

1. Build the extension with `npm run build`
2. Go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select any file in the `dist/` folder

## 🎯 Usage

1. **Navigate** to the SGS grade entry page
2. **Select** subject and section from dropdowns
3. **Copy** grade data from Google Sheets (Ctrl+C)
4. **Click** "Fill from Clipboard" in the extension panel
5. **Verify** the imported grades and submit

### Data Format

The extension expects tab-separated data (Google Sheets format):
- Each row represents one student
- Columns should match the enabled grade columns in SGS
- First row can contain headers (automatically detected)
- Values should be numeric within the valid range for each column

## 🏗 Architecture

### Core Components

- **ExtensionCore**: Main coordinator managing page detection and service initialization
- **SGSPageDetector**: Intelligent page type detection and validation
- **BasePageController**: Abstract base class for all page-specific controllers

### Shared Services

- **NotificationManager**: Consistent user notifications
- **StyleManager**: CSS management and theming
- **DOMUtils**: Common DOM manipulation utilities
- **SGSFormHandler**: ASP.NET postback handling

### Grade Entry Features

- **ColumnDetector**: Dynamic grade column detection
- **ClipboardHandler**: Data parsing and validation
- **FieldUpdater**: Grade field updates with validation
- **GradeEntryUI**: User interface components

## 🧪 Testing

```bash
# Run validation checks
npm run validate

# Check build output
npm run build && ls -la dist/

# Manual testing
npm run build:dev
# Load extension in browser and test functionality
```

## 🔧 Configuration

Extension behavior can be configured in `src/shared/constants/Config.js`:

- Feature flags per page type
- UI positioning and styling
- Performance settings
- Validation rules

## 🚀 Deployment

### Development Release

```bash
npm run build:dev
# Load dist/ folder in browser for testing
```

### Production Release

```bash
npm run clean
npm run validate
npm run lint
npm run build
# Upload dist/ folder to extension store
```

## 📄 Browser Compatibility

- Chrome >= 88 (Manifest V3)
- Edge >= 88 (Manifest V3)
- Firefox >= 78 (with Manifest V2 compatibility)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the existing code style
4. Run validation: `npm run validate && npm run lint`
5. Test your changes thoroughly
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- SGS System compatibility
- Google Sheets integration patterns
- Modern browser extension best practices