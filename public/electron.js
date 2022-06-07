const {
  app,
  ipcMain,
  BrowserWindow,
  Notification,
  Tray,
  Menu: { buildFromTemplate, setApplicationMenu },
  screen,
} = require("electron");

const isDev = process.env.NODE_ENV === "development";

let mainWindow = null;

const Hand = async () => {
  //当electron完成初始化后触发init-day-data
  mainWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 650,
    resizable: false,
    // frame: false, //无边框
    transparent: false, //透明
    alwaysOnTop: false,
    hasShadow: false, //阴影
    icon: '../assets/icon.ico',
    webPreferences: {
      nodeIntegration: true, //是否使用node
      enableRemoteModule: true, //是否有子页面
      contextIsolation: false, //是否禁止node
      nodeIntegrationInSubFrames: true, //否允许在子页面(iframe)或子窗口(child window)中集成Node.js
    },
  });

  isDev
    ? mainWindow.loadURL(`http://localhost:3000`)
    : mainWindow.loadURL(`file://${__dirname}\\index.html`);
  
  // 配置菜单
  setApplicationMenu(buildFromTemplate([]));

  // 打开调试
  ipcMain.on("init-devtool", e =>
    mainWindow.webContents.openDevTools({ mode: "detach" })
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit(); //应用退出的时候触发
  });
  
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
};

app.on("ready", () => {
  Hand();
});

app.on('window-all-closed', () => {
  // 非mac下
  if (process.platform !== 'darwin') {
      app.quit();
  }
});

app.on("activate", () => mainWindow === null && Hand());
