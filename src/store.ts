import { ipcRenderer } from 'electron'
import { reactive, toRaw } from 'vue'
import {
  deleteConfigNode,
  getNode,
  getSelectedNode,
  sysHostsId,
  visitConfigNode
} from './common/config'
import { Config } from './define'
import { IPC_EVENTS, IPC_RENDER_EVENTS } from './const'
import { uuid } from './utils'

export const store = reactive<Config>(window.__preload__.store)

// @ts-ignore
window.__store = store

export const actions = {
  getSelectedNode() {
    return getSelectedNode(store)
  },
  removeConfigNode(id: string) {
    return deleteConfigNode(store, id)
  },
  addConfigNode(label: string, isGroup: boolean) {
    if (isGroup) {
      store.hosts.push({
        label,
        id: uuid(),
        mode: 'single',
        children: []
      })
    } else {
      store.hosts.push({
        label,
        id: uuid(),
        checked: false,
        source: ''
      })
    }

    return actions.saveConfig()
  },
  saveConfig() {
    return ipcRenderer.invoke(IPC_EVENTS.SAVE_CONFIG, toRaw(store))
  },
  async resetConfig() {
    const conf = await ipcRenderer.invoke(IPC_EVENTS.RESET_CONFIG)
    for (const key in conf) {
      // @ts-ignore
      store[key] = conf[key]
    }
  },
  saveHosts() {
    const hosts: string[] = []

    visitConfigNode(store, (node) => node.checked && hosts.push(node.source))

    const conf = getNode(store, sysHostsId)

    if (conf) {
      conf.source = hosts.join('\n')
    }

    return ipcRenderer.invoke(IPC_EVENTS.SAVE_HOSTS, toRaw(store))
  },
  setPassword(password: string) {
    return ipcRenderer.invoke(IPC_EVENTS.SET_PASSWORD, password)
  }
}

ipcRenderer.on(IPC_RENDER_EVENTS.UPDATE_CONFIG, (_, conf) => {
  for (const key in conf) {
    // @ts-ignore
    store[key] = conf[key]
  }
})
