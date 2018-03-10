'use strict'

import { app, ipcMain, BrowserWindow, shell } from 'electron'
import Datastore from 'nedb'
import storage from 'electron-json-storage'
import empty from 'is-empty'

import Authentication from './auth'
import Account from './account'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

let db = new Datastore({
  filename: 'whalebird.db',
  autoload: true
})

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

let auth = new Authentication(db)

ipcMain.on('get-auth-url', (event, domain) => {
  auth.getAuthorizationUrl(domain)
    .catch((err) => {
      console.error(err)
      event.sender.send('error-get-auth-url', err)
    })
    .then((url) => {
      console.log(url)
      event.sender.send('response-get-auth-url', url)
      // Open authorize url in default browser.
      shell.openExternal(url)
    })
})

ipcMain.on('get-access-token', (event, code) => {
  auth.getAccessToken(code)
    .catch((err) => {
      console.error(err)
      event.sender.send('error-get-access-token', err)
    })
    .then((token) => {
      db.findOne({
        accessToken: token
      }, (err, doc) => {
        if (err) return event.sender.send('error-get-access-token', err)
        if (empty(doc)) return event.sender.send('error-get-access-token', 'error document is empty')
        event.sender.send('response-get-access-token', doc._id)
      })
    })
})

// json storage
ipcMain.on('get-social-token', (event, _) => {
  storage.get('config', (err, data) => {
    if (err || empty(data)) {
      console.log(err)
      event.sender.send('error-get-social-token', err)
    } else {
      event.sender.send('response-get-social-token', data.token)
    }
  })
})

// nedb
ipcMain.on('list-accounts', (event, _) => {
  const account = new Account(db)
  account.listAccounts()
    .catch((err) => {
      console.error(err)
      event.sender.send('error-list-accounts', err)
    })
    .then((accounts) => {
      event.sender.send('response-list-accounts', accounts)
    })
})

ipcMain.on('get-instance', (event, id) => {
  const account = new Account(db)
  account.getInstance(id)
    .catch((err) => {
      event.sender.send('error-get-instance', err)
    })
    .then((instance) => {
      event.sender.send('response-get-instance', instance)
    })
})

ipcMain.on('get-local-account', (event, id) => {
  const account = new Account(db)
  account.getAccount(id)
    .catch((err) => {
      event.sender.send('error-get-local-account', err)
    })
    .then((token) => {
      event.sender.send('response-get-local-account', token)
    })
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
