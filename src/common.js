export const puppeteer = window.require("puppeteer-core");
export const {
  ipcRenderer,
} = window.require("electron");

export const child_process = window.require('child_process');

export const chromeRemoteInterface = window.require('chrome-remote-interface');
export const Version = window.require('chrome-remote-interface').Version;

export const path = window.require('path');
export const os = window.require('os');
export const nodecrypto = window.require('crypto');

const Store = window.require('electron-store');
export const store = new Store(); // 创建实例

export const ipcasync = async (name, obj = null) => {
  ipcRenderer.send(name, obj);
  return await new Promise(resolve => {
    ipcRenderer.on(`${name}-reply`, (event, arg) => resolve(arg));
  });
};

export const opendevtool = async () => await ipcasync("init-devtool");

export const waitFor = (time, response) => new Promise(res => setTimeout(() => { res(response) }, time))