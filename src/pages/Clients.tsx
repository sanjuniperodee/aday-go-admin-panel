import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
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
  Block,
  CheckCircle,
  Visibility,
  Refresh,
  Download,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { apiService } from '../services/api';
import { User, BlockUserRequest } from '../types';

const Clients: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  // Блокировка пользователя
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('');
  const [blockUntil, setBlockUntil] = useState('');

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
        _start: paginationModel.page * paginationModel.pageSize,
        _end: (paginationModel.page + 1) * paginationModel.pageSize,
        _sort: 'id',
        _order: 'DESC',
      });
      setUsers(data);
      setTotalCount(total);
    } catch (error: any) {
      showSnackbar('Ошибка загрузки клиентов: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, showSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBlockUser = (user: User) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
    setBlockReason('');
    setBlockDuration('');
    setBlockUntil('');
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

  const submitBlockUser = async () => {
    if (!selectedUser || !blockReason) return;

    try {
      const blockData: BlockUserRequest = {
        userId: selectedUser.id,
        reason: blockReason,
      };

      if (blockDuration === 'custom' && blockUntil) {
        blockData.blockedUntil = new Date(blockUntil).toISOString();
      } else if (blockDuration && blockDuration !== 'permanent') {
        const now = new Date();
        const hours = parseInt(blockDuration);
        now.setHours(now.getHours() + hours);
        blockData.blockedUntil = now.toISOString();
      }

      await apiService.blockUser(blockData);
      showSnackbar(`Пользователь ${selectedUser.firstName} ${selectedUser.lastName} заблокирован`, 'success');
      setBlockDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      showSnackbar('Ошибка блокировки: ' + error.message, 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      // Получаем все данные для экспорта
      const { data } = await apiService.getClients({ _start: 0, _end: 10000 });
      
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

  const columns: GridColDef[] = [
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
      field: 'blockedUntil',
      headerName: 'Заблокирован до',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        return format(new Date(params.value), 'dd.MM.yyyy HH:mm', { locale: ru });
      },
    },
    {
      field: 'blockReason',
      headerName: 'Причина блокировки',
      width: 200,
      renderCell: (params) => params.value || '-',
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
        const user = params.row as User;
        const actions = [
          <GridActionsCellItem
            icon={<Visibility />}
            label="Просмотр"
            onClick={() => {
              // TODO: Открыть детальную информацию о пользователе
              console.log('View user:', user);
            }}
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
        <Typography variant="h4">Клиенты</Typography>
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

      <Paper sx={{ height: 600, width: '100%' }}>
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
        />
      </Paper>

      {/* Диалог блокировки пользователя */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Заблокировать пользователя {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Причина блокировки"
            fullWidth
            multiline
            rows={3}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Длительность блокировки</InputLabel>
            <Select
              value={blockDuration}
              onChange={(e) => setBlockDuration(e.target.value)}
              label="Длительность блокировки"
            >
              <MenuItem value="1">1 час</MenuItem>
              <MenuItem value="24">1 день</MenuItem>
              <MenuItem value="168">1 неделя</MenuItem>
              <MenuItem value="720">1 месяц</MenuItem>
              <MenuItem value="custom">Указать дату</MenuItem>
              <MenuItem value="permanent">Постоянно</MenuItem>
            </Select>
          </FormControl>

          {blockDuration === 'custom' && (
            <TextField
              margin="dense"
              label="Заблокировать до"
              type="datetime-local"
              fullWidth
              value={blockUntil}
              onChange={(e) => setBlockUntil(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={submitBlockUser} 
            variant="contained" 
            color="error"
            disabled={!blockReason}
          >
            Заблокировать
          </Button>
        </DialogActions>
      </Dialog>

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