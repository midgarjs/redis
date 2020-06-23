import { assignRecursive, asyncMap } from '@midgar/utils'
import { promisify } from 'util'
import redis from 'redis'

const DEFAULT_CONNEXION_NAME = 'default'

/**
 * Service name
 * @type {string}
 */
const serviceName = 'mid:redis'

const dependencies = []

/**
 * RedisService class
 */
class RedisService {
  /**
   * Constructor
   *
   * @param {Midgar}          mid             Midgar instance
   */
  constructor(mid) {
    /**
     * Plugin config
     * @var {Midgar}}
     */
    this.mid = mid

    /**
     * Plugin config
     * @var {object}
     */
    this.config = assignRecursive({}, this.mid.config.redis || {})

    /**
     * Connexions dictionary
     * @type {object}
     */
    this.connexions = {}

    this.mid.on('@midgar/midgar:stop', () => this._onMidgarStop())
  }

  /**
   * Close connections on midgar stop
   */
  async _onMidgarStop() {
    for (const code in this.connexions) {
      await this.connexions[code].asyncQuit()
    }
  }

  /**
   * Init service
   *
   * @return {Promise<void>}
   */
  async init() {
    this.mid.debug('@midgar/redis: init.')

    /**
     * init event.
     * @event @midgar/redis:afterInit
     */
    await this.mid.emit('@midgar/redis:afterInit', this)

    const connexions = Object.keys(this.config)

    if (!connexions.length) throw new Error('@midgar/redis: No connexion found in config !')

    // List connection set in config
    await asyncMap(connexions, async (connexion) => {
      const connexionConfig = this.config[connexion]
      try {
        const client = await redis.createClient(connexionConfig)

        client.asyncGet = promisify(client.get).bind(client)
        client.asyncSet = promisify(client.set).bind(client)
        client.asyncAuth = promisify(client.auth).bind(client)
        client.asyncQuit = promisify(client.quit).bind(client)

        this.connexions[connexion] = client
      } catch (error) {
        this.mid.error(error)
      }
    })
  }

  /**
   * Return a redis client instance
   *
   * @param {string} name Connexion name
   *
   * @return {Redis}
   */
  getConnexion(name = DEFAULT_CONNEXION_NAME) {
    if (!this.connexions[name]) throw new Error(`@midgar/redis: Invalid connexion name ${name} !`)
    return this.connexions[name]
  }

  /**
   * Set value on a connection
   * @param {String}               key                 Cache key
   * @param {String|Array<String>} value               Cache value
   * @param {Object}               options             options object
   * @param {String}               options.connection  connexion name
   * @param {String}               options.expire      Expire time in milisecond
   * @param {String}               options.PX          Expire time in milisecond
   */
  async set(key, value, options = { connection: DEFAULT_CONNEXION_NAME }) {
    if (!Array.isArray(value)) value = [value]
    const connection = this.getConnexion(options.connection)

    if (options.PX !== undefined || options.expire !== undefined) {
      const px = options.PX !== undefined ? options.PX : options.expire
      value.push('PX', px)
    } else if (options.EX !== undefined) {
      const ex = options.EX
      value.push('EX', ex)
    }

    await connection.asyncSet(key, ...value)
  }

  /**
   * Return a cached value
   *
   * @param {String} key Cache key
   *
   * @return {String|null}
   */
  get(key, options = { connection: DEFAULT_CONNEXION_NAME }) {
    const connection = this.getConnexion(options.connection)
    return connection.asyncGet(key)
  }
}

export default {
  name: serviceName,
  dependencies,
  service: RedisService
}
