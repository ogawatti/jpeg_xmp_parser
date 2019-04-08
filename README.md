[![GitHub version](https://badge.fury.io/gh/ogawatti%2Fjpeg_xmp_parser.svg)](https://badge.fury.io/gh/ogawatti%2Fjpeg_xmp_parser)
[![Build Status](https://travis-ci.org/ogawatti/jpeg_xmp_parser.svg?branch=master)](https://travis-ci.org/ogawatti/jpeg_xmp_parser)
[![Coverage Status](https://coveralls.io/repos/github/ogawatti/jpeg_xmp_parser/badge.svg?branch=master)](https://coveralls.io/github/ogawatti/jpeg_xmp_parser?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


# JpegXmpParser

Extract xmp from jpeg.

## Installation

```
$ npm install ogawatti/jpeg_xmp_parser#master
```

## Usage

```
const JpegXmpParser = require('jpeg_xmp_parser')

let string = JpegXmpParser.parse(filePath)
JpegXmpParser.write(dstPath, string)
```
