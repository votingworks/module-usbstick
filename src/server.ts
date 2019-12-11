//
// Just the HTTP glue to the functionality, no implementations.
// All actual implementations are in scanner.ts
//

import express, { Application, Request, Response } from 'express'
import * as path from 'path'

import { exec, ExecException } from 'child_process'

export const app: Application = express()
const port = 3004

app.use(express.json())

export interface BlockDeviceInfo {
  readonly name: string
  // eslint-disable-next-line no-null/no-null
  readonly mountpoint: string | null
  readonly type: string
  readonly children?: BlockDeviceInfo[]
}

// usb stick are ones that are mounted under /media automatically by Ubuntu
const findBlockDevice = (
  blockDevices: BlockDeviceInfo[]
): BlockDeviceInfo | null => {
  for (const blockDevice of blockDevices) {
    if (
      blockDevice.mountpoint &&
      blockDevice.mountpoint.startsWith('/media/')
    ) {
      return blockDevice
    }

    if (blockDevice.children) {
      const childResult = findBlockDevice(blockDevice.children)
      if (childResult) {
        return childResult
      }
    }
  }

  // eslint-disable-next-line no-null/no-null
  return null
}

// eslint-disable-next-line no-null/no-null
const getUSBStick = async (): Promise<BlockDeviceInfo | null> => {
  return new Promise(resolve => {
    exec(`lsblk -J`, (_exc: ExecException | null, stdout: string) => {
      const devices = JSON.parse(stdout).blockdevices as BlockDeviceInfo[]
      const usbStick = findBlockDevice(devices)

      resolve(usbStick)
    })
  })
}

const ejectUSBStick = async (blockDevice: BlockDeviceInfo) => {
  return new Promise(resolve => {
    exec(
      `udisksctl unmount -b /dev/${
        blockDevice.name
      } && udisksctl power-off -b /dev/${blockDevice.name}`,
      (exc: ExecException | null) => {
        if (exc) {
          return resolve(false)
        }

        return resolve(true)
      }
    )
  })
}

app.get('/usbstick/status', async (_request: Request, response: Response) => {
  const usbStick = await getUSBStick()
  response.json({ present: !!usbStick })
})

app.post('/usbstick/eject', async (_request: Request, response: Response) => {
  const usbStick = await getUSBStick()
  if (usbStick) {
    const resultOfEjection = await ejectUSBStick(usbStick)
    response.json({ success: resultOfEjection })
  } else {
    response.json({ success: false })
  }
})

app.get('/', (_request: Request, response: Response) => {
  response.sendFile(path.join(__dirname, '..', 'index.html'))
})

let _ignored = [
  'device', 
  'file'
].map(async name => {

  var controller = require('./controllers/' + name);
  await controller.setup(app);
});

export function start() {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Listening at http://localhost:${port}/`)
  })
}
