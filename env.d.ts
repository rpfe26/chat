
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Removed 'vite/client' reference to resolve "Cannot find type definition file" error.
// The necessary ImportMeta types are defined locally below.

interface ImportMetaEnv {
  readonly API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Fix: Augmented the NodeJS namespace to resolve "Cannot redeclare block-scoped variable 'process'".
// This provides typing for process.env.API_KEY without conflicting with existing global declarations.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
