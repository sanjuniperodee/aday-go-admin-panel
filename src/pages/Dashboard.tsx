import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  DirectionsCar,
  Assignment,
  TrendingUp,
  Today,
  CheckCircle,
  Cancel,
  AttachMoney,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { StatsData } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card elevation={3}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            p: 2,
            color: 'white',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiService.getStats();
        setStats(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки статистики');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Нет данных для отображения
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
        Обзор системы управления такси
      </Typography>

      <Grid container spacing={3}>
        {/* Основная статистика */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Всего пользователей"
            value={stats.totalUsers}
            icon={<People />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Водители"
            value={stats.totalDrivers}
            icon={<DirectionsCar />}
            color="#388e3c"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Всего заказов"
            value={stats.totalOrders}
            icon={<Assignment />}
            color="#f57c00"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Выручка"
            value={formatCurrency(stats.revenue)}
            icon={<AttachMoney />}
            color="#7b1fa2"
          />
        </Grid>

        {/* Статистика заказов */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Активные заказы"
            value={stats.activeOrders}
            icon={<TrendingUp />}
            color="#d32f2f"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Завершенные"
            value={stats.completedOrders}
            icon={<CheckCircle />}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Отклоненные"
            value={stats.rejectedOrders}
            icon={<Cancel />}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Заказы сегодня"
            value={stats.todayOrders}
            icon={<Today />}
            color="#0288d1"
          />
        </Grid>

        {/* Дополнительная информация */}
        <Grid size={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Быстрые действия
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Используйте навигацию слева для управления клиентами, водителями и заказами.
              Все основные функции доступны через соответствующие разделы.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 