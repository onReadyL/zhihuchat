export const puppeteer = window.require("puppeteer");
export const schedule = require("node-schedule"); // 定时任务
export const {
  ipcRenderer,
  shell: { openExternal },
  remote: {
    dialog: { showOpenDialogSync },
  },
} = window.require("electron");

export const child_process = window.require('child_process');
export const chromeRemoteInterface = window.require('chrome-remote-interface');
export const Version = window.require('chrome-remote-interface').Version;
export const path = window.require('path');

export const chromePath = process.env.NODE_ENV === 'development' ? path.join(process.cwd(), '/Chrome/App/chrome.exe') : path.join(process.cwd(), '/resources/Chrome/App/chrome.exe');

export const ipcasync = async (name, obj = null) => {
  ipcRenderer.send(name, obj);
  return await new Promise(resolve => {
    ipcRenderer.on(`${name}-reply`, (event, arg) => resolve(arg));
  });
};

export const setSchedule = _is => {
  let current = schedule.scheduleJob("30 1 * * * *", async () => {
    let waps = await ipcasync("init-like");
    if (waps.length && _is) {
      let url = waps[Math.floor(Math.random() * waps.length)].maxsrc;
      try {
        let res = await ipcasync("download", { url, path: "" });
       
      } catch (error) {
        console.log(error);
      }
    }
  });
  !_is && current.cancel();
};

export const opendevtool = async () => await ipcasync("init-devtool");

export const waitFor = (time, response) => new Promise(res => setTimeout(() => { res(response) }, time))