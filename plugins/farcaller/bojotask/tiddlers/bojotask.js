/*\
title: $:/plugins/farcaller/bojotask/macros/bojotask
type: application/javascript
module-type: macro

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  exports.name = 'bojotask';

  exports.params = [
    { slug: 'slug' },
  ];

  exports.run = function (slug) {
    const slugId = slug.split('-', 1);
    const indexer = this.wiki.getIndexer('BojoTaskIdIndexer');
    const taskTiddler = indexer.lookup(slugId);
    if (taskTiddler) {
      return `<$link to="""${taskTiddler.fields.title}""" />`;
    }
    return ``;
  };

})();
