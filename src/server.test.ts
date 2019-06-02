import request from 'supertest'
import { ExecException } from 'child_process'
import { app } from './server'

const blockDevicesWithoutUSBStick = `{
   "blockdevices": [
      {"name": "loop21", "maj:min": "7:21", "rm": "0", "size": "151M", "ro": "1", "type": "loop", "mountpoint": "/snap/gnome-3-28-1804/47"},
      {"name": "sda", "maj:min": "8:0", "rm": "0", "size": "64G", "ro": "0", "type": "disk", "mountpoint": null,
         "children": [
            {"name": "sda1", "maj:min": "8:1", "rm": "0", "size": "64G", "ro": "0", "type": "part", "mountpoint": "/"}
         ]
      },
      {"name": "sr0", "maj:min": "11:0", "rm": "1", "size": "1024M", "ro": "0", "type": "rom", "mountpoint": null}
   ]
}`

const blockDevicesWithUSBStick = `{
   "blockdevices": [
      {"name": "loop21", "maj:min": "7:21", "rm": "0", "size": "151M", "ro": "1", "type": "loop", "mountpoint": "/snap/gnome-3-28-1804/47"},
      {"name": "sda", "maj:min": "8:0", "rm": "0", "size": "64G", "ro": "0", "type": "disk", "mountpoint": null,
         "children": [
            {"name": "sda1", "maj:min": "8:1", "rm": "0", "size": "64G", "ro": "0", "type": "part", "mountpoint": "/"}
         ]
      },
      {"name": "sdb", "maj:min": "8:16", "rm": "1", "size": "7.5G", "ro": "0", "type": "disk", "mountpoint": null,
         "children": [
            {"name": "sdb1", "maj:min": "8:17", "rm": "1", "size": "1.9G", "ro": "0", "type": "part", "mountpoint": "/media/parallels/Ubuntu 18.04.2 LTS amd64"},
            {"name": "sdb2", "maj:min": "8:18", "rm": "1", "size": "2.4M", "ro": "0", "type": "part", "mountpoint": null}
         ]
      },
      {"name": "sr0", "maj:min": "11:0", "rm": "1", "size": "1024M", "ro": "0", "type": "rom", "mountpoint": null}
   ]
}`

// eslint-disable-next-line no-null/no-null
let execMockedException: ExecException | null = null
let execMockedStdout = ''
let execMockedStderr = ''
jest.mock('child_process', () => ({
  exec: jest.fn((_command, callback) => {
    callback(execMockedException, execMockedStdout, execMockedStderr)
  }),
}))

test('GET /usbstick/status no usb stick', done => {
  execMockedStdout = blockDevicesWithoutUSBStick
  request(app)
    .get('/usbstick/status')
    .set('Accept', 'application/json')
    .expect(200, { present: false })
    .then(() => {
      done()
    })
})

test('GET /usbstick/status WITH usb stick', done => {
  execMockedStdout = blockDevicesWithUSBStick
  request(app)
    .get('/usbstick/status')
    .set('Accept', 'application/json')
    .expect(200, { present: true })
    .then(() => {
      done()
    })
})

test('POST /usbstick/eject', done => {
  execMockedStdout = blockDevicesWithUSBStick
  request(app)
    .post('/usbstick/eject')
    .set('Accept', 'application/json')
    .expect(200, { success: true })
    .then(() => {
      done()
    })
})
