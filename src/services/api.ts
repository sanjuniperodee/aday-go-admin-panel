import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, Order, BlockUserRequest, StatsData, AdminAuth, AdminSMSRequest, AdminSMSConfirm } from '../types';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private retryCount = new Map<string, number>();

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Загружаем токен из localStorage
    this.token = localStorage.getItem('adminToken');
    if (this.token) {
      this.setAuthHeader(this.token);
    }

    // Улучшенный интерцептор для обработки ответов
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401) {
          // Создаем уникальный ключ для запроса
          const requestKey = `${originalRequest.method}-${originalRequest.url}`;
          const currentRetryCount = this.retryCount.get(requestKey) || 0;
          
          // Если это первая попытка, добавляем более детальную информацию об ошибке
          if (currentRetryCount === 0) {
            this.retryCount.set(requestKey, 1);
            
            // Проверяем, есть ли токен
            if (!this.token) {
              this.logout();
              throw new Error('Сессия истекла. Необходимо войти в систему заново.');
            }
            
            // Проверяем заголовок авторизации
            if (!originalRequest.headers.Authorization) {
              this.setAuthHeader(this.token);
              return this.api.request(originalRequest);
            }
            
            // Если токен есть, но сервер его не принимает
            throw new Error('Токен авторизации недействителен. Попробуйте выполнить операцию еще раз или войдите в систему заново.');
          } else {
            // При повторной 401 ошибке выходим из системы
            this.logout();
            throw new Error('Сессия истекла. Необходимо войти в систему заново.');
          }
        }
        
        // Очищаем счетчик ретраев для успешных запросов
        if (error.response?.status !== 401) {
          const requestKey = `${originalRequest.method}-${originalRequest.url}`;
          this.retryCount.delete(requestKey);
        }
        
        // Улучшаем сообщения об ошибках
        if (error.response?.status === 403) {
          throw new Error('Недостаточно прав для выполнения операции.');
        }
        
        if (error.response?.status >= 500) {
          throw new Error('Ошибка сервера. Попробуйте еще раз позже.');
        }
        
        return Promise.reject(error);
      }
    );
  }

  private setAuthHeader(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // SMS авторизация админа - отправка кода
  async sendSMSCode(request: AdminSMSRequest): Promise<{ smscode?: string }> {
    try {
      const response = await this.api.post('/v1/user/sing-in-by-phone', {
        phone: request.phone
      });
      
      // В продакшене smscode не должен возвращаться, но для разработки может быть полезно
      return response.data;
    } catch (error: any) {
      throw new Error('Ошибка отправки SMS кода: ' + (error.response?.data?.message || error.message));
    }
  }

  // SMS авторизация админа - подтверждение кода
  async confirmSMSCode(request: AdminSMSConfirm): Promise<{ token: string }> {
    try {
      const response = await this.api.post('/v1/user/sing-in-by-phone-confirm-code', {
        phone: request.phone,
        smscode: request.smscode
      });
      
      const { token } = response.data;
      this.token = token;
      localStorage.setItem('adminToken', token);
      this.setAuthHeader(token);
      return { token };
    } catch (error: any) {
      throw new Error('Неверный код или ошибка авторизации: ' + (error.response?.data?.message || error.message));
    }
  }

  // Аутентификация админа (deprecated - используется для обратной совместимости)
  async adminLogin(credentials: AdminAuth): Promise<{ token: string }> {
    // Для демо режима - если телефон содержит "admin"
    if (credentials.phone.includes('admin')) {
      const token = 'demo-admin-token-' + Date.now();
      this.token = token;
      localStorage.setItem('adminToken', token);
      this.setAuthHeader(token);
      return { token };
    }
    
    throw new Error('Используйте SMS авторизацию через sendSMSCode и confirmSMSCode');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('adminToken');
    delete this.api.defaults.headers.common['Authorization'];
    this.retryCount.clear(); // Очищаем счетчики ретраев
    
    // Уведомляем об выходе из системы
    console.log('User logged out due to authentication error');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Проверка и обновление токена
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      // Простой запрос для проверки валидности токена
      await this.api.get('/admin/clients', { params: { _start: 0, _end: 1 } });
      return true;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('Token is invalid');
        return false;
      }
      // Если ошибка не связана с авторизацией, считаем токен валидным
      return true;
    }
  }

  // Принудительное обновление заголовков авторизации
  refreshAuthHeader(): void {
    if (this.token) {
      this.setAuthHeader(this.token);
      console.log('Auth header refreshed');
    }
  }

  // Пользователи (клиенты)
  async getClients(params?: {
    orderStatus?: string;
    orderType?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    isBlocked?: boolean;
    dateFrom?: string;
    dateTo?: string;
    minOrders?: number;
    maxOrders?: number;
    _start?: number;
    _end?: number;
    _sort?: string;
    _order?: 'ASC' | 'DESC';
  }): Promise<{ data: User[]; total: number }> {
    const response: AxiosResponse<User[]> = await this.api.get('/admin/clients', { params });
    const total = parseInt(response.headers['x-total-count'] || '0');
    return { data: response.data, total };
  }

  async getClient(id: string): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/admin/clients/${id}`);
    return response.data;
  }

  // Водители
  async getDrivers(params?: {
    orderStatus?: string;
    orderType?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    isBlocked?: boolean;
    dateFrom?: string;
    dateTo?: string;
    minOrders?: number;
    maxOrders?: number;
    _start?: number;
    _end?: number;
    _sort?: string;
    _order?: 'ASC' | 'DESC';
  }): Promise<{ data: User[]; total: number }> {
    const response: AxiosResponse<User[]> = await this.api.get('/admin/drivers', { params });
    const total = parseInt(response.headers['x-total-count'] || '0');
    return { data: response.data, total };
  }

  async getDriver(id: string): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/admin/drivers/${id}`);
    return response.data;
  }

  // Заказы
  async getOrders(params?: {
    orderType?: string | number;
    orderStatus?: string | number;
    clientId?: string;
    driverId?: string;
    dateFrom?: string;
    dateTo?: string;
    minPrice?: number;
    maxPrice?: number;
    _start?: number;
    _end?: number;
    _sort?: string;
    _order?: 'ASC' | 'DESC';
  }): Promise<{ data: Order[]; total: number }> {
    const response: AxiosResponse<Order[]> = await this.api.get('/admin/order-requests', { params });
    const total = parseInt(response.headers['x-total-count'] || '0');
    return { data: response.data, total };
  }

  async getOrder(id: string): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.get(`/admin/order-requests/${id}`);
    return response.data;
  }

  // Блокировка пользователей
  async blockUser(blockData: BlockUserRequest): Promise<{ message: string; userId: string }> {
    try {
      console.log('Blocking user with data:', blockData);
      console.log('Current token:', this.token ? 'Present' : 'Missing');
      console.log('Authorization header:', this.api.defaults.headers.common['Authorization']);
      
      const response = await this.api.post('/admin/users/block', blockData);
      return response.data;
    } catch (error: any) {
      console.error('Block user error:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Ошибка авторизации при блокировке пользователя. Попробуйте еще раз.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Недостаточно прав для блокировки пользователей.');
      }
      
      if (error.response?.status === 400) {
        throw new Error('Неверные данные для блокировки: ' + (error.response?.data?.message || 'Проверьте введенные данные'));
      }
      
      if (error.response?.status === 404) {
        throw new Error('Пользователь не найден.');
      }
      
      throw new Error('Ошибка блокировки пользователя: ' + (error.response?.data?.message || error.message));
    }
  }

  async unblockUser(userId: string): Promise<{ message: string; userId: string }> {
    try {
      console.log('Unblocking user:', userId);
      console.log('Current token:', this.token ? 'Present' : 'Missing');
      console.log('Authorization header:', this.api.defaults.headers.common['Authorization']);
      
      const response = await this.api.put(`/admin/users/${userId}/unblock`);
      return response.data;
    } catch (error: any) {
      console.error('Unblock user error:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Ошибка авторизации при разблокировке пользователя. Попробуйте еще раз.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Недостаточно прав для разблокировки пользователей.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Пользователь не найден.');
      }
      
      throw new Error('Ошибка разблокировки пользователя: ' + (error.response?.data?.message || error.message));
    }
  }

  // Проверка разблокировки пользователей
  async forceCheckUnblockUsers(): Promise<{ message: string }> {
    const response = await this.api.post('/admin/users/check-unblock');
    return response.data;
  }

  // Получение статистики
  async getStats(): Promise<StatsData> {
    try {
      // Пытаемся получить статистику с бэкенда
      const response: AxiosResponse<StatsData> = await this.api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats from backend, calculating on frontend:', error);
      
      // Если бэкенд не отвечает, вычисляем статистику на фронтенде
      try {
        const [clientsResponse, driversResponse, ordersResponse] = await Promise.all([
          this.getClients({ _start: 0, _end: 1000 }),
          this.getDrivers({ _start: 0, _end: 1000 }),
          this.getOrders({ _start: 0, _end: 1000 })
        ]);

        const clients = clientsResponse.data;
        const drivers = driversResponse.data;
        const orders = ordersResponse.data;

        // Подсчитываем статистику
        const totalUsers = clients.length;
        const totalDrivers = drivers.length;
        const totalOrders = orders.length;
        
        const activeOrders = orders.filter(order => 
          ['CREATED', 'STARTED', 'WAITING', 'ONGOING'].includes(order.orderStatus)
        ).length;
        
        const completedOrders = orders.filter(order => 
          order.orderStatus === 'COMPLETED'
        ).length;
        
        const rejectedOrders = orders.filter(order => 
          ['REJECTED', 'REJECTED_BY_CLIENT', 'REJECTED_BY_DRIVER'].includes(order.orderStatus)
        ).length;

        // Заказы за сегодня
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today;
        }).length;

        // Подсчет выручки от завершенных заказов
        const revenue = orders
          .filter(order => order.orderStatus === 'COMPLETED')
          .reduce((sum, order) => sum + order.price, 0);

        return {
          totalUsers,
          totalDrivers,
          totalOrders,
          activeOrders,
          completedOrders,
          rejectedOrders,
          todayOrders,
          revenue
        };
      } catch (fallbackError) {
        console.error('Error calculating stats on frontend:', fallbackError);
        // Возвращаем пустую статистику в случае ошибки
        return {
          totalUsers: 0,
          totalDrivers: 0,
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          rejectedOrders: 0,
          todayOrders: 0,
          revenue: 0
        };
      }
    }
  }

  // Утилиты для экспорта данных
  exportToCSV(data: any[], filename: string) {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Экранируем запятые и кавычки
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Получение истории заказов пользователя
  async getUserOrders(userId: string, userType: 'client' | 'driver', params?: {
    orderStatus?: string;
    orderType?: string;
    dateFrom?: string;
    dateTo?: string;
    minPrice?: number;
    maxPrice?: number;
    _start?: number;
    _end?: number;
    _sort?: string;
    _order?: 'ASC' | 'DESC';
  }): Promise<{ data: Order[]; total: number }> {
    const queryParams = {
      ...params,
      [userType === 'client' ? 'clientId' : 'driverId']: userId
    };
    return this.getOrders(queryParams);
  }
}

export const apiService = new ApiService(); 