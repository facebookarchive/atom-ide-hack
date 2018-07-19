/*
 *  Copyright (c) 2017-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */
'use babel';

const { AutoLanguageClient } = require('atom-languageclient');
const fs = require('fs');
const cp = require('child_process');
const LinterAdapter = require('atom-languageclient/build/lib/adapters/linter-push-v2-adapter').default;

// Monkey patching time: atom-ide-ui and nuclide don't show the code by default. Put it in `source` to be
// consistent with nuclide-hack
const originalHandler = LinterAdapter.prototype.diagnosticToV2Message;
LinterAdapter.prototype.diagnosticToV2Message = (path, diagnostic) => {
  diagnostic.source = diagnostic.source + ": " + diagnostic.code;
  return originalHandler(path, diagnostic);
}

class HackLanguageClient extends AutoLanguageClient {
  getGrammarScopes() { return ['source.hack', 'text.html.hack']; }
  getLanguageName() { return 'Hack'; }
  getServerName() { return 'Hack' }

  async startServerProcess(workspace) {
    fs.accessSync(workspace + '/.hhconfig');

    return cp.spawn(
      atom.config.get('atom-ide-hack.hhClientPath') || 'hh_client',
      [
        'lsp',
        '--from',
        'atom-ide-hack',
      ],
      {
        cwd: workspace
      }
    );
  }

  getInitializeParams(projectPath, process) {
    const opts = {
      ...super.getInitializeParams(projectPath, process),
      initializationOptions: {
        useTextEditAutocomplete: true,
      },
    };
    console.log(opts);
    return opts;
  }
}

module.exports = new HackLanguageClient();
module.exports.config = {
  hhClientPath: {
    type: 'string',
    default: 'hh_client',
    description: 'Path to hh_client',
  },
};
