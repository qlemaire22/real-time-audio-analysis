const { app, BrowserWindow } = require('electron')
var { spawn } = require('child_process')

let win;

function execute(command) {
  const exec = require('child_process').exec
  exec(command, (err, stdout, stderr) => {
    process.stdout.write(stdout)
  })
}

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 900,
    height: 600,
    backgroundColor: '#ffffff',
    icon: `file://${__dirname}/dist/real-time-audio-analysis/assets/logo.png`
  })

  win.loadURL(`file://${__dirname}/dist/real-time-audio-analysis/index.html`)
  let python = spawn('python', ["backend.py"])

  // Event when the window is closed.
  win.on('closed', function () {
    win = null
  })

  win.once('ready-to-show', () => {
     win.show()
  })

  var handleRedirect = (e, url) => {
    if(url != win.webContents.getURL()) {
      e.preventDefault()
      require('electron').shell.openExternal(url)
    }
  }

  win.webContents.on('will-navigate', handleRedirect)
  win.webContents.on('new-window', handleRedirect)

}

// Create window on electron intialization
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  execute("kill $(ps aux | grep backend.py | grep -v grep | awk '{print $2}')")
  app.quit()
})

app.on('activate', function () {
  if (win === null) {
    createWindow()
  }
})
