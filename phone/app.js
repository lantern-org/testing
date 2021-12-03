// notes
/* GEOJSON shape
{
  type: 'FeatureCollection',
  features: [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [125.6, 10.1]
      },
      "properties": {
        "name": "Dinagat Islands"
      }
    },
    ...
  ]
}
*/

// constants
import express from 'express'
const app = express()

import bp from 'body-parser'
const { json, urlencoded } = bp
import multer from 'multer' // v1.0.5
const upload = multer() // for parsing multipart/form-data

const port = process.env.PORT || 3000
const id = process.env.ID || -1

import mgj from '@mapbox/togeojson'
const { gpx } = mgj
import DOMParser from 'xmldom'
const DP = new DOMParser.DOMParser()

import { request } from 'http'
const ingestURL = process.env.INGEST_URL || 'localhost'
const ingestPORT = process.env.INGEST_PORT || '1025'
import { createCipheriv, createHash, randomBytes } from 'crypto'
import dgram from 'dgram'
const client = dgram.createSocket('udp4')

import { toIEEE754Single } from './ieee754.js'

// variables
let routeFile = null // string xml
let route = null // geojson
let sending = false // are we sending the current route
let startTime = -1 // ms since epoch
let packetsSent = 0 // num packets sent
let log = [] // log of API responses
let tid = null // randInterval timeout id
let key = null // encryption key
let udp_port = -1 // port to send udp packets
let token = "" // token to signal server stop

// middleware
app.use(json()) // for parsing application/json
app.use(urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// hi!
app.get('/', (_, res) => {
  res.send('Hello World!')
})

// return health
app.get('/health', (_, res) => {
  res.json('healthy')
})

// return status info
app.get('/status', (_, res) => {
  res.json({
    'id': id,
    'route': route,
    'active': sending,
    'key': key,
    'token': token,
    'log': log,
    'start_time': startTime,
    'packets_sent': packetsSent,
  })
})

// return the stored route
app.get('/route', (_, res) => {
  res.setHeader('Content-type', "application/octet-stream");
  res.setHeader('Content-disposition', `attachment; filename=route.gpx`);
  res.send(routeFile)
})
// save a given route
app.put('/route', upload.single('route'), (req, res) => {
  try {
    if (!sending && req.file) {
      routeFile = String.fromCharCode(...req.file.buffer)
      route = gpx(
        DP.parseFromString(
          routeFile,
          'text/xml'
        )
      )
      res.json('succ')
    } else {
      res.status(409)
      res.json('fail')
    }
  } catch (error) {
    // console.log(error)
    res.status(400)
    res.send(error)
  }
})
// delete the stored route
app.delete('/route', (_, res) => {
  if (!sending) {
    routeFile = null
    route = null
    res.json('succ')
  } else {
    res.status(409)
    res.json('fail')
  }
})

// return status of transmission
app.get('/test', (_, res) => {
  // TODO
  res.json(sending)
})
// start/stop transmission
app.post('/test', (req, res) => {
  console.log(req.body)
  if (req.body && 'transmit' in req.body) { // maybe requested stop
    if (req.body.transmit) {
      // error for now
      res.status(409)
      res.json(false)
    } else {
      // (early) stop transmitting
      sending = false
      tid.clear() // quit sending
      res.json(true)
    }
  } else if (req.body && ('freq' in req.body) && ('rand' in req.body) && ('i' in req.body || 'time' in req.body)) { // requested start
    if (sending || !route) {
      res.status(409)
      res.json(false)
    } else {
      sending = true
      execute(
        parseInt(req.body.freq),
        parseInt(req.body.rand),
        parseInt(req.body.i),
        parseInt(req.body.time)
      )
      res.json(true) // we attempted
    }
  } else { // error
    res.status(400)
    res.json(false)
  }
})

// start the server
app.listen(port, () => {
  console.log(`phone emulator ${id} listening at http://localhost:${port}`)
})

// handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  client.close() // close udp socket
  server.close(() => {
    console.log('HTTP server closed')
  })
})

// this could be a separate object

// timing
// https://stackoverflow.com/a/60308175
const setRandomInterval = (minDelay, maxDelay) => {
  let timeout
  const runInterval = () => {
    const timeoutFunction = () => {
      if (sendPacket()) runInterval()
      else signalServerStop()
    }
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
    timeout = setTimeout(timeoutFunction, delay)
  }
  runInterval()
  return {
    clear() { clearTimeout(timeout) },
  }
}

