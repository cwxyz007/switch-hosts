import { ipcRenderer } from 'electron'
import { reactive, toRaw } from 'vue'
import {
  deleteConfigNode,
  getNode,
  getSelectedNode,
  sysHostsId,
  visitConfigNode
} from './common/config'
import { Config, NotificationOption } from './define'
import { IPC_EVENTS, IPC_RENDER_EVENTS } from './const'
import { ElNotification } from 'element-plus'
import { uuid } from './utils'
import debounce from 'lodash/debounce'

export const store = reactive<Config>(window.__preload__.store)

// @ts-ignore
window.__store = store

const saveHosts = debounce(
  () => {
    const hosts: string[] = []

    visitConfigNode(store, (node) => node.checked && hosts.push(node.source))

    const conf = getNode(store, sysHostsId)

    if (conf) {
      conf.source = hosts.join('\n')
    }

    return ipcRenderer.invoke(IPC_EVENTS.SAVE_HOSTS, toRaw(store))
  },
  500,
  {
    leading: false,
    trailing: true
  }
)

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
  saveHosts,
  setPassword(password: string) {
    return ipcRenderer.invoke(IPC_EVENTS.SET_PASSWORD, password)
  }
}

ipcRenderer.on(IPC_RENDER_EVENTS.UPDATE_CONFIG, (_, conf: Config) => {
  for (const key in conf) {
    // @ts-ignore
    store[key] = conf[key]
  }
})

ipcRenderer.on(IPC_RENDER_EVENTS.NOTIFICATION, (_, opt: NotificationOption) => {
  ElNotification({
    type: opt.type,
    title: opt.title,
    message: opt.content,
    position: 'bottom-right',
    duration: 1500,
    showClose: true
  })
})
