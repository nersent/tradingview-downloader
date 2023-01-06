# Tradingview Downloader

## Prerequisites

- [Node.js](https://nodejs.org/en/) min v16

## How to install

### 1. Install Yarn

Open shell and type:

```bash
npm install yarn --global
```

### 2. Install Node.js dependencies

Open shell at the root of this project

```bash
yarn
```

### 3. Update `.env`

    a) Sign in to Tradingview
    b) Go to random chart page
    c) Click lock icon in chrome next to address bar
    d) Click cookies
    e) Select tradingview.com > cookies
    f) Click item with name `sessionid`
    g) Copy value from `content`. **DO NOT SHARE THIS VALUE WITH ANYONE**
    h) Copy `.env.example` file to `.env` and change respective values

### Set what asset you want to download

Go to `src/list.ts` and edit `TRADINGVIEW_DOWNLOAD_LIST` array

- `name` is your custom name for this asset like BTC_OLCHV_4H
- `chartId` is a value for custom layout id from `https://tradingview.com/chart/{chartId}/?symbol=${symbolName}
- `symbol` is a symbol name of given asset
