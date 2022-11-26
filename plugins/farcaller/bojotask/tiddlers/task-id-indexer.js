/*\
title: $:/plugins/farcaller/bojotask/task-id-indexer.js
type: application/javascript
module-type: indexer

Indexes the tiddlers with bojo task ids.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global modules: false */
  "use strict";

  const TASK_ID_FIELD = 'bojo-task-id';

  class FarcallerBojoTaskIdIndexer {
    constructor(wiki) {
      this.wiki = wiki;
      this.index = null;
    }

    init() {}

    rebuild() {
      this.index = {};
      this.wiki.forEachTiddler((_, tiddler) => {
        const taskId = tiddler.fields[TASK_ID_FIELD];
        if (taskId) {
          this.index[taskId] = tiddler;
        }
      });
    }

    update(update) {
      if (this.index === null) {
        this.rebuild();
        return;
      }

      if (update.old.exists) {
        if (update.new.exists) {
          if (update.old.tiddler.fields[TASK_ID_FIELD] !== update.new.tiddler.fields[TASK_ID_FIELD]) {
            // update changed the task id. Drop the cache.
            console.warn(`task id inconsistency between ${update.old.tiddler} and ${update.new.tiddler}, dropping the cache`);
            this.rebuild();
          } else {
            // update changed something. We don't care.
          }
        } else {
          // tiddler is removed
          const oldTaskId = update.old.tiddler.fields[TASK_ID_FIELD];
          if (oldTaskId) {
            if (this.wiki.isShadowTiddler(update.old.tiddler.fields.title)) {
              return;
            }

            if (this.wiki.findDraft(update.old.tiddler.fields.title)) {
              return;
            }
            delete this.index[oldTaskId];
          }
        }
      } else {
        if (!update.new.exists) {
          // no old, no new, wtf?
          return;
        }

        if (this.wiki.isShadowTiddler(update.new.tiddler.fields.title)) {
          return;
        }

        if (this.wiki.findDraft(update.new.tiddler.fields.title)) {
          return;
        }

        const newTaskId = update.new.tiddler.fields[TASK_ID_FIELD];
        if (!newTaskId) {
          // not a task tiddler
          return;
        }
        if (this.index[newTaskId]) {
          console.warn(`task id collision between ${update.new.tiddler} and ${this.index[newTaskId]}, dropping the cache`);
          this.rebuild();
        }
        this.index[newTaskId] = update.new.tiddler;
      }
    }

    lookup(taskId) {
      if (this.index === null) {
        this.rebuild();
      }

      return this.index[taskId];
    }
  }

  exports.BojoTaskIdIndexer = FarcallerBojoTaskIdIndexer;

})();
