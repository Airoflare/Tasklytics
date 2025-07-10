const DB_NAME = 'TasklyticsDB';
const STORE_NAME = 'attachments';

let db: IDBDatabase;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 6);

    request.onupgradeneeded = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject('Error opening database');
    };
  });
}

export async function saveAttachment(file: File): Promise<string> {
  if (!db) {
    db = await openDatabase();
  }

  return new Promise((resolve, reject) => {
    const id = `${file.name}-${Date.now()}`; // Unique ID for the attachment

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add({ id, name: file.name, type: file.type, data });

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = () => {
        reject('Error saving attachment');
      };
    };
    reader.readAsDataURL(file);
  });
}

export async function getAttachment(id: string): Promise<File | null> {
  if (!db) {
    db = await openDatabase();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        const byteString = atob(result.data.split(',')[1]);
        const mimeString = result.data.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new File([ab], result.name, { type: mimeString }));
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject('Error getting attachment');
    };
  });
}

export async function deleteAttachment(id: string): Promise<void> {
  if (!db) {
    db = await openDatabase();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject('Error deleting attachment');
    };
  });
}

export async function getAllAttachmentIds(): Promise<string[]> {
  if (!db) {
    db = await openDatabase();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };

    request.onerror = () => {
      reject('Error getting all attachment IDs');
    };
  });
}
