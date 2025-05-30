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
  Download,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { apiService } from '../services/api';
import { User, UserFilters } from '../types';
import { AdvancedFilters } from '../components/AdvancedFilters';
import { BlockUserDialog } from '../components/BlockUserDialog';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, total } = await apiService.getClients({
        ...filters,
        _start: paginationModel.page * paginationModel.pageSize,
        _end: (paginationModel.page + 1) * paginationModel.pageSize,
        _sort: 'createdAt',
        _order: 'DESC',
      });
      setUsers(data);
      setTotalCount(total);
    } catch (error: any) {
      showSnackbar('Ошибка загрузки клиентов: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, filters, showSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewUser = (user: User) => {
    navigate(`/clients/${user.id}`);
  };

  const handleBlockUser = (user: User) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  const handleUnblockUser = async (user: User) => {
    try {
      await apiService.unblockUser(user.id);
      showSnackbar(`Пользователь ${user.firstName} ${user.lastName} разблокирован`, 'success');
      fetchUsers();
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
      const user = users.find(u => u.id === userId);
      showSnackbar(`Пользователь ${user?.firstName} ${user?.lastName} заблокирован`, 'success');
      setBlockDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      showSnackbar('Ошибка блокировки: ' + error.message, 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      // Получаем данные с текущими фильтрами для экспорта
      const { data } = await apiService.getClients({ 
        ...filters,
        _start: 0, 
        _end: 10000 
      });
      
      // Подготавливаем данные для экспорта
      const exportData = data.map(user => ({
        ID: user.id,
        Телефон: user.phone,
        Имя: user.firstName,
        Фамилия: user.lastName,
        Отчество: user.middleName || '',
        Статус: user.isBlocked ? 'Заблокирован' : 'Активен',
        'Заблокирован до': user.blockedUntil ? format(new Date(user.blockedUntil), 'dd.MM.yyyy HH:mm', { locale: ru }) : '',
        'Причина блокировки': user.blockReason || '',
        'Дата создания': format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru }),
        'Количество заказов': user.orders?.length || 0,
      }));

      const filename = `clients_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
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

  const getOrdersCount = (user: User) => {
    return user.orders?.length || 0;
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
      field: 'orders',
      headerName: 'Заказов',
      width: 100,
      renderCell: (params) => getOrdersCount(params.row),
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
      field: 'blockReason',
      headerName: 'Причина блокировки',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        return (
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
        );
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
        const user = params.row as User;
        const actions = [
          <GridActionsCellItem
            icon={<Visibility />}
            label="Просмотр"
            onClick={() => handleViewUser(user)}
          />,
        ];

        if (user.isBlocked) {
          actions.push(
            <GridActionsCellItem
              icon={<CheckCircle />}
              label="Разблокировать"
              onClick={() => handleUnblockUser(user)}
            />
          );
        } else {
          actions.push(
            <GridActionsCellItem
              icon={<Block />}
              label="Заблокировать"
              onClick={() => handleBlockUser(user)}
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
        <Typography variant="h4">
          Клиенты
          {totalCount > 0 && (
            <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 2 }}>
              ({totalCount})
            </Typography>
          )}
        </Typography>
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
            onClick={fetchUsers}
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
          rows={users}
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

export default Clients; 