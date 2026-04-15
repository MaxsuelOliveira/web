import { createRuntimeId } from "./utils.js";

const DB_NAME = "meu-player-audio-db";
const DB_VERSION = 1;
const STORE_NAME = "audio-files";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
        store.createIndex("createdAt", "createdAt");
      }
    });

    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(request.error ?? new Error("Nao foi possivel abrir o IndexedDB."));
    });
  });
}

function waitForTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => {
      reject(
        transaction.error ?? new Error("Falha na transação do IndexedDB."),
      );
    });
    transaction.addEventListener("abort", () => {
      reject(
        transaction.error ?? new Error("Transação abortada no IndexedDB."),
      );
    });
  });
}

export async function persistAudioFiles(fileList) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const createdAt = Date.now();
  const records = Array.from(fileList).map((file, index) => ({
    id: createRuntimeId(`local-db-${index}`),
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    lastModified: file.lastModified,
    createdAt: createdAt + index,
    sortOrder: createdAt + index,
    blob: file,
  }));

  records.forEach((record) => store.put(record));
  await waitForTransaction(transaction);
  database.close();

  return records;
}

export async function loadPersistedAudioFiles() {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  const records = await new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result ?? []));
    request.addEventListener("error", () => {
      reject(request.error ?? new Error("Falha ao ler arquivos persistidos."));
    });
  });

  await waitForTransaction(transaction);
  database.close();

  return records.sort(
    (left, right) =>
      Number(left.sortOrder ?? left.createdAt ?? 0) -
      Number(right.sortOrder ?? right.createdAt ?? 0),
  );
}

export async function replacePersistedAudioFiles(records) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  store.clear();
  records.forEach((record, index) => {
    store.put({
      ...record,
      sortOrder: Number(record.sortOrder ?? index),
    });
  });

  await waitForTransaction(transaction);
  database.close();
}

export async function deletePersistedAudioFile(trackId) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(trackId);
  await waitForTransaction(transaction);
  database.close();
}
