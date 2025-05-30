import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { BlockUserDialogProps } from '../types';

export const BlockUserDialog: React.FC<BlockUserDialogProps> = ({
  open,
  user,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [blockedUntil, setBlockedUntil] = useState('');
  const [quickReason, setQuickReason] = useState('');

  const quickReasons = [
    'Нарушение правил платформы',
    'Подозрительная активность',
    'Спам или мошенничество',
    'Неприемлемое поведение',
    'Технические проблемы',
    'Другое',
  ];

  const handleSubmit = () => {
    if (!reason.trim()) {
      return;
    }
    
    onConfirm(user!.id, reason, blockedUntil || undefined);
    handleClose();
  };

  const handleClose = () => {
    setReason('');
    setBlockedUntil('');
    setQuickReason('');
    onClose();
  };

  const handleQuickReasonChange = (value: string) => {
    setQuickReason(value);
    if (value === 'Другое') {
      setReason('');
    } else {
      setReason(value);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getNextWeekDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Блокировка пользователя
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Пользователь: <strong>{user.firstName} {user.lastName}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Телефон: {user.phone}
          </Typography>
        </Box>

        {user.isBlocked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Пользователь уже заблокирован
            {user.blockedUntil && (
              <>
                {' '}до {new Date(user.blockedUntil).toLocaleDateString('ru-RU')}
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

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Быстрый выбор причины</InputLabel>
          <Select
            value={quickReason}
            onChange={(e) => handleQuickReasonChange(e.target.value)}
          >
            {quickReasons.map((reason) => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Причина блокировки"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mb: 2 }}
          required
          helperText="Обязательное поле"
        />

        <TextField
          fullWidth
          type="date"
          label="Заблокировать до (необязательно)"
          value={blockedUntil}
          onChange={(e) => setBlockedUntil(e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="Оставьте пустым для бессрочной блокировки"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setBlockedUntil(getTomorrowDate())}
          >
            До завтра
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setBlockedUntil(getNextWeekDate())}
          >
            На неделю
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={!reason.trim()}
        >
          {user.isBlocked ? 'Обновить блокировку' : 'Заблокировать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 