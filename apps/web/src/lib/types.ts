export type Role = "CUSTOMER" | "RECEPTIONIST" | "HOUSEKEEPING" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type RoomStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "DIRTY"
  | "CLEANING"
  | "MAINTENANCE"
  | "RESERVED";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "PAYING"
  | "PENDING_APPROVAL"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

export interface RoomType {
  id: string;
  name: string;
  description?: string | null;
  maxGuests: number;
  areaSqm: number;
  bedType: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  notes?: string | null;
  roomType?: RoomType;
  roomTypeId: string;
}

export interface SearchResult {
  roomType: RoomType;
  rooms: Room[];
  pricePerNight: number;
  nights: number;
  totalPrice: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  adults?: number;
  children?: number;
  totalAmount: string | number;
  status: BookingStatus;
  paymentDeadline: string;
  guestNotes?: string | null;
  specialRequests?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  createdAt: string;
  room?: Room & { roomType?: RoomType };
  customer?: AuthUser;
  payment?: Payment;
  attachments?: BookingAttachment[];
}

export interface Payment {
  id: string;
  bookingId: string;
  method: string;
  paymentType: string;
  amount: string | number;
  status: string;
  receiptImageUrl?: string | null;
  gatewayUrl?: string | null;
  paidAt?: string | null;
}

export interface BookingAttachment {
  id: string;
  bookingId: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface PaymentMethodInfo {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string | null;
  qrImageUrl?: string | null;
  isActive: boolean;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
