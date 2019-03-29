const fs = require('fs');

module.exports = class JpegXmpParser {
  static parse(filePath) {
    if (!fs.existsSync(filePath)) { return null };
    let position = 0;
    let fd = fs.openSync(filePath, 'r');

    if (this.read2bytes(fd, position) !== 0xFFD8) { return null };
    position += 2;

    let fstat = fs.fstatSync(fd);
    while(position + 4 < fstat.size) {
      let marker = this.read2bytes(fd, position);
      if (marker === 0xFFDA) { break };  // 以降イメージデータ
      position += 2;

      let size = this.read2bytes(fd, position);
      position += 2;

      if (marker === 0xFFE1 && this.isXmp(fd, position)) {
        let xmp = this.readXmp(fd, position, size);
        fs.closeSync(fd);
        return xmp;
      } else {
        position += size - 2;
      };
    };

    return null;
  };

  static get segmentStr() { return 'http://ns.adobe.com/xap/1.0/\0' };
  static get xmpStartStr() { return '<x:xmpmeta ' };
  static get xmpEndStr() { return '</x:xmpmeta>' };

  static read2bytes(fd, position) {
    let buffer = Buffer.alloc(2);
    fs.readSync(fd, buffer, 0, 2, position);
    let bytes =  new Uint8Array(buffer);
    return bytes[0] * 0x100 + bytes[1];
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
};
