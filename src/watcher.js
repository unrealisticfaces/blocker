const chokidar = require('chokidar');
const { log } = require('./utils');
const path = require('path');
const { ipcMain } = require('electron');
const { exec } = require('child_process');

const directoriesToWatch = [
    path.join(process.env.USERPROFILE, 'Downloads'),
    // Add other directories if needed
];

const installerKeywords = [
    'installer', 'setup', 'install', 'update'
];

function isPotentialInstaller(filePath) {
    const filename = path.basename(filePath).toLowerCase();
    if (!filename.endsWith('.exe') && !filename.endsWith('.bat')) {
        return false;
    }

    for (const keyword of installerKeywords) {
        if (filename.includes(keyword)) {
            return true;
        }
    }
    return false;
}

async function getPsList() {
    const psListModule = await import('ps-list');
    return psListModule.default;
}

async function checkRunningProcesses() {
    const psList = await getPsList(); // Get the psList function
    const processes = await psList(); // Get the list of processes only once

    log('Checking running processes...'); // Log when the function starts

    for (const process of processes) {
        if (isPotentialInstaller(process.name)) {
            log(`Suspicious process found: ${process.name} (PID: ${process.pid})`);
            terminateProcess(process.pid, process.name);
        }
    }
}

function terminateProcess(pid, name) {
    log(`Attempting to terminate process: ${name} (PID: ${pid})`); // Log before termination

    exec(`taskkill /pid ${pid} /f`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error terminating process: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error in taskkill command: ${stderr}`);
            return;
        }
        log(`Process ${name} (PID: ${pid}) terminated.`);
        ipcMain.emit('blocked-execution', name); // Send notification to the renderer process
    });
}

function initializeWatcher() {
    const watcher = chokidar.watch(directoriesToWatch, {
        ignored: /(^|[\/\\])\../, // Ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        depth: 0,
    });

    watcher.on('add', async (filePath) => {
        if (isPotentialInstaller(filePath)) {
            log(`Potential installer detected: ${filePath}`);
            // Check running processes immediately when a potential installer is detected
            checkRunningProcesses();
        }
    });

    // Periodically check running processes as a backup (more frequently now)
    setInterval(checkRunningProcesses, 100); // Check every 1 second
}

module.exports = { initializeWatcher };