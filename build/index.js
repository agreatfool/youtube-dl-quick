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
const LibPath = require("path");
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
/**
 * 140          m4a        audio only DASH audio  130k , m4a_dash container, mp4a.40.2@128k
 * 136          mp4        1280x720   720p 2338k , avc1.4d401f, 30fps, video only
 * 298          mp4        1280x720   720p60 3496k , avc1.4d4020, 60fps, video only
 * 137          mp4        1920x1080  1080p 4366k , avc1.640028, 30fps, video only
 * 299          mp4        1920x1080  1080p60 5811k , avc1.64002a, 60fps, video only
 * 271          webm       2560x1440  1440p 8995k , vp9, 30fps, video only
 * 308          webm       2560x1440  1440p60 13375k , vp9, 60fps, video only
 * 313          webm       3840x2160  2160p 18369k , vp9, 30fps, video only
 * 315          webm       3840x2160  2160p60 26725k , vp9, 60fps, video only
 */
const VALID_VERTICAL_RESOLUTION = ['720', '1080', '1440', '2160'];
const DEFAULT_FORMAT = {
    '720': {
        '30': '136+140',
        '60': '298+140'
    },
    '1080': {
        '30': '137+140',
        '60': '299+140'
    },
    '1440': {
        '30': '271+140',
        '60': '308+140'
    },
    '2160': {
        '30': '313+140',
        '60': '315+140'
    }
};
const ERROR_UNAVAILABLE_FORMAT = 'ERROR: requested format not available';
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
    '\t-V 1080: "299+140" if 60fps available, "137+140" if not\n' +
    '\t-V 1440: "308+140" if 60fps available, "271+140" if not\n' +
    '\t-V 2160: "315+140" if 60fps available, "313+140" if not')
    .option('-F, --list-formats <boolean>', 'same as youtube-dl -F, list all available formats of video')
    .option('-V, --vertical-resolution <number>', `vertical resolution, default is "720", available options: ${JSON.stringify(VALID_VERTICAL_RESOLUTION)}`)
    .option('-D, --disable-socks5-proxy <boolean>', 'disable socks5 proxy, by default it is enabled')
    .option('-H, --socks5-host <string>', 'socks5 proxy host, default is "127.0.0.1"')
    .option('-P, --socks5-port <number>', 'socks5 proxy port, default is "1086"')
    .option('-A, --additional-options <string>', 'additional options, would be appended with built command directly, e.g: $builtCommand $additionalOptions')
    .parse(process.argv);
let ARGS_SOURCE = program.source;
let ARGS_OUTPUT_DIR = program.outputDir;
let ARGS_OUTPUT_NAME = program.outputName;
let ARGS_FORMAT = program.format;
const ARGS_LIST_FORMATS = program.listFormats !== undefined;
let ARGS_VERTICAL_RESOLUTION = program.verticalResolution;
const ARGS_DISABLE_SOCKS5_PROXY = program.disableSocks5Proxy !== undefined;
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
                console.log('Command "youtube-dl" not found, you need to install it first.\n' +
                    'e.g OSX: brew install youtube-dl');
                process.exit(1);
            }
            // validate ARGS_URL
            if (ARGS_SOURCE === undefined) {
                console.log('Option "source" required, please provide -s option!');
                process.exit(1);
            }
            if (isUrl(ARGS_SOURCE) && ARGS_SOURCE.indexOf('list') !== -1) {
                IS_SOURCE_PLAYLIST = true;
                console.log('Download source is a playlist');
            }
            if (!isUrl(ARGS_SOURCE)
                && (yield LibFs.exists(ARGS_SOURCE))
                && (yield LibFs.stat(ARGS_SOURCE)).isFile()) { // means a file
                IS_SOURCE_LISTFILE = true;
                console.log('Download source is a list file');
            }
            // validate ARGS_OUTPUT_DIR
            if (ARGS_OUTPUT_DIR === undefined && LibOs.platform() === 'darwin') {
                ARGS_OUTPUT_DIR = DEFAULT_OUTPUT_DIR;
            }
            else if (ARGS_OUTPUT_DIR === undefined) {
                console.log('Option "output dir" required, please provide -o option!');
                process.exit(1);
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
            else if (ARGS_VERTICAL_RESOLUTION
                && VALID_VERTICAL_RESOLUTION.indexOf(ARGS_VERTICAL_RESOLUTION) === -1) {
                console.log(`Option "vertical resolution" is restrict to one of ${JSON.stringify(VALID_VERTICAL_RESOLUTION)}!`);
                process.exit(1);
            }
            // validate ARGS_FORMAT
            if (ARGS_FORMAT === undefined) {
                ARGS_FORMAT = DEFAULT_FORMAT[ARGS_VERTICAL_RESOLUTION]['60'];
            }
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
            // prepare command base
            let cmdBase = 'youtube-dl';
            if (!ARGS_DISABLE_SOCKS5_PROXY) {
                cmdBase += ` --proxy socks5://${ARGS_SOCKS5_HOST}:${ARGS_SOCKS5_PORT}`;
            }
            cmdBase += ` -o "${LibPath.join(ARGS_OUTPUT_DIR, ARGS_OUTPUT_NAME)}"`;
            // list formats handled first
            if (ARGS_LIST_FORMATS && isUrl(ARGS_SOURCE)) {
                yield this._processListFormats(cmdBase);
            }
            yield this._executeWithErrorHandling(cmdBase, ARGS_SOURCE);
        });
    }
    _processListFormats(cmdBase) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._execute(`${cmdBase} -F`);
        });
    }
    _executeWithErrorHandling(command, source) {
        return __awaiter(this, void 0, void 0, function* () {
            const finalCommand = `${command} -f "${ARGS_FORMAT}" ${source}`;
            try {
                yield this._execute(finalCommand);
            }
            catch (e) {
                if (e === ERROR_UNAVAILABLE_FORMAT) {
                    // retry with downgrade format
                    try {
                        const retryCommand = `${command} -f "${DEFAULT_FORMAT[ARGS_VERTICAL_RESOLUTION]['30']}" ${source}`;
                        console.log(`retry with command: ${retryCommand}`);
                        yield this._execute(retryCommand);
                    }
                    catch (e) {
                        // retry failed
                        console.log(e);
                    }
                }
                else {
                    // unexpected error
                    console.log(e);
                }
            }
        });
    }
    _execute(command) {
        console.log(`execute command: ${command}`);
        return new Promise((resolve, reject) => {
            const child = shell.exec(command, (code, stdout, stderr) => {
                // unexpected error
                if (code !== 0 && stderr.trim() !== ERROR_UNAVAILABLE_FORMAT) {
                    return reject(`Error in "${command}"\ncode: ${code}, stderr: ${stderr}`);
                }
                // unavailable format error
                if (code !== 0 && stderr.trim() === ERROR_UNAVAILABLE_FORMAT) {
                    return reject(ERROR_UNAVAILABLE_FORMAT);
                }
                return resolve();
            });
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