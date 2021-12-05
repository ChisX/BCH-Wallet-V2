// Imports
let MAINJS = require('mainnet-js')
let axios  = require('axios').default
let fs = require('fs')

// Maincode
class BitcoinCashWallet {
  constructor(NETWORK) {
    this.net = NETWORK
  }

  toLegacy(privKey) {
    return new Promise((resolve,reject) => {
      try {
        resolve(ECPAIR.toLegacyAddress(ECPAIR.fromWIF(privKey)))
      } catch (err) { reject(err) }
    })
  }

  createWallet(name=null) {
    return new Promise(async (resolve,reject) => {
      try {
        let account = await MAINJS.Wallet.newRandom()
        let net = (this.net === 'mainnet' ? 'main' : 'test')
        account = {
          name: (name ? name : 'anon'),
          mnemonic: account.mnemonic,
          cashaddr: account.cashaddr,
          privateK: account.privateKeyWif,
          legacyA : await this.toLegacy(account.privateKeyWif)
        }

        // If a name is provided, create and save account info as a file
        if (name) fs.writeFileSync(`./wallets/${net}/${name}.json`,JSON.stringify(account,null,2))
        resolve(account)
      } catch (err) { reject(err) }
    })
  }

  // Load a wallet file
  importWallet(name) {
    let net = (this.net === 'mainnet' ? 'main' : 'test')
    return new Promise((resolve,reject) => {
      fs.readFile(`./wallets/${net}/${name}.json`,'utf8',(err,data) => {
        if (err || !name) reject(err || 'ERROR: Missing Name Error')
        resolve(data)
      })
    })
  }

  // Load wallet functions, using either private key or bip39-mnemonic
  loadWallet(privKey,mnemonic=null) {
    return new Promise((resolve,reject) => {
      try {
        if (!privKey && !mnemonic) reject('ERROR: Private Key or Mnemonic must be Provided')
        if (privKey)  resolve(MAINJS.Wallet.fromWIF(privKey))
        if (mnemonic) resolve(MAINJS.Wallet.fromSeed(mnemonic))
      } catch (err) { reject(err) }
    })
  }

  formatWallet(prk,name='anon') {
    return new Promise(async (resolve,reject) => {
      try {
        let account = await this.loadWallet(prk)
        resolve({
          name,
          mnemonic: account.mnemonic,
          cashaddr: account.cashaddr,
          privateK: account.privateKeyWif,
          legacyA : await this.toLegacy(account.privateKeyWif)
        })
      } catch (err) { reject(err) }
    })
  }

  checkBalance(address) {
    return new Promise((resolve,reject) => {
      try {
        let url = `https://api.blockchair.com/bitcoin-cash/dashboards/address/${address}`
        axios.get(url).then(({data}) => resolve(data.data[address].address.balance))
      } catch (err) { reject(err) }
    })
  }
}

// Exports
module.exports = BitcoinCashWallet