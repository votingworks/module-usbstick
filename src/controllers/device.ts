import { Application, Request, Response } from 'express'
import { exec, ExecException } from 'child_process'
import { BlockDeviceInfo } from '../server'
import { resolve } from 'dns'

const drivelist = require('drivelist')

export class UsbDeviceInfo {
  id: number
  description: string
  device: string
  path: string
  mountpoints: string[]

  constructor(
    id: number,
    description: string,
    device: string,
    path: string,
    mountpoints: string[]
  ) {
    this.id = id
    this.description = description
    this.device = device
    this.path = path
    this.mountpoints = mountpoints
  }
}

export var availableDrives: UsbDeviceInfo[] = []

const _getBlockDevice = (
  devicePath: string
): Promise<BlockDeviceInfo[]> => {
  return new Promise(resolve => {
    exec(
      `lsblk ${devicePath} -J`,
      (_exc: ExecException | null, stdout: string) => {
        const device = JSON.parse(stdout).blockdevices as BlockDeviceInfo[]
        resolve(device)
      }
    )
  })
}

const _getUsbDrives = async (): Promise<UsbDeviceInfo[]> => {
    const drives = await drivelist.list()

    availableDrives = []

    drives.forEach((drive: any) => {
      if (drive.isRemovable && drive.isUSB && !drive.isSystem) {
        //console.log(drive)
        let mountpoints: string[] = []
        drive.mountpoints.forEach((mountpoint: any) =>
          mountpoints.push(mountpoint.path)
        )

        let driveInfo = new UsbDeviceInfo(
          availableDrives.length,
          drive.description,
          drive.device,
          drive.devicePath,
          mountpoints
        )
        availableDrives.push(driveInfo)
      }
    })

    return availableDrives
}

const _getUsbDrive = async (
  deviceId: number
): Promise<UsbDeviceInfo | null> => {
    let devices = await _getUsbDrives()
    if (devices.length <= 0 || !devices[deviceId]) {
      return null
    }
    let device = devices[deviceId]
    return device
}

const _mountUsbDrive = (
  device: string,
  label: string
): Promise<string | ExecException | null> => {
  return new Promise(resolve => {
    exec(
      `pmount ${device} ${label}`,
      (error: ExecException | null, stdout: string) => {
        if (error) {
          resolve(error)
          return
        }
        resolve(stdout)
      }
    )
  })
}

const _unmountUsbDrive = (
  device: string
): Promise<string | ExecException | null> => {
  return new Promise(resolve => {
    exec(`pumount ${device}`, (error: ExecException | null, stdout: string) => {
      if (error) {
        resolve(error)
        return
      }
      resolve(stdout)
    })
  })
}

export async function setup(app: Application) {
  app.get('/usb', async (_request: Request, response: Response) => {
    let devices = await _getUsbDrives()
    response.json(devices)
  })

  app.post(
    '/usb/:deviceId/mount',
    async (_request: Request, response: Response) => {
      let device = await _getUsbDrive(_request.params.deviceId)
      if (!device) {
        response.json({
          success: false,
          mnessage: `could not find device ${_request.params.deviceId}`,
        })
        return
      }

      let mountpoint = device.mountpoints[0]
      if (mountpoint) {
        response.json({ success: true, message: 'device alredy mounted' })
        return
      }

      let blockDevices = await _getBlockDevice(device.device)
      if (blockDevices.length <= 0 || !blockDevices[0]) {
        response.json({
          success: false,
          message: `could not find block device ${device.device}`,
        })
        return
      }

      var partitionName: string | undefined = undefined
      if (blockDevices[0].type === 'part') {
        partitionName = blockDevices[0].name
      } else {
        if (blockDevices[0].children && blockDevices[0].children[0]) {
          partitionName = blockDevices[0].children[0].name
        } else {
          response.json({
            success: false,
            message: `could not find partition for block device ${
              device.device
            }`,
          })
          return
        }
      }

      var label: string =
        _request.get('label') ||
        _request.query.label ||
        `usb_${new Date().getTime()}`
      let result = await _mountUsbDrive(`/dev/${partitionName}`, label)
      if ((result as ExecException).name) {
        response.json({ success: false, message: result })
      } else {
        let device = await _getUsbDrive(_request.params.deviceId)
        response.json({ success: true, message: device })
      }
    }
  )

  app.post(
    '/usb/:deviceId/unmount',
    async (_request: Request, response: Response) => {
      let device = await _getUsbDrive(_request.params.deviceId)
      if (!device) {
        response.json({
          success: false,
          mnessage: `could not find device ${_request.params.deviceId}`,
        })
        return
      }

      let mountpoint = device.mountpoints[0]
      if (!mountpoint) {
        response.json({ success: true, message: 'device not mounted' })
        return
      }

      let result = await _unmountUsbDrive(mountpoint)
      if ((result as ExecException).name) {
        response.json({ success: false, message: result })
      } else {
        let device = await _getUsbDrive(_request.params.deviceId)
        response.json({ success: true, message: device })
      }
    }
  )

  console.log('device controller setup')
}
