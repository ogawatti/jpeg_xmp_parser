const expect = require('chai').expect
const JpegXmpParser = require('../index.js')
const path = require('path')
const fs = require('fs')

describe('JpegXmpParser', () => {
  let jpegPath = path.join(__dirname, 'test.jpeg')

  describe('.parse()', () => {
    context('with jpeg has xmp', () => {
      it ('return xmp string', () => {
        xmp = JpegXmpParser.parse(jpegPath)
        expect(xmp).to.be.a('string')
        expect(xmp).to.include('xmpmeta')
      })
    })
  })

  describe('parseMeta()', () => {
    context('with xmp string', () => {
      it ('return xmp string without xpacket meta', () => {
        xmp = JpegXmpParser.parse(jpegPath)
        xmp = JpegXmpParser.parseMeta(xmp)
        expect(xmp).to.be.a('string')
        expect(xmp).to.include('xmpmeta')
        expect(xmp).not.to.include('xpacket')
      })
    })
  })
})
