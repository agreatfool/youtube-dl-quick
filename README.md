youtube-dl-quick
================

youtube-dl is required. Please install it first.

Mac user:

```
brew install youtube-dl
```

## Install

```
npm install youtube-dl-quick -g
```

## Usage

```
$ youtube-dl-quick -h
Usage: index [options]

youtube-dl-quick: quick usage wrapper for command youtube-dl

Options:
  -V, --version                       output the version number
  -s, --source <string>               download target, could be url or a list file
  -o, --output_dir <dir>              output directory, default is "~/Downloads/youtube" if OSX
  -n, --output-name <string>          output name template, default is:
        single video: "[%(uploader)s] %(title)s.%(ext)s"
        video in list: "%(playlist)s/[%(uploader)s] %(title)s.%(ext)s"
  -e, --ext <string>                  download file ext, default is: MKV, could be: 
        MP4: mp4 avc1 video + m4a mp4a audio -> *.mp4, bigger file, normal quality, better compatibility
        MKV: webm vp9 video + m4a mp4a audio -> *.mkv, much smaller file, good quality, worse compatibility
  -f, --format <string>               download format, default is: 
        MP4:
                -E 720: "298+140" if 60fps available, "136+140" if not
                -E 1080: "299+140" if 60fps available, "137+140" if not
        MKV:
                -E 720: "302+140" if 60fps available, "247+140" if not
                -E 1080: "303+140" if 60fps available, "248+140" if not
                -E 1440: "308+140" if 60fps available, "271+140" if not
                -E 2160: "315+140" if 60fps available, "313+140" if not
  -F, --list-formats                  same as youtube-dl -F, list all available formats of video
  -E, --vertical-resolution <number>  vertical resolution, default is "BEST", available options: ["720","1080","1440","2160","BEST"]
  -D, --disable-proxy                 disable proxy, by default it is enabled
  -R, --proxy-protocol <string>       proxy protocol, default is "socks5"
  -H, --proxy-host <string>           proxy host, default is "127.0.0.1"
  -P, --proxy-port <number>           proxy port, default is "6153"
  -A, --additional-options <string>   additional options, would be appended with built command directly, e.g: $builtCommand $additionalOptions
  -h, --help                          display help for command
```

```
Video formats:
 249          webm       audio only tiny   57k , webm_dash container, opus @ 57k (48000Hz), 621.30KiB
 250          webm       audio only tiny   76k , webm_dash container, opus @ 76k (48000Hz), 823.10KiB
 140          m4a        audio only tiny  129k , m4a_dash container, mp4a.40.2@129k (44100Hz), 1.37MiB
 251          webm       audio only tiny  150k , webm_dash container, opus @150k (48000Hz), 1.58MiB
 136          mp4        1280x720   720p 2338k , avc1.4d401f, 30fps, video only
 247          webm       1280x720   720p 1530k , vp9, 30fps, video only
 298          mp4        1280x720   720p60 3496k , avc1.4d4020, 60fps, video only
 302          webm       1280x720   720p60 2665k , vp9, 60fps, video only
 137          mp4        1920x1080  1080p 4366k , avc1.640028, 30fps, video only
 248          webm       1920x1080  1080p 2684k , vp9, 30fps, video only
 299          mp4        1920x1080  1080p60 5811k , avc1.64002a, 60fps, video only
 303          webm       1920x1080  1080p60 4435k , vp9, 60fps, video only
 271          webm       2560x1440  1440p 8995k , vp9, 30fps, video only
 308          webm       2560x1440  1440p60 13375k , vp9, 60fps, video only
 313          webm       3840x2160  2160p 18369k , vp9, 30fps, video only
 315          webm       3840x2160  2160p60 26725k , vp9, 60fps, video only
```
