import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
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
  Download,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { apiService } from '../services/api';
import { Order, OrderStatus, OrderType, OrderFilters } from '../types';
import { AdvancedFilters } from '../components/AdvancedFilters';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  // Расширенные фильтры
  const [filters, setFilters] = useState<OrderFilters>({});

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
      const { data, total } = await apiService.getOrders({
        ...filters,
        _start: paginationModel.page * paginationModel.pageSize,
        _end: (paginationModel.page + 1) * paginationModel.pageSize,
        _sort: 'createdAt',
        _order: 'DESC',
      });
      setOrders(data);
      setTotalCount(total);
    } catch (error: any) {
      showSnackbar('Ошибка загрузки заказов: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel, filters, showSnackbar]);

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
      // Получаем данные с текущими фильтрами для экспорта
      const { data } = await apiService.getOrders({ 
        ...filters,
        _start: 0, 
        _end: 10000 
      });
      
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

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setPaginationModel({ ...paginationModel, page: 0 }); // Сбрасываем на первую страницу
  };

  const handleClearFilters = () => {
    setFilters({});
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const columns: GridColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value.substring(0, 8)}...</span>
        </Tooltip>
      )
    },
    {
      field: 'orderType',
      headerName: 'Тип',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getOrderTypeLabel(params.value)}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: 'orderStatus',
      headerName: 'Статус',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={getOrderStatusLabel(params.value)}
          color={getOrderStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    { 
      field: 'from', 
      headerName: 'Откуда', 
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            display: 'block'
          }}>
            {params.value}
          </span>
        </Tooltip>
      )
    },
    { 
      field: 'to', 
      headerName: 'Куда', 
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            display: 'block'
          }}>
            {params.value}
          </span>
        </Tooltip>
      )
    },
    {
      field: 'price',
      headerName: 'Цена',
      width: 120,
      renderCell: (params) => formatCurrency(params.value),
    },
    {
      field: 'clientId',
      headerName: 'Клиент',
      width: 100,
      renderCell: (params) => {
        if (!params.value) return '-';
        return (
          <Tooltip title={params.value}>
            <span>{params.value.substring(0, 8)}...</span>
          </Tooltip>
        );
      },
    },
    {
      field: 'driverId',
      headerName: 'Водитель',
      width: 100,
      renderCell: (params) => {
        if (!params.value) return '-';
        return (
          <Tooltip title={params.value}>
            <span>{params.value.substring(0, 8)}...</span>
          </Tooltip>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Создан',
      width: 130,
      renderCell: (params) => {
        return format(new Date(params.value), 'dd.MM.yyyy HH:mm', { locale: ru });
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 80,
      getActions: (params: GridRowParams) => {
        const order = params.row as Order;
        return [
          <GridActionsCellItem
            icon={<Visibility />}
            label="Просмотр"
            onClick={() => {
              // TODO: Открыть детальную информацию о заказе
              console.log('View order:', order);
            }}
          />,
        ];
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Assignment color="primary" />
          <Typography variant="h4">
            Заказы
            {totalCount > 0 && (
              <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 2 }}>
                ({totalCount})
              </Typography>
            )}
          </Typography>
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

      {/* Расширенные фильтры */}
      <AdvancedFilters
        type="orders"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      <Paper sx={{ height: 600, width: '100%', mt: 2 }}>
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
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
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