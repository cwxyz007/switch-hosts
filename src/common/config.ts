import { Config, ConfigHostItem, ConfigNode, ConfigSchema } from '../define'

export function isSchema(c: ConfigSchema | ConfigNode): c is ConfigSchema {
  return !!(c as ConfigSchema).mode
}

export function isNode(c: ConfigSchema | ConfigNode): c is ConfigNode {
  return !isSchema(c)
}

/**
 *
 * @param visit 返回 true，跳出循环
 */
export function visitConfigItem(conf: Config, visit: (item: ConfigHostItem) => boolean | void) {
  for (const node of conf.hosts) {
    visit(node)

    if (isSchema(node)) {
      for (const item of node.children) {
        visit(item)
      }
    }
  }
}

export function visitConfigNode(conf: Config, visit: (node: ConfigNode) => void) {
  visitConfigItem(conf, item => {
    isNode(item) && visit(item)
  })
}

export function getNode(conf: Config, id: string) {
  let node: ConfigNode | undefined

  visitConfigItem(conf, item => {
    if (isNode(item) && item.id === id) {
      node = item
      return true
    }
  })

  return node
}

export function getSelectedNode(conf: Config) {
  return getNode(conf, conf.selected)
}