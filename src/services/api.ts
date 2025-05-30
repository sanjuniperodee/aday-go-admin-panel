import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, Order, BlockUserRequest, StatsData, AdminAuth, AdminSMSRequest, AdminSMSConfirm } from '../types';

// Simple cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 30000): void { // default 30 seconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private cache = new SimpleCache();

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

    // Интерцептор для обработки ответов
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  private setAuthHeader(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${JSON.stringify(params || {})}`;
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
    this.cache.clear(); // Clear cache on logout
  }

  isAuthenticated(): boolean {
    return !!this.token;
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
    const cacheKey = this.getCacheKey('/admin/clients', params);
    const cached = this.cache.get<{ data: User[]; total: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response: AxiosResponse<User[]> = await this.api.get('/admin/clients', { params });
    const total = parseInt(response.headers['x-total-count'] || '0');
    const result = { data: response.data, total };
    
    // Cache for 15 seconds for list data
    this.cache.set(cacheKey, result, 15000);
    
    return result;
  }

  async getClient(id: string): Promise<User> {
    const cacheKey = this.getCacheKey(`/admin/clients/${id}`);
    const cached = this.cache.get<User>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response: AxiosResponse<User> = await this.api.get(`/admin/clients/${id}`);
    
    // Cache individual client for 60 seconds
    this.cache.set(cacheKey, response.data, 60000);
    
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
    const cacheKey = this.getCacheKey('/admin/drivers', params);
    const cached = this.cache.get<{ data: User[]; total: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response: AxiosResponse<User[]> = await this.api.get('/admin/drivers', { params });
    const total = parseInt(response.headers['x-total-count'] || '0');
    const result = { data: response.data, total };
    
    // Cache for 15 seconds for list data
    this.cache.set(cacheKey, result, 15000);
    
    return result;
  }

  async getDriver(id: string): Promise<User> {
    const cacheKey = this.getCacheKey(`/admin/drivers/${id}`);
    const cached = this.cache.get<User>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response: AxiosResponse<User> = await this.api.get(`/admin/drivers/${id}`);
    
    // Cache individual driver for 60 seconds
    this.cache.set(cacheKey, response.data, 60000);
    
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
    const cacheKey = this.getCacheKey('/admin/order-requests', params);
    const cached = this.cache.get<{ data: Order[]; total: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response: AxiosResponse<Order[]> = await this.api.get('/admin/order-requests', { params });
    const total = parseInt(response.headers['x-total-count'] || '0');
    const result = { data: response.data, total };
    
    // Cache for 10 seconds for orders (more dynamic data)
    this.cache.set(cacheKey, result, 10000);
    
    return result;
  }

  async getOrder(id: string): Promise<Order> {
    const cacheKey = this.getCacheKey(`/admin/order-requests/${id}`);
    const cached = this.cache.get<Order>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response: AxiosResponse<Order> = await this.api.get(`/admin/order-requests/${id}`);
    
    // Cache individual order for 30 seconds
    this.cache.set(cacheKey, response.data, 30000);
    
    return response.data;
  }

  // Блокировка пользователей
  async blockUser(blockData: BlockUserRequest): Promise<{ message: string; userId: string }> {
    const response = await this.api.post('/admin/users/block', blockData);
    
    // Clear relevant caches when user is blocked
    this.cache.delete(this.getCacheKey('/admin/clients'));
    this.cache.delete(this.getCacheKey('/admin/drivers'));
    this.cache.delete(this.getCacheKey(`/admin/clients/${blockData.userId}`));
    this.cache.delete(this.getCacheKey(`/admin/drivers/${blockData.userId}`));
    
    return response.data;
  }

  async unblockUser(userId: string): Promise<{ message: string; userId: string }> {
    const response = await this.api.put(`/admin/users/${userId}/unblock`);
    
    // Clear relevant caches when user is unblocked
    this.cache.delete(this.getCacheKey('/admin/clients'));
    this.cache.delete(this.getCacheKey('/admin/drivers'));
    this.cache.delete(this.getCacheKey(`/admin/clients/${userId}`));
    this.cache.delete(this.getCacheKey(`/admin/drivers/${userId}`));
    
    return response.data;
  }

  // Проверка разблокировки пользователей
  async forceCheckUnblockUsers(): Promise<{ message: string }> {
    const response = await this.api.post('/admin/users/check-unblock');
    
    // Clear user caches after checking unblock
    this.cache.delete(this.getCacheKey('/admin/clients'));
    this.cache.delete(this.getCacheKey('/admin/drivers'));
    
    return response.data;
  }

  // Получение статистики
  async getStats(): Promise<StatsData> {
    const cacheKey = this.getCacheKey('/admin/stats');
    const cached = this.cache.get<StatsData>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Пытаемся получить статистику с бэкенда
      const response: AxiosResponse<StatsData> = await this.api.get('/admin/stats');
      
      // Cache stats for 60 seconds
      this.cache.set(cacheKey, response.data, 60000);
      
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