/*\
title: $:/plugins/farcaller/bojotask/excise-task.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to excise the selection to a new tiddler

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const ShortUniqueId = require('$:/plugins/farcaller/bojotask/thirdparty/short-unique-id.js');
  const uid = new ShortUniqueId({ length: 8 });

  exports.generateNewTaskId = function (wiki) {
    let c = 0;
    let uidCandidate = uid();
    const indexer = wiki.getIndexer('BojoTaskIdIndexer');

    while (indexer.lookup(uidCandidate) !== undefined) {
      uidCandidate = uid();
    }
    return uidCandidate;
  };

  exports['excise-task'] = function (event, operation) {
    const editTiddler = this.wiki.getTiddler(this.editTitle);
    let editTiddlerTitle = this.editTitle;
    if (editTiddler && editTiddler.fields['draft.of']) {
      editTiddlerTitle = editTiddler.fields['draft.of'];
    }
    const selection = operation.selection;
    const splitIdx = selection.indexOf('\n');
    let firstLine = selection;
    let restLines = '';
    if (splitIdx !== -1) {
      firstLine = selection.substring(0, splitIdx);
      restLines = selection.substring(splitIdx + 1);
    }

    if (firstLine.length === 0) {
      return;
    }
    
    const excisionTitle = this.wiki.generateNewTitle(firstLine);
    const taskId = exports.generateNewTaskId(this.wiki);

    let fields = {
      title: excisionTitle,
      text: restLines,
      tags: [editTiddlerTitle],
      task: 'pending',
      'bojo-task-id': taskId,
    };
    if (excisionTitle !== selection) {
      fields.caption = selection;
    }
    this.wiki.addTiddler(new $tw.Tiddler(
      this.wiki.getCreationFields(),
      this.wiki.getModificationFields(),
      fields,
    ));
    operation.replacement = `<<bojotask """${taskId}-${firstLine}""">>`;
    operation.cutStart = operation.selStart;
    operation.cutEnd = operation.selEnd;
    operation.newSelStart = operation.selStart;
    operation.newSelEnd = operation.selStart + operation.replacement.length;
  };

})();
