const dir_root = await navigator.storage.getDirectory();
console.log(typeof(dir_root));
console.log(dir_root);

const dir_db = await dir_root.getDirectoryHandle("db", { create: true });
console.log(typeof(dir_db));
console.log(dir_db);

// import sqlite3InitModule from "https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.51.1-build2/+esm";
// import * as sqlite from "https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.51.1-build2/+esm";


/* CDN
import { sqlite3Worker1Promiser } 
        from 'https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.51.1-build2/+esm';
*/

// import { sqlite3Worker1Promiser } from "./vendor/sqlite3-worker1-promiser.mjs";
import * as sqlite from "./vendor/sqlite3-worker1-promiser.mjs";

/* ---------------------------------------------------------------- */
/* インメモリ                                                       */
/* ---------------------------------------------------------------- */
/*
const sqlite3 = await sqlite3InitModule();
console.log('SQLite version:', sqlite3.version.libVersion);

// 非永続DB（メモリ相当）を開いてクエリ実行
const db = new sqlite3.oo1.DB();           // main-thread API
db.exec(`CREATE TABLE demo(id INTEGER, name TEXT);
         INSERT INTO demo VALUES (1, 'hello'), (2, 'world');`);
db.exec({
    sql: 'SELECT * FROM demo',
    rowMode: 'object',
    callback: row => console.log(row),
});

db.close();
*/
/* ---------------------------------------------------------------- */


// Workerを内部で起動してSQLiteを初期化
      const promiser = await new Promise((resolve) => {
        const p = sqlite3Worker1Promiser ({ onready: () => resolve(p) });
      });

      // バージョン確認
      const cfg = await promiser('config-get', {});
      console.log('SQLite version:', cfg.result.version.libVersion);

      // OPFS上のDBをopen（永続化されます）
      const openRes = await promiser('open', { 
        filename: 'file:mydb.sqlite3?vfs=opfs' 
      });
      const { dbId } = openRes;

      // クエリ実行
      await promiser('exec', { 
        dbId,
        sql: `CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY, name TEXT);
              INSERT INTO items(name) VALUES ('CDN+WASM'), ('永続化OK');`
      });

      await promiser('exec', {
        dbId,
        sql: 'SELECT * FROM items',
        rowMode: 'array',
        callback: (row) => { if (row) console.log(row); }
      });

      // 必要に応じて close
      await promiser('close', { dbId });
