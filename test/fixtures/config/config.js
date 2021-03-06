import path from 'path'
import os from 'os'
import uid from 'uid-safe'
import mkdirp from 'mkdirp'

const resolve = (p) => {
  return path.join(__dirname, p)
}

function getTmpDir(name) {
  const dirname = path.join(os.tmpdir(), uid.sync(8), name)

  mkdirp.sync(dirname, { mode: parseInt('0700', 8) })

  return dirname
}

export default {
  log: {
    dir: getTmpDir('logs'),
    stdout: true,
    level: 'debug'
  },
  redis: {
    default: {
      host: '127.0.0.1',
      port: 6379,
      password: process.env.REDIS_PASSWORD
    }
  },
  pluginsLocalPath: resolve('../plugins')
}
