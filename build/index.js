#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LibFs = require("mz/fs");
const LibOs = require("os");
const program = require("commander");
const shell = require("shelljs");
const isUrl = require("is-url");
const pkg = require('../package.json');
const DEFAULT_OUTPUT_DIR = '~/Downloads/youtube';
const DEFAULT_OUTPUT_NAME_SINGLE = '[%(uploader)s] %(title)s.%(ext)s';
const DEFAULT_OUTPUT_NAME_LIST = `%(playlist)s/${DEFAULT_OUTPUT_NAME_SINGLE}`;
const DEFAULT_VERTICAL_RESOLUTION = '720';
const DEFAULT_SOCKS5_HOST = '127.0.0.1';
const DEFAULT_SOCKS5_PORT = '1086';
const VALID_VERTICAL_RESOLUTION = ['720', '1080'];
let IS_SOURCE_LISTFILE = false;
let IS_SOURCE_PLAYLIST = false;
program.version(pkg.version)
    .description('youtube-dl-quick: quick usage wrapper for command youtube-dl')
    .option('-s, --source <string>', 'download target, could be url or a list file')
    .option('-o, --output_dir <dir>', 'output directory, default is "~/Downloads/youtube" if OSX')
    .option('-n, --output-name <string>', 'output name template, default is:\n' +
    '\tsingle video: "[%(uploader)s] %(title)s.%(ext)s"\n' +
    '\tvideo in list: "%(playlist)s/[%(uploader)s] %(title)s.%(ext)s"')
    .option('-f, --format <string>', 'download format, default is: \n' +
    '\t-V 720: "298+140" if 60fps available, "136+140" if not\n' +
    '\t-V 1080: "299+140" if 60fps available, "137+140" if not')
    .option('-F, --list-formats', 'same as youtube-dl -F, list all available formats of video')
    .option('-V, --vertical-resolution <number>', 'vertical resolution, default is "720"')
    .option('-H, --socks5-host <string>', 'socks5 proxy host, default is "127.0.0.1"')
    .option('-P, --socks5-port <number>', 'socks5 proxy port, default is "1086"')
    .option('-A, --additional-options <string>', 'additional options, would be appended with built command directly, e.g: $builtCommand $additionalOptions')
    .parse(process.argv);
console.log(program);
console.log(1, program.socks5Host);
console.log(1, program.additionalOptions);
console.log(1, program.listFormats);
let ARGS_SOURCE = program.source;
let ARGS_OUTPUT_DIR = program.outputDir;
let ARGS_OUTPUT_NAME = program.outputName;
const ARGS_FORMAT = program.format;
const ARGS_LIST_FORMATS = program.listFormats !== undefined;
let ARGS_VERTICAL_RESOLUTION = program.verticalResolution;
const ARGS_SOCKS5_HOST = program.socks5Host === undefined ? DEFAULT_SOCKS5_HOST : program.socks5Host;
const ARGS_SOCKS5_PORT = program.socks5Port === undefined ? DEFAULT_SOCKS5_PORT : program.socks5Port;
const ARGS_ADDITIONAL_OPTIONS = program.additionalOptions === undefined ? '' : program.additionalOptions;
class YoutubeDLQuick {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Process starting ...');
            yield this._validate();
            yield this._process();
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Process validating ...');
            // validate youtube-dl installed or not
            if (!shell.which('youtube-dl')) {
                console.log('Command "youtube-dl" not found, you need to install "youtube-dl" first.\nOSX e.g: brew install youtube-dl');
                process.exit(1);
            }
            // validate ARGS_URL
            if (ARGS_SOURCE === undefined) {
                console.log('Option "url" required, please provide -u option!');
                process.exit(1);
            }
            if (!isUrl(ARGS_SOURCE) && (yield LibFs.stat(ARGS_SOURCE))) { // means a file
            }
            // validate ARGS_OUTPUT_DIR
            if (ARGS_OUTPUT_DIR === undefined && LibOs.platform() === 'darwin') {
                ARGS_OUTPUT_DIR = DEFAULT_OUTPUT_DIR;
            }
            else if (ARGS_OUTPUT_DIR === undefined) {
                console.log('Option "output dir" required, please provide -o option!');
                process.exit(1);
            }
            // is playlist
            if (ARGS_SOURCE.indexOf('list') !== -1) {
                IS_SOURCE_PLAYLIST = true;
                console.log('Target url is a playlist');
            }
            // validate ARGS_OUTPUT_NAME
            if (ARGS_OUTPUT_NAME === undefined && IS_SOURCE_PLAYLIST) {
                ARGS_OUTPUT_NAME = DEFAULT_OUTPUT_NAME_LIST;
            }
            else if (ARGS_OUTPUT_NAME === undefined) {
                ARGS_OUTPUT_NAME = DEFAULT_OUTPUT_NAME_SINGLE;
            }
            // validate ARGS_VERTICAL_RESOLUTION
            if (ARGS_VERTICAL_RESOLUTION === undefined) {
                ARGS_VERTICAL_RESOLUTION = DEFAULT_VERTICAL_RESOLUTION;
            }
            else if (VALID_VERTICAL_RESOLUTION.indexOf(ARGS_VERTICAL_RESOLUTION) === -1) {
                console.log(`Option "vertical resolution" is restrict to ${JSON.stringify(VALID_VERTICAL_RESOLUTION)}!`);
                process.exit(1);
            }
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
new YoutubeDLQuick().run().then(_ => _).catch(_ => console.log(_));
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});
//# sourceMappingURL=index.js.map