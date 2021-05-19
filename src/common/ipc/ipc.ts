/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Inter-process communications (main <-> renderer)
// https://www.electronjs.org/docs/api/ipc-main
// https://www.electronjs.org/docs/api/ipc-renderer

import { ipcMain, ipcRenderer, webContents, remote } from "electron";
import { toJS } from "mobx";
import logger from "../../main/logger";
import { ClusterFrameInfo, clusterFrameMap } from "../cluster-frames";
import type { Disposer } from "../utils";

const subFramesChannel = "ipc:get-sub-frames";

export async function requestMain(channel: string, ...args: any[]) {
  return ipcRenderer.invoke(channel, ...args);
}

function getSubFrames(): ClusterFrameInfo[] {
  return toJS(Array.from(clusterFrameMap.values()), { recurseEverything: true });
}

export function broadcastMessage(channel: string, ...args: any[]) {
  const views = (webContents || remote?.webContents)?.getAllWebContents();

  if (!views) return;

  ipcRenderer?.send(channel, ...args);
  ipcMain?.emit(channel, ...args);

  const subFramesP = ipcRenderer
    ? requestMain(subFramesChannel)
    : Promise.resolve(getSubFrames());

  subFramesP
    .then(subFrames => {
      for (const view of views) {
        try {
          logger.silly(`[IPC]: broadcasting "${channel}" to ${view.getType()}=${view.id}`, { args });
          view.send(channel, ...args);

          for (const frameInfo of subFrames) {
            view.sendToFrame([frameInfo.processId, frameInfo.frameId], channel, ...args);
          }
        } catch (error) {
          logger.error("[IPC]: failed to send IPC message", { error: String(error) });
        }
      }
    });
}

export function ipcMainOn(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => any): Disposer {
  ipcMain.on(channel, listener);

  return () => ipcMain.off(channel, listener);
}

export function ipcRendererOn(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => any): Disposer {
  ipcRenderer.on(channel, listener);

  return () => ipcRenderer.off(channel, listener);
}

export function bindBroadcastHandlers() {
  ipcMain.handle(subFramesChannel, getSubFrames);
}
