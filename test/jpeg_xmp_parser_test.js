const expect = require('chai').expect
const JpegXmpParser = require('../index.js')
const path = require('path')
const fs = require('fs')

describe('JpegXmpParser', () => {
  let jpegPath = path.join(__dirname, 'test.jpg')
  let noXmpJpegPath = path.join(__dirname, 'test_no_xmp.jpg')
  let dstPath = path.join(__dirname, '../test/dst.jpg')
  let xmpSegmentString = 'http://ns.adobe.com/xap/1.0/\0'
  let xmpString = [
    '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>',
    '<x:xmpmeta xmlns:x="adobe:ns:meta/" xmptk="JpegXmpParser.js">',
    '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '    <rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">',
    '      <GPano:PoseHeadingDegrees>0.0</GPano:PoseHeadingDegrees>',
    '      <GPano:PosePitchDegrees>0.0</GPano:PosePitchDegrees>',
    '      <GPano:PoseRollDegrees>0.0</GPano:PoseRollDegrees>',
    '    </rdf:Description>',
    '  </rdf:RDF>',
    '</x:xmpmeta>',
    '<?xpacket end="r"?>',
    ''
  ].join('\n')

  describe('.parse()', () => {
    context('with jpeg has xmp', () => {
      it ('return xmp string', () => {
        let result = JpegXmpParser.parse(jpegPath)
        expect(result).to.be.a('string')
        expect(result).to.include('xmpmeta')
      })
    })

    context('with jpeg does not have xmp', () => {
      it ('return null', () => {
        let result = JpegXmpParser.parse(noXmpJpegPath)
        expect(result).to.be.null
      })
    })

    context('with not exist jpeg', () => {
      it ('return null', () => {
        let result = JpegXmpParser.parse(noXmpJpegPath)
        expect(result).to.be.null
      })
    })
  })

  describe('.parseMeta()', () => {
    context('with xmp string', () => {
      it ('return xmp string without xpacket meta', () => {
        let result = JpegXmpParser.parse(jpegPath)
        let xmp = JpegXmpParser.parseMeta(result)
        expect(xmp).to.be.a('string')
        expect(xmp).to.include('xmpmeta')
        expect(xmp).not.to.include('xpacket')
      })
    })
  })

  describe('.write()', () => {
    before(() => { if (fs.existsSync(dstPath)) { fs.unlinkSync(dstPath) } })
    after(()  => { if (fs.existsSync(dstPath)) { fs.unlinkSync(dstPath) } })

    context('with jpegPath and dstPath, xmp string', () => {
      it('return dstPath', () => {
        res = JpegXmpParser.write(jpegPath, dstPath, xmpString)
        expect(res).to.equal(dstPath)

        let string = JpegXmpParser.parse(dstPath)
        let xmp = JpegXmpParser.parseMeta(string)
        expect(xmp).to.be.a('string')
        expect(xmp).to.include('xmpmeta')
        expect(xmp).not.to.include('xpacket')
      })
    })

    context('with jpegPath and dstPath, invalid xmp string', () => {
      it ('return null', () => {
        let xmpString = ""
        res = JpegXmpParser.write(noXmpJpegPath, dstPath, xmpString)
        expect(res).to.be.null
      })
    })

    context('with noXmpJpegPath and dstPath, xmp string', () => {
      it ('return dstPath', () => {
        res = JpegXmpParser.write(noXmpJpegPath, dstPath, xmpString)
        expect(res).to.equal(dstPath)

        let string = JpegXmpParser.parse(dstPath)
        let xmp = JpegXmpParser.parseMeta(string)
        expect(xmp).to.be.a('string')
        expect(xmp).to.include('xmpmeta')
        expect(xmp).not.to.include('xpacket')
      })
    })

    context('with jpegPath and dstPath, xmp(+segStr) string', () => {
      it ('return dstPath', () => {
        res = JpegXmpParser.write(noXmpJpegPath, dstPath, xmpSegmentString + xmpString)
        expect(res).to.equal(dstPath)

        let string = JpegXmpParser.parse(dstPath)
        let xmp = JpegXmpParser.parseMeta(string)
        expect(xmp).to.be.a('string')
        expect(xmp).to.include('xmpmeta')
        expect(xmp).not.to.include('xpacket')
      })
    })
  })
})
