const electron = require('electron');
const wpilib_nt =require('wpilib-nt-client')
const client=new wpilib_nt.Client();
const app=electron.app;
const BrowserWindow=electron.BrowserWindow;
const ipc=electron.ipcMain;

client.setReconnectDelay(1000);
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

let clientDataListener = (key, val, valType, mesgType, id, flags) => {
  if (val === 'true' || val === 'false') {
      val = val === 'true';
  }
  mainWindow.webContents.send(mesgType, {
      key,
      val,
      valType,
      id,
      flags
  });
};

function createWindow () {
  client.start((con, err) => {
    
            let connectFunc = () => {
                console.log('Sending status');
                mainWindow.webContents.send('connected', con);
    
                // Listens to the changes coming from the client
            };
    
            // If the Window is ready than send the connection status to it
            if (ready) {
                connectFunc();
            }
            connectedFunc = connectFunc;
        });
        // When the script starts running in the window set the ready variable
        ipc.on('ready', (ev, mesg) => {
            console.log('NetworkTables is ready');
            ready = mainWindow != null;
    
            // Remove old Listener
            client.removeListener(clientDataListener);
    
            // Add new listener with immediate callback
            client.addListener(clientDataListener, true);
    
            // Send connection message to the window if if the message is ready
            if (connectedFunc) connectedFunc();
        });
        // When the user chooses the address of the bot than try to connect
        ipc.on('connect', (ev, address, port) => {
            console.log(`Trying to connect to ${address}` + (port ? ':' + port : ''));
            let callback = (connected, err) => {
                console.log('Sending status');
                mainWindow.webContents.send('connected', connected);
            };
            if (port) {
                client.start(callback, address, port);
            } else {
                client.start(callback, address);
            }
        });
        ipc.on('add', (ev, mesg) => {
            client.Assign(mesg.val, mesg.key, (mesg.flags & 1) === 1);
        });
        ipc.on('update', (ev, mesg) => {
            client.Update(mesg.id, mesg.val);
        });
        ipc.on('windowError', (ev, error) => {
            console.log(error);
        });
    win = new BrowserWindow({ width: 1380, height: 550, frame: false})
    win.setMenu(null);
    win.setMenuBarVisibility(false);
    win.setPosition(0,0);
    win.setResizable(false);
    win.loadFile('index.html')
    win.on('closed', () => {
        win = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.on('closed',()=>{
  connectedFunc = null;
  client.removeListener(clientDataListener);
});