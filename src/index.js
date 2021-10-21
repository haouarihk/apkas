const adb = require('android-platform-tools');
const fs = require('fs');
const { join } = require("path")
const { exec } = require("child_process")
const colors = require('colors');

const argv = require('yargs')
    .usage('Usage: $0 <command> [target path]')
    .command('-f', 'forces update for adb')
    .command('-l', 'lists devices')
    .command('-d', 'use device <device name>')
    .command('-debug', 'debugger mode')
    .argv;


const configPath = "./config.json"
let currentConfig = {
    adbPath: false,
};


let currentPath = '';
let selectedDevice = '';
let devices = [];


async function start(args) {
    currentPath = join(args[0], "..");

    await getSettings();

    const targetPath = argv._;
    const forceUpdate = argv.f;
    selectedDevice = argv.d || currentConfig.device;

    await downloadTools(forceUpdate, currentConfig.adbPath)

    // list all devices if the user wants to
    if (argv.l || argv.list) {
        return await showAllDevices()
    }

    if (argv.d) {
        await connectToDevice(devices)
        updateConfing({ device: selectedDevice })
    }


    if (!targetPath || targetPath?.length === 0) return

    // check if we have a adb device connected
    devices = await getListDevices()

    if (!selectedDevice) {
        if (devices.length === 0) {
            console.log("No device connected")
            return
        }

        if (devices.length > 1) {
            console.log("More than one device connected")
            await showAllDevices();
            await connectToDevice(await selectFrom(devices));
        }

    }


    // check if we have a adb device connected
    const device = devices[0]
    console.log("Device connected:", device)

    if (targetPath.length > 1) {
        console.log("Only one target is allowed")
        return;
    }


    // execute the install command
    await adbInstallApp(targetPath).catch(console.error)



}



async function downloadTools(forceUpdate = false) {
    if (!forceUpdate && currentConfig.adbPath && fs.existsSync(currentConfig.adbPath))
        return { adbPath: currentConfig.adbPath }


    const { path: adbDirPath } = await adb
        .downloadTools("./adb", currentPath).catch(err => { throw `couldn't download adb: ${err}` })

    await updateConfing({ adbPath: join(adbDirPath, './adb.exe') })

    return { adbPath: join(adbDirPath, './adb.exe') }
}



async function getSettings() {
    if (fs.existsSync(join(currentPath, configPath))) {
        return currentConfig = JSON.parse(fs.readFileSync(join(currentPath, configPath)))
    }

    const _default = {
        adbPath: false,
    }

    // else create that config file
    fs.writeFileSync(join(currentPath, configPath), JSON.stringify(_default))
    currentConfig = { ..._default }
}

async function updateConfing(newConfigData) {
    // read data 
    const currentConfig = await getSettings()
    fs.writeFileSync(join(currentPath, configPath), JSON.stringify(
        {
            ...currentConfig,
            ...newConfigData
        }
    ))
}


const readline = require('readline');
async function selectFrom(list) {
    let answeredcorrectly = false;
    while (!answeredcorrectly) {
        readline.question(`Select a device: ${list.map(lit)}`, (answer) => {
            if (answer >= 0 && answer < list.length) {

                const index = parseInt(answer)

                answeredcorrectly = true;

                if (index >= 0 && index < list.length) {
                    readline.close()
                    return list[index]
                }

                console.log("Invalid Input")
                return selectFrom(list);
            }
        })
    }
}


async function showAllDevices() {
    console.log("devices:".underline.green)
    console.log(`${(await getListDevices()).map(lit)}`.yellow)

    holdon()
}



function getListDevices() {
    return executeUntilProcesExitsButWithList(`${currentConfig.adbPath} devices`).then(str => str.join('\n')
        .split('\n')
        .filter(s => s.length > 1)
        .map(st => st
            .split('\t')[0]
            .replace("\r", ""))
        .slice(1)
    )
}

function connectToDevice(device) {
    return executeUntilProcesExitsButWithList(`${currentConfig.adbPath} connect ${device}`)
}


function adbInstallApp(target) {
    return executeUntilProcesExits(`${currentConfig.adbPath} install ${target}`)
}


async function executeUntilProcesExitsButWithList(command) {
    const list = [];
    return new Promise((resolve, reject) => {
        const child = exec(command, (err, stdout, stderr) => {
            if (err) {
                console.log(err)
                reject(err)
            }
            list.push(stdout)
        })
        child.addListener('close', () => resolve(list));
        child.addListener('error', () => resolve(list));
    })
}


async function executeUntilProcesExits(command) {
    return new Promise((resolve, reject) => {
        const child = exec(command, (err, stdout, stderr) => {
            if (err) {
                console.log(err)
                reject(err)
            }
            console.log(stdout)
        })
        child.addListener('close', resolve);
        child.addListener('error', resolve);
    })
}


function lit(str, index) {
    if (selectedDevice === undefined || selectedDevice === null) {
        return `[ ${index} ] ${(selectedDevice === str) ? str.green : str}`
    }

    return `[ ${(selectedDevice === str) ? 'X'.green : ""} ] ${index} - ${(selectedDevice === str) ? str.green : str}`
}

function holdon() {
    console.log("press any key to continue")
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
        process.exit();
    })
}

module.exports = start