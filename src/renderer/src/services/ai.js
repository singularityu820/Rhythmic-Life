import { format, differenceInMinutes } from 'date-fns';
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
}

export const ai = new AIService(); 