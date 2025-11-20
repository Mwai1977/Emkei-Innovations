const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'NVI Investment Dashboard'
  });

  mainWindow.loadFile('src/index.html');

  // Open DevTools in development mode (comment out for production)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for data operations
ipcMain.handle('load-equipment-data', async () => {
  try {
    const dataPath = path.join(__dirname, 'data', 'equipment.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading equipment data:', error);
    return [];
  }
});

ipcMain.handle('load-products-data', async () => {
  try {
    const dataPath = path.join(__dirname, 'data', 'products.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading products data:', error);
    return [];
  }
});

ipcMain.handle('load-scenarios-data', async () => {
  try {
    const dataPath = path.join(__dirname, 'data', 'scenarios.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading scenarios data:', error);
    return {};
  }
});

ipcMain.handle('save-equipment-data', async (event, data) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'equipment.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving equipment data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-excel', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
  } catch (error) {
    console.error('Error importing Excel:', error);
    return { success: false, error: error.message };
  }
});
