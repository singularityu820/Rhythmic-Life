const DB_NAME = 'rhythmic-life';
const DB_VERSION = 1;

const STORES = {
  ACTIVITIES: 'activities',
  ACTIVITY_TYPES: 'activity_types',
  SETTINGS: 'settings'
};

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        reject('数据库打开失败');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 创建活动记录存储
        if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
          const activityStore = db.createObjectStore(STORES.ACTIVITIES, { keyPath: 'id', autoIncrement: true });
          activityStore.createIndex('startTime', 'startTime', { unique: false });
          activityStore.createIndex('endTime', 'endTime', { unique: false });
          activityStore.createIndex('typeId', 'typeId', { unique: false });
        }

        // 创建活动类型存储
        if (!db.objectStoreNames.contains(STORES.ACTIVITY_TYPES)) {
          const typeStore = db.createObjectStore(STORES.ACTIVITY_TYPES, { keyPath: 'id', autoIncrement: true });
          typeStore.createIndex('name', 'name', { unique: true });
        }

        // 创建设置存储
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
        }
      };
    });
  }

  // 活动记录相关方法
  async addActivity(activity) {
    return this.add(STORES.ACTIVITIES, activity);
  }

  async getActivity(id) {
    return this.get(STORES.ACTIVITIES, id);
  }

  async getAllActivities() {
    return this.getAll(STORES.ACTIVITIES);
  }

  async updateActivity(activity) {
    return this.update(STORES.ACTIVITIES, activity);
  }

  async deleteActivity(id) {
    return this.delete(STORES.ACTIVITIES, id);
  }

  // 活动类型相关方法
  async addActivityType(type) {
    return this.add(STORES.ACTIVITY_TYPES, type);
  }

  async getActivityType(id) {
    return this.get(STORES.ACTIVITY_TYPES, id);
  }

  async getAllActivityTypes() {
    return this.getAll(STORES.ACTIVITY_TYPES);
  }

  async updateActivityType(type) {
    return this.update(STORES.ACTIVITY_TYPES, type);
  }

  async deleteActivityType(id) {
    return this.delete(STORES.ACTIVITY_TYPES, id);
  }

  // 设置相关方法
  async getSettings() {
    return this.get(STORES.SETTINGS, 1);
  }

  async updateSettings(settings) {
    return this.update(STORES.SETTINGS, { id: 1, ...settings });
  }

  // 数据导出导入相关方法
  async exportData() {
    const activities = await this.getAllActivities();
    const activityTypes = await this.getAllActivityTypes();
    const settings = await this.getSettings();

    return {
      activities,
      activityTypes,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  async importData(data) {
    // 验证数据格式
    if (!data.activities || !data.activityTypes || !data.settings) {
      throw new Error('无效的数据格式');
    }

    // 清除现有数据
    await this.clearAllData();

    // 导入新数据
    for (const activity of data.activities) {
      await this.addActivity(activity);
    }

    for (const type of data.activityTypes) {
      await this.addActivityType(type);
    }

    if (data.settings) {
      await this.updateSettings(data.settings);
    }
  }

  async clearAllData() {
    const stores = Object.values(STORES);
    for (const store of stores) {
      const items = await this.getAll(store);
      for (const item of items) {
        await this.delete(store, item.id);
      }
    }
  }

  // 通用 CRUD 操作
  async add(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DatabaseService(); 