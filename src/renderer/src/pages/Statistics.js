import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function Statistics() {
  const { state } = useApp();

  // 计算时间分配数据
  const pieData = useMemo(() => {
    const typeMap = new Map();
    state.activities.forEach(activity => {
      const duration = differenceInMinutes(activity.endTime, activity.startTime);
      const type = state.activityTypes.find(t => t.id === activity.typeId);
      if (type) {
        const current = typeMap.get(type.name) || 0;
        typeMap.set(type.name, current + duration);
      }
    });

    return Array.from(typeMap.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value / 60) // 转换为小时
    }));
  }, [state.activities, state.activityTypes]);

  // 计算每日活动时长数据
  const barData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { locale: zhCN });
    const weekEnd = endOfWeek(today, { locale: zhCN });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map(day => {
      const dayActivities = state.activities.filter(activity => {
        const activityDate = new Date(activity.startTime);
        return format(activityDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const result = {
        name: format(day, 'EEEE', { locale: zhCN }),
      };

      state.activityTypes.forEach(type => {
        const typeActivities = dayActivities.filter(a => a.typeId === type.id);
        const totalMinutes = typeActivities.reduce((sum, activity) => {
          return sum + differenceInMinutes(activity.endTime, activity.startTime);
        }, 0);
        result[type.name] = Math.round(totalMinutes / 60); // 转换为小时
      });

      return result;
    });
  }, [state.activities, state.activityTypes]);

  // 计算效率评分趋势
  const efficiencyData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { locale: zhCN });
    const weekEnd = endOfWeek(today, { locale: zhCN });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map(day => {
      const dayActivities = state.activities.filter(activity => {
        const activityDate = new Date(activity.startTime);
        return format(activityDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const avgEfficiency = dayActivities.length > 0
        ? dayActivities.reduce((sum, activity) => sum + activity.efficiencyScore, 0) / dayActivities.length
        : 0;

      return {
        name: format(day, 'EEEE', { locale: zhCN }),
        efficiency: Math.round(avgEfficiency * 10) / 10
      };
    });
  }, [state.activities]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (state.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        统计分析
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              时间分配
            </Typography>
            {pieData.length > 0 ? (
              <PieChart width={400} height={300}>
                <Pie
                  data={pieData}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center">
                暂无数据
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              每日活动时长
            </Typography>
            {barData.length > 0 ? (
              <BarChart
                width={400}
                height={300}
                data={barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {state.activityTypes.map((type, index) => (
                  <Bar
                    key={type.id}
                    dataKey={type.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center">
                暂无数据
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              效率评分趋势
            </Typography>
            {efficiencyData.length > 0 ? (
              <BarChart
                width={800}
                height={300}
                data={efficiencyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="efficiency" fill="#8884d8" name="平均效率" />
              </BarChart>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center">
                暂无数据
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Statistics; 