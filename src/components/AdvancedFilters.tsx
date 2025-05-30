import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  Paper,
  Chip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';
import { OrderStatus, OrderType, UserFilters, OrderFilters } from '../types';

interface AdvancedFiltersProps {
  type: 'users' | 'orders';
  filters: UserFilters | OrderFilters;
  onFiltersChange: (filters: UserFilters | OrderFilters) => void;
  onClearFilters: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  type,
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (field: string, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  };

  const renderUserFilters = () => {
    const userFilters = filters as UserFilters;
    
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="Телефон"
            value={userFilters.phone || ''}
            onChange={(e) => handleFilterChange('phone', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="Имя"
            value={userFilters.firstName || ''}
            onChange={(e) => handleFilterChange('firstName', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="Фамилия"
            value={userFilters.lastName || ''}
            onChange={(e) => handleFilterChange('lastName', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={userFilters.isBlocked || false}
                onChange={(e) => handleFilterChange('isBlocked', e.target.checked)}
              />
            }
            label="Только заблокированные"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Статус заказа</InputLabel>
            <Select
              value={userFilters.orderStatus || ''}
              onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              {Object.values(OrderStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Тип заказа</InputLabel>
            <Select
              value={userFilters.orderType || ''}
              onChange={(e) => handleFilterChange('orderType', e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              {Object.values(OrderType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Дата от"
            InputLabelProps={{ shrink: true }}
            value={userFilters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Дата до"
            InputLabelProps={{ shrink: true }}
            value={userFilters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Мин. заказов"
            value={userFilters.minOrders || ''}
            onChange={(e) => handleFilterChange('minOrders', parseInt(e.target.value) || undefined)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Макс. заказов"
            value={userFilters.maxOrders || ''}
            onChange={(e) => handleFilterChange('maxOrders', parseInt(e.target.value) || undefined)}
          />
        </Grid>
      </Grid>
    );
  };

  const renderOrderFilters = () => {
    const orderFilters = filters as OrderFilters;
    
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Статус заказа</InputLabel>
            <Select
              value={orderFilters.orderStatus || ''}
              onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              {Object.values(OrderStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Тип заказа</InputLabel>
            <Select
              value={orderFilters.orderType || ''}
              onChange={(e) => handleFilterChange('orderType', e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              {Object.values(OrderType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Дата от"
            InputLabelProps={{ shrink: true }}
            value={orderFilters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Дата до"
            InputLabelProps={{ shrink: true }}
            value={orderFilters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Мин. цена"
            value={orderFilters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value) || undefined)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Макс. цена"
            value={orderFilters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value) || undefined)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="ID клиента"
            value={orderFilters.clientId || ''}
            onChange={(e) => handleFilterChange('clientId', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="ID водителя"
            value={orderFilters.driverId || ''}
            onChange={(e) => handleFilterChange('driverId', e.target.value)}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Paper elevation={1} sx={{ mb: 2 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography variant="h6">
              Расширенные фильтры
            </Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip 
                label={getActiveFiltersCount()} 
                size="small" 
                color="primary" 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: '100%' }}>
            {type === 'users' ? renderUserFilters() : renderOrderFilters()}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={onClearFilters}
                disabled={getActiveFiltersCount() === 0}
              >
                Очистить фильтры
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}; 