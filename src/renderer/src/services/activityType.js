import { db } from './db';

class ActivityTypeService {
  async getActivityTypes() {
    try {
      const types = await db.activityTypes.toArray();
      return types;
    } catch (error) {
      console.error('获取活动类型失败:', error);
      return [];
    }
  }

  async addActivityType(type) {
    try {
      const id = await db.activityTypes.add(type);
      return { ...type, id };
    } catch (error) {
      console.error('添加活动类型失败:', error);
      throw error;
    }
  }

  async updateActivityType(id, changes) {
    try {
      await db.activityTypes.update(id, changes);
      return { id, ...changes };
    } catch (error) {
      console.error('更新活动类型失败:', error);
      throw error;
    }
  }

  async deleteActivityType(id) {
    try {
      await db.activityTypes.delete(id);
      return id;
    } catch (error) {
      console.error('删除活动类型失败:', error);
      throw error;
    }
  }
}

export const activityTypeService = new ActivityTypeService(); 