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
  LinearProgress,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { ai } from '../services/ai';
import { format, addMinutes } from 'date-fns';
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
  const [feedbackActivity, setFeedbackActivity] = useState(null);
  const [feedbackScore, setFeedbackScore] = useState(3);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (state.activities.length > 0 && state.activityTypes.length > 0) {
          const timePatterns = ai.analyzeTimePatterns(state.activities, state.activityTypes);
          setPatterns(timePatterns);
          setSchedule(ai.generateSchedule(timePatterns, state.activityTypes));
          setTips(ai.generateEfficiencyTips(timePatterns, state.activityTypes));
        }
      } catch (error) {
        console.error('Error loading AI schedule data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [state.activities, state.activityTypes]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const timePatterns = ai.analyzeTimePatterns(state.activities, state.activityTypes);
      setPatterns(timePatterns);
      setSchedule(ai.generateSchedule(timePatterns, state.activityTypes));
      setTips(ai.generateEfficiencyTips(timePatterns, state.activityTypes));
    } catch (error) {
      console.error('Error refreshing AI schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (activity) => {
    setSelectedActivity(activity);
    setEditDialogOpen(true);
  };

  const handleEditSave = (editedActivity) => {
    setSchedule(schedule.map(item => 
      item === selectedActivity ? { ...item, ...editedActivity } : item
    ));
    setEditDialogOpen(false);
    setSelectedActivity(null);
  };

  const handleFeedbackClick = (activity) => {
    setFeedbackActivity(activity);
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    // 这里应该调用 AI 服务来学习用户的反馈
    console.log('Feedback submitted:', {
      activity: feedbackActivity,
      score: feedbackScore,
      comment: feedbackComment
    });
    setFeedbackDialogOpen(false);
    setFeedbackActivity(null);
    setFeedbackScore(3);
    setFeedbackComment('');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!patterns || schedule.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI 智能日程规划
        </Typography>
        <Typography variant="body1" color="text.secondary">
          暂无足够的数据生成智能日程建议，请先记录一些活动。
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          AI 智能日程规划
        </Typography>
        <Tooltip title="刷新建议">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              今日建议日程
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              基于您的历史数据，AI 已为您规划了"阻力最小"的日程安排，考虑了您的高效时段和休息需求。
            </Alert>
            <List>
              {schedule.map((item, index) => (
                <ListItem
                  key={index}
                  sx={{
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                  secondaryAction={
                    <Box>
                      <Tooltip title="调整时间">
                        <IconButton onClick={() => handleEditClick(item)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="提供反馈">
                        <IconButton onClick={() => handleFeedbackClick(item)}>
                          <ThumbUpIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.typeName}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          建议开始时间：{format(item.suggestedStartTime, 'HH:mm')}，预计时长：{item.suggestedDuration} 分钟
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          结束时间：{format(addMinutes(item.suggestedStartTime, item.suggestedDuration), 'HH:mm')}
                        </Typography>
                        {item.reason && (
                          <Typography variant="body2" color="info.main">
                            推荐理由：{item.reason}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Chip
                    label={`${Math.round(item.confidence * 100)}% 置信度`}
                    color={item.confidence > 0.7 ? 'success' : 'warning'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="效率提升建议"
              avatar={<TrendingUpIcon color="primary" />}
            />
            <CardContent>
              {tips.length > 0 ? (
                <List>
                  {tips.map((tip, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <TimerIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={tip.typeName}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {tip.suggestion}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              预计可提升 {tip.improvement}% 的效率
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  暂无效率提升建议
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="休息时间建议"
              avatar={<AccessTimeIcon color="primary" />}
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                根据您的历史数据，建议在以下时间段安排休息：
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="上午休息"
                    secondary="10:30 - 10:45，短暂休息，保持精力"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="午休时间"
                    secondary="12:00 - 13:30，充分休息，恢复体力"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="下午休息"
                    secondary="15:30 - 15:45，缓解疲劳，提高效率"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>调整活动时间</DialogTitle>
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
              />
              <TextField
                label="持续时间（分钟）"
                type="number"
                value={selectedActivity.suggestedDuration}
                onChange={(e) => handleEditSave({ ...selectedActivity, suggestedDuration: parseInt(e.target.value) })}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={() => setEditDialogOpen(false)} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 反馈对话框 */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)}>
        <DialogTitle>提供反馈</DialogTitle>
        <DialogContent>
          {feedbackActivity && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                这个时间安排对您来说合适吗？
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => setFeedbackScore(1)}>
                  <ThumbDownIcon color={feedbackScore === 1 ? 'error' : 'default'} />
                </IconButton>
                <Slider
                  value={feedbackScore}
                  onChange={(_, value) => setFeedbackScore(value)}
                  min={1}
                  max={5}
                  step={1}
                  marks
                  sx={{ mx: 2 }}
                />
                <IconButton onClick={() => setFeedbackScore(5)}>
                  <ThumbUpIcon color={feedbackScore === 5 ? 'success' : 'default'} />
                </IconButton>
              </Box>
              <TextField
                label="反馈意见"
                multiline
                rows={4}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>取消</Button>
          <Button onClick={handleFeedbackSubmit} variant="contained">
            提交反馈
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AISchedule; 