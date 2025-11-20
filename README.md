# NVI Investment Dashboard

**National Veterinary Institute - Comprehensive Reform Plan**
Investment Decision Support System for Ethiopian Investment Holdings

## Overview

The NVI Investment Dashboard is a standalone Electron desktop application designed to help Ethiopian Investment Holdings (EIH) prioritize and analyze $8.5M-$24.7M in capital investments across 23 vaccine production lines at the National Veterinary Institute (NVI).

### Key Features

- **Offline Capability**: Works without internet connection
- **Cross-Platform**: Available for Windows, macOS, and Linux
- **Interactive Visualizations**: Dynamic scatter plots and charts
- **Excel Integration**: Import and export data via Excel files
- **Real-time Analysis**: Instant recalculation and ranking

## Three Main Modules

### 1. Equipment Investment Prioritization
Interactive scatter plot visualization of all 23 production lines:
- **X-axis**: Investment Required ($ Millions)
- **Y-axis**: Impact Score (0-100)
- **Bubble Size**: Implementation Complexity
- **Bubble Color**: Risk Level (Red/Orange/Green)

**Features**:
- Four filter options (All, Critical Only, High Revenue, Strategic)
- Live statistics dashboard
- Detailed equipment information panels
- Click-to-view detailed specifications

### 2. Product Portfolio Optimizer
Multi-criteria decision matrix with weighted scoring:
- **5 Adjustable Weights**: Market Demand, Profit Margin, Technical Feasibility, Competitive Position, Regulatory Complexity
- **Real-time Ranking**: Products automatically re-rank as weights change
- **Auto-normalization**: Weights automatically adjust to total 100%

**Priority Classification**:
- Rank 1-4: High Priority (Red)
- Rank 5-8: Medium Priority (Orange)
- Rank 9-12: Low Priority (Green)

### 3. Scenario Comparison
Side-by-side analysis of three investment strategies:
- **Conservative**: $8.5M, 8 lines, 35% revenue growth
- **Moderate**: $15.2M, 15 lines, 65% revenue growth
- **Aggressive**: $24.7M, 23 lines, 120% revenue growth

**Includes**:
- Detailed scenario cards with metrics
- Investment vs Revenue Growth comparison chart
- Full analysis with included production lines
- Key benefits and considerations

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)

### Setup Instructions

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd nvi-investment-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application in development mode**
   ```bash
   npm start
   ```

## Building Installers

### Build for All Platforms
```bash
npm run build
```

### Build for Specific Platforms

**Windows**:
```bash
npm run build:win
```
Creates an NSIS installer (.exe) in the `dist` folder

**macOS**:
```bash
npm run build:mac
```
Creates a DMG installer (.dmg) in the `dist` folder

**Linux**:
```bash
npm run build:linux
```
Creates AppImage and .deb installers in the `dist` folder

### Installer Locations

After building, installers will be located in the `dist` folder:
- Windows: `dist/NVI Investment Dashboard Setup X.X.X.exe`
- macOS: `dist/NVI Investment Dashboard-X.X.X.dmg`
- Linux: `dist/NVI Investment Dashboard-X.X.X.AppImage` and `.deb`

## Usage Guide

### Navigating the Dashboard

1. **Launch the Application**: Double-click the installed application icon
2. **Select a Module**: Click on the tabs at the top to switch between modules
3. **Import Data**: Click "Import Excel" to load custom data
4. **Export Data**: Click "Export Data" to save current data to Excel

### Module 1: Equipment Investment Prioritization

1. **View All Production Lines**: The scatter plot displays all 23 lines by default
2. **Apply Filters**: Click filter buttons to focus on specific categories
3. **View Details**: Click any bubble to see detailed equipment information
4. **Monitor Statistics**: Watch the four live statistics cards update automatically

### Module 2: Product Portfolio Optimizer

1. **Adjust Weights**: Move the sliders to change priority weights
2. **View Rankings**: Products automatically re-rank in real-time
3. **View Details**: Click "View Details" to see comprehensive product metrics
4. **Reset Weights**: Click "Reset to Equal Weights" to return to 20% each

### Module 3: Scenario Comparison

1. **Review Scenarios**: Examine the three side-by-side scenario cards
2. **Compare Metrics**: Use the chart to visualize investment vs revenue
3. **View Full Analysis**: Click "View Full Analysis" for detailed breakdown
4. **Review Production Lines**: See which lines are included in each scenario

## Data Management

### JSON Data Files

Data is stored in the `data` folder:
- `equipment.json`: 23 production lines with specifications
- `products.json`: 12 vaccines and pharmaceuticals
- `scenarios.json`: Three investment scenarios

### Excel Import Format

When importing Excel files, ensure columns match these names:

**Equipment Data**:
- name, investment, impactScore, complexity, riskLevel, priority, gmpCompliance, revenueImpact, strategicImportance, roiTimeline, category, description

**Product Data**:
- name, type, marketDemand, profitMargin, technicalFeasibility, competitivePosition, regulatoryComplexity, estimatedInvestment, currentProduction, potentialProduction

### Excel Export

The "Export Data" button creates an Excel file with three sheets:
1. Equipment (all production lines)
2. Products (all vaccines/drugs)
3. Scenarios (all three scenarios)

Files are saved to your Downloads folder with a timestamp.

## Project Structure

```
nvi-investment-dashboard/
├── main.js                 # Electron main process
├── package.json            # Project configuration
├── data/                   # JSON data files
│   ├── equipment.json
│   ├── products.json
│   └── scenarios.json
├── src/                    # Application source code
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Application styles
│   ├── navigation.js      # Tab navigation
│   ├── module1.js         # Equipment prioritization
│   ├── module2.js         # Product portfolio
│   ├── module3.js         # Scenario comparison
│   └── excel-import.js    # Excel functionality
├── assets/                 # Application assets
│   └── icon.png           # Application icon
└── dist/                   # Build output (generated)
```

## Technical Specifications

### Built With
- **Electron**: v28.0.0 - Desktop application framework
- **Chart.js**: v4.4.1 - Interactive visualizations
- **XLSX**: v0.18.5 - Excel import/export

### System Requirements
- **Windows**: Windows 7 or later
- **macOS**: macOS 10.12 or later
- **Linux**: Ubuntu 18.04 or later (or equivalent)
- **RAM**: 4GB minimum
- **Disk Space**: 200MB

## Development

### Running in Development Mode
```bash
npm start
```

### Debugging
Uncomment this line in `main.js` to open DevTools:
```javascript
mainWindow.webContents.openDevTools();
```

### Modifying Data
Edit JSON files in the `data` folder to customize:
- Production line specifications
- Product metrics
- Scenario parameters

## Support

For issues, questions, or feature requests, please contact:
- **Organization**: Ethiopian Investment Holdings
- **Project**: NVI Comprehensive Reform Plan

## License

ISC License - Internal use by Ethiopian Investment Holdings

## Version History

- **v1.0.0** (2024): Initial release
  - Equipment Investment Prioritization module
  - Product Portfolio Optimizer module
  - Scenario Comparison module
  - Excel import/export functionality
  - Cross-platform desktop application

---

**Developed for Ethiopian Investment Holdings**
Supporting the National Veterinary Institute Comprehensive Reform Plan
