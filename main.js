// モジュールWorkerで起動
const worker = new Worker('./worker.js', { type: 'module' });

// ストレージ永続化をリクエスト（失敗してもアプリは動作）
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const persisted = await navigator.storage.persist();
    console.log('persist:', persisted);
  }
}
requestPersistentStorage(); // OPFSのエビクション対策（UA次第）
// ↑ 参考: sqliteフォーラムの議論でも推奨（拒否されることもある） [4](https://sqlite.org/forum/info/542fba6a46cec787)

// Workerからのメッセージ受付
worker.onmessage = (e) => {
  const { type, payload } = e.data || {};
  if (type === 'export-bytes') {
    // 受け取ったUint8Arrayをダウンロード
    const blob = new Blob([payload.buffer], { type: 'application/x-sqlite3' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mydb.sqlite3';
    a.click();
    URL.revokeObjectURL(a.href);
  } else if (type === 'status') {
    console.log(payload);
  } else if (type === 'error') {
    console.error(payload);
  }
};

// 初期化 + スキーマ作成の例
worker.postMessage({ type: 'init', filename: '/mydb.sqlite3' });

// インポート（ファイル→OPFSへ）
document.querySelector('#importFile').addEventListener('change', async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  const buf = await f.arrayBuffer();
  // Workerに送り、OPFS上に書き込ませる（転送コスト対策でTransfer使用）
  worker.postMessage({ type: 'import-db', filename: '/mydb.sqlite3', bytes: buf }, [buf]);
});

// DB初期化
document.querySelector('#btn_init').addEventListener('click', () => {
    worker.postMessage({ type: 'exec', sql: `
        CREATE TABLE IF NOT EXISTS items(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            qty INTEGER NOT NULL
        );
    ` });
});

// エクスポート（OPFS上のDB→Uint8Array→ダウンロード）
document.querySelector('#exportBtn').addEventListener('click', () => {
  worker.postMessage({ type: 'export-db' });
});
