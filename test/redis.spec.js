import { describe, it } from 'mocha'
import chai from 'chai'
import dirtyChai from 'dirty-chai'
import chaiAsPromised from 'chai-as-promised'
import path from 'path'

import Midgar from '@midgar/midgar'
import RedisPlugin from '../src/index.plugin'
import service from '../src/services/redis.service'

const RedisService = service.service

const expect = chai.expect
chai.use(dirtyChai)
chai.use(chaiAsPromised)

const configPath = path.join(__dirname, 'fixtures/config')
let mid = null
const initMidgar = async () => {
  mid = new Midgar()
  await mid.start(configPath)
  return mid
}

/**
 * Test the service
 */
describe('Redis', function () {
  this.timeout(100000)
  before(async () => {
    mid = await initMidgar()
  })
  after(async () => {
    await mid.stop()
    mid = null
  })

  /**
   * Test if the plugin is load
   */
  it('test plugin', async () => {
    mid = await initMidgar()
    const plugin = mid.pm.getPlugin('@midgar/redis')
    expect(plugin).to.be.an.instanceof(RedisPlugin, 'Plugin is not an instance of RedisPlugin')

    const service = mid.getService('mid:redis')
    expect(service).to.be.an.instanceof(RedisService, 'Service is not an instance of RedisService')
  })

  /**
   * Set and get
   */
  it('set and get', async () => {
    const redisService = mid.getService('mid:redis')

    const value = 'test-value'
    const key = 'test-key'
    await redisService.set(key, value)
    const result = await redisService.get(key)
    expect(result).to.be.equal(value, 'Invalid cache value')
  })

  it('set and get with EX', async () => {
    const redisService = mid.getService('mid:redis')
    // EX
    const expireValue = 'expire-value-ex'
    const expireKey = 'expire-key-ex'
    await redisService.set(expireKey, expireValue, { EX: 2 })

    // Check after at 1 second if entry exist
    await new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await redisService.get(expireKey)
          expect(result).to.be.equal(expireValue, 'Invalid cache value')
          resolve()
        } catch (error) {
          reject(error)
        }
      }, 1000)
    })

    // Check after 2 second if cache have exipred
    await new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await redisService.get(expireKey)
          expect(result).to.be.null('Invalid cache value')
          resolve()
        } catch (error) {
          reject(error)
        }
      }, 3000)
    })
  })

  it('set and get with PX', async () => {
    const redisService = mid.getService('mid:redis')
    // EX
    const expireValue = 'expire-value-px'
    const expireKey = 'expire-key-px'
    await redisService.set(expireKey, expireValue, { PX: 2000 })

    // Check after at 1 second if entry exist
    await new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await redisService.get(expireKey)
          expect(result).to.be.equal(expireValue, 'Invalid cache value')
          resolve()
        } catch (error) {
          reject(error)
        }
      }, 1000)
    })

    // Check after 2 second if cache have exipred
    await new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await redisService.get(expireKey)
          expect(result).to.be.null('Invalid cache value')
          resolve()
        } catch (error) {
          reject(error)
        }
      }, 3000)
    })
  })
})
