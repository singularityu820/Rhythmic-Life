import { format, differenceInMinutes, getHours, getDay, isWeekend } from 'date-fns';
import { zhCN } from 'date-fns/locale';

class AIService {
  // 分析用户的时间使用模式
  analyzeTimePatterns(activities, activityTypes) {
    const patterns = {
      dailyAverages: {},
      weeklyPatterns: {},
      efficiencyByType: {},
      preferredTimeSlots: {}
    };

    // 计算每种活动类型的每日平均时长
    activityTypes.forEach(type => {
      const typeActivities = activities.filter(a => a.typeId === type.id);
      const totalMinutes = typeActivities.reduce((sum, activity) => {
        return sum + differenceInMinutes(activity.endTime, activity.startTime);
      }, 0);
      patterns.dailyAverages[type.name] = totalMinutes / 7; // 假设分析最近7天的数据
    });

    // 分析每周模式
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    weekDays.forEach(day => {
      patterns.weeklyPatterns[day] = {};
      activityTypes.forEach(type => {
        const dayActivities = activities.filter(a => {
          const activityDate = new Date(a.startTime);
          return format(activityDate, 'EEEE', { locale: zhCN }) === day && a.typeId === type.id;
        });
        const totalMinutes = dayActivities.reduce((sum, activity) => {
          return sum + differenceInMinutes(activity.endTime, activity.startTime);
        }, 0);
        patterns.weeklyPatterns[day][type.name] = totalMinutes;
      });
    });

    // 分析每种活动类型的效率
    activityTypes.forEach(type => {
      const typeActivities = activities.filter(a => a.typeId === type.id);
      const avgEfficiency = typeActivities.reduce((sum, activity) => {
        return sum + activity.efficiencyScore;
      }, 0) / typeActivities.length;
      patterns.efficiencyByType[type.name] = avgEfficiency;
    });

    // 分析最佳时间段
    const timeSlots = Array.from({ length: 24 }, (_, i) => i);
    timeSlots.forEach(hour => {
      patterns.preferredTimeSlots[hour] = {};
      activityTypes.forEach(type => {
        const hourActivities = activities.filter(a => {
          const activityHour = new Date(a.startTime).getHours();
          return activityHour === hour && a.typeId === type.id;
        });
        const avgEfficiency = hourActivities.reduce((sum, activity) => {
          return sum + activity.efficiencyScore;
        }, 0) / (hourActivities.length || 1);
        patterns.preferredTimeSlots[hour][type.name] = avgEfficiency;
      });
    });

    return patterns;
  }

  // 生成智能日程建议
  generateSchedule(patterns, activityTypes, date = new Date()) {
    const schedule = [];
    const dayOfWeek = format(date, 'EEEE', { locale: zhCN });
    const dayPatterns = patterns.weeklyPatterns[dayOfWeek] || {};

    // 根据历史数据分配时间
    activityTypes.forEach(type => {
      const dailyAverage = patterns.dailyAverages[type.name] || 0;
      const daySpecificTime = dayPatterns[type.name] || 0;
      const efficiency = patterns.efficiencyByType[type.name] || 0;

      // 如果这个活动类型在特定日期有显著的时间分配，使用该时间
      const suggestedDuration = daySpecificTime > dailyAverage * 1.2 ? daySpecificTime : dailyAverage;

      // 找到效率最高的时间段
      let bestHour = 0;
      let bestEfficiency = 0;
      for (let hour = 0; hour < 24; hour++) {
        const hourEfficiency = (patterns.preferredTimeSlots[hour] && patterns.preferredTimeSlots[hour][type.name]) || 0;
        if (hourEfficiency > bestEfficiency) {
          bestEfficiency = hourEfficiency;
          bestHour = hour;
        }
      }

      // 创建建议
      if (suggestedDuration > 0) {
        schedule.push({
          typeId: type.id,
          typeName: type.name,
          suggestedStartTime: new Date(date.setHours(bestHour, 0, 0, 0)),
          suggestedDuration: Math.round(suggestedDuration),
          confidence: Math.min(1, efficiency / 5) // 基于历史效率的置信度
        });
      }
    });

    // 按建议开始时间排序
    schedule.sort((a, b) => a.suggestedStartTime - b.suggestedStartTime);

    return schedule;
  }

