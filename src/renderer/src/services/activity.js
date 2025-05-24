import { db } from './db';

class ActivityService {
  async getActivities() {
    try {
      const activities = await db.activities.toArray();
      return activities;
    } catch (error) {
      console.error('获取活动数据失败:', error);
      return [];
    }
  }

  async addActivity(activity) {
    try {
      const id = await db.activities.add(activity);
      return { ...activity, id };
    } catch (error) {
      console.error('添加活动失败:', error);
      throw error;
    }
  }

  async updateActivity(id, changes) {
    try {
      await db.activities.update(id, changes);
      return { id, ...changes };
    } catch (error) {
      console.error('更新活动失败:', error);
      throw error;
    }
  }

  async deleteActivity(id) {
    try {
      await db.activities.delete(id);
      return id;
    } catch (error) {
      console.error('删除活动失败:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService(); 