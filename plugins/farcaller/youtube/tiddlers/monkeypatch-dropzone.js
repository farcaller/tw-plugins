/*\
title: $:/plugins/farcaller/youtube/monkeypatch-dropzone.js
type: application/javascript
module-type: startup
\*/

(function () {

  /*jslint node: false, browser: true */
  /*global $tw: false */
  "use strict";

  // Export name and synchronous status
  exports.name = "farcaller-youtube-monkeypatch-dropzone";
  exports.after = ["windows"];
  exports.synchronous = true;

  const YoutubeRegexp = /(youtube.*\.com|youtu\.be).*(\/|%3D|vi?=)(?<id>[0-9A-z-_]{11})([%#?&]|$)/;

  exports.startup = function () {
    const version = $tw.version.split('.');
    if ($tw.node || version[0] > 5 || version[1] > 2 || version[1] > 3) {
      return;
    }

    const dropzoneWidget = require("$:/core/modules/widgets/dropzone.js");
    const originalHandler = dropzoneWidget.dropzone.prototype.handlePasteEvent;
    dropzoneWidget.dropzone.prototype.handlePasteEvent = function (event) {
      const self = this;

      if (["TEXTAREA", "INPUT"].indexOf(event.target.tagName) !== -1 || event.target.isContentEditable) {
        return;
      }

      const items = event.clipboardData.items;
      if (items.length === 0) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }

      if (items[0].kind !== 'string') {
        originalHandler.call(this, event);
        return;
      }

      if (!event.clipboardData.types.includes('text/plain')) {
        originalHandler.call(this, event);
        return;
      }

      const str = event.clipboardData.getData('text/plain');
      const match = str.match(YoutubeRegexp);
      if (!match) {
        originalHandler.call(this, event);
        return;
      }

      const apiKey = $tw.wiki.getTiddler('$:/plugins/farcaller/youtube/configuration').fields.apikey;
      if (!apiKey) {
        console.warn('importing a YT link but no api key defined, skipping youtube importer');
        originalHandler.call(this, event);
        return;
      }

      const youtubeVideoId = match.groups.id;
      fetch('https://www.googleapis.com/youtube/v3/videos?' + new URLSearchParams({
        id: youtubeVideoId,
        part: 'snippet',
        key: apiKey,
      })).then((response) => response.json()).then((body) => {
        const items = body.items;
        if (!items) {
          throw 'no items in response';
        }
        if (items.length !== 1) {
          throw 'not a single item in response';
        }
        const snippet = items[0].snippet;

        // const tagline = `Tags: ` + (snippet.tags?.map((t) => `\`#${t}\``).join(' ') ?? '');
        // const description = snippet.description?.split('\n').map((line) => `> ${line}`).join('\n') ?? '';

        const tiddlerFields = {
          title: self.wiki.generateNewTitle(snippet.title),
          type: 'text/vnd.tiddlywiki',
          'youtube-id': youtubeVideoId,
          'youtube-channel-id': snippet.channelId,
          text: '',
        };
        if ($tw.log.IMPORT) {
          console.log('Importing youtube video', snippet);
        }
        self.readFileCallback([tiddlerFields]);
      }).catch((rej) => {
        console.error('something went wrong:', rej);
      });
      
      event.stopPropagation();
      event.preventDefault();
    }
  };

})();
