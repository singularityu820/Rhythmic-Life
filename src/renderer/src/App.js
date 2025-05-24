import React, { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider, useApp } from './contexts/AppContext';
import Layout from './components/Layout';

// 导入页面组件
import Dashboard from './pages/Dashboard';
import ActivityRecord from './pages/ActivityRecord';
import ActivityTypes from './pages/ActivityTypes';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import AISchedule from './pages/AISchedule';
import HabitAnalysis from './pages/HabitAnalysis';

function AppContent() {
  const { state, updateSettings } = useApp();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: state.settings.darkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          background: {
            default: state.settings.darkMode ? '#121212' : '#f5f5f5',
            paper: state.settings.darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      }),
    [state.settings.darkMode],
  );

  const handleThemeChange = (newMode) => {
    updateSettings({ darkMode: newMode === 'dark' });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout onThemeChange={handleThemeChange}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/record" element={<ActivityRecord />} />
          <Route path="/types" element={<ActivityTypes />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-schedule" element={<AISchedule />} />
          <Route path="/habits" element={<HabitAnalysis />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App; 