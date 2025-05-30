import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Visibility,
  Refresh,
  Assignment,
  FilterList,
  Download,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { apiService } from '../services/api';
import { Order, OrderStatus, OrderType } from '../types';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  // Фильтры
  const [filters, setFilters] = useState({
    orderStatus: '',
    orderType: '',
    clientId: '',
    driverId: '',
  });

  // Уведомления
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        _start: paginationModel.page * paginationModel.pageSize,
        _end: (paginationModel.page + 1) * paginationModel.pageSize,
        _sort: 'id',
        _order: 'DESC',
      };

      // Добавляем фильтры если они установлены
      if (filters.orderStatus) params.orderStatus = filters.orderStatus;
      if (filters.orderType) params.orderType = filters.orderType;
      if (filters.clientId) params.clientId = filters.clientId;
      if (filters.driverId) params.driverId = filters.driverId;

      const { data, total } = await apiService.getOrders(params);
      setOrders(data);
      setTotalCount(total);
    } catch (error: any) {
      showSnackbar('Ошибка загрузки заказов: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleExportCSV = async () => {
    try {
      // Получаем все данные для экспорта
      const { data } = await apiService.getOrders({ _start: 0, _end: 10000 });
      
      // Подготавливаем данные для экспорта
      const exportData = data.map(order => ({
        ID: order.id,
        'ID клиента': order.clientId,
        'ID водителя': order.driverId || '',
        'Тип заказа': getOrderTypeLabel(order.orderType),
        'Статус': getOrderStatusLabel(order.orderStatus),
        'Откуда': order.from,
        'Куда': order.to,
        'Цена': order.price,
        'Время создания': format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru }),
        'Время начала': order.startTime ? format(new Date(order.startTime), 'dd.MM.yyyy HH:mm', { locale: ru }) : '',
        'Время прибытия': order.arrivalTime ? format(new Date(order.arrivalTime), 'dd.MM.yyyy HH:mm', { locale: ru }) : '',
        'Широта': order.lat || '',
        'Долгота': order.lng || '',
      }));

      const filename = `orders_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      apiService.exportToCSV(exportData, filename);
      showSnackbar('Данные экспортированы успешно', 'success');
    } catch (error: any) {
      showSnackbar('Ошибка экспорта: ' + error.message, 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 100 },
    {
      field: 'orderType',
      headerName: 'Тип',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getOrderTypeLabel(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'orderStatus',
      headerName: 'Статус',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={getOrderStatusLabel(params.value)}
          color={getOrderStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    { field: 'from', headerName: 'Откуда', width: 200 },
    { field: 'to', headerName: 'Куда', width: 200 },
    {
      field: 'price',
      headerName: 'Цена',
      width: 120,
      renderCell: (params) => formatCurrency(params.value),
    },
    { field: 'clientId', headerName: 'ID клиента', width: 120 },
    { field: 'driverId', headerName: 'ID водителя', width: 120 },
    {
      field: 'rating',
      headerName: 'Рейтинг',
      width: 100,
      renderCell: (params) => {
        if (!params.value) return '-';
        return `${params.value}/5`;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Дата создания',
      width: 180,
      renderCell: (params) => {
        return format(new Date(params.value), 'dd.MM.yyyy HH:mm', { locale: ru });
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 100,
      getActions: (params: GridRowParams) => {
        const order = params.row as Order;
        return [
          <GridActionsCellItem
            icon={<Visibility />}
            label="Просмотр"
            onClick={() => {
              navigate(`/order-detail/${order.id}`);
            }}
          />,
        ];
      },
    },
  ];

  const clearFilters = () => {
    setFilters({
      orderStatus: '',
      orderType: '',
      clientId: '',
      driverId: '',
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Assignment color="primary" />
          <Typography variant="h4">Заказы</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
          >
            Экспорт CSV
          </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchOrders}
        >
          Обновить
        </Button>
        </Box>
      </Box>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <FilterList />
          <Typography variant="h6">Фильтры</Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Статус заказа</InputLabel>
            <Select
              value={filters.orderStatus}
              onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value })}
              label="Статус заказа"
            >
              <MenuItem value="">Все</MenuItem>
              {Object.values(OrderStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {getOrderStatusLabel(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Тип заказа</InputLabel>
            <Select
              value={filters.orderType}
              onChange={(e) => setFilters({ ...filters, orderType: e.target.value })}
              label="Тип заказа"
            >
              <MenuItem value="">Все</MenuItem>
              {Object.values(OrderType).map((type) => (
                <MenuItem key={type} value={type}>
                  {getOrderTypeLabel(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="ID клиента"
            value={filters.clientId}
            onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
            sx={{ minWidth: 150 }}
          />

          <TextField
            size="small"
            label="ID водителя"
            value={filters.driverId}
            onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
            sx={{ minWidth: 150 }}
          />

          <Button variant="outlined" onClick={clearFilters}>
            Очистить фильтры
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={orders}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={totalCount}
          loading={loading}
          paginationMode="server"
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
        />
      </Paper>

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

export default Orders; 