  // 生成效率提升建议
  generateEfficiencyTips(patterns, activityTypes) {
    const tips = [];

    // 分析每种活动类型的效率
    activityTypes.forEach(type => {
      const efficiency = patterns.efficiencyByType[type.name];
      if (efficiency < 3) { // 如果平均效率低于3分
        // 找到效率最高的时间段
        let bestHour = 0;
        let bestEfficiency = 0;
        for (let hour = 0; hour < 24; hour++) {
          const hourEfficiency = patterns.preferredTimeSlots[hour][type.name] || 0;
          if (hourEfficiency > bestEfficiency) {
            bestEfficiency = hourEfficiency;
            bestHour = hour;
          }
        }

        tips.push({
          typeId: type.id,
          typeName: type.name,
          currentEfficiency: efficiency,
          suggestion: `建议在 ${bestHour}:00 进行${type.name}活动，这是您效率最高的时间段。`,
          improvement: Math.round((bestEfficiency - efficiency) * 20) // 预计提升百分比
        });
      }
    });

    return tips;
  }

  // 分析用户习惯
  analyzeHabits(activities, activityTypes) {
    const habits = {
      consistency: {},
      streaks: {},
      improvements: {},
      recommendations: []
    };

    // 分析每种活动类型的一致性
    activityTypes.forEach(type => {
      const typeActivities = activities.filter(a => a.typeId === type.id);
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayCount = weekDays.map(day => {
        return typeActivities.filter(a => 
          format(new Date(a.startTime), 'EEEE', { locale: zhCN }) === day
        ).length;
      });

      habits.consistency[type.name] = {
        averageDaysPerWeek: dayCount.reduce((a, b) => a + b, 0) / 7,
        mostFrequentDay: weekDays[dayCount.indexOf(Math.max(...dayCount))],
        leastFrequentDay: weekDays[dayCount.indexOf(Math.min(...dayCount))]
      };
    });

    // 分析连续记录
    activityTypes.forEach(type => {
      const typeActivities = activities
        .filter(a => a.typeId === type.id)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      let currentStreak = 0;
      let maxStreak = 0;
      let lastDate = null;

      typeActivities.forEach(activity => {
        const activityDate = new Date(activity.startTime);
        if (lastDate) {
          const dayDiff = Math.floor((activityDate - lastDate) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        lastDate = activityDate;
      });

      habits.streaks[type.name] = {
        currentStreak,
        maxStreak
      };
    });

    // 分析改进趋势
    activityTypes.forEach(type => {
      const typeActivities = activities
        .filter(a => a.typeId === type.id)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      if (typeActivities.length >= 2) {
        const recentActivities = typeActivities.slice(-5);
        const oldEfficiency = typeActivities.slice(0, 5).reduce((sum, a) => sum + a.efficiencyScore, 0) / 5;
        const newEfficiency = recentActivities.reduce((sum, a) => sum + a.efficiencyScore, 0) / recentActivities.length;

        habits.improvements[type.name] = {
          efficiencyChange: newEfficiency - oldEfficiency,
          trend: newEfficiency > oldEfficiency ? 'improving' : 'declining'
        };
      }
    });

    // 生成个性化建议
    Object.entries(habits.consistency).forEach(([typeName, data]) => {
      if (data.averageDaysPerWeek < 3) {
        habits.recommendations.push({
          type: 'consistency',
          activityType: typeName,
          message: `建议增加${typeName}活动的频率，目前每周平均只有${data.averageDaysPerWeek.toFixed(1)}天。`,
          priority: 'high'
        });
      }
    });

    Object.entries(habits.streaks).forEach(([typeName, data]) => {
      if (data.currentStreak > 0 && data.currentStreak < 3) {
        habits.recommendations.push({
          type: 'streak',
          activityType: typeName,
          message: `您已经连续${data.currentStreak}天进行${typeName}活动，继续保持！`,
          priority: 'medium'
        });
      }
    });

    Object.entries(habits.improvements).forEach(([typeName, data]) => {
      if (data.trend === 'declining') {
        habits.recommendations.push({
          type: 'improvement',
          activityType: typeName,
          message: `${typeName}活动的效率有所下降，建议调整时间安排或休息方式。`,
          priority: 'high'
        });
      }
    });

    return habits;
  }

  // 生成习惯建议
  generateHabitRecommendations(habits, activityTypes) {
    const recommendations = [];

    // 分析一致性建议
    Object.entries(habits.consistency).forEach(([typeName, data]) => {
      if (data.averageDaysPerWeek < 3) {
        recommendations.push({
          type: 'consistency',
          activityType: typeName,
          suggestion: `建议增加${typeName}的频率，目前每周平均只有${data.averageDaysPerWeek.toFixed(1)}天。`,
          expectedBenefit: '提高活动规律性，培养良好习惯'
        });
      }
    });

    // 分析连续记录建议
    Object.entries(habits.streaks).forEach(([typeName, data]) => {
      if (data.currentStreak === 0) {
        recommendations.push({
          type: 'streak',
          activityType: typeName,
          suggestion: `您的${typeName}活动已经中断，建议重新开始记录。`,
          expectedBenefit: '重建活动连续性，提高坚持度'
        });
      } else if (data.currentStreak < data.maxStreak / 2) {
        recommendations.push({
          type: 'streak',
          activityType: typeName,
          suggestion: `您的${typeName}活动当前连续${data.currentStreak}天，距离最长记录${data.maxStreak}天还有提升空间。`,
          expectedBenefit: '突破个人最佳记录，提升成就感'
        });
      }
    });

    // 添加一般性建议
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        activityType: '所有活动',
        suggestion: '您的习惯保持得很好，继续保持！',
        expectedBenefit: '维持良好的时间管理习惯'
      });
    }

