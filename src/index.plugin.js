import { Plugin } from '@midgar/midgar'

/**
 * RedisPlugin class
 */
class RedisPlugin extends Plugin {
  /**
   * Init plugin
   */
  async init() {}
}

export default RedisPlugin
export const dependencies = ['@midgar/service']
