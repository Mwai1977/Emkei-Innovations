# How to Download and Build NVI Investment Dashboard

## 📥 Method 1: Download from GitHub (Easiest)

### Step-by-Step Instructions:

1. **Go to the GitHub Repository**
   - Open your web browser
   - Navigate to: `https://github.com/Mwai1977/Emkei-Innovations`

2. **Switch to the Correct Branch**
   - Click the branch dropdown (usually says "main" or "master")
   - Select: `claude/nvi-investment-dashboard-01GNNo1gUwC9wgJXdkp1mdT1`

3. **Download the Code**
   - Click the green "Code" button
   - Click "Download ZIP"
   - Save the file to your computer (e.g., Downloads folder)

4. **Extract the ZIP File**
   - Right-click the downloaded ZIP file
   - Select "Extract All..." (Windows) or double-click (Mac/Linux)
   - Choose a destination folder (e.g., `C:\Projects\NVI-Dashboard`)
   - Remember this location!

## 🔧 Method 2: Clone with Git (For Developers)

If you have Git installed:

```bash
git clone https://github.com/Mwai1977/Emkei-Innovations.git
cd Emkei-Innovations
git checkout claude/nvi-investment-dashboard-01GNNo1gUwC9wgJXdkp1mdT1
```

## 🚀 Building the Installer

### For Windows Users:

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Choose "LTS" version (e.g., 18.x or 20.x)
   - Run the installer, click "Next" through all steps
   - Restart your computer after installation

2. **Navigate to the Project Folder**
   - Open File Explorer
   - Go to where you extracted the ZIP file
   - You should see files like `package.json`, `main.js`, `README.md`

3. **Run the Build Script**

   **Option A: Double-Click Method (Easiest)**
   - Find the file: `build-windows.bat`
   - Double-click it
   - Wait for the process to complete (5-10 minutes)
   - The installer will be created in the `dist` folder

   **Option B: Command Line Method**
   - Hold `Shift` + Right-click in the folder
   - Select "Open PowerShell window here" or "Open Command window here"
   - Type: `npm install`
   - Then type: `npm run build:win`

4. **Find Your Installer**
   - Open the `dist` folder
   - Look for: `NVI Investment Dashboard Setup 1.0.0.exe`
   - This is your installer! (approximately 150-200 MB)

### For macOS Users:

1. **Install Node.js**
   - Download from: https://nodejs.org/
   - Install the LTS version
   - Open Terminal to verify: `node --version`

2. **Navigate to Project Folder**
   ```bash
   cd /path/to/Emkei-Innovations
   ```

3. **Build the Installer**
   ```bash
   npm install
   npm run build:mac
   ```

4. **Find Your Installer**
   - Check the `dist` folder
   - Look for: `NVI Investment Dashboard-1.0.0.dmg`

### For Linux Users:

1. **Install Node.js**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Fedora
   sudo dnf install nodejs
   ```

2. **Navigate to Project Folder**
   ```bash
   cd /path/to/Emkei-Innovations
   ```

3. **Run the Build Script**
   ```bash
   ./build-linux.sh
   ```

   Or manually:
   ```bash
   npm install
   npm run build:linux
   ```

4. **Find Your Installers**
   - Check the `dist` folder
   - You'll find both:
     - `NVI Investment Dashboard-1.0.0.AppImage`
     - `nvi-investment-dashboard_1.0.0_amd64.deb`

## 📦 What You Get

After building, you'll have a **standalone installer** that includes:

✅ Complete Electron desktop application
✅ All three analysis modules
✅ Sample data for 23 production lines
✅ Excel import/export functionality
✅ Professional dashboard interface
✅ Offline capability (no internet needed)

## 💾 Installer Details

| Platform | File Type | Size | Location |
|----------|-----------|------|----------|
| Windows | `.exe` | ~170 MB | `dist/NVI Investment Dashboard Setup 1.0.0.exe` |
| macOS | `.dmg` | ~200 MB | `dist/NVI Investment Dashboard-1.0.0.dmg` |
| Linux | `.AppImage` | ~190 MB | `dist/NVI Investment Dashboard-1.0.0.AppImage` |
| Linux | `.deb` | ~170 MB | `dist/nvi-investment-dashboard_1.0.0_amd64.deb` |

## 🔄 Sharing the Installer

Once built, you can share your installer:

1. **Copy to USB Drive**
   - Simply copy the installer file from `dist` folder to a USB drive
   - Plug into any compatible computer and install

2. **Upload to Cloud Storage**
   - Upload to Google Drive, Dropbox, OneDrive, etc.
   - Share the download link with colleagues

3. **Email** (if under size limit)
   - Attach the installer to an email
   - Note: Some email services limit attachment size to 25-50 MB

4. **Internal Network Share**
   - Copy to a shared network folder
   - Others can install from there

## 📋 Installation on Target Computers

### Windows:
1. Double-click the `.exe` file
2. Click "Yes" if prompted by User Account Control
3. Follow the installation wizard
4. Launch from Start Menu or desktop shortcut

### macOS:
1. Double-click the `.dmg` file
2. Drag app icon to Applications folder
3. Launch from Applications
4. If blocked by security: System Preferences → Security & Privacy → "Open Anyway"

### Linux (AppImage):
```bash
chmod +x "NVI Investment Dashboard-1.0.0.AppImage"
./NVI\ Investment\ Dashboard-1.0.0.AppImage
```

### Linux (Debian/Ubuntu):
```bash
sudo dpkg -i nvi-investment-dashboard_1.0.0_amd64.deb
```

## ❓ Troubleshooting

### "Node.js not recognized"
- Restart your terminal/command prompt after installing Node.js
- Or restart your computer

### "npm install" takes too long
- This is normal! It needs to download ~200 MB of dependencies
- Ensure you have a stable internet connection
- Typical time: 3-10 minutes depending on connection speed

### Build fails with "out of memory"
- Close other applications
- Ensure you have at least 2 GB free RAM
- Try building one platform at a time

### "Permission denied" on Linux
- Run: `chmod +x build-linux.sh`
- For global npm issues: Use `sudo npm install -g npm@latest`

## 🎯 Quick Reference

| Action | Windows Command | Linux/Mac Command |
|--------|----------------|-------------------|
| Install dependencies | `npm install` | `npm install` |
| Build installer | `npm run build:win` | `npm run build:linux` or `npm run build:mac` |
| Test without building | `npm start` | `npm start` |
| Clean build | `rmdir /s dist` | `rm -rf dist` |

## ✅ Verification

After building, verify your installer:

1. Check file size (should be 150-220 MB)
2. File should have the correct extension (.exe, .dmg, .AppImage, or .deb)
3. Test installation on a clean machine (optional but recommended)

## 📞 Support

If you encounter issues:

1. Check BUILD_INSTRUCTIONS.md for detailed troubleshooting
2. Ensure Node.js version is 16 or higher: `node --version`
3. Try clearing npm cache: `npm cache clean --force`
4. Delete `node_modules` folder and run `npm install` again

---

## 🎉 You're All Set!

Once you have your installer, you can:
- Install on unlimited computers
- Share with your team
- Deploy across your organization
- Use completely offline

**No license keys, no activation, no internet required after installation!**