let n = 0
let pts = 0
let I = -1
let idx = -1 // always starts at -1
function getPoint() {
  idx += 1 // always start by incrementing
  let q = Math.floor(idx / (I+1))
  let r = idx % (I+1)
  console.log(q,r,route.features.length)
  if (r == 0) {
    // just short-circuit the special case
    return route.features[q].geometry.coordinates
    // that way, we don't have to handle when q+1 is out of bounds
    // though we could just append a dummy value to route.features
  }
  // console.log()
  let pt1 = route.features[q].geometry.coordinates
  let pt2 = route.features[q+1].geometry.coordinates
  return [
    pt1[0] + r*(pt2[0]-pt1[0])/(I+1),
    pt1[1] + r*(pt2[1]-pt1[1])/(I+1)
  ]
}
function sendPacket() {
  // use current state to transmit a packet to the server
  let [lon,lat] = getPoint() // increments idx
  let time = BigInt(Date.now())
  console.log(lat, lon, time)
  // construct packet
  let buf = Buffer.alloc(32)
  buf.set(toIEEE754Single(lat), 0)
  buf.set(toIEEE754Single(lon), 4)
  buf.writeBigInt64BE(time, 8)
  let digest = createHash('md5').update(buf.subarray(0, 16)).digest()
  buf.set(digest, 16)
  // encrypt
  let cipher = createCipheriv('AES-256-ECB', key, null)
  // buf = Buffer.concat([cipher.update(buf), cipher.final()])
  buf = cipher.update(buf) // no need to concat cipher.final, cipher.update returns all data
  // cipher.final() // do we still need to call it though?
  // send
  console.log(buf)
  client.send(buf, udp_port, ingestURL, (err) => {
    console.log('sent packet -- err='+err)
  })
  packetsSent += 1 // we sent a packet
  sending = idx < pts-1 // keep going if idx < len(route with interpolation)-1
  return sending
  // we do len-1 b/c getPoint starts by incrementing
  // so we have to look-ahead here
}
function signalServerStop() {
  // tell ingest server we're done
  let data = JSON.stringify({
    port: udp_port,
    token: token
  })
  new Promise((resolve, reject) => {
    let req = request({
      host: ingestURL,
      port: ingestPORT,
      path: '/session/stop',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, res => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error('statusCode='+res.statusCode))
        }
        let body = []
        res.on('data', chunk => {
          body.push(chunk)
        })
        res.on('end', () => {
          try {
            body = JSON.parse(Buffer.concat(body).toString())
          } catch (e) {
            reject(e)
          }
          resolve(body)
        })
    })
    req.on("error", (err) => {
      reject(err)
    })
    req.write(data)
    req.end()
  }).then(res => {
    console.log(res)
    log.push(res)
  }).catch(err => {
    console.log(err)
  })
}
function execute(freq, rand, i, time) {
  // reset
  I = i
  idx = -1
  // compute params
  n = route.features.length
  pts = i*(n-1)+n
  if (isNaN(i)) {
    i = Math.floor( (((time*1000)/freq)-n)/(n-1) )
  } // else  i  is defined so we re-compute time
  // if  time  is defined then we have to re-compute time anyway
  time = pts*freq // recalculate the time
  // do the dance with the server
  key = randomBytes(32) // set encryption key
  let data = JSON.stringify({
    username: 'test',
    password: 'test',
    key: key.toString('hex')
  })
  new Promise((resolve, reject) => {
    let req = request({
      host: ingestURL,
      port: ingestPORT,
      path: '/session/start',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, res => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error('statusCode='+res.statusCode))
        }
        let body = []
        res.on('data', chunk => {
          body.push(chunk)
        })
        res.on('end', () => {
          try {
            body = JSON.parse(Buffer.concat(body).toString())
          } catch (e) {
            reject(e)
          }
          resolve(body)
        })
    })
    req.on("error", (err) => {
      reject(err)
    })
    req.write(data)
    req.end()
  }).then(res => {
    console.log(res)
    log.push(res)
    startTime = Date.now()
    udp_port = res.port
    token = res.token
    tid = setRandomInterval(freq-rand, freq+rand)
  }).catch(err => {
    console.log(err)
  })
}
