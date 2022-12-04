/*\
title: $:/plugins/farcaller/bojotask/widgets/bojotask
type: application/javascript
module-type: widget

\*/

(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const Widget = require("$:/core/modules/widgets/widget.js").widget;

  class BojoWidget extends Widget {
    BojoWidget() {
      this.initialise(parseTreeNode, options);
    }

    render(parent, nextSibling) {
      this.parentDomNode = parent;
      this.computeAttributes();
      this.execute();
      this.renderChildren(parent, nextSibling);
    }

    computeAttributes() {
      super.computeAttributes();
      this.slugId = null;
      this.taskTiddler = null;
      
      const slug = this.getAttribute("slug");
      if (!slug) {
        console.warn('BojoWidget without a slug');
        return;
      }
      const slugId = slug.split('-', 1);
      const indexer = this.wiki.getIndexer('BojoTaskIdIndexer');
      const taskTiddler = indexer.lookup(slugId);
      if (!taskTiddler) {
        console.warn(`BojoWidget has no tiddler for slug ${slugId}`);
        return;
      }

      this.slugId = slugId;
      this.taskTiddler = taskTiddler;
    }

    execute() {
      if (!this.taskTiddler) {
        return;
      }
      this.setVariable("currentTiddler", this.taskTiddler.fields.title);
      this.makeChildWidgets();
    }

    refresh(changedTiddlers) {
      if (!this.taskTiddler) {
        this.computeAttributes();
      }

      if (this.slugId) {
        const indexer = this.wiki.getIndexer('BojoTaskIdIndexer');
        const taskTiddler = indexer.lookup(this.slugId);
        if (this.taskTiddler?.fields.title !== taskTiddler?.fields.title) {
          this.refreshSelf();
          return true;
        }
      }

      return false;
    }
  };

  exports.bojowidget = BojoWidget;

})();
