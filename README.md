# USB Stick Module

This web server component provides a web interface to simple USB stick
operations.

## Install Requisite Software

```
yarn install
```

## Run Tests

```
yarn test
```

## Start the Server

```
yarn start
```

## API Documentation

This scanner module provides the following API:

- `GET /usbstick/status` -- returns whether a USB stick is present or not:

```
{present: true}
```

- `POST /usbstick/eject` -- ejects a USB stick if present

```
{success: true}
```

## Architecture
