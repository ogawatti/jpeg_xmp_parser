const fs = require('fs');
const xml2js = require('xml2js')

module.exports = class JpegXmpParser {
  static parse(filePath) {
    if (!this.validateFile(filePath)) { return null }
    let fd = fs.openSync(filePath, 'r');
    let position = 2;

    let fstat = fs.fstatSync(fd);
    while(position + 4 < fstat.size) {
      let marker = this.read2bytes(fd, position);
      position += 2;
      let size = this.read2bytes(fd, position);
      position += 2;

      if (marker === 0xFFDA) {  // 以降イメージデータ
        break;
      } else if (marker === 0xFFE1 && this.isXmp(fd, position)) {
        let xmp = this.readXmp(fd, position, size);
        fs.closeSync(fd);
        return xmp;
      } else {
        position += size - 2;
      };
    };

    fs.closeSync(fd);
    return null;
  };

  static write(srcPath, dstPath, xmp) {
    if (!this.validateFile(srcPath)) { return null }
    if (!this.validateXmp(xmp)) { return null }

    let fd = fs.openSync(srcPath, 'r');
    let position = 2;

    let fstat = fs.fstatSync(fd);
    while(position + 4 < fstat.size) {
      let marker = this.read2bytes(fd, position);
      position += 2;
      let size = this.read2bytes(fd, position);
      position += 2;

      if (marker === 0xFFDA) {  // 以降イメージデータ
        fs.writeFileSync(dstPath, this.createBufferWithXmp(fd, position - 4, position - 2, xmp))
        break;
      } else if (marker === 0xFFE1 && this.isXmp(fd, position)) {
        fs.writeFileSync(dstPath, this.createBufferWithXmp(fd, position - 4, position, xmp))
        break;
      } else {
        position += size - 2;
      };
    };

    fs.closeSync(fd);
    return dstPath;
  }

  static validateFile(filePath) {
    if (!fs.existsSync(filePath)) { return false };
    let fd = fs.openSync(filePath, 'r');
    let marker = this.read2bytes(fd, 0)
    fs.closeSync(fd);

    return (marker === 0xFFD8)
  }

  // JPEGファイルのp1とp2の間にxmpを差し込む
  static createBufferWithXmp(fd, p1, p2, xmp) {
    if (!xmp.match(new RegExp(`^${this.segmentStr}`))) {
      xmp = this.segmentStr + xmp
    }

    let xmpSize = 2 + xmp.length;  // size + paylaod size
    let buffer = Buffer.concat([
      Buffer.from([0xFF, 0xE1, Math.floor(xmpSize / 0x100), xmpSize % 0x100 ]),
      Buffer.from(xmp)
    ], xmp.length + 4);  // app1 segment size

    let bytes = this.readBytes(fd, 0, p1)
    buffer = Buffer.concat([bytes, buffer], bytes.length + buffer.length)
    bytes = this.readBytes(fd, p2)
    buffer = Buffer.concat([buffer, bytes], bytes.length + buffer.length)

    return buffer
  }

  static get segmentStr() { return 'http://ns.adobe.com/xap/1.0/\0' };
  static get xmpStartStr() { return '<x:xmpmeta ' };
  static get xmpEndStr() { return '</x:xmpmeta>' };

  static readBytes(fd, position, size) {
    let fstat = fs.fstatSync(fd);
    if (!size) { size = fstat.size - position + 1}
    let buffer = Buffer.alloc(size);
    fs.readSync(fd, buffer, 0, size, position);
    return buffer
  }

  static read2bytes(fd, position) {
    let buffer = this.readBytes(fd, position, 2);
    return buffer[0] * 0x100 + buffer[1];
  };

  static isXmp(fd, position) {
    let buffer = new Buffer.alloc(29);
    fs.readSync(fd, buffer, 0, 29, position);

    let bytes = new Uint8Array(buffer);
    let string = String.fromCharCode.apply(null, bytes);
    return string == this.segmentStr;
  };

  // $ exiftool -xmp -b hoge.jpeg と同等
  static readXmp(fd, position, size) {
    let buffer = new Buffer.alloc(size - 31);
    let length = size - (this.segmentStr.length + 2);

    fs.readSync(fd, buffer, 0, length, position + this.segmentStr.length);
    let bytes = new Uint8Array(buffer);
    return String.fromCharCode.apply(null, bytes);
  }

  // xmpmeta部分だけ抽出する
  static parseMeta(xmp) {
    let start = xmp.search(this.xmpStartStr);
    let end = xmp.search(this.xmpEndStr);
    if (start === -1 || end === -1) { return null };

    let length = end - start + this.xmpEndStr.length;
    return xmp.substr(start, length);
  };

  static validateXmp(xmp) {
    let xmpmeta = this.parseMeta(xmp)
    let res
    xml2js.parseString(xmpmeta, (error, result) => { res = !(error) })
    return res
  }
};
