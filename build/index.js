#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
const DEFAULT_EXT = 'MP4';
const DEFAULT_PROXY_PROTOCOL = 'socks5';
const DEFAULT_PROXY_HOST = '127.0.0.1';
const DEFAULT_PROXY_PORT = '1086';
/**
 * 140          m4a        audio only DASH audio  130k , m4a_dash container, mp4a.40.2@128k
 * 136          mp4        1280x720   720p 2338k , avc1.4d401f, 30fps, video only
 * 247          webm       1280x720   720p 1530k , vp9, 30fps, video only
 * 298          mp4        1280x720   720p60 3496k , avc1.4d4020, 60fps, video only
 * 302          webm       1280x720   720p60 2665k , vp9, 60fps, video only
 * 137          mp4        1920x1080  1080p 4366k , avc1.640028, 30fps, video only
 * 248          webm       1920x1080  1080p 2684k , vp9, 30fps, video only
 * 299          mp4        1920x1080  1080p60 5811k , avc1.64002a, 60fps, video only
 * 303          webm       1920x1080  1080p60 4435k , vp9, 60fps, video only
 * 271          webm       2560x1440  1440p 8995k , vp9, 30fps, video only
 * 308          webm       2560x1440  1440p60 13375k , vp9, 60fps, video only
 * 313          webm       3840x2160  2160p 18369k , vp9, 30fps, video only
 * 315          webm       3840x2160  2160p60 26725k , vp9, 60fps, video only
 */
const VALID_VERTICAL_RESOLUTION = ['720', '1080', '1440', '2160'];
const DEFAULT_FORMAT = {
    MP4: {
        '720': '298+140/136+140',
        '1080': '299+140/137+140',
        '1440': '308+140/271+140',
        '2160': '315+140/313+140',
    },
    MKV: {
        '720': '302+140/247+140',
        '1080': '303+140/248+140',
        '1440': '308+140/271+140',
        '2160': '315+140/313+140',
    }
};
let IS_SOURCE_LISTFILE = false;
let IS_SOURCE_PLAYLIST = false;
program.version(pkg.version)
    .description('youtube-dl-quick: quick usage wrapper for command youtube-dl')
    .option('-s, --source <string>', 'download target, could be url or a list file')
    .option('-o, --output_dir <dir>', 'output directory, default is "~/Downloads/youtube" if OSX')
    .option('-n, --output-name <string>', 'output name template, default is:\n' +
    '\tsingle video: "[%(uploader)s] %(title)s.%(ext)s"\n' +
    '\tvideo in list: "%(playlist)s/[%(uploader)s] %(title)s.%(ext)s"')
    .option('-e, --ext <string>', 'download file ext, default is: MP4, could be: \n' +
    '\tMP4: mp4 avc1 video + m4a mp4a audio -> *.mp4, bigger file, better compatibility\n' +
    '\tMKV: webm vp9 video + m4a mp4a audio -> *.mkv, smaller file, worse compatibility')
    .option('-f, --format <string>', 'download format, default is: \n' +
    '\tMP4:\n' +
    '\t\t-E 720: "298+140" if 60fps available, "136+140" if not\n' +
    '\t\t-E 1080: "299+140" if 60fps available, "137+140" if not\n' +
    '\tMKV:\n' +
    '\t\t-E 720: "302+140" if 60fps available, "247+140" if not\n' +
    '\t\t-E 1080: "303+140" if 60fps available, "248+140" if not\n' +
    '\t\t-E 1440: "308+140" if 60fps available, "271+140" if not\n' +
    '\t\t-E 2160: "315+140" if 60fps available, "313+140" if not')
    .option('-F, --list-formats', 'same as youtube-dl -F, list all available formats of video')
    .option('-E, --vertical-resolution <number>', `vertical resolution, default is "720", available options: ${JSON.stringify(VALID_VERTICAL_RESOLUTION)}`)
    .option('-D, --disable-proxy', 'disable proxy, by default it is enabled')
    .option('-R, --proxy-protocol <string>', 'proxy protocol, default is "socks5"')
    .option('-H, --proxy-host <string>', 'proxy host, default is "127.0.0.1"')
    .option('-P, --proxy-port <number>', 'proxy port, default is "1086"')
    .option('-A, --additional-options <string>', 'additional options, would be appended with built command directly, e.g: $builtCommand $additionalOptions')
    .parse(process.argv);
