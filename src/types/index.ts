export enum OrderType {
  TAXI = 'TAXI',
  DELIVERY = 'DELIVERY',
  INTERCITY_TAXI = 'INTERCITY_TAXI',
  CARGO = 'CARGO'
}

export enum OrderStatus {
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  WAITING = 'WAITING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  REJECTED_BY_CLIENT = 'REJECTED_BY_CLIENT',
  REJECTED_BY_DRIVER = 'REJECTED_BY_DRIVER'
}

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  lastSms?: string;
  deviceToken?: string;
  isBlocked: boolean;
  blockedUntil?: Date;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  orders_as_driver?: Order[];
  categoryLicenses?: CategoryLicense[];
}

export interface Order {
  id: string;
  driverId?: string;
  clientId: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  from: string;
  to: string;
  fromMapboxId: string;
  toMapboxId: string;
  startTime?: Date;
  arrivalTime?: Date;
  lat?: number;
  lng?: number;
  price: number;
  comment?: string;
  rejectReason?: string;
  endedAt?: Date;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryLicense {
  id: string;
  driverId: string;
  categoryType: OrderType;
  brand: string;
  model: string;
  number: string;
  color: string;
  SSN: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface BlockUserRequest {
  userId: string;
  blockedUntil?: string;
  reason: string;
}

export interface AdminAuth {
  phone: string;
}

export interface AdminSMSRequest {
  phone: string;
}

export interface AdminSMSConfirm {
  phone: string;
  smscode: string;
}

export interface StatsData {
  totalUsers: number;
  totalDrivers: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  todayOrders: number;
  revenue: number;
}

export interface UserFilters {
  phone?: string;
  firstName?: string;
  lastName?: string;
  isBlocked?: boolean;
  orderStatus?: OrderStatus;
  orderType?: OrderType;
  dateFrom?: string;
  dateTo?: string;
  minOrders?: number;
  maxOrders?: number;
}

export interface OrderFilters {
  orderStatus?: OrderStatus;
  orderType?: OrderType;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  driverId?: string;
  clientId?: string;
}

export interface PaginationParams {
  _start?: number;
  _end?: number;
  _sort?: string;
  _order?: 'ASC' | 'DESC';
}

export interface UserDetailPageProps {
  userId: string;
  userType: 'client' | 'driver';
}

export interface BlockUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: (userId: string, reason: string, blockedUntil?: string) => void;
} 