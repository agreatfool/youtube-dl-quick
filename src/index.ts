#!/usr/bin/env node

import * as LibFs from 'mz/fs';
import * as LibPath from 'path';
import * as LibOs from 'os';

import * as program from 'commander';
import * as shell from 'shelljs';
import * as isUrl from 'is-url';

const pkg = require('../package.json');

const DEFAULT_OUTPUT_DIR = '~/Downloads/youtube';
const DEFAULT_OUTPUT_NAME_SINGLE = '[%(uploader)s] %(title)s.%(ext)s';
const DEFAULT_OUTPUT_NAME_LIST = `%(playlist)s/${DEFAULT_OUTPUT_NAME_SINGLE}`;
const DEFAULT_VERTICAL_RESOLUTION = 'BEST';
const DEFAULT_EXT = 'MKV';
const DEFAULT_PROXY_PROTOCOL = 'socks5';
const DEFAULT_PROXY_HOST = '127.0.0.1';
const DEFAULT_PROXY_PORT = '6153';
/**
 * 249          webm       audio only tiny   57k , webm_dash container, opus @ 57k (48000Hz), 621.30KiB
 * 250          webm       audio only tiny   76k , webm_dash container, opus @ 76k (48000Hz), 823.10KiB
 * 140          m4a        audio only tiny  129k , m4a_dash container, mp4a.40.2@129k (44100Hz), 1.37MiB
 * 251          webm       audio only tiny  150k , webm_dash container, opus @150k (48000Hz), 1.58MiB
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
const VALID_VERTICAL_RESOLUTION = ['720', '1080', '1440', '2160', 'BEST'];
const DEFAULT_FORMAT = { // 60fps first
  MP4: {
    '720': '298+140/136+140',
    '1080': '299+140/137+140',
    '1440': '308+140/271+140',
    '2160': '315+140/313+140',
    'BEST': '315+140/308+140/299+140/298+140',
  },
  MKV: {
    '720': '302+140/247+140',
    '1080': '303+140/248+140',
    '1440': '308+140/271+140',
    '2160': '315+140/313+140',
    'BEST': '315+140/308+140/303+140/302+140',
  }
};

let IS_SOURCE_LISTFILE = false;
let IS_SOURCE_PLAYLIST = false;

program.version(pkg.version)
  .description('youtube-dl-quick: quick usage wrapper for command youtube-dl')
  .option('-s, --source <string>', 'download target, could be url or a list file')
  .option('-o, --output_dir <dir>', 'output directory, default is "~/Downloads/youtube" if OSX')
  .option(
    '-n, --output-name <string>',
    'output name template, default is:\n' +
    '\tsingle video: "[%(uploader)s] %(title)s.%(ext)s"\n' +
    '\tvideo in list: "%(playlist)s/[%(uploader)s] %(title)s.%(ext)s"'
  )
  .option(
    '-e, --ext <string>',
    'download file ext, default is: MKV, could be: \n' +
    '\tMP4: mp4 avc1 video + m4a mp4a audio -> *.mp4, bigger file, normal quality, better compatibility\n' +
    '\tMKV: webm vp9 video + m4a mp4a audio -> *.mkv, much smaller file, good quality, worse compatibility'
  )
  .option(
    '-f, --format <string>',
    'download format, default is: \n' +
    '\tMP4:\n' +
    '\t\t-E 720: "298+140" if 60fps available, "136+140" if not\n' +
    '\t\t-E 1080: "299+140" if 60fps available, "137+140" if not\n' +
    '\tMKV:\n' +
    '\t\t-E 720: "302+140" if 60fps available, "247+140" if not\n' +
    '\t\t-E 1080: "303+140" if 60fps available, "248+140" if not\n' +
    '\t\t-E 1440: "308+140" if 60fps available, "271+140" if not\n' +
    '\t\t-E 2160: "315+140" if 60fps available, "313+140" if not'
  )
  .option('-F, --list-formats', 'same as youtube-dl -F, list all available formats of video')
  .option('-E, --vertical-resolution <number>', `vertical resolution, default is "BEST", available options: ${JSON.stringify(VALID_VERTICAL_RESOLUTION)}`)
  .option('-D, --disable-proxy', 'disable proxy, by default it is enabled')
  .option('-R, --proxy-protocol <string>', 'proxy protocol, default is "socks5"')
  .option('-H, --proxy-host <string>', 'proxy host, default is "127.0.0.1"')
  .option('-P, --proxy-port <number>', 'proxy port, default is "6153"')
  .option('-A, --additional-options <string>', 'additional options, would be appended with built command directly, e.g: $builtCommand $additionalOptions')
  .parse(process.argv);

let ARGS_SOURCE = (program as any).source;
let ARGS_OUTPUT_DIR = (program as any).outputDir;
let ARGS_OUTPUT_NAME = (program as any).outputName;
let ARGS_EXT = (program as any).ext === undefined ? DEFAULT_EXT : (program as any).ext;
let ARGS_FORMAT = (program as any).format;
const ARGS_LIST_FORMATS = (program as any).listFormats !== undefined;
let ARGS_VERTICAL_RESOLUTION = (program as any).verticalResolution;
const ARGS_DISABLE_PROXY = (program as any).disableProxy !== undefined;
const ARGS_PROXY_PROTOCOL = (program as any).proxyProtocol === undefined ? DEFAULT_PROXY_PROTOCOL : (program as any).proxyProtocol;
const ARGS_PROXY_HOST = (program as any).proxyHost === undefined ? DEFAULT_PROXY_HOST : (program as any).proxyHost;
const ARGS_PROXY_PORT = (program as any).proxyPort === undefined ? DEFAULT_PROXY_PORT : (program as any).proxyPort;
const ARGS_ADDITIONAL_OPTIONS = (program as any).additionalOptions === undefined ? '' : (program as any).additionalOptions;

class YoutubeDLQuick {

  public async run() {
    console.log('Process starting ...');

    await this._validate();
    await this._process();
  }

  private async _validate() {
    console.log('Process validating ...');

    // validate youtube-dl installed or not
    if (!shell.which('youtube-dl')) {
      console.log(
        'Command "youtube-dl" not found, you need to install it first.\n' +
        'e.g OSX: brew install youtube-dl'
      );
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
      && await LibFs.exists(ARGS_SOURCE)
      && (await LibFs.stat(ARGS_SOURCE)).isFile()) { // means a file
      IS_SOURCE_LISTFILE = true;
      console.log('Download source is a list file');
    }

    // validate ARGS_OUTPUT_DIR
    if (ARGS_OUTPUT_DIR === undefined && LibOs.platform() === 'darwin') {
      ARGS_OUTPUT_DIR = DEFAULT_OUTPUT_DIR;
    } else if (ARGS_OUTPUT_DIR === undefined) {
      console.log('Option "output dir" required, please provide -o option!');
      process.exit(1);
    }

    // validate ARGS_OUTPUT_NAME
    if (ARGS_OUTPUT_NAME === undefined && IS_SOURCE_PLAYLIST) {
      ARGS_OUTPUT_NAME = DEFAULT_OUTPUT_NAME_LIST;
    } else if (ARGS_OUTPUT_NAME === undefined) {
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
    } else if (ARGS_VERTICAL_RESOLUTION
      && VALID_VERTICAL_RESOLUTION.indexOf(ARGS_VERTICAL_RESOLUTION) === -1) {
      console.log(`Option "vertical resolution" is restrict to one of ${JSON.stringify(VALID_VERTICAL_RESOLUTION)}!`);
      process.exit(1);
    }

    // validate ARGS_FORMAT
    if (ARGS_FORMAT === undefined) {
      ARGS_FORMAT = DEFAULT_FORMAT[ARGS_EXT][ARGS_VERTICAL_RESOLUTION];
    }

  }

  private async _process() {

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
      await this._processListFormats(cmdBase, ARGS_SOURCE);
    }

    // process download
    if (IS_SOURCE_PLAYLIST) {
      // playlist
      await this._processPlaylistDownload(cmdBase);
    } else if (IS_SOURCE_LISTFILE) {
      // list file
      await this._processListFileDownload(cmdBase);
    } else {
      // single url download
      await this._executeWithErrorHandling(cmdBase, ARGS_SOURCE);
    }

  }

  private async _processListFormats(cmdBase: string, source: string) {
    await this._executeWithErrorHandling(`${cmdBase} -F`, source);
    process.exit(0); // exit after format list
  }

  private async _processPlaylistDownload(cmdBase: string) {
    await this._executeWithErrorHandling(`${cmdBase} --yes-playlist`, ARGS_SOURCE);
  }

  private async _processListFileDownload(cmdBase: string) {
    await this._executeWithErrorHandling(`${cmdBase} --batch-file`, ARGS_SOURCE);
  }

  private async _executeWithErrorHandling(command: string, source: string) {

    const finalCommand = `${command} "${source}"`;

    try {
      await this._execute(finalCommand);
    } catch (e) {
      // unexpected error
      console.log(e);
    }

  }

  private _execute(command: string): Promise<void> {

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

process.on('uncaughtException', (error: Error) => {
  console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on('unhandledRejection', (error: Error) => {
  console.error(`Process on unhandledRejection error = ${error.stack}`);
});
