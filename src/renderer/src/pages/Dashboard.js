import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  Timeline as TimelineIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { format, isToday, differenceInMinutes, getHours } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function Dashboard() {
  const { state, deleteActivity } = useApp();
  const theme = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 获取今日活动
  const todayActivities = useMemo(() => {
    return state.activities
      .filter(activity => isToday(new Date(activity.startTime)))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [state.activities]);

  // 计算今日总时长
  const totalDuration = useMemo(() => {
    return todayActivities.reduce((total, activity) => {
      return total + differenceInMinutes(
        new Date(activity.endTime),
        new Date(activity.startTime)
      );
    }, 0);
  }, [todayActivities]);

  // 计算各类型活动时长
  const typeDurations = useMemo(() => {
    const durations = {};
    todayActivities.forEach(activity => {
      const type = state.activityTypes.find(t => t.id === activity.typeId);
      if (type) {
        const duration = differenceInMinutes(
          new Date(activity.endTime),
          new Date(activity.startTime)
        );
        durations[type.name] = (durations[type.name] || 0) + duration;
      }
    });
    return durations;
  }, [todayActivities, state.activityTypes]);

  // 计算平均效率
  const averageEfficiency = useMemo(() => {
    if (todayActivities.length === 0) return 0;
    const total = todayActivities.reduce((sum, activity) => sum + (activity.efficiencyScore || 0), 0);
    return total / todayActivities.length;
  }, [todayActivities]);

  // 计算每小时活动分布
  const hourlyDistribution = useMemo(() => {
    const distribution = Array(24).fill(0);
    const hourlyActivities = Array(24).fill().map(() => []);

    todayActivities.forEach(activity => {
      const startHour = getHours(new Date(activity.startTime));
      const endHour = getHours(new Date(activity.endTime));
      const duration = differenceInMinutes(
        new Date(activity.endTime),
        new Date(activity.startTime)
      );
      
      // 如果活动跨小时，按比例分配时间
      if (startHour === endHour) {
        distribution[startHour] += duration;
        hourlyActivities[startHour].push(activity);
      } else {
        const startMinute = new Date(activity.startTime).getMinutes();
        const endMinute = new Date(activity.endTime).getMinutes();
        
        // 计算第一个小时的时长
        distribution[startHour] += (60 - startMinute);
        hourlyActivities[startHour].push(activity);
        // 计算最后一个小时的时长
        distribution[endHour] += endMinute;
        hourlyActivities[endHour].push(activity);
        // 计算中间完整小时的时长
        for (let hour = startHour + 1; hour < endHour; hour++) {
          distribution[hour] += 60;
          hourlyActivities[hour].push(activity);
        }
      }
    });

    return { distribution, hourlyActivities };
  }, [todayActivities]);

  // 计算每小时活动类型分布
  const hourlyTypeDistribution = useMemo(() => {
    const typeDistribution = Array(24).fill().map(() => ({}));
    
    hourlyDistribution.hourlyActivities.forEach((activities, hour) => {
      activities.forEach(activity => {
        const type = state.activityTypes.find(t => t.id === activity.typeId);
        if (type) {
          typeDistribution[hour][type.name] = (typeDistribution[hour][type.name] || 0) + 1;
        }
      });
    });

    return typeDistribution;
  }, [hourlyDistribution.hourlyActivities, state.activityTypes]);

  const handleDeleteClick = (activity) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (activityToDelete) {
      await deleteActivity(activityToDelete.id);
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (state.loading) {
    return (
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          加载中...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            今日概览
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </Typography>
        </Box>
        <Tooltip title="刷新数据">
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* 统计卡片组 */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {/* 总时长统计 */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardHeader
                  title="今日总时长"
                  avatar={<AccessTimeIcon color="primary" />}
                />
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {Math.round(totalDuration / 60)}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      小时 {totalDuration % 60} 分钟
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(totalDuration / (24 * 60)) * 100}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* 效率统计 */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardHeader
                  title="平均效率"
                  avatar={<TrendingUpIcon color="primary" />}
                />
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {averageEfficiency.toFixed(1)}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      满分 5 分
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(averageEfficiency / 5) * 100}
                    color={averageEfficiency >= 4 ? 'success' : averageEfficiency >= 3 ? 'warning' : 'error'}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(
                        averageEfficiency >= 4 ? theme.palette.success.main :
                        averageEfficiency >= 3 ? theme.palette.warning.main :
                        theme.palette.error.main,
                        0.1
                      )
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* 活动类型分布 */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardHeader
                  title="活动类型分布"
                  avatar={<TimerIcon color="primary" />}
                />
                <CardContent>
                  {Object.entries(typeDurations).map(([typeName, duration]) => {
                    const type = state.activityTypes.find(t => t.name === typeName);
                    return (
                      <Box key={typeName} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: type?.colorCode || 'grey.500' 
                            }} />
                            {typeName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(duration / 60)}h {duration % 60}m
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(duration / totalDuration) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: alpha(type?.colorCode || theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: type?.colorCode || theme.palette.primary.main
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* 今日活动列表 */}
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 3,
              height: '100%',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                今日活动
              </Typography>
              <Chip
                label={`${todayActivities.length} 个活动`}
                color="primary"
                size="small"
              />
            </Box>
            {todayActivities.length > 0 ? (
              <List>
                {todayActivities.map((activity, index) => {
                  const type = state.activityTypes.find(t => t.id === activity.typeId);
                  const duration = differenceInMinutes(
                    new Date(activity.endTime),
                    new Date(activity.startTime)
                  );
                  return (
                    <ListItem
                      key={activity.id}
                      sx={{
                        borderLeft: '4px solid',
                        borderColor: type?.colorCode || 'grey.500',
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          bgcolor: alpha(type?.colorCode || theme.palette.primary.main, 0.05)
                        }
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="删除"
                          onClick={() => handleDeleteClick(activity)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <ScheduleIcon sx={{ color: type?.colorCode }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {activity.description || type?.name}
                            <Chip
                              label={`${Math.round(duration / 60)}h ${duration % 60}m`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(activity.startTime), 'HH:mm')} - {format(new Date(activity.endTime), 'HH:mm')}
                            </Typography>
                            {activity.efficiencyScore && (
                              <Chip
                                label={`效率：${activity.efficiencyScore}/5`}
                                color={activity.efficiencyScore >= 4 ? 'success' : activity.efficiencyScore >= 3 ? 'warning' : 'error'}
                                size="small"
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: 'text.secondary'
              }}>
                <InfoIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  今日暂无活动记录
                </Typography>
                <Typography variant="body2">
                  开始记录您的第一个活动吧！
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 时间轴统计 */}
        <Grid item xs={12}>
          <Card 
            sx={{ 
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <CardHeader
              title="时间轴统计"
              avatar={<TimelineIcon color="primary" />}
              action={
                <Tooltip title="刷新数据">
                  <IconButton onClick={handleRefresh}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Box sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                {/* 时间轴图表 */}
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  gap: 0.5,
                  position: 'relative',
                  mb: 2,
                  px: 2
                }}>
                  {/* 背景网格线 */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    pointerEvents: 'none'
                  }}>
                    {[0, 25, 50, 75, 100].map((percent) => (
                      <Box
                        key={percent}
                        sx={{
                          width: '100%',
                          borderBottom: '1px dashed',
                          borderColor: 'divider',
                          opacity: 0.3
                        }}
                      />
                    ))}
                  </Box>

                  {/* 时间柱状图 */}
                  {hourlyDistribution.distribution.map((duration, hour) => {
                    const maxDuration = Math.max(...hourlyDistribution.distribution);
                    const height = maxDuration > 0 ? (duration / maxDuration) * 100 : 0;
                    const isSelected = selectedHour === hour;
                    const isCurrentHour = hour === new Date().getHours();
                    
                    return (
                      <Box
                        key={hour}
                        sx={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          position: 'relative',
                          '&:hover': {
                            '& .hour-label': {
                              color: 'primary.main'
                            }
                          }
                        }}
                        onClick={() => setSelectedHour(isSelected ? null : hour)}
                      >
                        {/* 时间柱 */}
                        <Box
                          sx={{
                            width: '100%',
                            height: `${height}%`,
                            bgcolor: isCurrentHour ? 'primary.main' : isSelected ? 'primary.light' : 'primary.light',
                            borderRadius: '4px 4px 0 0',
                            opacity: duration > 0 ? 0.8 : 0.2,
                            transition: 'all 0.2s',
                            position: 'relative',
                            '&:hover': {
                              opacity: 1,
                              transform: 'scaleY(1.02)',
                              transformOrigin: 'bottom'
                            }
                          }}
                        >
                          {/* 时长标签 */}
                          {duration > 0 && (
                            <Tooltip 
                              title={
                                <Box>
                                  <Typography variant="body2">
                                    {hour}:00 - {hour + 1}:00
                                  </Typography>
                                  <Typography variant="body2">
                                    活动时长：{Math.round(duration / 60)}小时 {duration % 60}分钟
                                  </Typography>
                                  <Typography variant="body2">
                                    活动数量：{hourlyDistribution.hourlyActivities[hour].length}个
                                  </Typography>
                                </Box>
                              }
                            >
                              <Box sx={{ 
                                position: 'absolute',
                                top: -24,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                bgcolor: 'background.paper',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                boxShadow: 1,
                                display: isSelected ? 'block' : 'none',
                                whiteSpace: 'nowrap'
                              }}>
                                <Typography variant="caption">
                                  {Math.round(duration / 60)}h {duration % 60}m
                                </Typography>
                              </Box>
                            </Tooltip>
                          )}
                        </Box>

                        {/* 时间标签 */}
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          position: 'relative'
                        }}>
                          <Typography 
                            variant="caption" 
                            color={isCurrentHour ? 'primary.main' : 'text.secondary'}
                            className="hour-label"
                            sx={{ 
                              transition: 'color 0.2s',
                              fontWeight: isSelected || isCurrentHour ? 'bold' : 'normal',
                              fontSize: '0.75rem'
                            }}
                          >
                            {hour}:00
                          </Typography>
                          {isCurrentHour && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -4,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                bgcolor: 'primary.main'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* 选中小时的详细信息 */}
                {selectedHour !== null && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    boxShadow: 1
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">
                        {selectedHour}:00 - {selectedHour + 1}:00 的活动详情
                      </Typography>
                      <Chip
                        label={`${hourlyDistribution.hourlyActivities[selectedHour].length} 个活动`}
                        size="small"
                        color="primary"
                      />
                    </Box>

                    {hourlyDistribution.hourlyActivities[selectedHour].length > 0 ? (
                      <>
                        <List dense>
                          {hourlyDistribution.hourlyActivities[selectedHour].map((activity, index) => {
                            const type = state.activityTypes.find(t => t.id === activity.typeId);
                            return (
                              <ListItem 
                                key={index}
                                sx={{
                                  bgcolor: 'background.paper',
                                  borderRadius: 1,
                                  mb: 1,
                                  '&:last-child': { mb: 0 }
                                }}
                              >
                                <ListItemIcon>
                                  <ScheduleIcon sx={{ color: type?.colorCode }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={activity.description || type?.name}
                                  secondary={`${format(new Date(activity.startTime), 'HH:mm')} - ${format(new Date(activity.endTime), 'HH:mm')}`}
                                />
                                {activity.efficiencyScore && (
                                  <Chip
                                    label={`效率：${activity.efficiencyScore}/5`}
                                    color={activity.efficiencyScore >= 4 ? 'success' : activity.efficiencyScore >= 3 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                )}
                              </ListItem>
                            );
                          })}
                        </List>

                        {/* 活动类型分布 */}
                        {Object.keys(hourlyTypeDistribution[selectedHour]).length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              活动类型分布
                            </Typography>
                            {Object.entries(hourlyTypeDistribution[selectedHour]).map(([typeName, count]) => {
                              const type = state.activityTypes.find(t => t.name === typeName);
                              return (
                                <Box key={typeName} sx={{ mb: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box sx={{ 
                                        width: 8, 
                                        height: 8, 
                                        borderRadius: '50%', 
                                        bgcolor: type?.colorCode || 'grey.500' 
                                      }} />
                                      {typeName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {count} 个活动
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={(count / hourlyDistribution.hourlyActivities[selectedHour].length) * 100}
                                    sx={{ 
                                      height: 8, 
                                      borderRadius: 4,
                                      bgcolor: 'action.hover',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: type?.colorCode || 'primary.main'
                                      }
                                    }}
                                  />
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary" align="center">
                        该时段暂无活动记录
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除这个活动记录吗？此操作无法撤销。
          </Typography>
          {activityToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                活动类型：{state.activityTypes.find(t => t.id === activityToDelete.typeId)?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                时间：{format(new Date(activityToDelete.startTime), 'HH:mm')} - {format(new Date(activityToDelete.endTime), 'HH:mm')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>取消</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard; 