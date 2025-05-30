import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  ArrowBack,
  Block,
  CheckCircle,
  Phone,
  Person,
  DirectionsCar,
  Assignment,
  Visibility,
  AttachMoney,
  CalendarToday,
} from '@mui/icons-material';
import { User, Order, OrderFilters } from '../types';
import { apiService } from '../services/api';
import { AdvancedFilters } from '../components/AdvancedFilters';
import { BlockUserDialog } from '../components/BlockUserDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Определяем тип пользователя из пути URL
  const userType: 'client' | 'driver' = location.pathname.includes('/clients/') ? 'client' : 'driver';
  
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({});

  const fetchUser = useCallback(async () => {
    if (!userId || !userType) return;
    
    try {
      setLoading(true);
      const userData = userType === 'client' 
        ? await apiService.getClient(userId)
        : await apiService.getDriver(userId);
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки пользователя');
    } finally {
      setLoading(false);
    }
  }, [userId, userType]);

  const fetchOrders = useCallback(async () => {
    if (!userId || !userType) return;
    
    try {
      setOrdersLoading(true);
      const response = await apiService.getUserOrders(userId, userType, {
        ...filters,
        _start: page * rowsPerPage,
        _end: (page + 1) * rowsPerPage,
        _sort: 'createdAt',
        _order: 'DESC',
      });
      setOrders(response.data);
      setTotalOrders(response.total);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [userId, userType, page, rowsPerPage, filters]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleBlockUser = async (userId: string, reason: string, blockedUntil?: string) => {
    try {
      await apiService.blockUser({
        userId,
        reason,
        blockedUntil,
      });
      await fetchUser(); // Обновляем данные пользователя
    } catch (err: any) {
      setError(err.message || 'Ошибка блокировки пользователя');
    }
  };

  const handleUnblockUser = async () => {
    if (!user) return;
    
    try {
      await apiService.unblockUser(user.id);
      await fetchUser(); // Обновляем данные пользователя
    } catch (err: any) {
      setError(err.message || 'Ошибка разблокировки пользователя');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'CREATED': case 'STARTED': case 'WAITING': case 'ONGOING': return 'primary';
      case 'REJECTED': case 'REJECTED_BY_CLIENT': case 'REJECTED_BY_DRIVER': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TAXI': return 'info';
      case 'DELIVERY': return 'warning';
      case 'CARGO': return 'secondary';
      case 'INTERCITY_TAXI': return 'primary';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getOrderStats = () => {
    const userOrders = userType === 'client' 
      ? user?.orders || [] 
      : user?.orders_as_driver || [];
    
    const completed = userOrders.filter(o => o.orderStatus === 'COMPLETED').length;
    const active = userOrders.filter(o => 
      ['CREATED', 'STARTED', 'WAITING', 'ONGOING'].includes(o.orderStatus)
    ).length;
    const rejected = userOrders.filter(o => 
      ['REJECTED', 'REJECTED_BY_CLIENT', 'REJECTED_BY_DRIVER'].includes(o.orderStatus)
    ).length;
    const totalRevenue = userOrders
      .filter(o => o.orderStatus === 'COMPLETED')
      .reduce((sum, o) => sum + o.price, 0);

    return { completed, active, rejected, total: userOrders.length, totalRevenue };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
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
          {error || 'Пользователь не найден'}
        </Alert>
      </Box>
    );
  }

  const orderStats = getOrderStats();

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
          {userType === 'client' ? 'Клиент' : 'Водитель'}: {user.firstName} {user.lastName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {user.isBlocked ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleUnblockUser}
            >
              Разблокировать
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<Block />}
              onClick={() => setBlockDialogOpen(true)}
            >
              Заблокировать
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Информация о пользователе */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                {userType === 'client' ? <Person /> : <DirectionsCar />}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.middleName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Phone sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">{user.phone}</Typography>
                </Box>
              </Box>
            </Box>

            {user.isBlocked && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Пользователь заблокирован
                {user.blockedUntil && (
                  <>
                    <br />
                    До: {new Date(user.blockedUntil).toLocaleDateString('ru-RU')}
                  </>
                )}
                {user.blockReason && (
                  <>
                    <br />
                    Причина: {user.blockReason}
                  </>
                )}
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Статус: 
              <Chip 
                label={user.isBlocked ? 'Заблокирован' : 'Активен'} 
                color={user.isBlocked ? 'error' : 'success'}
                size="small"
                sx={{ ml: 1 }}
              />
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Регистрация: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
            </Typography>

            {userType === 'driver' && user.categoryLicenses && user.categoryLicenses.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Лицензии:
                </Typography>
                {user.categoryLicenses.map((license) => (
                  <Chip
                    key={license.id}
                    label={license.categoryType}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Статистика заказов */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4">{orderStats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всего заказов
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4">{orderStats.completed}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Завершено
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CalendarToday sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4">{orderStats.active}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Активные
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6">{formatCurrency(orderStats.totalRevenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Выручка
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Вкладки */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            label={
              <Badge badgeContent={totalOrders} color="primary">
                История заказов
              </Badge>
            } 
          />
          {userType === 'driver' && (
            <Tab label="Транспорт" />
          )}
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Фильтры для заказов */}
          <AdvancedFilters
            type="orders"
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters as OrderFilters);
              setPage(0);
            }}
            onClearFilters={() => {
              setFilters({});
              setPage(0);
            }}
          />

          {/* Таблица заказов */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Маршрут</TableCell>
                  <TableCell>Цена</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Заказов не найдено
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.orderType}
                          color={getTypeColor(order.orderType) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.orderStatus}
                          color={getStatusColor(order.orderStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.from} → {order.to}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatCurrency(order.price)}</TableCell>
                      <TableCell>
                        <Tooltip title="Просмотр заказа">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalOrders}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Строк на странице:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} из ${count !== -1 ? count : `более ${to}`}`
              }
            />
          </TableContainer>
        </TabPanel>

        {userType === 'driver' && (
          <TabPanel value={tabValue} index={1}>
            {user.categoryLicenses && user.categoryLicenses.length > 0 ? (
              <Grid container spacing={2}>
                {user.categoryLicenses.map((license) => (
                  <Grid size={{ xs: 12, md: 6 }} key={license.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {license.categoryType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Марка:</strong> {license.brand}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Модель:</strong> {license.model}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Номер:</strong> {license.number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Цвет:</strong> {license.color}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>SSN:</strong> {license.SSN}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Дата регистрации:</strong> {' '}
                          {new Date(license.createdAt).toLocaleDateString('ru-RU')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                У водителя нет зарегистрированного транспорта
              </Alert>
            )}
          </TabPanel>
        )}
      </Box>

      {/* Диалог блокировки */}
      <BlockUserDialog
        open={blockDialogOpen}
        user={user}
        onClose={() => setBlockDialogOpen(false)}
        onConfirm={handleBlockUser}
      />
    </Box>
  );
};

export default UserDetail; 