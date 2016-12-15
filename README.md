# ipg [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> zoho crm sync

## Installation
You only need to install what is in the package:
```bash
$ sudo npm install
```

## Usage
Once all dependencies have been installed, you can use all the methos exposed in the main module, which is in cron.js.

For running the task in the server you'll nedd to intall foreverjs as global:
``` bash
  $ [sudo] npm install forever -g
```
More info about [forever][0]

With forever installed, and standed in project's root, lets start the cron task running:
``` bash
  $ forever start lib/cron.js
```

To see where the log is:
``` bash
  $ forever logs
```

In order to stop the task:
``` bash
  $ forever stop 0
```
The '0' is the index of the task that's running (assuming there's only one).

## License

MIT © [jimibustamante]()


[npm-image]: https://badge.fury.io/js/ipg.svg
[npm-url]: https://npmjs.org/package/ipg
[travis-image]: https://travis-ci.org/jimibustamante/ipg.svg?branch=master
[travis-url]: https://travis-ci.org/jimibustamante/ipg
[daviddm-image]: https://david-dm.org/jimibustamante/ipg.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/jimibustamante/ipg

[0]: https://github.com/foreverjs/forever
