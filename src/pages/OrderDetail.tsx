import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Person,
  DirectionsCar,
  AttachMoney,
  AccessTime,
  Assignment,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Order, OrderStatus, OrderType } from '../types';
import { apiService } from '../services/api';

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const orderData = await apiService.getOrder(orderId);
      setOrder(orderData);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки заказа');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const getOrderStatusLabel = (status: OrderStatus) => {
    const labels = {
      [OrderStatus.CREATED]: 'Создан',
      [OrderStatus.STARTED]: 'Начат',
      [OrderStatus.WAITING]: 'Ожидание',
      [OrderStatus.ONGOING]: 'В процессе',
      [OrderStatus.COMPLETED]: 'Завершен',
      [OrderStatus.REJECTED]: 'Отклонен',
      [OrderStatus.REJECTED_BY_CLIENT]: 'Отклонен клиентом',
      [OrderStatus.REJECTED_BY_DRIVER]: 'Отклонен водителем',
    };
    return labels[status] || status;
  };

  const getOrderStatusColor = (status: OrderStatus) => {
    const colors = {
      [OrderStatus.CREATED]: 'info',
      [OrderStatus.STARTED]: 'warning',
      [OrderStatus.WAITING]: 'warning',
      [OrderStatus.ONGOING]: 'primary',
      [OrderStatus.COMPLETED]: 'success',
      [OrderStatus.REJECTED]: 'error',
      [OrderStatus.REJECTED_BY_CLIENT]: 'error',
      [OrderStatus.REJECTED_BY_DRIVER]: 'error',
    };
    return colors[status] || 'default';
  };

  const getOrderTypeLabel = (type: OrderType) => {
    const labels = {
      [OrderType.TAXI]: 'Такси',
      [OrderType.DELIVERY]: 'Доставка',
      [OrderType.INTERCITY_TAXI]: 'Межгород',
      [OrderType.CARGO]: 'Грузоперевозки',
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Назад
        </Button>
        <Alert severity="error">
          {error || 'Заказ не найден'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Заказ #{order.id.substring(0, 8)}...
        </Typography>
        <Chip
          label={getOrderStatusLabel(order.orderStatus)}
          color={getOrderStatusColor(order.orderStatus) as any}
          size="medium"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Основная информация */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Assignment sx={{ mr: 1 }} />
              Информация о заказе
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Тип заказа
                </Typography>
                <Chip
                  label={getOrderTypeLabel(order.orderType)}
                  variant="outlined"
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Цена
                </Typography>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 0.5 }} />
                  {formatCurrency(order.price)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Время создания
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime sx={{ mr: 0.5 }} />
                  {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                </Typography>
              </Grid>
              {order.startTime && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Время начала
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(order.startTime), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </Typography>
                </Grid>
              )}
              {order.arrivalTime && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Время прибытия
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(order.arrivalTime), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Маршрут */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1 }} />
              Маршрут
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Откуда
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {order.from}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Куда
              </Typography>
              <Typography variant="body1">
                {order.to}
              </Typography>
              {(order.lat && order.lng) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Координаты
                  </Typography>
                  <Typography variant="body2">
                    Широта: {order.lat}, Долгота: {order.lng}
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Участники */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Клиент */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} />
                Клиент
              </Typography>
              {order.clientId ? (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    ID клиента
                  </Typography>
                  <Typography variant="body1">
                    {order.clientId}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/clients/${order.clientId}`)}
                    sx={{ mt: 1 }}
                  >
                    Просмотр профиля
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Информация о клиенте недоступна
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Водитель */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsCar sx={{ mr: 1 }} />
                Водитель
              </Typography>
              {order.driverId ? (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    ID водителя
                  </Typography>
                  <Typography variant="body1">
                    {order.driverId}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/drivers/${order.driverId}`)}
                    sx={{ mt: 1 }}
                  >
                    Просмотр профиля
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