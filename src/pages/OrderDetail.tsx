import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  DirectionsCar,
  LocationOn,
  Schedule,
  Payment,
} from '@mui/icons-material';
import { Order, User } from '../types';
import { apiService } from '../services/api';

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('ID заказа не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orderData = await apiService.getOrder(orderId);
        setOrder(orderData as Order);
      } catch (err: any) {
        setError('Ошибка загрузки заказа: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'CREATED': 'info',
      'STARTED': 'primary',
      'WAITING': 'warning',
      'ONGOING': 'warning',
      'COMPLETED': 'success',
      'REJECTED': 'error',
      'REJECTED_BY_CLIENT': 'error',
      'REJECTED_BY_DRIVER': 'error',
      'CANCELLED': 'error',
    };
    return statusColors[status] || 'default';
  };

  const getTypeColor = (type: string) => {
    const typeColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'TAXI': 'primary',
      'DELIVERY': 'secondary',
      'INTERCITY_TAXI': 'info',
      'CARGO': 'success',
    };
    return typeColors[type] || 'default';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/orders')}
          sx={{ mb: 2 }}
        >
          Назад к заказам
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/orders')}
          sx={{ mb: 2 }}
        >
          Назад к заказам
        </Button>
        <Alert severity="warning">Заказ не найден</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок с кнопкой назад */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/orders')}
          sx={{ mr: 2 }}
        >
          Назад к заказам
        </Button>
        <Typography variant="h4" component="h1">
          Заказ #{order.id}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Основная информация о заказе */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Информация о заказе
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={order.orderStatus}
                  color={getStatusColor(order.orderStatus)}
                  size="small"
                />
                <Chip
                  label={order.orderType}
                  color={getTypeColor(order.orderType)}
                  size="small"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <LocationOn color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">Маршрут</Typography>
                    </Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Откуда:</strong> {order.from}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Куда:</strong> {order.to}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Payment color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">Цена</Typography>
                    </Box>
                    <Typography variant="body1" color="primary">
                      <strong>{order.price} ₸</strong>
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Временные метки */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Schedule color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Создан</Typography>
                  </Box>
                  <Typography variant="body2">
                    {formatDateTime(order.createdAt)}
                  </Typography>
                </Grid>

                {order.startTime && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Schedule color="success" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">Начат</Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatDateTime(order.startTime.toString())}
                    </Typography>
                  </Grid>
                )}

                {order.arrivalTime && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Schedule color="warning" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">Прибытие</Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatDateTime(order.arrivalTime.toString())}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Боковая панель */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Информация о клиенте */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Person color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Клиент</Typography>
              </Box>
              {order.client ? (
                <Box>
                  <Typography variant="body1">
                    {order.client.firstName} {order.client.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.client.phone}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate(`/client-detail/${order.client?.id}`)}
                    sx={{ mt: 1 }}
                  >
                    Перейти к профилю
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Информация недоступна
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Информация о водителе */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DirectionsCar color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Водитель</Typography>
              </Box>
              {order.driver ? (
                <Box>
                  <Typography variant="body1">
                    {order.driver.firstName} {order.driver.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.driver.phone}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate(`/driver-detail/${order.driver?.id}`)}
                    sx={{ mt: 1 }}
                  >
                    Перейти к профилю
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Водитель не назначен
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderDetail; 