import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { PhoneOutlined, SmsOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [smscode, setSmscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const { login, authError, clearAuthError } = useAuth();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    clearAuthError();
    setLoading(true);

    try {
      const response = await apiService.sendSMSCode({ phone });
      setActiveStep(1);
      setSuccessMessage('SMS код отправлен на ваш телефон');
      
      // В режиме разработки показываем код (если он возвращается)
      if (response.smscode) {
        setSuccessMessage(`SMS код отправлен: ${response.smscode}`);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearAuthError();
    setLoading(true);

    try {
      await login(phone, smscode);
      // Авторизация успешна, AuthContext автоматически обновит состояние
    } catch (err: any) {
      setError(err.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setActiveStep(0);
    setSmscode('');
    setError('');
    setSuccessMessage('');
    clearAuthError();
  };

  // Показываем ошибки из AuthContext
  const displayError = error || authError;

  const steps = ['Введите номер телефона', 'Введите SMS код'];

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              p: 1,
              mb: 2,
            }}
          >
            {activeStep === 0 ? (
              <PhoneOutlined sx={{ color: 'white' }} />
            ) : (
              <SmsOutlined sx={{ color: 'white' }} />
            )}
          </Box>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Админ панель такси
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Авторизация по SMS
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {displayError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {displayError}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {activeStep === 0 ? (
            <Box component="form" onSubmit={handleSendCode} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="phone"
                label="Номер телефона"
                name="phone"
                autoComplete="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                placeholder="+7 (XXX) XXX-XX-XX"
                helperText="Введите номер телефона в международном формате"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !phone.trim()}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Отправить SMS код'}
              </Button>
              
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1, width: '100%' }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  <strong>Демо доступ:</strong><br />
                  Телефон: +77771234567admin<br />
                  (любой номер содержащий "admin")
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleConfirmCode} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="smscode"
                label="SMS код"
                name="smscode"
                autoComplete="one-time-code"
                autoFocus
                value={smscode}
                onChange={(e) => setSmscode(e.target.value)}
                disabled={loading}
                placeholder="XXXX"
                helperText="Введите код из SMS сообщения"
                inputProps={{ maxLength: 6 }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 3, mb: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoBack}
                  disabled={loading}
                  size="large"
                >
                  Назад
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !smscode.trim()}
                  size="large"
                >
                  {loading ? <CircularProgress size={24} /> : 'Войти'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 