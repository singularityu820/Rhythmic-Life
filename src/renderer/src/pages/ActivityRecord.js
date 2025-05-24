import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Rating,
  FormHelperText,
  Snackbar,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Timer as TimerIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  AccessTime as AccessTimeIcon,
  TimerOutlined as TimerOutlinedIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

function ActivityRecord() {
  const { state, addActivity } = useApp();
  const [formData, setFormData] = useState({
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date().toISOString().slice(0, 16),
    description: '',
    typeId: '',
    efficiencyScore: 3
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // 时间输入模式
  const [timeMode, setTimeMode] = useState('manual'); // 'manual' 或 'timer'
  
  // 番茄钟状态
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  // 处理时间模式切换
  const handleTimeModeChange = (event, newMode) => {
    if (newMode !== null) {
      setTimeMode(newMode);
      // 如果切换到手动模式，停止计时器
      if (newMode === 'manual' && timerRunning) {
        stopTimer();
      }
    }
  };

  // 计时器控制函数
  const startTimer = () => {
    if (!timerRunning) {
      setTimerRunning(true);
      setTimerPaused(false);
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      // 设置开始时间
      setFormData(prev => ({
        ...prev,
        startTime: new Date().toISOString().slice(0, 16)
      }));
    }
  };

  const pauseTimer = () => {
    if (timerRunning && !timerPaused) {
      setTimerPaused(true);
      clearInterval(timerInterval);
    } else if (timerRunning && timerPaused) {
      setTimerPaused(false);
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    }
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setTimerPaused(false);
    clearInterval(timerInterval);
    // 设置结束时间
    setFormData(prev => ({
      ...prev,
      endTime: new Date().toISOString().slice(0, 16)
    }));
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleRatingChange = (event, newValue) => {
    setFormData({
      ...formData,
      efficiencyScore: newValue
    });
  };

  const validateForm = () => {
    if (!formData.description.trim()) {
      setError('请输入活动描述');
      return false;
    }
    if (!formData.typeId) {
      setError('请选择活动类型');
      return false;
    }
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      setError('结束时间必须晚于开始时间');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await addActivity({
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        description: formData.description,
        typeId: parseInt(formData.typeId),
        efficiencyScore: parseInt(formData.efficiencyScore)
      });

      setFormData({
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date().toISOString().slice(0, 16),
        description: '',
        typeId: '',
        efficiencyScore: 3
      });
      setSuccess(true);
      setError('');
      // 重置计时器
      setElapsedTime(0);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          新建活动
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 时间输入模式切换 */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TimerIcon color="primary" />
                <Typography variant="h6">时间设置</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                  value={timeMode}
                  exclusive
                  onChange={handleTimeModeChange}
                  aria-label="时间输入模式"
                >
                  <ToggleButton value="manual" aria-label="手动输入">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon />
                      <Typography>手动输入</Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="timer" aria-label="计时器">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimerOutlinedIcon />
                      <Typography>计时器</Typography>
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {timeMode === 'manual' ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="开始时间"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={handleInputChange('startTime')}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="结束时间"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={handleInputChange('endTime')}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h2" sx={{ fontFamily: 'monospace' }}>
                    {formatTime(elapsedTime)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <IconButton
                      color="primary"
                      size="large"
                      onClick={startTimer}
                      disabled={timerRunning && !timerPaused}
                    >
                      <PlayIcon fontSize="large" />
                    </IconButton>
                    <IconButton
                      color="primary"
                      size="large"
                      onClick={pauseTimer}
                      disabled={!timerRunning}
                    >
                      <PauseIcon fontSize="large" />
                    </IconButton>
                    <IconButton
                      color="primary"
                      size="large"
                      onClick={stopTimer}
                      disabled={!timerRunning}
                    >
                      <StopIcon fontSize="large" />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 活动信息表单卡片 */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CategoryIcon color="primary" />
                    <Typography variant="subtitle1">活动类型</Typography>
                  </Box>
                  <TextField
                    select
                    fullWidth
                    label="选择活动类型"
                    value={formData.typeId}
                    onChange={handleInputChange('typeId')}
                    helperText="请选择或创建活动类型"
                  >
                    {state.activityTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="subtitle1">活动描述</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    label="详细描述"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    placeholder="请详细描述您的活动内容..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <StarIcon color="primary" />
                    <Typography variant="subtitle1">效率评分</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Rating
                      name="efficiency-rating"
                      value={formData.efficiencyScore}
                      onChange={handleRatingChange}
                      precision={1}
                      icon={<StarIcon fontSize="inherit" />}
                      emptyIcon={<StarBorderIcon fontSize="inherit" />}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSubmit}
                      disabled={timeMode === 'timer' && timerRunning}
                    >
                      保存活动
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          活动记录已保存
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ActivityRecord; 