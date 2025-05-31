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
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Phone,
  Schedule,
  Assignment,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { User, Order } from '../types';
import { apiService } from '../services/api';
import { BlockUserDialog } from '../components/BlockUserDialog';

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockUserDialogOpen, setBlockUserDialogOpen] = useState(false);
  
  // Уведомления
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleBlockUser = () => {
    setBlockUserDialogOpen(true);
  };

  const handleUnblockUser = async () => {
    if (!client) return;
    
    try {
      await apiService.unblockUser(client.id);
      showSnackbar(`Клиент ${client.firstName} ${client.lastName} разблокирован`, 'success');
      // Обновляем данные клиента
      const clientData = await apiService.getClient(client.id);
      setClient(clientData);
    } catch (error: any) {
      showSnackbar('Ошибка разблокировки: ' + error.message, 'error');
    }
  };

  const handleBlockConfirm = async (userId: string, reason: string, blockedUntil?: string) => {
    try {
      await apiService.blockUser({
        userId,
        reason,
        blockedUntil,
      });
      showSnackbar(`Клиент ${client?.firstName} ${client?.lastName} заблокирован`, 'success');
      // Обновляем данные клиента
      if (client) {
        const clientData = await apiService.getClient(client.id);
        setClient(clientData);
      }
    } catch (error: any) {
      showSnackbar('Ошибка блокировки: ' + error.message, 'error');
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setError('ID клиента не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [clientData, ordersData] = await Promise.all([
          apiService.getClient(clientId),
          apiService.getUserOrders(clientId, 'client')
        ]);
        setClient(clientData);
        setOrders(ordersData.data);
      } catch (err: any) {
        setError('Ошибка загрузки данных клиента: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
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
          onClick={() => navigate('/clients')}
          sx={{ mb: 2 }}
        >
          Назад к клиентам
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/clients')}
          sx={{ mb: 2 }}
        >
          Назад к клиентам
        </Button>
        <Alert severity="warning">Клиент не найден</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок с кнопкой назад */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/clients')}
          sx={{ mr: 2 }}
        >
          Назад к клиентам
        </Button>
        <Typography variant="h4" component="h1">
          Клиент: {client.firstName} {client.lastName}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Основная информация о клиенте */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Информация о клиенте
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={client.isBlocked ? 'Заблокирован' : 'Активен'}
                  color={client.isBlocked ? 'error' : 'success'}
                  size="small"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Person color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">Личные данные</Typography>
                    </Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Имя:</strong> {client.firstName}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Фамилия:</strong> {client.lastName}
                    </Typography>
                    {client.middleName && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Отчество:</strong> {client.middleName}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Phone color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">Контакты</Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>Телефон:</strong> {client.phone}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Временные метки */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Schedule color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Дата регистрации</Typography>
                  </Box>
                  <Typography variant="body2">
                    {formatDateTime(client.createdAt)}
                  </Typography>
                </Grid>

                {client.blockedUntil && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Block color="error" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">Заблокирован до</Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatDateTime(client.blockedUntil.toString())}
                    </Typography>
                    {client.blockReason && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Причина:</strong> {client.blockReason}
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* История заказов */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                История заказов ({orders.length})
              </Typography>
              {orders.length > 0 ? (
                <Box>
                  {orders.slice(0, 10).map((order) => (
                    <Paper 
                      key={order.id} 
                      elevation={1} 
                      sx={{ p: 2, mb: 2, cursor: 'pointer' }}
                      onClick={() => navigate(`/order-detail/${order.id}`)}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Typography variant="body2">
                            <strong>Заказ #{order.id}</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(order.createdAt)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Chip
                            label={order.orderStatus}
                            size="small"
                            color={order.orderStatus === 'COMPLETED' ? 'success' : 'default'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Typography variant="body2">
                            {order.price} ₸
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Typography variant="body2" noWrap>
                            {order.from} → {order.to}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  {orders.length > 10 && (
                    <Typography variant="body2" color="text.secondary" align="center">
                      Показаны первые 10 заказов из {orders.length}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  У клиента нет заказов
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Боковая панель */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Статистика */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Статистика</Typography>
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>Всего заказов:</strong> {orders.length}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Завершенных:</strong> {orders.filter(o => o.orderStatus === 'COMPLETED').length}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Отмененных:</strong> {orders.filter(o => o.orderStatus.includes('REJECTED')).length}
              </Typography>
              <Typography variant="body1">
                <strong>Общая сумма:</strong> {orders.reduce((sum, o) => sum + o.price, 0)} ₸
              </Typography>
            </CardContent>
          </Card>

          {/* Действия */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Действия
              </Typography>
              {client.isBlocked ? (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<CheckCircle />}
                  onClick={handleUnblockUser}
                >
                  Разблокировать
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  startIcon={<Block />}
                  onClick={handleBlockUser}
                >
                  Заблокировать
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Диалог блокировки пользователя */}
      <BlockUserDialog
        open={blockUserDialogOpen}
        user={client}
        onClose={() => setBlockUserDialogOpen(false)}
        onConfirm={handleBlockConfirm}
      />

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientDetail; 