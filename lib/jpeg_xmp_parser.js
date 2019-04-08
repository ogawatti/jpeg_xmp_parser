const fs = require('fs')
const xml2js = require('xml2js')

module.exports = class JpegXmpParser {
  static get segmentStr () { return 'http://ns.adobe.com/xap/1.0/\0' }
  static get xmpStartStr () { return '<x:xmpmeta ' }
  static get xmpEndStr () { return '</x:xmpmeta>' }
  static get marker () { return { start: 0xFFD8, xmp: 0xFFE1, image: 0xFFDA } }

  static parse (filePath) {
    if (!this.validateFile(filePath)) { return null }
    let position = this._findPositionByMarker(filePath, this.marker.xmp)
    return (position ? this._readXmp(filePath, position) : null)
  }

  static write (srcPath, dstPath, xmp) {
    if (!this.validateXmp(xmp)) { return null }
    if (!this.validateFile(srcPath)) { return null }

    let position = this._findPositionByMarker(srcPath, this.marker.xmp)
    if (position) {
      fs.writeFileSync(dstPath, this._createBufferWithXmp(xmp, srcPath, position, position + 4))
    } else {
      position = this._findPositionByMarker(srcPath, this.marker.image)
      fs.writeFileSync(dstPath, this._createBufferWithXmp(xmp, srcPath, position, position))
    }
    return dstPath
  }

  static validateFile (filePath) {
    if (!fs.existsSync(filePath)) { return false }
    let fd = fs.openSync(filePath, 'r')
    let marker = this._read2bytes(fd, 0)
    fs.closeSync(fd)

    return (marker === this.marker.start)
  }

  static validateXmp (xmp) {
    let xmpmeta = this.parseMeta(xmp)
    let result
    xml2js.parseString(xmpmeta, (err, res) => { result = !(err) })
    return result
  }

  // xmpmeta部分だけ抽出する
  static parseMeta (xmp) {
    let start = xmp.search(this.xmpStartStr)
    let end = xmp.search(this.xmpEndStr)
    if (start === -1 || end === -1) { return null }

    let length = end - start + this.xmpEndStr.length
    return xmp.substr(start, length)
  }

  static _findPositionByMarker (filePath, number) {
    let fd = fs.openSync(filePath, 'r')
    let position = 2
    let result = null

    let fstat = fs.fstatSync(fd)
    while (position + 4 < fstat.size) {
      let marker = this._read2bytes(fd, position)
      let size = this._read2bytes(fd, position + 2)

      if (marker === number && this._isXmpOrNotExif(number, fd, position)) {
        result = position
        break
      } else if (marker === this.marker.image) {
        break // 以降イメージデータ
      } else {
        position += size + 2
      }
    }

    fs.closeSync(fd)
    return result
  }

  static _createBufferWithXmp (xmp, filePath, p1, p2) {
    let fd = fs.openSync(filePath, 'r')
    if (!xmp.match(new RegExp(`^${this.segmentStr}`))) {
      xmp = this.segmentStr + xmp
    }

    let xmpSize = 2 + xmp.length // size + paylaod size
    let buffer = Buffer.concat([
      Buffer.from([
        Math.floor(this.marker.xmp / 0x100),
        this.marker.xmp % 0x100,
        Math.floor(xmpSize / 0x100),
        xmpSize % 0x100
      ]),
      Buffer.from(xmp)
    ], xmp.length + 4) // app1 segment size

    let bytes = this._readBytes(fd, 0, p1)
    buffer = Buffer.concat([bytes, buffer], bytes.length + buffer.length)
    bytes = this._readBytes(fd, p2)
    buffer = Buffer.concat([buffer, bytes], bytes.length + buffer.length)

    return buffer
  }

  static _readBytes (fd, position, size) {
    let fstat = fs.fstatSync(fd)
    if (!size) { size = fstat.size - position + 1 }
    let buffer = Buffer.alloc(size)
    fs.readSync(fd, buffer, 0, size, position)
    return buffer
  }

  static _read2bytes (fd, position) {
    let buffer = this._readBytes(fd, position, 2)
    return buffer[0] * 0x100 + buffer[1]
  }

  static _isXmp (fd, position) {
    let buffer = Buffer.alloc(29)
    fs.readSync(fd, buffer, 0, 29, position + 4)

    let bytes = new Uint8Array(buffer)
    let string = String.fromCharCode.apply(null, bytes)
    return string.match(new RegExp(`^${this.segmentStr}`))
  }

  static _isXmpOrNotExif (number, fd, position) {
    return (number === this.marker.xmp && this._isXmp(fd, position)) || number !== this.marker.xmp
  }

  static _readXmp (filePath, position) {
    let fd = fs.openSync(filePath, 'r')
    let size = this._read2bytes(fd, position + 2)
    let buffer = Buffer.alloc(size - 31)
    let length = size - (this.segmentStr.length + 2)

    fs.readSync(fd, buffer, 0, length, position + 4 + this.segmentStr.length)
    fs.closeSync(fd)

    let bytes = new Uint8Array(buffer)
    return String.fromCharCode.apply(null, bytes)
  }
}
