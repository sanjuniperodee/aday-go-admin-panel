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
  Tooltip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Block,
  CheckCircle,
  Visibility,
  Refresh,
  DirectionsCar,
  Download,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { apiService } from '../services/api';
import { User, OrderType, UserFilters } from '../types';
import { AdvancedFilters } from '../components/AdvancedFilters';
import { BlockUserDialog } from '../components/BlockUserDialog';

const Drivers: React.FC = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [filters, setFilters] = useState<UserFilters>({});

  // Блокировка пользователя
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
        ...filters,
        _start: paginationModel.page * paginationModel.pageSize,
        _end: (paginationModel.page + 1) * paginationModel.pageSize,
        _sort: 'createdAt',
        _order: 'DESC',
      });
      setDrivers(data);
      setTotalCount(total);
    } catch (error: any) {
      showSnackbar('Ошибка загрузки водителей: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, filters, showSnackbar]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleViewUser = (user: User) => {
    navigate(`/drivers/${user.id}`);
  };

  const handleBlockUser = (user: User) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  const handleUnblockUser = async (user: User) => {
    try {
      await apiService.unblockUser(user.id);
      showSnackbar(`Водитель ${user.firstName} ${user.lastName} разблокирован`, 'success');
      fetchDrivers();
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
      const user = drivers.find(u => u.id === userId);
      showSnackbar(`Водитель ${user?.firstName} ${user?.lastName} заблокирован`, 'success');
      setBlockDialogOpen(false);
      fetchDrivers();
    } catch (error: any) {
      showSnackbar('Ошибка блокировки: ' + error.message, 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      // Получаем данные с текущими фильтрами для экспорта
      const { data } = await apiService.getDrivers({ 
        ...filters,
        _start: 0, 
        _end: 10000 
      });
      
      // Подготавливаем данные для экспорта
      const exportData = data.map(driver => ({
        ID: driver.id,
        Телефон: driver.phone,
        Имя: driver.firstName,
        Фамилия: driver.lastName,
        Отчество: driver.middleName || '',
        Статус: driver.isBlocked ? 'Заблокирован' : 'Активен',
        'Заблокирован до': driver.blockedUntil ? format(new Date(driver.blockedUntil), 'dd.MM.yyyy HH:mm', { locale: ru }) : '',
        'Причина блокировки': driver.blockReason || '',
        'Дата создания': format(new Date(driver.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru }),
        'Количество заказов': driver.orders_as_driver?.length || 0,
        'Завершенных заказов': driver.orders_as_driver?.filter(o => o.orderStatus === 'COMPLETED').length || 0,
        'Категории лицензий': driver.categoryLicenses?.map(l => l.categoryType).join(', ') || '',
      }));

      const filename = `drivers_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      apiService.exportToCSV(exportData, filename);
      showSnackbar('Данные экспортированы успешно', 'success');
    } catch (error: any) {
      showSnackbar('Ошибка экспорта: ' + error.message, 'error');
    }
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
    setPaginationModel({ ...paginationModel, page: 0 }); // Сбрасываем на первую страницу
  };

  const handleClearFilters = () => {
    setFilters({});
    setPaginationModel({ ...paginationModel, page: 0 });
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

  const getOrdersCount = (driver: User) => {
    return driver.orders_as_driver?.length || 0;
  };

  const getCompletedOrdersCount = (driver: User) => {
    return driver.orders_as_driver?.filter(order => order.orderStatus === 'COMPLETED').length || 0;
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
    { field: 'phone', headerName: 'Телефон', width: 150 },
    { field: 'firstName', headerName: 'Имя', width: 130 },
    { field: 'lastName', headerName: 'Фамилия', width: 130 },
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
      width: 180,
      renderCell: (params) => {
        const licenses = params.value || [];
        if (licenses.length === 0) return 'Нет лицензий';
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {licenses.slice(0, 2).map((license: any, index: number) => (
              <Chip
                key={index}
                label={getOrderTypeLabel(license.categoryType)}
                size="small"
                variant="outlined"
              />
            ))}
            {licenses.length > 2 && (
              <Tooltip title={licenses.slice(2).map((l: any) => getOrderTypeLabel(l.categoryType)).join(', ')}>
                <Chip
                  label={`+${licenses.length - 2}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: 'orders_as_driver',
      headerName: 'Всего заказов',
      width: 110,
      renderCell: (params) => getOrdersCount(params.row),
    },
    {
      field: 'completed_orders',
      headerName: 'Завершено',
      width: 100,
      renderCell: (params) => getCompletedOrdersCount(params.row),
    },
    {
      field: 'blockedUntil',
      headerName: 'Заблокирован до',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return '-';
        return format(new Date(params.value), 'dd.MM.yyyy', { locale: ru });
      },
    },
    {
      field: 'createdAt',
      headerName: 'Дата регистрации',
      width: 150,
      renderCell: (params) => {
        return format(new Date(params.value), 'dd.MM.yyyy', { locale: ru });
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 120,
      getActions: (params: GridRowParams) => {
        const driver = params.row as User;
        const actions = [
          <GridActionsCellItem
            icon={<Visibility />}
            label="Просмотр"
            onClick={() => handleViewUser(driver)}
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
        } else {
          actions.push(
            <GridActionsCellItem
              icon={<Block />}
              label="Заблокировать"
              onClick={() => handleBlockUser(driver)}
            />
          );
        }

        return actions;
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <DirectionsCar color="primary" />
          <Typography variant="h4">
            Водители
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
            onClick={fetchDrivers}
          >
            Обновить
          </Button>
        </Box>
      </Box>

      {/* Расширенные фильтры */}
      <AdvancedFilters
        type="users"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      <Paper sx={{ height: 600, width: '100%', mt: 2 }}>
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
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>

      {/* Диалог блокировки пользователя */}
      <BlockUserDialog
        open={blockDialogOpen}
        user={selectedUser}
        onClose={() => setBlockDialogOpen(false)}
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

export default Drivers; 