    return recommendations;
  }

  // 数据预处理与特征工程
  preprocessData(activities, activityTypes) {
    const features = {
      timeFeatures: this.extractTimeFeatures(activities),
      activityFeatures: this.extractActivityFeatures(activities, activityTypes),
      userProfile: this.buildUserProfile(activities, activityTypes)
    };

    return features;
  }

  // 提取时间特征
  extractTimeFeatures(activities) {
    const timeFeatures = {
      hourEncoding: Array(24).fill(0),
      weekdayEncoding: Array(7).fill(0),
      timeFactors: {}
    };

    activities.forEach(activity => {
      const startTime = new Date(activity.startTime);
      const hour = getHours(startTime);
      const weekday = getDay(startTime);
      
      // 时段编码
      timeFeatures.hourEncoding[hour]++;
      
      // 星期编码
      timeFeatures.weekdayEncoding[weekday]++;
      
      // 时间因子
      const timeKey = `${hour}:${weekday}`;
      if (!timeFeatures.timeFactors[timeKey]) {
        timeFeatures.timeFactors[timeKey] = {
          count: 0,
          totalEfficiency: 0,
          activities: []
        };
      }
      timeFeatures.timeFactors[timeKey].count++;
      timeFeatures.timeFactors[timeKey].totalEfficiency += activity.efficiencyScore || 0;
      timeFeatures.timeFactors[timeKey].activities.push(activity);
    });

    return timeFeatures;
  }

  // 提取活动特征
  extractActivityFeatures(activities, activityTypes) {
    const activityFeatures = {
      typeEncoding: {},
      durationStats: {},
      efficiencyByType: {}
    };

    activityTypes.forEach(type => {
      const typeActivities = activities.filter(a => a.typeId === type.id);
      
      // 活动类型编码
      activityFeatures.typeEncoding[type.id] = {
        count: typeActivities.length,
        totalDuration: 0,
        averageEfficiency: 0
      };

      // 时长统计
      activityFeatures.durationStats[type.id] = {
        min: Infinity,
        max: 0,
        average: 0,
        durations: []
      };

      // 效率统计
      let totalEfficiency = 0;
      let efficiencyCount = 0;

      typeActivities.forEach(activity => {
        const duration = differenceInMinutes(
          new Date(activity.endTime),
          new Date(activity.startTime)
        );

        // 更新时长统计
        activityFeatures.durationStats[type.id].durations.push(duration);
        activityFeatures.durationStats[type.id].min = Math.min(
          activityFeatures.durationStats[type.id].min,
          duration
        );
        activityFeatures.durationStats[type.id].max = Math.max(
          activityFeatures.durationStats[type.id].max,
          duration
        );

        // 更新效率统计
        if (activity.efficiencyScore) {
          totalEfficiency += activity.efficiencyScore;
          efficiencyCount++;
        }
      });

      // 计算平均值
      if (typeActivities.length > 0) {
        activityFeatures.durationStats[type.id].average = 
          activityFeatures.durationStats[type.id].durations.reduce((a, b) => a + b, 0) / 
          typeActivities.length;
      }

      if (efficiencyCount > 0) {
        activityFeatures.efficiencyByType[type.id] = totalEfficiency / efficiencyCount;
      }
    });

    return activityFeatures;
  }

  // 构建用户画像
  buildUserProfile(activities, activityTypes) {
    const profile = {
      averageEfficiency: {},
      activityDurations: {},
      restPatterns: {},
      sleepPatterns: {},
      fixedActivities: {}
    };

    // 计算平均效率
    activityTypes.forEach(type => {
      const typeActivities = activities.filter(a => a.typeId === type.id);
      if (typeActivities.length > 0) {
        profile.averageEfficiency[type.id] = typeActivities.reduce(
          (sum, activity) => sum + (activity.efficiencyScore || 0),
          0
        ) / typeActivities.length;
      }
    });

    // 分析休息模式
    profile.restPatterns = this.analyzeRestPatterns(activities);

    // 分析作息习惯
    profile.sleepPatterns = this.analyzeSleepPatterns(activities);

    // 识别固定活动
    profile.fixedActivities = this.identifyFixedActivities(activities);

    return profile;
  }

  // 分析休息模式
  analyzeRestPatterns(activities) {
    const restPatterns = {
      averageWorkDuration: 0,
      averageRestDuration: 0,
      commonRestTimes: []
    };

    // 按日期分组活动
    const activitiesByDate = {};
    activities.forEach(activity => {
      const date = format(new Date(activity.startTime), 'yyyy-MM-dd');
      if (!activitiesByDate[date]) {
        activitiesByDate[date] = [];
      }
      activitiesByDate[date].push(activity);
    });

    // 分析每天的工作-休息模式
    Object.values(activitiesByDate).forEach(dayActivities => {
      dayActivities.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
      let workDuration = 0;
      let restDuration = 0;
      let lastEndTime = null;

      dayActivities.forEach(activity => {
        const startTime = new Date(activity.startTime);
        const endTime = new Date(activity.endTime);
        
        if (lastEndTime) {
          const gap = differenceInMinutes(startTime, lastEndTime);
          if (gap >= 15) { // 15分钟以上的间隔视为休息
            restDuration += gap;
            restPatterns.commonRestTimes.push({
              start: lastEndTime,
              end: startTime,
              duration: gap
            });
          }
        }
        
        workDuration += differenceInMinutes(endTime, startTime);
        lastEndTime = endTime;
      });

      restPatterns.averageWorkDuration = (restPatterns.averageWorkDuration + workDuration) / 2;
      restPatterns.averageRestDuration = (restPatterns.averageRestDuration + restDuration) / 2;
    });

    return restPatterns;
  }

  // 分析作息习惯
  analyzeSleepPatterns(activities) {
    const sleepPatterns = {
      averageWakeTime: null,
      averageSleepTime: null,
      sleepDuration: 0
    };

    // 按日期分组活动
    const activitiesByDate = {};
    activities.forEach(activity => {
      const date = format(new Date(activity.startTime), 'yyyy-MM-dd');
      if (!activitiesByDate[date]) {
        activitiesByDate[date] = [];
      }
      activitiesByDate[date].push(activity);
    });

    // 分析每天的作息时间
    Object.values(activitiesByDate).forEach(dayActivities => {
      dayActivities.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
      const firstActivity = dayActivities[0];
      const lastActivity = dayActivities[dayActivities.length - 1];
      
      if (firstActivity && lastActivity) {
        const wakeTime = new Date(firstActivity.startTime);
        const sleepTime = new Date(lastActivity.endTime);
        
        if (!sleepPatterns.averageWakeTime) {
          sleepPatterns.averageWakeTime = wakeTime;
        } else {
          sleepPatterns.averageWakeTime = new Date(
            (sleepPatterns.averageWakeTime.getTime() + wakeTime.getTime()) / 2
          );
        }
        
        if (!sleepPatterns.averageSleepTime) {
          sleepPatterns.averageSleepTime = sleepTime;
        } else {
          sleepPatterns.averageSleepTime = new Date(
            (sleepPatterns.averageSleepTime.getTime() + sleepTime.getTime()) / 2
          );
        }
      }
    });

    return sleepPatterns;
  }

  // 识别固定活动
  identifyFixedActivities(activities) {
    const fixedActivities = {};
    const activitiesByType = {};

    // 按类型分组活动
    activities.forEach(activity => {
      if (!activitiesByType[activity.typeId]) {
        activitiesByType[activity.typeId] = [];
      }
      activitiesByType[activity.typeId].push(activity);
    });

    // 分析每种类型的活动模式
    Object.entries(activitiesByType).forEach(([typeId, typeActivities]) => {
      const timeSlots = {};
      
      typeActivities.forEach(activity => {
        const startTime = new Date(activity.startTime);
        const timeKey = format(startTime, 'HH:mm');
        
        if (!timeSlots[timeKey]) {
          timeSlots[timeKey] = {
            count: 0,
            totalDuration: 0
          };
        }
        
        timeSlots[timeKey].count++;
        timeSlots[timeKey].totalDuration += differenceInMinutes(
          new Date(activity.endTime),
          startTime
        );
      });

      // 识别固定时间段的活动
      Object.entries(timeSlots).forEach(([time, stats]) => {
        if (stats.count >= 3) { // 如果同一时间段出现3次以上
          fixedActivities[typeId] = fixedActivities[typeId] || [];
          fixedActivities[typeId].push({
            time,
            averageDuration: stats.totalDuration / stats.count,
            frequency: stats.count
          });
        }
      });
    });

    return fixedActivities;
  }

  // 生成骨架规划
  generateSkeletonPlan(date, fixedActivities, userProfile) {
    const plan = {
      fixedSlots: [],
      healthSlots: [],
      bufferSlots: [],
      flexibleSlots: []
    };

    // 1. 填充固定活动
    plan.fixedSlots = this.fillFixedActivities(fixedActivities, date);

    // 2. 添加健康约束
    plan.healthSlots = this.addHealthConstraints(date, userProfile);

    // 3. 添加缓冲时间
    plan.bufferSlots = this.addBufferTime(plan);

    // 4. 计算灵活时段
    plan.flexibleSlots = this.calculateFlexibleSlots(plan, date);

    return plan;
  }

  // 填充固定活动
  fillFixedActivities(fixedActivities, date) {
    return fixedActivities.map(activity => ({
      ...activity,
      startTime: new Date(date.setHours(
        parseInt(activity.time.split(':')[0]),
        parseInt(activity.time.split(':')[1])
      )),
      duration: activity.averageDuration
    }));
  }

  // 添加健康约束
  addHealthConstraints(date, userProfile) {
    const healthSlots = [];

    // 添加用餐时间
    const mealTimes = [
      { name: '早餐', start: '08:00', duration: 30 },
      { name: '午餐', start: '12:00', duration: 60 },
      { name: '晚餐', start: '18:00', duration: 60 }
    ];

    mealTimes.forEach(meal => {
      const [hours, minutes] = meal.start.split(':').map(Number);
      healthSlots.push({
        name: meal.name,
        startTime: new Date(date.setHours(hours, minutes)),
        duration: meal.duration,
        type: 'health'
      });
    });

    // 添加休息时间
    if (userProfile.restPatterns) {
      const { averageWorkDuration, averageRestDuration } = userProfile.restPatterns;
      let currentTime = new Date(date.setHours(9, 0)); // 从早上9点开始

      while (currentTime.getHours() < 18) { // 到下午6点结束
        healthSlots.push({
          name: '休息',
          startTime: new Date(currentTime),
          duration: Math.min(averageRestDuration, 15), // 最多休息15分钟
          type: 'rest'
        });

        currentTime = new Date(currentTime.getTime() + (averageWorkDuration + averageRestDuration) * 60000);
      }
    }

    return healthSlots;
  }

  // 添加缓冲时间
  addBufferTime(plan) {
    const bufferSlots = [];
    const allSlots = [...plan.fixedSlots, ...plan.healthSlots].sort(
      (a, b) => a.startTime - b.startTime
    );

    for (let i = 0; i < allSlots.length - 1; i++) {
      const currentSlot = allSlots[i];
      const nextSlot = allSlots[i + 1];
      const gap = differenceInMinutes(nextSlot.startTime, currentSlot.startTime);

      if (gap > 15) { // 如果间隔超过15分钟
        bufferSlots.push({
          name: '缓冲时间',
          startTime: new Date(currentSlot.startTime.getTime() + currentSlot.duration * 60000),
          duration: Math.min(15, gap - currentSlot.duration), // 最多15分钟缓冲
          type: 'buffer'
        });
      }
    }

    return bufferSlots;
  }

  // 计算灵活时段
  calculateFlexibleSlots(plan, date) {
    const allSlots = [...plan.fixedSlots, ...plan.healthSlots, ...plan.bufferSlots]
      .sort((a, b) => a.startTime - b.startTime);

    const flexibleSlots = [];
    let currentTime = new Date(date.setHours(9, 0)); // 从早上9点开始

    allSlots.forEach(slot => {
      if (currentTime < slot.startTime) {
        flexibleSlots.push({
          startTime: new Date(currentTime),
          duration: differenceInMinutes(slot.startTime, currentTime),
          type: 'flexible'
        });
      }
      currentTime = new Date(slot.startTime.getTime() + slot.duration * 60000);
    });

    // 添加最后一个灵活时段
    if (currentTime < new Date(date.setHours(18, 0))) {
      flexibleSlots.push({
        startTime: new Date(currentTime),
        duration: differenceInMinutes(new Date(date.setHours(18, 0)), currentTime),
        type: 'flexible'
      });
    }

    return flexibleSlots;
  }

  // 优化规划
  optimizePlan(skeletonPlan, tasks, userProfile, features) {
    const optimizedPlan = [];
    const prioritizedTasks = this.prioritizeTasks(tasks);

    // 为每个灵活时段分配任务
    skeletonPlan.flexibleSlots.forEach(slot => {
      const bestTask = this.findBestTaskForSlot(slot, prioritizedTasks, userProfile, features);
      if (bestTask) {
        optimizedPlan.push({
          ...bestTask,
          startTime: slot.startTime,
          duration: Math.min(slot.duration, bestTask.estimatedDuration),
          confidence: this.calculateConfidence(bestTask, slot, userProfile, features)
        });
      }
    });

    return optimizedPlan;
  }

  // 任务优先级排序
  prioritizeTasks(tasks) {
    return tasks.sort((a, b) => {
      // 首先按优先级排序
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // 其次按截止日期排序
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      
      // 最后按预估时长排序
      return a.estimatedDuration - b.estimatedDuration;
    });
  }

  // 为时段找到最佳任务
  findBestTaskForSlot(slot, tasks, userProfile, features) {
    let bestTask = null;
    let bestScore = -Infinity;

    tasks.forEach(task => {
      const score = this.calculateTaskScore(task, slot, userProfile, features);
      if (score > bestScore) {
        bestScore = score;
        bestTask = task;
      }
    });

    return bestTask;
  }

  // 计算任务得分
  calculateTaskScore(task, slot, userProfile, features) {
    const efficiencyScore = this.predictEfficiency(task, slot, userProfile, features);
    const priorityScore = this.getPriorityScore(task);
    const timeFitScore = this.getTimeFitScore(task, slot);
    const energyLevelScore = this.getEnergyLevelScore(task, slot, userProfile);

    return (
      efficiencyScore * 0.4 +
      priorityScore * 0.3 +
      timeFitScore * 0.2 +
      energyLevelScore * 0.1
    );
  }

  // 预测效率
  predictEfficiency(task, slot, userProfile, features) {
    const hour = slot.startTime.getHours();
    const weekday = slot.startTime.getDay();
    const timeKey = `${hour}:${weekday}`;

    // 获取历史效率数据
    const historicalEfficiency = features.timeFactors[timeKey]?.totalEfficiency / 
                               features.timeFactors[timeKey]?.count || 0;

    // 获取活动类型效率
    const typeEfficiency = userProfile.averageEfficiency[task.typeId] || 0;

    // 获取时段效率
    const timeSlotEfficiency = features.timeFeatures.hourEncoding[hour] / 
                             features.timeFeatures.hourEncoding.reduce((a, b) => a + b, 0);

    return (historicalEfficiency * 0.4 + typeEfficiency * 0.4 + timeSlotEfficiency * 0.2);
  }

  // 获取优先级得分
  getPriorityScore(task) {
    const priorityScores = { high: 1, medium: 0.7, low: 0.4 };
    return priorityScores[task.priority] || 0.5;
  }

  // 获取时间适应度得分
  getTimeFitScore(task, slot) {
    const duration = task.estimatedDuration;
    const slotDuration = slot.duration;
    
    if (duration <= slotDuration) {
      return 1 - (slotDuration - duration) / slotDuration;
    }
    return 0;
  }

  // 获取精力水平得分
  getEnergyLevelScore(task, slot, userProfile) {
    const hour = slot.startTime.getHours();
    const isHighEnergyHour = hour >= 9 && hour <= 11 || hour >= 14 && hour <= 16;
    const isLowEnergyHour = hour >= 12 && hour <= 13 || hour >= 17 && hour <= 18;
    
    const taskIntensity = task.intensity || 'medium';
    const intensityScores = { high: 1, medium: 0.7, low: 0.4 };
    
    if (isHighEnergyHour && taskIntensity === 'high') return 1;
    if (isLowEnergyHour && taskIntensity === 'low') return 1;
    if (isHighEnergyHour && taskIntensity === 'low') return 0.7;
    if (isLowEnergyHour && taskIntensity === 'high') return 0.3;
    
    return intensityScores[taskIntensity];
  }

  // 计算置信度
  calculateConfidence(task, slot, userProfile, features) {
    const efficiencyConfidence = this.predictEfficiency(task, slot, userProfile, features);
    const timeFitConfidence = this.getTimeFitScore(task, slot);
    const historicalConfidence = this.getHistoricalConfidence(task, slot, features);

    return (efficiencyConfidence * 0.4 + timeFitConfidence * 0.3 + historicalConfidence * 0.3);
  }

  // 获取历史置信度
  getHistoricalConfidence(task, slot, features) {
    const hour = slot.startTime.getHours();
    const weekday = slot.startTime.getDay();
    const timeKey = `${hour}:${weekday}`;

    const historicalData = features.timeFactors[timeKey];
    if (!historicalData) return 0.5;

    const activityCount = historicalData.count;
    const efficiency = historicalData.totalEfficiency / activityCount;

    return Math.min(1, (activityCount / 10) * (efficiency / 5));
  }

  // 检测冲突
  detectConflicts(plan) {
    const conflicts = [];
    for (let i = 0; i < plan.length; i++) {
      for (let j = i + 1; j < plan.length; j++) {
        if (this.isTimeOverlap(plan[i], plan[j])) {
          conflicts.push({
            activity1: plan[i],
            activity2: plan[j],
            type: 'overlap'
          });
        }
      }
    }
    return conflicts;
  }

  // 检查时间重叠
  isTimeOverlap(activity1, activity2) {
    const start1 = new Date(activity1.startTime);
    const end1 = new Date(start1.getTime() + activity1.duration * 60000);
    const start2 = new Date(activity2.startTime);
    const end2 = new Date(start2.getTime() + activity2.duration * 60000);

    return start1 < end2 && start2 < end1;
  }

  // 调整规划
  adjustPlan(plan, changes) {
    const adjustedPlan = [...plan];
    
    // 应用用户修改
    changes.forEach(change => {
      const index = adjustedPlan.findIndex(item => item.id === change.id);
      if (index !== -1) {
        adjustedPlan[index] = { ...adjustedPlan[index], ...change };
      }
    });

    // 检测冲突
    const conflicts = this.detectConflicts(adjustedPlan);
    
    // 解决冲突
    if (conflicts.length > 0) {
      this.resolveConflicts(adjustedPlan, conflicts);
    }

    return adjustedPlan;
  }

  // 解决冲突
  resolveConflicts(plan, conflicts) {
    conflicts.forEach(conflict => {
      const { activity1, activity2 } = conflict;
      
      // 获取优先级更高的活动
      const higherPriority = this.getHigherPriorityActivity(activity1, activity2);
      const lowerPriority = higherPriority === activity1 ? activity2 : activity1;
      
      // 尝试调整低优先级活动的时间
      const alternatives = this.suggestAlternatives(lowerPriority, plan);
      
      if (alternatives.length > 0) {
        // 选择最佳替代方案
        const bestAlternative = alternatives[0];
        const index = plan.findIndex(item => item.id === lowerPriority.id);
        if (index !== -1) {
          plan[index] = bestAlternative;
        }
      } else {
        // 如果无法调整，则移除低优先级活动
        const index = plan.findIndex(item => item.id === lowerPriority.id);
        if (index !== -1) {
          plan.splice(index, 1);
        }
      }
    });
  }

  // 获取优先级更高的活动
  getHigherPriorityActivity(activity1, activity2) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[activity1.priority] <= priorityOrder[activity2.priority] 
      ? activity1 
      : activity2;
  }

  // 建议替代方案
  suggestAlternatives(activity, plan) {
    const alternatives = [];
    const availableSlots = this.findAvailableSlots(activity, plan);
    
    availableSlots.forEach(slot => {
      alternatives.push({
        ...activity,
        startTime: slot.startTime,
        duration: Math.min(slot.duration, activity.estimatedDuration)
      });
    });

    // 按时间适应度排序
    return alternatives.sort((a, b) => {
      const scoreA = this.getTimeFitScore(a, { duration: a.duration });
      const scoreB = this.getTimeFitScore(b, { duration: b.duration });
      return scoreB - scoreA;
    });
  }

  // 查找可用时段
  findAvailableSlots(activity, plan) {
    const slots = [];
    const dayStart = new Date(activity.startTime);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(activity.startTime);
    dayEnd.setHours(18, 0, 0, 0);

    let currentTime = new Date(dayStart);
    const sortedPlan = [...plan].sort((a, b) => a.startTime - b.startTime);

    sortedPlan.forEach(item => {
      if (currentTime < item.startTime) {
        const gap = differenceInMinutes(item.startTime, currentTime);
        if (gap >= activity.estimatedDuration) {
          slots.push({
            startTime: new Date(currentTime),
            duration: gap
          });
        }
      }
      currentTime = new Date(item.startTime.getTime() + item.duration * 60000);
    });

    // 检查最后一个时段
    if (currentTime < dayEnd) {
      const gap = differenceInMinutes(dayEnd, currentTime);
      if (gap >= activity.estimatedDuration) {
        slots.push({
          startTime: new Date(currentTime),
          duration: gap
        });
      }
    }

    return slots;
  }

  // 更新模型
  updateModel(userFeedback) {
    // 更新用户偏好
    this.updateUserPreferences(userFeedback);
    
    // 更新效率预测模型
    this.updateEfficiencyModel(userFeedback);
    
    // 调整规则权重
    this.adjustRuleWeights(userFeedback);
  }

  // 更新用户偏好
  updateUserPreferences(userFeedback) {
    const { activity, score, comment } = userFeedback;
    
    // 更新活动类型偏好
    if (activity.typeId) {
      this.userPreferences = this.userPreferences || {};
      this.userPreferences[activity.typeId] = this.userPreferences[activity.typeId] || {
        totalScore: 0,
        count: 0
      };
      
      this.userPreferences[activity.typeId].totalScore += score;
      this.userPreferences[activity.typeId].count++;
    }
  }

  // 更新效率预测模型
  updateEfficiencyModel(userFeedback) {
    const { activity, score } = userFeedback;
    
    // 更新时段效率数据
    if (activity.startTime) {
      const hour = new Date(activity.startTime).getHours();
      const weekday = new Date(activity.startTime).getDay();
      const timeKey = `${hour}:${weekday}`;
      
      this.efficiencyModel = this.efficiencyModel || {};
      this.efficiencyModel[timeKey] = this.efficiencyModel[timeKey] || {
        totalScore: 0,
        count: 0
      };
      
      this.efficiencyModel[timeKey].totalScore += score;
      this.efficiencyModel[timeKey].count++;
    }
  }

  // 调整规则权重
  adjustRuleWeights(userFeedback) {
    const { activity, score } = userFeedback;
    
    // 根据用户反馈调整规则权重
    this.ruleWeights = this.ruleWeights || {
      efficiency: 0.4,
      priority: 0.3,
      timeFit: 0.2,
      energyLevel: 0.1
    };
    
    // 如果用户对高效率时段的安排不满意，降低效率权重
    if (score < 3 && activity.efficiencyScore > 4) {
      this.ruleWeights.efficiency *= 0.9;
      this.ruleWeights.priority *= 1.1;
    }
    
    // 如果用户对高优先级任务的安排不满意，提高优先级权重
    if (score < 3 && activity.priority === 'high') {
      this.ruleWeights.priority *= 1.1;
      this.ruleWeights.efficiency *= 0.9;
    }
    
    // 归一化权重
    const totalWeight = Object.values(this.ruleWeights).reduce((a, b) => a + b, 0);
    Object.keys(this.ruleWeights).forEach(key => {
      this.ruleWeights[key] /= totalWeight;
    });
  }
}

export const ai = new AIService(); 