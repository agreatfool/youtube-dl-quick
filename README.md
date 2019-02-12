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
  -f, --format <string>               download format, default is: 
        -V 720: "298+140" if 60fps available, "136+140" if not
        -V 1080: "299+140" if 60fps available, "137+140" if not
        -V 1440: "308+140" if 60fps available, "271+140" if not
        -V 2160: "315+140" if 60fps available, "313+140" if not
  -F, --list-formats <boolean>        same as youtube-dl -F, list all available formats of video
  -V, --vertical-resolution <number>  vertical resolution, default is "720", available options: ["720","1080","1440","2160"]
  -D, --disable-proxy <boolean>       disable proxy, by default it is enabled
  -R, --proxy-protocol <string>       proxy protocol, default is "socks5"
  -H, --proxy-host <string>           proxy host, default is "127.0.0.1"
  -P, --proxy-port <number>           proxy port, default is "1086"
  -A, --additional-options <string>   additional options, would be appended with built command directly, e.g: $builtCommand $additionalOptions
  -h, --help                          output usage information
```