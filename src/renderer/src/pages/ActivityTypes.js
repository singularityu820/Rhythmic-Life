import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Alert, Snackbar } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useApp } from '../contexts/AppContext';

function ActivityTypes() {
  const { state, addActivityType, updateActivityType, deleteActivityType } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    colorCode: '#000000'
  });
  const [editingType, setEditingType] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('请输入类型名称');
      return false;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(formData.colorCode)) {
      setError('请输入有效的颜色代码（例如：#FF0000）');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingType) {
        await updateActivityType({
          id: editingType.id,
          name: formData.name,
          colorCode: formData.colorCode
        });
        setSuccess('活动类型已更新');
      } else {
        await addActivityType({
          name: formData.name,
          colorCode: formData.colorCode
        });
        setSuccess('活动类型已添加');
      }

      setFormData({
        name: '',
        colorCode: '#000000'
      });
      setEditingType(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (type) => {
    setFormData({
      name: type.name,
      colorCode: type.colorCode
    });
    setEditingType(type);
  };

  const handleDelete = async (id) => {
    try {
      await deleteActivityType(id);
      setSuccess('活动类型已删除');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      colorCode: '#000000'
    });
    setEditingType(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        活动类型管理
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {editingType ? '编辑活动类型' : '新建活动类型'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="类型名称"
                  variant="outlined"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="颜色代码"
                  variant="outlined"
                  value={formData.colorCode}
                  onChange={handleInputChange('colorCode')}
                  placeholder="#000000"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  sx={{ mr: 1 }}
                >
                  {editingType ? '更新' : '添加'}
                </Button>
                {editingType && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleCancel}
                  >
                    取消
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              现有活动类型
            </Typography>
            <List>
              {state.activityTypes.map((type) => (
                <ListItem
                  key={type.id}
                  sx={{
                    borderLeft: `4px solid ${type.colorCode}`,
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <ListItemText
                    primary={type.name}
                    secondary={`颜色：${type.colorCode}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEdit(type)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(type.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
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

export default ActivityTypes; 