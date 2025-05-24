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
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { ai } from '../services/ai';

function HabitAnalysis() {
  const { state } = useApp();
  const [habits, setHabits] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (state.activities.length > 0 && state.activityTypes.length > 0) {
          const habitAnalysis = ai.analyzeHabits(state.activities, state.activityTypes);
          setHabits(habitAnalysis);
          setRecommendations(ai.generateHabitRecommendations(habitAnalysis, state.activityTypes));
        }
      } catch (error) {
        console.error('Error loading habit analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [state.activities, state.activityTypes]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const habitAnalysis = ai.analyzeHabits(state.activities, state.activityTypes);
      setHabits(habitAnalysis);
      setRecommendations(ai.generateHabitRecommendations(habitAnalysis, state.activityTypes));
    } catch (error) {
      console.error('Error refreshing habit analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!habits || Object.keys(habits.consistency || {}).length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          习惯分析
        </Typography>
        <Typography variant="body1" color="text.secondary">
          暂无足够的数据进行习惯分析，请先记录一些活动。
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          习惯分析
        </Typography>
        <Tooltip title="刷新分析">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              活动一致性分析
            </Typography>
            <List>
              {Object.entries(habits.consistency).map(([typeName, data]) => (
                <ListItem
                  key={typeName}
                  sx={{
                    borderLeft: '4px solid',
                    borderColor: data.averageDaysPerWeek >= 3 ? 'success.main' : 'warning.main',
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <ListItemIcon>
                    <TimelineIcon color={data.averageDaysPerWeek >= 3 ? 'success' : 'warning'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={typeName}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          每周平均 {data.averageDaysPerWeek.toFixed(1)} 天
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          最常进行：{data.mostFrequentDay}，最少进行：{data.leastFrequentDay}
                        </Typography>
                      </>
                    }
                  />
                  <Chip
                    label={data.averageDaysPerWeek >= 3 ? '良好' : '需改进'}
                    color={data.averageDaysPerWeek >= 3 ? 'success' : 'warning'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              连续记录分析
            </Typography>
            <List>
              {Object.entries(habits.streaks).map(([typeName, data]) => (
                <ListItem
                  key={typeName}
                  sx={{
                    borderLeft: '4px solid',
                    borderColor: data.currentStreak > 0 ? 'success.main' : 'error.main',
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <ListItemIcon>
                    <EmojiEventsIcon color={data.currentStreak > 0 ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={typeName}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          当前连续：{data.currentStreak} 天
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          最长记录：{data.maxStreak} 天
                        </Typography>
                      </>
                    }
                  />
                  <Chip
                    label={data.currentStreak > 0 ? '进行中' : '已中断'}
                    color={data.currentStreak > 0 ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="个性化建议"
              avatar={<TrendingUpIcon color="primary" />}
            />
            <CardContent>
              {recommendations.length > 0 ? (
                <List>
                  {recommendations.map((rec, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {rec.type === 'consistency' ? (
                            <WarningIcon color="warning" />
                          ) : rec.type === 'streak' ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <TimelineIcon color="info" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.activityType}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {rec.suggestion}
                              </Typography>
                              <Typography variant="body2" color="success.main">
                                预期效果：{rec.expectedBenefit}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < recommendations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  暂无个性化建议
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default HabitAnalysis; 