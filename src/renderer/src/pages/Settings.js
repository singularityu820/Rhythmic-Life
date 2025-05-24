import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar } from '@mui/material';
import { useApp } from '../contexts/AppContext';

function Settings() {
  const { state, updateSettings, exportData, importData, clearAllData } = useApp();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '' });

  const handleSettingChange = async (setting) => {
    try {
      await updateSettings(setting);
      setSuccess('设置已更新');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rhythmic-life-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('数据导出成功');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      setSuccess('数据导入成功');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      setSuccess('所有数据已清除');
      setConfirmDialog({ open: false, type: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        设置
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              基本设置
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.settings.notificationsEnabled}
                      onChange={(e) => handleSettingChange({ notificationsEnabled: e.target.checked })}
                    />
                  }
                  label="启用通知"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.settings.darkMode}
                      onChange={(e) => handleSettingChange({ darkMode: e.target.checked })}
                    />
                  }
                  label="深色模式"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="每日总结提醒时间"
                  type="time"
                  value={state.settings.dailySummaryTime}
                  onChange={(e) => handleSettingChange({ dailySummaryTime: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              数据管理
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button variant="outlined" color="primary" fullWidth onClick={handleExport}>
                  导出数据
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  component="label"
                >
                  导入数据
                  <input
                    type="file"
                    hidden
                    accept=".json"
                    onChange={handleImport}
                  />
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => setConfirmDialog({ open: true, type: 'clear' })}
                >
                  清除所有数据
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: '' })}
      >
        <DialogTitle>确认操作</DialogTitle>
        <DialogContent>
          <Typography>
            确定要清除所有数据吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: '' })}>
            取消
          </Button>
          <Button onClick={handleClearData} color="error">
            确认清除
          </Button>
        </DialogActions>
      </Dialog>

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
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings; 