let ARGS_SOURCE = program.source;
let ARGS_OUTPUT_DIR = program.outputDir;
let ARGS_OUTPUT_NAME = program.outputName;
let ARGS_EXT = program.ext === undefined ? DEFAULT_EXT : program.ext;
let ARGS_FORMAT = program.format;
const ARGS_LIST_FORMATS = program.listFormats !== undefined;
let ARGS_VERTICAL_RESOLUTION = program.verticalResolution;
const ARGS_DISABLE_PROXY = program.disableProxy !== undefined;
const ARGS_PROXY_PROTOCOL = program.proxyProtocol === undefined ? DEFAULT_PROXY_PROTOCOL : program.proxyProtocol;
const ARGS_PROXY_HOST = program.proxyHost === undefined ? DEFAULT_PROXY_HOST : program.proxyHost;
const ARGS_PROXY_PORT = program.proxyPort === undefined ? DEFAULT_PROXY_PORT : program.proxyPort;
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
            // validate ARGS_EXT
            if (ARGS_EXT !== 'MP4' && ARGS_EXT !== 'MKV') {
                console.log('Option "ext" is restrict to one of MP4 | MKV!');
                process.exit(1);
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
                ARGS_FORMAT = DEFAULT_FORMAT[ARGS_EXT][ARGS_VERTICAL_RESOLUTION];
            }
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
            // prepare command base
            let cmdBase = 'youtube-dl';
            if (!ARGS_DISABLE_PROXY) {
                cmdBase += ` --proxy ${ARGS_PROXY_PROTOCOL}://${ARGS_PROXY_HOST}:${ARGS_PROXY_PORT}`; // proxy
            }
            cmdBase += ` -o "${LibPath.join(ARGS_OUTPUT_DIR, ARGS_OUTPUT_NAME)}"`; // output template
            cmdBase += ` -f "${ARGS_FORMAT}"`; // format
            cmdBase += ' --ignore-errors'; // continue when error encountered
            if (ARGS_ADDITIONAL_OPTIONS) {
                cmdBase += ` ${ARGS_ADDITIONAL_OPTIONS}`; // additional options
            }
            // list formats handled first
            if (ARGS_LIST_FORMATS && isUrl(ARGS_SOURCE)) {
                yield this._processListFormats(cmdBase, ARGS_SOURCE);
            }
            // process download
            if (IS_SOURCE_PLAYLIST) {
                // playlist
                yield this._processPlaylistDownload(cmdBase);
            }
            else if (IS_SOURCE_LISTFILE) {
                // list file
                yield this._processListFileDownload(cmdBase);
            }
            else {
                // single url download
                yield this._executeWithErrorHandling(cmdBase, ARGS_SOURCE);
            }
        });
    }
    _processListFormats(cmdBase, source) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeWithErrorHandling(`${cmdBase} -F`, source);
            process.exit(0); // exit after format list
        });
    }
    _processPlaylistDownload(cmdBase) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeWithErrorHandling(`${cmdBase} --yes-playlist`, ARGS_SOURCE);
        });
    }
    _processListFileDownload(cmdBase) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeWithErrorHandling(`${cmdBase} --batch-file`, ARGS_SOURCE);
        });
    }
    _executeWithErrorHandling(command, source) {
        return __awaiter(this, void 0, void 0, function* () {
            const finalCommand = `${command} "${source}"`;
            try {
                yield this._execute(finalCommand);
            }
            catch (e) {
                // unexpected error
                console.log(e);
            }
        });
    }
    _execute(command) {
        console.log(`execute command: ${command}`);
        return new Promise((resolve, reject) => {
            shell.exec(command, (code, stdout, stderr) => {
                // unexpected error
                if (code !== 0) {
                    return reject(`Error in "${command}"\ncode: ${code}, stderr: ${stderr}`);
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