# NVI Investment Dashboard

A standalone Electron desktop application for the National Veterinary Institute (NVI) Comprehensive Reform Plan investment decision support. This tool helps Ethiopian Investment Holdings (EIH) prioritize $8.5M-$24.7M in capital investments across 23 vaccine production lines.

## Features

### 1. Equipment Investment Prioritization
- Interactive scatter plot showing all 23 production lines
- Visual analysis of Investment vs Impact with bubble sizing by complexity
- Color-coded risk levels (Red=High, Orange=Medium, Green=Low)
- Live statistics dashboard showing:
  - Total CAPEX Required
  - Critical Lines Count
  - Average ROI Timeline
  - GMP Compliance Gap
- Filtering options:
  - All Production Lines
  - Critical Only (GMP/Safety priority)
  - High Revenue Impact (score ≥80)
  - Strategic (AU PANVAC/Regional)

### 2. Product Portfolio Optimizer
- Multi-criteria decision matrix with 5 weighted sliders
- Real-time weighted scoring calculation
- Auto-normalized weights
- Interactive ranking table with priority badges
- Criteria weights:
  - Market Demand
  - Profit Margin
  - Technical Feasibility
  - Competitive Position
  - Regulatory Complexity (inverse)

### 3. Scenario Comparison
- Side-by-side comparison of 3 investment strategies:
  - **Conservative**: $8.5M, 8 Critical Lines, +35% Revenue, 4.5yr ROI
  - **Moderate**: $15.2M, 15 Lines, +65% Revenue, 3.8yr ROI
  - **Aggressive**: $24.7M, All 23 Lines, +120% Revenue, 3.2yr ROI
- Dual-axis comparison chart

### 4. Data Management
- Excel import capability (.xlsx files)
- PDF export for board presentations
- Local JSON data storage
- Offline operation

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Setup Instructions

1. **Clone or download the repository**
   ```bash
   cd Emkei-Innovations
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

## Building Installers

### Build for all platforms
```bash
npm run build
```

### Build for specific platforms

**Windows (NSIS installer)**
```bash
npm run build:win
```

**macOS (DMG)**
```bash
npm run build:mac
```

**Linux (AppImage)**
```bash
npm run build:linux
```

Installers will be created in the `dist/` directory.

## Project Structure

```
Emkei-Innovations/
├── main.js              # Electron main process
├── index.html           # Application UI
├── renderer.js          # Frontend logic and charts
├── styles.css           # Professional styling
├── package.json         # Dependencies and build config
├── data/
│   ├── equipment.json   # 23 production lines data
│   └── products.json    # 12 vaccine products data
└── README.md
```

## Data Files

### equipment.json
Contains 23 vaccine production lines with:
- Investment amount ($M)
- Impact score (0-100)
- Implementation complexity (30-90)
- Risk level (high/medium/low)
- Priority classification
- ROI timeline
- GMP compliance percentage

### products.json
Contains 12 vaccine/drug products with:
- Market demand score
- Profit margin score
- Technical feasibility score
- Competitive position score
- Regulatory complexity score
- Investment range estimate

## Usage Guide

### Navigation
- Use the top navigation tabs to switch between modules
- Click on bubbles in the Equipment chart to see detailed information
- Adjust sliders in Portfolio Optimizer to change prioritization weights
- Compare scenarios side-by-side in Scenario Comparison

### Excel Import
1. Click "Import Excel" button
2. Select an .xlsx file with proper column structure
3. Review the preview
4. Confirm to import data

**Expected Excel Format:**

**Equipment Sheet:**
| Name | Investment | Impact | Complexity | Risk | Type | Priority |
|------|-----------|--------|------------|------|------|----------|

**Products Sheet:**
| Name | Type | Demand | Margin | Feasibility | Competitive | Regulatory |
|------|------|--------|--------|-------------|-------------|-----------|

### PDF Export
1. Navigate to the module you want to export
2. Click "Export PDF" button
3. Choose save location
4. PDF will be generated with current view

## Technical Details

### Technologies Used
- **Electron**: Desktop application framework
- **Chart.js**: Interactive data visualization
- **Node.js**: Backend runtime
- **HTML/CSS/JavaScript**: Frontend
- **electron-builder**: Cross-platform installer creation

### Color Scheme
- **Primary Blue**: #1e40af (dark), #3b82f6 (bright)
- **Success Green**: #10b981 (low risk)
- **Warning Orange**: #f59e0b (medium priority/risk)
- **Danger Red**: #dc2626 (high priority/risk/critical)
- **Neutral Gray**: #64748b (secondary text)

## System Requirements

- **OS**: Windows 10+, macOS 10.13+, Ubuntu 18.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Display**: 1200x800 minimum resolution
- **Storage**: 200MB free space

## Development

### Run in development mode
```bash
npm start
```

### Enable DevTools
Uncomment this line in `main.js`:
```javascript
mainWindow.webContents.openDevTools();
```

## License

MIT License - Ethiopian Investment Holdings (EIH)

## Support

For issues or questions, contact:
- Ethiopian Investment Holdings (EIH)
- National Veterinary Institute (NVI)

## Version

**Version 1.0.0** - Initial Release

---

**Built for Ethiopian Investment Holdings (EIH)**
National Veterinary Institute Comprehensive Reform Plan
