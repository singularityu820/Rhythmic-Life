import React, { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Alert,
  CircularProgress,
  Snackbar,
  Tabs,
  Tab,
  Divider,
  Stack,
  LinearProgress,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon,
  EmojiEvents as EmojiEventsIcon,
  Error as ErrorIcon,
  Compare as CompareIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { ai } from '../services/ai';
import { format, addMinutes, subDays, addDays, isSameDay, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function AISchedule() {
  const { state } = useApp();
  const [patterns, setPatterns] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState({ score: 3, comment: '' });
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [compareMode, setCompareMode] = useState(false);
  const [compareDate, setCompareDate] = useState(subDays(new Date(), 1));
  const [compareSchedule, setCompareSchedule] = useState([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    workStartTime: '09:00',
    workEndTime: '18:00',
    preferredBreakDuration: 30,
    maxContinuousWorkTime: 120,
    minBreakTime: 15,
    preferredActivityOrder: 'efficiency', // 'efficiency' | 'duration' | 'custom'
    enableNotifications: true,
    autoAdjustSchedule: true,
    considerEnergyLevels: true,
    preferredWorkStyle: 'balanced', // 'balanced' | 'intensive' | 'relaxed'
    customBreakTimes: {
      morning: { enabled: true, time: '10:30', duration: 15 },
      noon: { enabled: true, time: '12:00', duration: 90 },
      afternoon: { enabled: true, time: '15:30', duration: 15 }
    }
  });

  useEffect(() => {
    loadData();
  }, [state.activities, state.activityTypes]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (state.activities.length === 0 || state.activityTypes.length === 0) {
        setError('暂无活动数据，请先添加一些活动');
        return;
      }

      const timePatterns = ai.analyzeTimePatterns(state.activities, state.activityTypes);
      setPatterns(timePatterns);

      const generatedSchedule = ai.generateSchedule(timePatterns, state.activityTypes);
      setSchedule(generatedSchedule);

      const efficiencyTips = ai.generateEfficiencyTips(timePatterns, state.activityTypes);
      setTips(efficiencyTips);

      if (generatedSchedule.length === 0) {
        setError('无法生成有效的日程建议，请添加更多活动数据');
      }
    } catch (error) {
      console.error('加载 AI 日程数据失败:', error);
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadData();
      setSnackbar({
        open: true,
        message: '日程已更新',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '更新失败，请重试',
        severity: 'error'
      });
    }
  };

  const handleEditClick = (activity) => {
    setSelectedActivity(activity);
    setEditDialogOpen(true);
  };

  const handleEditSave = (editedActivity) => {
    try {
      setSchedule(schedule.map(item => 
        item === selectedActivity ? { ...item, ...editedActivity } : item
      ));
      setEditDialogOpen(false);
      setSelectedActivity(null);
      setSnackbar({
        open: true,
        message: '时间已调整',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '调整失败，请重试',
        severity: 'error'
      });
    }
  };

  const handleFeedbackClick = (activity) => {
    setSelectedActivity(activity);
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    try {
      await ai.updateModel({
        activity: selectedActivity,
        score: feedback.score,
        comment: feedback.comment
      });
      setFeedbackDialogOpen(false);
      setSelectedActivity(null);
      setFeedback({ score: 3, comment: '' });
      setSnackbar({
        open: true,
        message: '感谢您的反馈',
        severity: 'success'
      });
    } catch (error) {
      console.error('提交反馈失败:', error);
      setSnackbar({
        open: true,
        message: '提交反馈失败，请重试',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCompare = async () => {
    setCompareLoading(true);
    try {
      const timePatterns = ai.analyzeTimePatterns(state.activities, state.activityTypes);
      const generatedSchedule = ai.generateSchedule(timePatterns, state.activityTypes, compareDate);
      setCompareSchedule(generatedSchedule);
      setCompareMode(true);
    } catch (error) {
      console.error('生成对比日程失败:', error);
      setSnackbar({
        open: true,
        message: '生成对比日程失败，请重试',
        severity: 'error'
      });
    } finally {
      setCompareLoading(false);
    }
  };

  const handleDateChange = (direction) => {
    const newDate = direction === 'next' 
      ? addDays(compareDate, 1)
      : subDays(compareDate, 1);
    setCompareDate(newDate);
    handleCompare();
  };

  const getScheduleDifferences = () => {
    const differences = [];
    
    // 创建时间槽映射，用于更精确的比较
    const createTimeSlotMap = (schedule) => {
      const timeSlots = new Map();
      schedule.forEach(item => {
        const startTime = format(item.suggestedStartTime, 'HH:mm');
        const endTime = format(addMinutes(item.suggestedStartTime, item.suggestedDuration), 'HH:mm');
        timeSlots.set(item.typeId, {
          startTime,
          endTime,
          duration: item.suggestedDuration,
          typeName: item.typeName,
          confidence: item.confidence
        });
      });
      return timeSlots;
    };

    const todaySlots = createTimeSlotMap(schedule);
    const compareSlots = createTimeSlotMap(compareSchedule);

    // 1. 分析活动类型变化
    const todayTypes = new Set(todaySlots.keys());
    const compareTypes = new Set(compareSlots.keys());

    // 新增的活动类型
    compareTypes.forEach(typeId => {
      if (!todayTypes.has(typeId)) {
        const activity = compareSlots.get(typeId);
        differences.push({
          type: 'new',
          message: `新增了 ${activity.typeName} 活动`,
          details: `建议时间：${activity.startTime}-${activity.endTime}，预计时长：${activity.duration}分钟`,
          confidence: activity.confidence
        });
      }
    });

    // 移除的活动类型
    todayTypes.forEach(typeId => {
      if (!compareTypes.has(typeId)) {
        const activity = todaySlots.get(typeId);
        differences.push({
          type: 'removed',
          message: `移除了 ${activity.typeName} 活动`,
          details: `原计划时间：${activity.startTime}-${activity.endTime}，原计划时长：${activity.duration}分钟`,
          confidence: activity.confidence
        });
      }
    });

    // 2. 分析时间安排变化
    todayTypes.forEach(typeId => {
      if (compareTypes.has(typeId)) {
        const todayActivity = todaySlots.get(typeId);
        const compareActivity = compareSlots.get(typeId);

        // 比较开始时间
        const todayStart = new Date(`2000-01-01T${todayActivity.startTime}`);
        const compareStart = new Date(`2000-01-01T${compareActivity.startTime}`);
        const timeDiff = Math.abs(todayStart - compareStart) / (1000 * 60); // 转换为分钟

        if (timeDiff > 30) {
          differences.push({
            type: 'time',
            message: `${todayActivity.typeName} 活动时间调整`,
            details: `从 ${compareActivity.startTime} 调整为 ${todayActivity.startTime}，变化 ${Math.round(timeDiff)} 分钟`,
            confidence: todayActivity.confidence
          });
        }

        // 比较持续时间
        const durationDiff = Math.abs(todayActivity.duration - compareActivity.duration);
        if (durationDiff > 30) {
          differences.push({
            type: 'duration',
            message: `${todayActivity.typeName} 活动时长变化`,
            details: `从 ${compareActivity.duration} 分钟调整为 ${todayActivity.duration} 分钟，变化 ${durationDiff} 分钟`,
            confidence: todayActivity.confidence
          });
        }

        // 比较置信度变化
        const confidenceDiff = Math.abs(todayActivity.confidence - compareActivity.confidence);
        if (confidenceDiff > 0.2) {
          differences.push({
            type: 'confidence',
            message: `${todayActivity.typeName} 活动置信度变化`,
            details: `从 ${Math.round(compareActivity.confidence * 100)}% 调整为 ${Math.round(todayActivity.confidence * 100)}%`,
            confidence: todayActivity.confidence
          });
        }
      }
    });

    // 3. 按时间顺序排序差异
    return differences.sort((a, b) => {
      const timeA = a.type === 'time' ? a.details.split(' ')[2] : '00:00';
      const timeB = b.type === 'time' ? b.details.split(' ')[2] : '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  const renderCompareView = () => {
    const differences = getScheduleDifferences();
    
    return (
      <Box>
        {/* 日期选择器 - 移动端优化 */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => handleDateChange('prev')}
            disabled={compareLoading}
            fullWidth={false}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 0 }
            }}
          >
            {format(subDays(compareDate, 1), 'MM月dd日')}
          </Button>
          <Typography 
            variant="h6" 
            sx={{ 
              mx: 2,
              textAlign: 'center',
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 0, sm: 1 }
            }}
          >
            {format(compareDate, 'MM月dd日')}
          </Typography>
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={() => handleDateChange('next')}
            disabled={compareLoading || isSameDay(compareDate, new Date())}
            fullWidth={false}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 2 }
            }}
          >
            {format(addDays(compareDate, 1), 'MM月dd日')}
          </Button>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="日程变化分析"
                avatar={<CompareIcon color="primary" />}
                sx={{
                  '& .MuiCardHeader-content': {
                    overflow: 'hidden'
                  }
                }}
              />
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                {differences.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {differences.map((diff, index) => (
                      <ListItem 
                        key={index}
                        sx={{
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          p: { xs: 1, sm: 2 },
                          '&:not(:last-child)': {
                            borderBottom: '1px solid',
                            borderColor: 'divider'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: { xs: 'auto', sm: 40 },
                          mr: { xs: 0, sm: 2 },
                          mb: { xs: 1, sm: 0 }
                        }}>
                          {diff.type === 'new' && <TrendingUpIcon color="success" />}
                          {diff.type === 'removed' && <TrendingUpIcon color="error" />}
                          {diff.type === 'time' && <AccessTimeIcon color="warning" />}
                          {diff.type === 'duration' && <TimerIcon color="info" />}
                          {diff.type === 'confidence' && <EmojiEventsIcon color="secondary" />}
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 'medium',
                                mb: { xs: 0.5, sm: 0 }
                              }}
                            >
                              {diff.message}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: { xs: 0.5, sm: 0 } }}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  mb: 0.5,
                                  wordBreak: 'break-word'
                                }}
                              >
                                {diff.details}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  display: 'block',
                                  mt: 0.5
                                }}
                              >
                                置信度：{Math.round(diff.confidence * 100)}%
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    align="center"
                    sx={{ py: 2 }}
                  >
                    与前一天相比没有显著变化
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="今日建议日程"
                sx={{
                  '& .MuiCardHeader-content': {
                    overflow: 'hidden'
                  }
                }}
              />
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <List sx={{ p: 0 }}>
                  {schedule.map((item, index) => (
                    <ListItem 
                      key={index}
                      sx={{
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        mb: 1,
                        bgcolor: 'background.paper',
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(4px)'
                        },
                        position: 'relative'
                      }}
                      secondaryAction={
                        <Box sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 1,
                          mt: { xs: 1, sm: 0 }
                        }}>
                          <Chip
                            label={`${Math.round(item.confidence * 100)}% 置信度`}
                            color={item.confidence > 0.7 ? 'success' : 'warning'}
                            size="small"
                            sx={{ 
                              height: { xs: 24, sm: 32 },
                              fontWeight: 600
                            }}
                          />
                          <Box sx={{ 
                            display: 'flex',
                            gap: 1
                          }}>
                            <Tooltip title="调整时间">
                              <IconButton 
                                onClick={() => handleEditClick(item)}
                                size="small"
                                sx={{
                                  bgcolor: 'primary.light',
                                  color: 'primary.main',
                                  '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'white'
                                  }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="提供反馈">
                              <IconButton 
                                onClick={() => handleFeedbackClick(item)}
                                size="small"
                                sx={{
                                  bgcolor: 'success.light',
                                  color: 'success.main',
                                  '&:hover': {
                                    bgcolor: 'success.main',
                                    color: 'white'
                                  }
                                }}
                              >
                                <EmojiEventsIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      }
                    >
                      <ListItemIcon sx={{ 
                        minWidth: { xs: 36, sm: 40 },
                        mr: { xs: 1, sm: 2 }
                      }}>
                        <ScheduleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography 
                            variant="subtitle1"
                            sx={{ 
                              fontWeight: 600,
                              mb: { xs: 0.5, sm: 0 }
                            }}
                          >
                            {item.typeName}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                mb: 0.5,
                                wordBreak: 'break-word'
                              }}
                            >
                              建议开始时间：{format(item.suggestedStartTime, 'HH:mm')}，预计时长：{item.suggestedDuration} 分钟
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                mb: 0.5,
                                wordBreak: 'break-word'
                              }}
                            >
                              结束时间：{format(addMinutes(item.suggestedStartTime, item.suggestedDuration), 'HH:mm')}
                            </Typography>
                            {item.reason && (
                              <Typography 
                                variant="body2" 
                                color="info.main"
                                sx={{ 
                                  wordBreak: 'break-word',
                                  fontStyle: 'italic'
                                }}
                              >
                                推荐理由：{item.reason}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title={`${format(compareDate, 'MM月dd日')}日程`}
                sx={{
                  '& .MuiCardHeader-content': {
                    overflow: 'hidden'
                  }
                }}
              />
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <List sx={{ p: 0 }}>
                  {compareSchedule.map((item, index) => (
                    <ListItem 
                      key={index}
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        p: { xs: 1, sm: 2 },
                        '&:not(:last-child)': {
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 'medium',
                              mb: { xs: 0.5, sm: 0 }
                            }}
                          >
                            {item.typeName}
                          </Typography>
                        }
                        secondary={
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              wordBreak: 'break-word'
                            }}
                          >
                            {`${format(item.suggestedStartTime, 'HH:mm')} - ${format(
                              addMinutes(item.suggestedStartTime, item.suggestedDuration),
                              'HH:mm'
                            )}`}
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderAnalysisView = () => {
    // 计算时间分布
    const timeDistribution = {
      morning: schedule.filter(item => {
        const hour = new Date(item.suggestedStartTime).getHours();
        return hour >= 6 && hour < 12;
      }).length,
      afternoon: schedule.filter(item => {
        const hour = new Date(item.suggestedStartTime).getHours();
        return hour >= 12 && hour < 18;
      }).length,
      evening: schedule.filter(item => {
        const hour = new Date(item.suggestedStartTime).getHours();
        return hour >= 18 && hour < 22;
      }).length,
      night: schedule.filter(item => {
        const hour = new Date(item.suggestedStartTime).getHours();
        return hour >= 22 || hour < 6;
      }).length
    };

    // 计算活动类型分布
    const typeDistribution = schedule.reduce((acc, item) => {
      acc[item.typeName] = (acc[item.typeName] || 0) + item.suggestedDuration;
      return acc;
    }, {});

    // 计算效率趋势
    const efficiencyTrend = schedule.map(item => ({
      type: item.typeName,
      confidence: item.confidence,
      duration: item.suggestedDuration,
      time: format(item.suggestedStartTime, 'HH:mm')
    }));

    // 计算休息时间分布
    const restTimeDistribution = {
      morning: '10:30 - 10:45',
      noon: '12:00 - 13:30',
      afternoon: '15:30 - 15:45'
    };

    return (
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* 时间分布分析 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="时间分布分析"
              avatar={<AccessTimeIcon color="primary" />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  活动时段分布
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                      <Typography variant="h6" color="primary.contrastText">
                        {timeDistribution.morning}
                      </Typography>
                      <Typography variant="body2" color="primary.contrastText">
                        上午活动
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light' }}>
                      <Typography variant="h6" color="secondary.contrastText">
                        {timeDistribution.afternoon}
                      </Typography>
                      <Typography variant="body2" color="secondary.contrastText">
                        下午活动
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Typography variant="h6" color="info.contrastText">
                        {timeDistribution.evening}
                      </Typography>
                      <Typography variant="body2" color="info.contrastText">
                        晚上活动
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                      <Typography variant="h6" color="warning.contrastText">
                        {timeDistribution.night}
                      </Typography>
                      <Typography variant="body2" color="warning.contrastText">
                        夜间活动
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 活动类型分析 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="活动类型分析"
              avatar={<TrendingUpIcon color="primary" />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  活动时长分布
                </Typography>
                <List>
                  {Object.entries(typeDistribution).map(([type, duration]) => (
                    <ListItem key={type}>
                      <ListItemText
                        primary={type}
                        secondary={`${Math.round(duration / 60)} 小时`}
                      />
                      <Box sx={{ width: '60%', ml: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(duration / Math.max(...Object.values(typeDistribution))) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 效率趋势分析 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="效率趋势分析"
              avatar={<EmojiEventsIcon color="primary" />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  活动效率分布
                </Typography>
                <Grid container spacing={2}>
                  {efficiencyTrend.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper 
                        sx={{ 
                          p: 2,
                          bgcolor: item.confidence > 0.7 ? 'success.light' : 
                                 item.confidence > 0.4 ? 'warning.light' : 'error.light'
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom>
                          {item.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          时间：{item.time}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          时长：{item.duration} 分钟
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            置信度：{Math.round(item.confidence * 100)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={item.confidence * 100}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              bgcolor: 'rgba(255,255,255,0.3)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 2
                              }
                            }}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 休息时间分析 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="休息时间分析"
              avatar={<AccessTimeIcon color="primary" />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  建议休息时段
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(restTimeDistribution).map(([period, time]) => (
                    <Grid item xs={12} sm={4} key={period}>
                      <Paper 
                        sx={{ 
                          p: 2,
                          textAlign: 'center',
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom>
                          {period === 'morning' ? '上午休息' :
                           period === 'noon' ? '午休时间' : '下午休息'}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {time}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {period === 'morning' ? '短暂休息，保持精力' :
                           period === 'noon' ? '充分休息，恢复体力' : '缓解疲劳，提高效率'}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const handleSettingsSave = () => {
    // 保存设置并重新生成日程
    setSettingsOpen(false);
    handleRefresh();
  };

  const renderSettingsDialog = () => (
    <Dialog 
      open={settingsOpen} 
      onClose={() => setSettingsOpen(false)}
      fullScreen={window.innerWidth < 600}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '600px' },
          maxWidth: '100%',
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 2 },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        日程偏好设置
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* 工作时间设置 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                工作时间设置
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="工作开始时间"
                    type="time"
                    value={preferences.workStartTime}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      workStartTime: e.target.value
                    })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="工作结束时间"
                    type="time"
                    value={preferences.workEndTime}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      workEndTime: e.target.value
                    })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* 休息时间设置 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                休息时间设置
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>休息时间偏好</InputLabel>
                    <Select
                      value={preferences.preferredBreakDuration}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        preferredBreakDuration: e.target.value
                      })}
                      label="休息时间偏好"
                    >
                      <MenuItem value={15}>短休息 (15分钟)</MenuItem>
                      <MenuItem value={30}>中等休息 (30分钟)</MenuItem>
                      <MenuItem value={45}>长休息 (45分钟)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>
                    最大连续工作时间：{preferences.maxContinuousWorkTime} 分钟
                  </Typography>
                  <Slider
                    value={preferences.maxContinuousWorkTime}
                    onChange={(_, value) => setPreferences({
                      ...preferences,
                      maxContinuousWorkTime: value
                    })}
                    min={60}
                    max={240}
                    step={30}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* 工作风格设置 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                工作风格设置
              </Typography>
              <FormControl fullWidth>
                <InputLabel>工作风格</InputLabel>
                <Select
                  value={preferences.preferredWorkStyle}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    preferredWorkStyle: e.target.value
                  })}
                  label="工作风格"
                >
                  <MenuItem value="balanced">平衡型</MenuItem>
                  <MenuItem value="intensive">集中型</MenuItem>
                  <MenuItem value="relaxed">轻松型</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 活动排序设置 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                活动排序设置
              </Typography>
              <FormControl fullWidth>
                <InputLabel>活动排序方式</InputLabel>
                <Select
                  value={preferences.preferredActivityOrder}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    preferredActivityOrder: e.target.value
                  })}
                  label="活动排序方式"
                >
                  <MenuItem value="efficiency">按效率优先</MenuItem>
                  <MenuItem value="duration">按时长优先</MenuItem>
                  <MenuItem value="custom">自定义排序</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 其他设置 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                其他设置
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.enableNotifications}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        enableNotifications: e.target.checked
                      })}
                    />
                  }
                  label="启用提醒通知"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.autoAdjustSchedule}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        autoAdjustSchedule: e.target.checked
                      })}
                    />
                  }
                  label="自动调整日程"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.considerEnergyLevels}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        considerEnergyLevels: e.target.checked
                      })}
                    />
                  }
                  label="考虑精力水平"
                />
              </FormGroup>
            </Grid>

            {/* 自定义休息时间 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                自定义休息时间
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(preferences.customBreakTimes).map(([key, value]) => (
                  <Grid item xs={12} key={key}>
                    <Paper sx={{ p: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={value.enabled}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              customBreakTimes: {
                                ...preferences.customBreakTimes,
                                [key]: {
                                  ...value,
                                  enabled: e.target.checked
                                }
                              }
                            })}
                          />
                        }
                        label={
                          key === 'morning' ? '上午休息' :
                          key === 'noon' ? '午休时间' : '下午休息'
                        }
                      />
                      {value.enabled && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <TextField
                              label="时间"
                              type="time"
                              value={value.time}
                              onChange={(e) => setPreferences({
                                ...preferences,
                                customBreakTimes: {
                                  ...preferences.customBreakTimes,
                                  [key]: {
                                    ...value,
                                    time: e.target.value
                                  }
                                }
                              })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="时长（分钟）"
                              type="number"
                              value={value.duration}
                              onChange={(e) => setPreferences({
                                ...preferences,
                                customBreakTimes: {
                                  ...preferences.customBreakTimes,
                                  [key]: {
                                    ...value,
                                    duration: parseInt(e.target.value)
                                  }
                                }
                              })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: { xs: 2, sm: 3 },
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button 
          onClick={() => setSettingsOpen(false)}
          fullWidth={window.innerWidth < 600}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          取消
        </Button>
        <Button 
          onClick={handleSettingsSave} 
          variant="contained"
          fullWidth={window.innerWidth < 600}
          sx={{ 
            mt: { xs: 1, sm: 0 },
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          保存设置
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          正在生成智能日程...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="info" 
          icon={<ErrorIcon />}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              重试
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3 },
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)'
      }}
    >
      {/* 顶部标题栏 */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}
        >
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem' },
                textAlign: { xs: 'center', sm: 'left' },
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              AI 智能日程规划
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              基于您的历史数据，为您提供最优的日程安排建议
            </Typography>
          </Box>
          <Stack 
            direction="row" 
            spacing={1}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-end' }
            }}
          >
            <Tooltip title="偏好设置">
              <IconButton 
                onClick={() => setSettingsOpen(true)}
                sx={{ 
                  p: { xs: 1.5, sm: 1 },
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="数据分析">
              <IconButton 
                onClick={() => setShowAnalysis(!showAnalysis)}
                sx={{ 
                  p: { xs: 1.5, sm: 1 },
                  bgcolor: showAnalysis ? 'primary.main' : 'transparent',
                  color: showAnalysis ? 'white' : 'inherit',
                  '&:hover': {
                    bgcolor: showAnalysis ? 'primary.dark' : 'action.hover'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <AnalyticsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="对比日程">
              <IconButton 
                onClick={handleCompare} 
                disabled={loading || compareLoading}
                sx={{ 
                  p: { xs: 1.5, sm: 1 },
                  bgcolor: compareMode ? 'primary.main' : 'transparent',
                  color: compareMode ? 'white' : 'inherit',
                  '&:hover': {
                    bgcolor: compareMode ? 'primary.dark' : 'action.hover'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CompareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="刷新建议">
              <IconButton 
                onClick={handleRefresh} 
                disabled={loading}
                sx={{ 
                  p: { xs: 1.5, sm: 1 },
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      {/* 主要内容区域 */}
      <Box
        sx={{
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.3s ease'
        }}
      >
        {showAnalysis ? (
          renderAnalysisView()
        ) : compareMode ? (
          renderCompareView()
        ) : (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={8}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  今日建议日程
                </Typography>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 2,
                    borderRadius: 1,
                    '& .MuiAlert-message': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                >
                  基于您的历史数据，AI 已为您规划了"阻力最小"的日程安排，考虑了您的高效时段和休息需求。
                </Alert>
                <List sx={{ p: 0 }}>
                  {schedule.map((item, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        mb: 1,
                        bgcolor: 'background.paper',
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(4px)'
                        },
                        position: 'relative'
                      }}
                      secondaryAction={
                        <Box sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 1,
                          mt: { xs: 1, sm: 0 }
                        }}>
                          <Chip
                            label={`${Math.round(item.confidence * 100)}% 置信度`}
                            color={item.confidence > 0.7 ? 'success' : 'warning'}
                            size="small"
                            sx={{ 
                              height: { xs: 24, sm: 32 },
                              fontWeight: 600
                            }}
                          />
                          <Box sx={{ 
                            display: 'flex',
                            gap: 1
                          }}>
                            <Tooltip title="调整时间">
                              <IconButton 
                                onClick={() => handleEditClick(item)}
                                size="small"
                                sx={{
                                  bgcolor: 'primary.light',
                                  color: 'primary.main',
                                  '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'white'
                                  }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="提供反馈">
                              <IconButton 
                                onClick={() => handleFeedbackClick(item)}
                                size="small"
                                sx={{
                                  bgcolor: 'success.light',
                                  color: 'success.main',
                                  '&:hover': {
                                    bgcolor: 'success.main',
                                    color: 'white'
                                  }
                                }}
                              >
                                <EmojiEventsIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      }
                    >
                      <ListItemIcon sx={{ 
                        minWidth: { xs: 36, sm: 40 },
                        mr: { xs: 1, sm: 2 }
                      }}>
                        <ScheduleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography 
                            variant="subtitle1"
                            sx={{ 
                              fontWeight: 600,
                              mb: { xs: 0.5, sm: 0 }
                            }}
                          >
                            {item.typeName}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                mb: 0.5,
                                wordBreak: 'break-word'
                              }}
                            >
                              建议开始时间：{format(item.suggestedStartTime, 'HH:mm')}，预计时长：{item.suggestedDuration} 分钟
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                mb: 0.5,
                                wordBreak: 'break-word'
                              }}
                            >
                              结束时间：{format(addMinutes(item.suggestedStartTime, item.suggestedDuration), 'HH:mm')}
                            </Typography>
                            {item.reason && (
                              <Typography 
                                variant="body2" 
                                color="info.main"
                                sx={{ 
                                  wordBreak: 'break-word',
                                  fontStyle: 'italic'
                                }}
                              >
                                推荐理由：{item.reason}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <CardHeader
                    title="效率提升建议"
                    avatar={<TrendingUpIcon color="primary" />}
                    sx={{
                      '& .MuiCardHeader-content': {
                        overflow: 'hidden'
                      }
                    }}
                  />
                  <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                    {tips.length > 0 ? (
                      <List sx={{ p: 0 }}>
                        {tips.map((tip, index) => (
                          <ListItem 
                            key={index}
                            sx={{
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              p: { xs: 1, sm: 2 },
                              '&:not(:last-child)': {
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                              },
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                          >
                            <ListItemIcon sx={{ 
                              minWidth: { xs: 'auto', sm: 40 },
                              mr: { xs: 0, sm: 2 },
                              mb: { xs: 1, sm: 0 }
                            }}>
                              <TimerIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography 
                                  variant="subtitle1"
                                  sx={{ 
                                    fontWeight: 600,
                                    mb: { xs: 0.5, sm: 0 }
                                  }}
                                >
                                  {tip.typeName}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ 
                                      mb: 0.5,
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {tip.suggestion}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    color="success.main"
                                    sx={{ 
                                      wordBreak: 'break-word',
                                      fontWeight: 600
                                    }}
                                  >
                                    预计可提升 {tip.improvement}% 的效率
                                  </Typography>
                                </Box>
                              }
                              sx={{ m: 0 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        align="center"
                        sx={{ py: 2 }}
                      >
                        暂无效率提升建议
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <CardHeader
                    title="休息时间建议"
                    avatar={<AccessTimeIcon color="primary" />}
                    sx={{
                      '& .MuiCardHeader-content': {
                        overflow: 'hidden'
                      }
                    }}
                  />
                  <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mb: 2,
                        wordBreak: 'break-word'
                      }}
                    >
                      根据您的历史数据，建议在以下时间段安排休息：
                    </Typography>
                    <List sx={{ p: 0 }}>
                      <ListItem 
                        sx={{ 
                          p: { xs: 1, sm: 2 },
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              上午休息
                            </Typography>
                          }
                          secondary="10:30 - 10:45，短暂休息，保持精力"
                        />
                      </ListItem>
                      <ListItem 
                        sx={{ 
                          p: { xs: 1, sm: 2 },
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              午休时间
                            </Typography>
                          }
                          secondary="12:00 - 13:30，充分休息，恢复体力"
                        />
                      </ListItem>
                      <ListItem 
                        sx={{ 
                          p: { xs: 1, sm: 2 },
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              下午休息
                            </Typography>
                          }
                          secondary="15:30 - 15:45，缓解疲劳，提高效率"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* 编辑对话框 */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        fullScreen={window.innerWidth < 600}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '400px' },
            maxWidth: '100%',
            m: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: 2 },
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          调整活动时间
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box sx={{ pt: 2 }}>
              <TextField
                label="开始时间"
                type="time"
                value={format(selectedActivity.suggestedStartTime, 'HH:mm')}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':');
                  const newTime = new Date(selectedActivity.suggestedStartTime);
                  newTime.setHours(parseInt(hours), parseInt(minutes));
                  handleEditSave({ ...selectedActivity, suggestedStartTime: newTime });
                }}
                fullWidth
                sx={{ mb: 2 }}
                InputLabelProps={{
                  shrink: true
                }}
              />
              <TextField
                label="持续时间（分钟）"
                type="number"
                value={selectedActivity.suggestedDuration}
                onChange={(e) => handleEditSave({ ...selectedActivity, suggestedDuration: parseInt(e.target.value) })}
                fullWidth
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 },
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            fullWidth={window.innerWidth < 600}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            取消
          </Button>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            variant="contained"
            fullWidth={window.innerWidth < 600}
            sx={{ 
              mt: { xs: 1, sm: 0 },
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 反馈对话框 */}
      <Dialog 
        open={feedbackDialogOpen} 
        onClose={() => setFeedbackDialogOpen(false)}
        fullScreen={window.innerWidth < 600}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '400px' },
            maxWidth: '100%',
            m: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: 2 },
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          提供反馈
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>评分</Typography>
            <Slider
              value={feedback.score}
              onChange={(_, value) => setFeedback({ ...feedback, score: value })}
              min={1}
              max={5}
              step={1}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />
            <TextField
              label="评论"
              multiline
              rows={4}
              value={feedback.comment}
              onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 },
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={() => setFeedbackDialogOpen(false)}
            fullWidth={window.innerWidth < 600}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleFeedbackSubmit} 
            variant="contained" 
            color="primary"
            fullWidth={window.innerWidth < 600}
            sx={{ 
              mt: { xs: 1, sm: 0 },
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            提交
          </Button>
        </DialogActions>
      </Dialog>

      {/* 设置对话框 */}
      {renderSettingsDialog()}

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          bottom: { xs: 0, sm: 24 }
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            maxWidth: { xs: '100%', sm: '400px' },
            borderRadius: 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AISchedule; 