/*\
title: $:/plugins/farcaller/youtube/widget
type: application/javascript
module-type: widget

\*/

(function () {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  // We need to store the player objects somewhere where <$youtube/> can write
  // them and <$youtubeTimestamp/> can read them from. We're using the
  // div.data-tiddler-title created in the default view template for this, and
  // store the players in the yt_installedPlayers attribute.
  const PARENT_SEARCH_QUERY = '[data-tiddler-title]';

  const Widget = require('$:/core/modules/widgets/widget.js').widget;

  // YoutubeWidget is a widget that renders YT videos with a player. It expects
  // that the YT iframe api is already loaded.
  const YoutubeWidget = function (parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
  };

  YoutubeWidget.prototype = new Widget();

  YoutubeWidget.prototype._makeYTPlayer = function (parent, nextSibling, videoId) {
    // find the body of the tiddler created in ViewTemplate. Bail out if not
    // found.
    const tiddlerBody = parent.closest(PARENT_SEARCH_QUERY);
    if (!tiddlerBody) {
      return;
    }

    // FIXME: what if iframe api didn't load yet? it doesn't seem like tiddly is
    // waiting for document to be ready :-(
    if (!window.YT || !window.YT.Player) {
      console.warn(`YT API didn't load in time for ${videoId}`);
      return;
    }

    // YT Player replaces the passed in node so let's create a temporary node
    // for it, otherwise it will destroy the parent.
    const ytNode = document.createElement("DIV");
    parent.insertBefore(ytNode, nextSibling);
    const player = new window.YT.Player(ytNode, {
      height: '315',
      width: '560',
      videoId: videoId,
    });
    this.domNodes.push(player.getIframe());

    if (!tiddlerBody.yt_installedPlayers) {
      tiddlerBody.yt_installedPlayers = {};
    }
    tiddlerBody.yt_installedPlayers[videoId] = player;
  };

  YoutubeWidget.prototype._rmYTPlayer = function (parent, videoId) {
    const tiddlerBody = parent.closest(PARENT_SEARCH_QUERY);
    if (!tiddlerBody) {
      return;
    }
    if (!tiddlerBody.yt_installedPlayers) {
      tiddlerBody.yt_installedPlayers = {};
    }
    tiddlerBody.yt_installedPlayers[videoId] = null;
  };

  YoutubeWidget.prototype.render = function (parent, nextSibling) {
    this.parentDomNode = parent;
    this.nextSibling = nextSibling;
    this.computeAttributes();

    this.videoId = this.getAttribute("video");

    this.execute();
  };

  YoutubeWidget.prototype.execute = function () {
    if (this.videoId) {
      this._makeYTPlayer(this.parentDomNode, this.nextSibling, this.videoId);
    } else {
      const textNode = this.document.createTextNode(
        '<$youtube/> widget requires a "video" attribute');
      this.parentDomNode.insertBefore(textNode, this.nextSibling);
      this.domNodes.push(textNode);
    }
  };

  YoutubeWidget.prototype.refresh = function (changedTiddlers) {
    if (changedTiddlers['$:/temp/youtube-api-loaded'] !== undefined) {
      console.log('will refresh yt');
      this.refreshSelf();
      return true;
    }
    return false;
  };

  YoutubeWidget.prototype.removeChildDomNodes = function () {
    Widget.prototype.removeChildDomNodes.call(this);
    this._rmYTPlayer(this.parentDomNode, this.videoId);
  };

  exports.youtube = YoutubeWidget;

  // YoutubeTimestampWidget is a widget that seeks the youtube widget in the
  // current tiddler to the given time.
  const YoutubeTimestampWidget = function (parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
  };

  YoutubeTimestampWidget.prototype = new Widget();

  YoutubeTimestampWidget.prototype._handleNavigation = function () {
    let videoId = this.shadowVideoId;
    if (this.videoId) {
      videoId = this.videoId;
    }

    const tiddlerBody = this.parentDomNode.closest(PARENT_SEARCH_QUERY);
    let player = undefined;
    if (videoId) {
      player = tiddlerBody.yt_installedPlayers[videoId];
    } else {
      const keys = Object.keys(tiddlerBody.yt_installedPlayers);
      if (keys.length !== 1) {
        console.error(`no videoId defined in ytts; expected 1 player installed but got ${keys}`);
        return;
      }
      player = tiddlerBody.yt_installedPlayers[keys[0]];
    }

    const tc = this.timestamp.split(':');
    let timeSec = 0;
    if (tc.length == 1) {
      timeSec = +tc[0];
    } else {
      timeSec = +(tc[0]) * 60 + (+tc[1]);
    }
    player.seekTo(timeSec, true);
    player.playVideo();
  };

  YoutubeTimestampWidget.prototype.render = function (parent, nextSibling) {
    this.parentDomNode = parent;
    this.nextSibling = nextSibling;
    this.computeAttributes();

    this.videoId = this.getAttribute("video");
    this.shadowVideoId = this.getAttribute("shadowVideo");
    this.timestamp = this.getAttribute("timestamp");

    this.execute();
  };

  YoutubeTimestampWidget.prototype.execute = function () {
    if (this.timestamp) {
      const tsNode = document.createElement("SPAN");
      tsNode.onclick = () => { this._handleNavigation() };
      tsNode.style.textDecoration = 'underline';
      tsNode.style.textDecorationColor = 'red';
      tsNode.style.cursor = 'pointer';
      const textNode = this.document.createTextNode(this.timestamp);
      tsNode.appendChild(textNode);

      this.parentDomNode.insertBefore(tsNode, this.nextSibling);
      this.domNodes.push(tsNode);
    } else {
      const textNode = this.document.createTextNode(
        '<$youtubeTimestamp/> widget requires "video" and "timestamp" attributes');
      this.parentDomNode.insertBefore(textNode, this.nextSibling);
      this.domNodes.push(textNode);
    }
  };

  exports.youtubeTimestamp = YoutubeTimestampWidget;

})();
