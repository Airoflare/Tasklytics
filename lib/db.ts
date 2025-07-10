class IndexedDBManager {
  private dbName = "TasklyticsDB"
  private version = 6
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create tasks store
        if (!db.objectStoreNames.contains("tasks")) {
          db.createObjectStore("tasks", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("statuses")) {
          db.createObjectStore("statuses", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("tags")) {
          db.createObjectStore("tags", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("priorities")) {
          db.createObjectStore("priorities", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }
        if (!db.objectStoreNames.contains("attachments")) {
          db.createObjectStore("attachments", { keyPath: "id" });
        }
      }
    })
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async add<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result ? request.result.value : undefined)
    })
  }

  async putSetting<T>(key: string, value: T): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put({ key, value })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deleteSetting(key: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  getAllStoreNames(): string[] {
    if (!this.db) {
      throw new Error("Database not initialized.");
    }
    return Array.from(this.db.objectStoreNames);
  }

  async exportData(): Promise<any> {
    if (!this.db) await this.init();

    const exportedData: { [key: string]: any[] } = {};
    const storeNames = this.getAllStoreNames();

    for (const storeName of storeNames) {
      exportedData[storeName] = await this.getAll(storeName);
    }
    return exportedData;
  }

  async importData(data: any): Promise<void> {
    if (!this.db) await this.init();

    const storeNames = this.getAllStoreNames();

    // Clear existing data
    for (const storeName of storeNames) {
      await this.clearStore(storeName);
    }

    // Import new data
    for (const storeName of storeNames) {
      if (data[storeName]) {
        for (const item of data[storeName]) {
          await this.add(storeName, item);
        }
      }
    }
  }

  async clearStore(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllStores(): Promise<void> {
    if (!this.db) await this.init();

    const storeNames = this.getAllStoreNames();
    for (const storeName of storeNames) {
      await this.clearStore(storeName);
    }
  }
}

export const db = new IndexedDBManager()
