const { app, BrowserWindow, ipcMain, Notification, dialog, Tray, Menu } = require('electron');
const path = require('path');
const { initializeWatcher } = require('./src/watcher');

let mainWindow = null;
let popupWindow = null;
let tray = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'preload.js')
        },
    });

    mainWindow.loadFile('src/index.html');

    // Handle minimize event
    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    // Handle close event
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();

            // Show a notification (optional)
            const notification = new Notification({
                title: 'App is Still Running',
                body: 'The application is now running in the system tray.'
            });
            notification.show();
        }
        return false;
    });
}

function createPopupWindow() {
    if (popupWindow === null || popupWindow.isDestroyed()) {
        popupWindow = new BrowserWindow({
            width: 400,
            height: 200,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'src', 'popup-preload.js')
            },
            parent: mainWindow,
            modal: true,
            alwaysOnTop: true
        });

        popupWindow.loadFile('src/popup.html');
    }
}

app.whenReady().then(() => {
    createWindow();
    initializeWatcher();

    // Create tray icon
    tray = new Tray(path.join(__dirname, 'src', 'blockicon.ico')); 

    // Add a context menu (optional)
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);
    tray.setContextMenu(contextMenu);

    // Handle double-click on tray icon (optional)
    tray.on('double-click', () => {
        mainWindow.show();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

ipcMain.on('blocked-execution', (event, processName) => {
    const notification = new Notification({
        title: 'Installer Blocked',
        body: `Blocked: ${processName}`,
    });
    notification.show();

    createPopupWindow();
    if (popupWindow) {
        popupWindow.webContents.send('blocked-message', processName);
    }
});