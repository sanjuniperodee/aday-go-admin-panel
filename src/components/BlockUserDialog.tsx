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
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  SelectChangeEvent,
} from '@mui/material';
import { BlockUserDialogProps } from '../types';

type DurationType = 'quick' | 'custom' | 'permanent';
type TimeUnit = 'hours' | 'days' | 'weeks' | 'months';

export const BlockUserDialog: React.FC<BlockUserDialogProps> = ({
  open,
  user,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [quickReason, setQuickReason] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('quick');
  const [customDuration, setCustomDuration] = useState(1);
  const [customUnit, setCustomUnit] = useState<TimeUnit>('hours');
  const [customDateTime, setCustomDateTime] = useState('');
  const [selectedQuickDuration, setSelectedQuickDuration] = useState('');

  const quickReasons = [
    'Нарушение правил платформы',
    'Подозрительная активность', 
    'Спам или мошенничество',
    'Неприемлемое поведение',
    'Технические проблемы',
    'Жалобы пользователей',
    'Нарушение ПДД',
    'Другое',
  ];

  const quickDurations = [
    { label: '1 час', value: '1h', hours: 1 },
    { label: '3 часа', value: '3h', hours: 3 },
    { label: '6 часов', value: '6h', hours: 6 },
    { label: '12 часов', value: '12h', hours: 12 },
    { label: '1 день', value: '1d', hours: 24 },
    { label: '3 дня', value: '3d', hours: 72 },
    { label: '1 неделя', value: '1w', hours: 168 },
    { label: '2 недели', value: '2w', hours: 336 },
    { label: '1 месяц', value: '1m', hours: 720 },
  ];

  const timeUnits = [
    { value: 'hours', label: 'часов' },
    { value: 'days', label: 'дней' },
    { value: 'weeks', label: 'недель' },
    { value: 'months', label: 'месяцев' },
  ];

  const calculateBlockedUntil = (): string | undefined => {
    if (durationType === 'permanent') {
      return undefined;
    }

    if (durationType === 'custom' && customDateTime) {
      return new Date(customDateTime).toISOString();
    }

    if (durationType === 'quick' && selectedQuickDuration) {
      const duration = quickDurations.find(d => d.value === selectedQuickDuration);
      if (duration) {
        const now = new Date();
        now.setHours(now.getHours() + duration.hours);
        return now.toISOString();
      }
    }

    if (durationType === 'custom' && customDuration > 0) {
      const now = new Date();
      switch (customUnit) {
        case 'hours':
          now.setHours(now.getHours() + customDuration);
          break;
        case 'days':
          now.setDate(now.getDate() + customDuration);
          break;
        case 'weeks':
          now.setDate(now.getDate() + (customDuration * 7));
          break;
        case 'months':
          now.setMonth(now.getMonth() + customDuration);
          break;
      }
      return now.toISOString();
    }

    return undefined;
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      return;
    }
    
    const blockedUntil = calculateBlockedUntil();
    onConfirm(user!.id, reason, blockedUntil);
    handleClose();
  };

  const handleClose = () => {
    setReason('');
    setQuickReason('');
    setDurationType('quick');
    setCustomDuration(1);
    setCustomUnit('hours');
    setCustomDateTime('');
    setSelectedQuickDuration('');
    onClose();
  };

  const handleQuickReasonChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setQuickReason(value);
    if (value === 'Другое') {
      setReason('');
    } else {
      setReason(value);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Минимум на 1 минуту вперед
    return now.toISOString().slice(0, 16);
  };

  const formatPreviewTime = () => {
    const blockedUntil = calculateBlockedUntil();
    if (!blockedUntil) {
      return 'Бессрочно';
    }
    return new Date(blockedUntil).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Блокировка пользователя
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Пользователь: <strong>{user.firstName} {user.lastName}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Телефон: {user.phone}
          </Typography>
        </Box>

        {user.isBlocked && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Пользователь уже заблокирован
            {user.blockedUntil && (
              <>
                {' '}до {new Date(user.blockedUntil).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Быстрый выбор причины</InputLabel>
              <Select
                value={quickReason}
                onChange={handleQuickReasonChange}
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
              rows={4}
              label="Причина блокировки"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
              required
              helperText="Обязательное поле"
              sx={{ mb: 3 }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Срок блокировки</FormLabel>
              <RadioGroup
                value={durationType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationType(e.target.value as DurationType)}
              >
                <FormControlLabel
                  value="quick"
                  control={<Radio />}
                  label="Быстрый выбор"
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="Указать срок"
                />
                <FormControlLabel
                  value="permanent"
                  control={<Radio />}
                  label="Навсегда"
                />
              </RadioGroup>
            </FormControl>

            {durationType === 'quick' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Выберите период:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {quickDurations.map((duration) => (
                    <Chip
                      key={duration.value}
                      label={duration.label}
                      variant={selectedQuickDuration === duration.value ? 'filled' : 'outlined'}
                      color={selectedQuickDuration === duration.value ? 'primary' : 'default'}
                      onClick={() => setSelectedQuickDuration(duration.value)}
                      clickable
                    />
                  ))}
                </Box>
              </Box>
            )}

            {durationType === 'custom' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Укажите срок:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    type="number"
                    label="Количество"
                    value={customDuration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1, max: 999 }}
                    sx={{ flex: 1 }}
                  />
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Единица времени</InputLabel>
                    <Select
                      value={customUnit}
                      onChange={(e: SelectChangeEvent) => setCustomUnit(e.target.value as TimeUnit)}
                    >
                      {timeUnits.map((unit) => (
                        <MenuItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Или выберите точную дату и время:
                </Typography>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Заблокировать до"
                  value={customDateTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomDateTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: getMinDateTime() }}
                />
              </Box>
            )}

            {durationType === 'permanent' && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Пользователь будет заблокирован навсегда
              </Alert>
            )}

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary">
                Блокировка до: {formatPreviewTime()}
              </Typography>
            </Box>
          </Box>
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
          disabled={!reason.trim() || (durationType === 'quick' && !selectedQuickDuration)}
        >
          {user.isBlocked ? 'Обновить блокировку' : 'Заблокировать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 