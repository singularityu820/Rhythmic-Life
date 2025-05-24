import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { db } from '../services/db';

const AppContext = createContext();

// 默认活动类型
const defaultActivityTypes = [
  { name: '未记录', colorCode: '#9E9E9E' },
  { name: '工作', colorCode: '#FF5722' },
  { name: '学习', colorCode: '#2196F3' },
  { name: '运动', colorCode: '#4CAF50' },
  { name: '休息', colorCode: '#9C27B0' },
  { name: '娱乐', colorCode: '#FFC107' }
];

const initialState = {
  activities: [],
  activityTypes: [],
  settings: {
    notificationsEnabled: true,
    darkMode: false,
    dailySummaryTime: '20:00'
  },
  loading: true,
  error: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };
    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] };
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(activity =>
          activity.id === action.payload.id ? action.payload : activity
        )
      };
    case 'DELETE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.filter(activity => activity.id !== action.payload)
      };
    case 'SET_ACTIVITY_TYPES':
      return { ...state, activityTypes: action.payload };
    case 'ADD_ACTIVITY_TYPE':
      return { ...state, activityTypes: [...state.activityTypes, action.payload] };
    case 'UPDATE_ACTIVITY_TYPE':
      return {
        ...state,
        activityTypes: state.activityTypes.map(type =>
          type.id === action.payload.id ? action.payload : type
        )
      };
    case 'DELETE_ACTIVITY_TYPE':
      return {
        ...state,
        activityTypes: state.activityTypes.filter(type => type.id !== action.payload)
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    async function initializeApp() {
      try {
        await db.init();
        
        // 加载活动类型
        let activityTypes = await db.getAllActivityTypes();
        
        // 如果没有活动类型，添加默认类型
        if (activityTypes.length === 0) {
          for (const type of defaultActivityTypes) {
            const id = await db.addActivityType(type);
            activityTypes.push({ ...type, id });
          }
        } else {
          // 检查是否存在"未记录"类型
          const hasUnrecorded = activityTypes.some(type => type.name === '未记录');
          if (!hasUnrecorded) {
            const unrecordedType = defaultActivityTypes[0];
            const id = await db.addActivityType(unrecordedType);
            activityTypes.push({ ...unrecordedType, id });
          }
        }
        
        dispatch({ type: 'SET_ACTIVITY_TYPES', payload: activityTypes });

        // 加载活动记录
        const activities = await db.getAllActivities();
        dispatch({ type: 'SET_ACTIVITIES', payload: activities });

        // 加载设置
        const settings = await db.getSettings();
        if (settings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        }

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    initializeApp();
  }, []);

  const value = {
    state,
    dispatch,
    // 活动相关方法
    addActivity: async (activity) => {
      try {
        const id = await db.addActivity(activity);
        const newActivity = { ...activity, id };
        dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
        return newActivity;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    updateActivity: async (activity) => {
      try {
        await db.updateActivity(activity);
        dispatch({ type: 'UPDATE_ACTIVITY', payload: activity });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    deleteActivity: async (id) => {
      try {
        await db.deleteActivity(id);
        dispatch({ type: 'DELETE_ACTIVITY', payload: id });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    // 活动类型相关方法
    addActivityType: async (type) => {
      try {
        const id = await db.addActivityType(type);
        const newType = { ...type, id };
        dispatch({ type: 'ADD_ACTIVITY_TYPE', payload: newType });
        return newType;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    updateActivityType: async (type) => {
      try {
        await db.updateActivityType(type);
        dispatch({ type: 'UPDATE_ACTIVITY_TYPE', payload: type });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    deleteActivityType: async (id) => {
      try {
        await db.deleteActivityType(id);
        dispatch({ type: 'DELETE_ACTIVITY_TYPE', payload: id });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    // 设置相关方法
    updateSettings: async (settings) => {
      try {
        await db.updateSettings(settings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    // 数据导出导入相关方法
    exportData: async () => {
      try {
        return await db.exportData();
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    importData: async (data) => {
      try {
        await db.importData(data);
        // 重新加载所有数据
        const activityTypes = await db.getAllActivityTypes();
        const activities = await db.getAllActivities();
        const settings = await db.getSettings();

        dispatch({ type: 'SET_ACTIVITY_TYPES', payload: activityTypes });
        dispatch({ type: 'SET_ACTIVITIES', payload: activities });
        if (settings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    clearAllData: async () => {
      try {
        await db.clearAllData();
        dispatch({ type: 'SET_ACTIVITY_TYPES', payload: [] });
        dispatch({ type: 'SET_ACTIVITIES', payload: [] });
        dispatch({ type: 'UPDATE_SETTINGS', payload: initialState.settings });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 