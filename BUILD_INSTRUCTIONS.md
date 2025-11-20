# Building NVI Investment Dashboard Installers

## Quick Start Guide

Follow these steps to build the Windows, macOS, or Linux installer on your local machine.

### Prerequisites

1. **Install Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - Verify installation: Open terminal/command prompt and run:
     ```bash
     node --version
     npm --version
     ```

### Step 1: Download the Project

**Option A: Clone from GitHub (Recommended)**
```bash
git clone https://github.com/Mwai1977/Emkei-Innovations.git
cd Emkei-Innovations
git checkout claude/nvi-investment-dashboard-01GNNo1gUwC9wgJXdkp1mdT1
```

**Option B: Download ZIP**
1. Go to: https://github.com/Mwai1977/Emkei-Innovations
2. Click on the branch dropdown and select `claude/nvi-investment-dashboard-01GNNo1gUwC9wgJXdkp1mdT1`
3. Click "Code" → "Download ZIP"
4. Extract the ZIP file to a folder
5. Open terminal/command prompt in that folder

### Step 2: Install Dependencies

Open terminal/command prompt in the project folder and run:

```bash
npm install
```

This will download all required packages (Electron, Chart.js, XLSX library, etc.)

**Note**: This may take 2-5 minutes depending on your internet speed.

### Step 3: Build the Installer

Choose the installer for your operating system:

#### For Windows Users:
```bash
npm run build:win
```
**Output**: Creates `dist/NVI Investment Dashboard Setup 1.0.0.exe` (approximately 150-200MB)

#### For macOS Users:
```bash
npm run build:mac
```
**Output**: Creates `dist/NVI Investment Dashboard-1.0.0.dmg`

#### For Linux Users:
```bash
npm run build:linux
```
**Output**: Creates both:
- `dist/NVI Investment Dashboard-1.0.0.AppImage`
- `dist/NVI Investment Dashboard_1.0.0_amd64.deb`

#### Build All Platforms (if needed):
```bash
npm run build
```

### Step 4: Locate Your Installer

After the build completes:

1. Navigate to the `dist` folder in your project directory
2. Find your installer:
   - **Windows**: `NVI Investment Dashboard Setup 1.0.0.exe`
   - **macOS**: `NVI Investment Dashboard-1.0.0.dmg`
   - **Linux**: `NVI Investment Dashboard-1.0.0.AppImage` or `.deb` file

### Step 5: Install the Application

#### Windows Installation:
1. Double-click `NVI Investment Dashboard Setup 1.0.0.exe`
2. Follow the installation wizard
3. The app will be installed to `C:\Users\YourName\AppData\Local\Programs\nvi-investment-dashboard`
4. A desktop shortcut will be created
5. Launch from Start Menu or desktop shortcut

#### macOS Installation:
1. Double-click the `.dmg` file
2. Drag "NVI Investment Dashboard" to Applications folder
3. Launch from Applications or Launchpad
4. If macOS blocks it (security), go to System Preferences → Security & Privacy → Click "Open Anyway"

#### Linux Installation:

**For AppImage:**
1. Make it executable: `chmod +x "NVI Investment Dashboard-1.0.0.AppImage"`
2. Double-click to run, or: `./NVI\ Investment\ Dashboard-1.0.0.AppImage`

**For .deb (Ubuntu/Debian):**
```bash
sudo dpkg -i nvi-investment-dashboard_1.0.0_amd64.deb
```

## Testing Before Building

To test the app without building an installer:

```bash
npm start
```

This runs the app in development mode. Press `Ctrl+C` to stop.

## Troubleshooting

### Issue: "npm install" fails
**Solution**:
- Ensure you have a stable internet connection
- Try: `npm cache clean --force` then `npm install` again
- Update npm: `npm install -g npm@latest`

### Issue: Build fails on Windows
**Solution**:
- Install Windows Build Tools: `npm install --global windows-build-tools` (run as Administrator)
- Ensure you have enough disk space (at least 1GB free)

### Issue: Build fails on macOS
**Solution**:
- Install Xcode Command Line Tools: `xcode-select --install`
- Accept Xcode license if prompted

### Issue: Build fails on Linux
**Solution**:
- Install required dependencies:
  ```bash
  sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libxcb-dri3-0
  ```

### Issue: "electron-builder" not found
**Solution**:
- Install globally: `npm install -g electron-builder`
- Or use: `npx electron-builder`

## Build Output Sizes

Expected installer sizes:
- **Windows (.exe)**: ~150-200 MB
- **macOS (.dmg)**: ~180-220 MB
- **Linux (.AppImage)**: ~170-210 MB
- **Linux (.deb)**: ~150-200 MB

## Distribution

Once built, you can:
1. **Share the installer** - Copy the file from `dist` folder to USB drive, cloud storage, or email
2. **Install on multiple machines** - The installer is portable and can be installed on any compatible machine
3. **No internet required** - The app works completely offline after installation

## Version Information

- **Application Version**: 1.0.0
- **Electron Version**: 28.0.0
- **Supported OS**: Windows 7+, macOS 10.12+, Ubuntu 18.04+

## Building from Different Branch

If you want to ensure you're on the correct branch:

```bash
git fetch origin
git checkout claude/nvi-investment-dashboard-01GNNo1gUwC9wgJXdkp1mdT1
git pull origin claude/nvi-investment-dashboard-01GNNo1gUwC9wgJXdkp1mdT1
npm install
npm run build:win  # or build:mac or build:linux
```

## Support

For build issues or questions:
- Check the main README.md for application documentation
- Verify all prerequisites are installed correctly
- Ensure you're in the correct project directory

---

**Ready to distribute your NVI Investment Dashboard!**

After building, your installer is a standalone executable that can be shared with anyone. No additional files needed!
