// import sqliteOrgsqliteWasm from "https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.51.1-build2/+esm"
import {} from "https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.51.1-build2/+esm"

let sqlite3, db;

    console.log("worker.js loaded.");

const openDb = async (filename) => {
  sqlite3 = await sqlite3InitModule();
  console.log(sqlite3);
  db = 'opfs' in sqlite3
    ? new sqlite3.oo1.OpfsDb(filename, 'c')
    : new sqlite3.oo1.DB('/transient.sqlite3', 'ct');
  console.log(db);
};

onmessage = async (e) => {
  
    console.log("worker.js called.");

  const { type, sql, filename, bytes } = e.data || {};
  if (type === 'init') {
    await openDb(filename ?? '/mydb.sqlite3');
  } else if (type === 'exec') {
    db.exec(sql);
  } else if (type === 'export-db') {
    const u8 = sqlite3.capi.sqlite3_js_db_export(db);
    postMessage({ type: 'export-bytes', payload: u8 }, [u8.buffer]);
  } else if (type === 'import-db') {
    if (db?.isOpen()) db.close();
    const root = await navigator.storage.getDirectory();
    const h = await root.getFileHandle(filename, { create: true });
    const access = await h.createSyncAccessHandle();
    try {
      access.truncate(0);
      access.write(new Uint8Array(bytes), { at: 0 });
      access.flush();
    } finally { access.close(); }
    await openDb(filename);
  }
};
