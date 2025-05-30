import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  CheckCircle,
  Visibility,
  Refresh,
  DirectionsCar,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { apiService } from '../services/api';
import { User, OrderType } from '../types';

const Drivers: React.FC = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
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

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, total } = await apiService.getDrivers({
        _start: paginationModel.page * paginationModel.pageSize,
        _end: (paginationModel.page + 1) * paginationModel.pageSize,
        _sort: 'id',
        _order: 'DESC',
      });
      setDrivers(data);
      setTotalCount(total);
    } catch (error: any) {
      showSnackbar('Ошибка загрузки водителей: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleUnblockUser = useCallback(async (user: User) => {
    try {
      await apiService.unblockUser(user.id);
      showSnackbar(`Водитель ${user.firstName} ${user.lastName} разблокирован`, 'success');
      fetchDrivers();
    } catch (error: any) {
      showSnackbar('Ошибка разблокировки: ' + error.message, 'error');
    }
  }, [fetchDrivers]);

  const getOrderTypeLabel = useCallback((type: OrderType) => {
    const labels = {
      [OrderType.TAXI]: 'Такси',
      [OrderType.DELIVERY]: 'Доставка',
      [OrderType.INTERCITY_TAXI]: 'Межгород',
      [OrderType.CARGO]: 'Грузоперевозки',
    };
    return labels[type] || type;
  }, []);

  const columns: GridColDef[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'phone', headerName: 'Телефон', width: 150 },
    { field: 'firstName', headerName: 'Имя', width: 150 },
    { field: 'lastName', headerName: 'Фамилия', width: 150 },
    {
      field: 'isBlocked',
      headerName: 'Статус',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Заблокирован' : 'Активен'}
          color={params.value ? 'error' : 'success'}
          size="small"
        />
      ),
    },
    {
      field: 'categoryLicenses',
      headerName: 'Категории',
      width: 200,
      renderCell: (params) => {
        const licenses = params.value || [];
        if (licenses.length === 0) return 'Нет лицензий';
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {licenses.map((license: any, index: number) => (
              <Chip
                key={index}
                label={getOrderTypeLabel(license.categoryType)}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'orders_as_driver',
      headerName: 'Заказов выполнено',
      width: 150,
      renderCell: (params) => {
        const orders = params.value || [];
        const completedOrders = orders.filter((order: any) => order.orderStatus === 'COMPLETED');
        return completedOrders.length;
      },
    },
    {
      field: 'blockedUntil',
      headerName: 'Заблокирован до',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        return format(new Date(params.value), 'dd.MM.yyyy HH:mm', { locale: ru });
      },
    },
    {
      field: 'createdAt',
      headerName: 'Дата регистрации',
      width: 180,
      renderCell: (params) => {
        return format(new Date(params.value), 'dd.MM.yyyy HH:mm', { locale: ru });
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 150,
      getActions: (params: GridRowParams) => {
        const driver = params.row as User;
        const actions = [
          <GridActionsCellItem
            icon={<Visibility />}
            label="Просмотр"
            onClick={() => {
              navigate(`/driver-detail/${driver.id}`);
            }}
          />,
        ];

        if (driver.isBlocked) {
          actions.push(
            <GridActionsCellItem
              icon={<CheckCircle />}
              label="Разблокировать"
              onClick={() => handleUnblockUser(driver)}
            />
          );
        }

        return actions;
      },
    },
  ], [getOrderTypeLabel, handleUnblockUser, navigate]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <DirectionsCar color="primary" />
          <Typography variant="h4">Водители</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDrivers}
        >
          Обновить
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={drivers}
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

export default Drivers; 