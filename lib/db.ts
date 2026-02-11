
const DB_NAME = 'OzFabricDB';
const DB_VERSION = 3;

// Store names
export const STORES = {
    POSES: 'poses',
    MODELS: 'models',
    BACKGROUNDS: 'backgrounds',
    FITS: 'fits',
    SHOES: 'shoes',
    LIGHTING: 'lighting',
    JACKETS: 'jackets',
    BAGS: 'bags',
    GLASSES: 'glasses',
    HATS: 'hats',
    JEWELRY: 'jewelry',
    BELTS: 'belts'
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

export const dbRequest = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB Error:", event);
            reject("Database error");
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object stores if they don't exist
            Object.values(STORES).forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
    });
};

export const dbOperations = {
    async getAll<T>(storeName: StoreName): Promise<T[]> {
        const db = await dbRequest();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async add<T>(storeName: StoreName, item: T): Promise<T> {
        const db = await dbRequest();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item); // put handles both add and update if keyPath exists

            request.onsuccess = () => resolve(item);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName: StoreName, id: string): Promise<void> {
        const db = await dbRequest();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Migration helper: Move from localStorage to IDB
    async migrateFromLocalStorage(): Promise<void> {
        const MAPPINGS = {
            'ozfabric_saved_poses': STORES.POSES,
            'ozfabric_saved_models': STORES.MODELS,
            'ozfabric_saved_backgrounds': STORES.BACKGROUNDS,
            'ozfabric_saved_fits': STORES.FITS,
            'ozfabric_saved_shoes': STORES.SHOES,
        };

        for (const [lsKey, storeName] of Object.entries(MAPPINGS)) {
            const data = localStorage.getItem(lsKey);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const db = await dbRequest();
                        const tx = db.transaction(storeName as StoreName, 'readwrite');
                        const store = tx.objectStore(storeName as StoreName);

                        // Add all items
                        for (const item of parsed) {
                            store.put(item);
                        }

                        console.log(`Migrated ${parsed.length} items from ${lsKey} to ${storeName}`);
                        // Clear localStorage after successful migration to prevent overwriting updates
                        localStorage.removeItem(lsKey);
                        localStorage.setItem(`${lsKey}_migrated`, 'true');
                    }
                } catch (e) {
                    console.error(`Migration failed for ${lsKey}`, e);
                }
            }
        }
    }
};
