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
  | "PENDING_HOST_APPROVAL"
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
  starRating?: number;
  policies?: Record<string, string>;
  popularFacilities?: string[];
  distanceToCenter?: string;
  nearbyPoints?: string[];
  faqs?: { question: string; answer: string }[];
  totalRooms?: number;
  numFloors?: number;
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
  branchId?: string;
  branch?: HotelBranch;
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
  approvalDeadline?: string | null;
  paymentDeadline?: string | null;
  guestNotes?: string | null;
  specialRequests?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  createdAt: string;
  room?: Room & { roomType?: RoomType };
  customer?: AuthUser;
  payment?: Payment;
  review?: Review | null;
  attachments?: BookingAttachment[];
  hasActiveOverlap?: boolean;
  conversation?: Conversation | null;
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

export interface Notification {
  id: string;
  recipientId: string;
  email: string;
  type: string;
  templateData: Record<string, any>;
  sentAt?: string | null;
  readAt?: string | null;
  failed: boolean;
  failReason?: string | null;
  retries: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  staffId?: string | null;
  bookingId?: string | null;
  subject?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer?: Pick<AuthUser, "id" | "firstName" | "lastName" | "email">;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessageCreatedEvent {
  type: "chat.message.created";
  conversationId: string;
  bookingId: string | null;
  bookingStatus: BookingStatus | null;
  customerId: string;
  staffId: string | null;
  senderId: string;
  message: Message;
  latestMessage: Message;
  updatedAt: string;
  conversation: Conversation;
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

export interface UserPaymentMethod {
  id: string;
  userId: string;
  type: string;
  label: string;
  details: Record<string, any>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface HotelBranch {
  id: string;
  name: string;
  province: string;
  city: string;
  address: string;
  phone?: string | null;
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: string;
  value: string | number;
  minAmount?: string | number | null;
  maxDiscount?: string | number | null;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  isUsed: boolean;
  usedAt?: string | null;
  createdAt: string;
  coupon: Coupon;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  roomTypeId: string;
  rating: number;
  comment?: string | null;
  images: string[];
  isApproved: boolean;
  createdAt: string;
  customer?: { firstName: string; lastName: string };
}

export interface WishlistItem {
  id: string;
  roomTypeId: string;
  roomType: RoomType & {
    starRating?: number;
    pricePerNight?: number;
    branch?: HotelBranch;
  };
}

export interface CouponPublic extends Coupon {
  isClaimed: boolean;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type AvailabilityDayStatus = "available" | "held" | "booked";

export interface AvailabilityDay {
  date: string;
  status: AvailabilityDayStatus;
  available: boolean;
}

export interface RoomTypeAvailabilityDay {
  date: string;
  status: "available" | "booked";
  totalRooms: number;
  availableRooms: number;
  heldRooms: number;
  bookedRooms: number;
}

export interface RoomAvailabilityResponse {
  roomId: string;
  from: string;
  to: string;
  days: AvailabilityDay[];
}

export interface RoomTypeAvailabilityResponse {
  roomTypeId: string;
  from: string;
  to: string;
  days: RoomTypeAvailabilityDay[];
}

export interface AvailabilityConflict {
  checkIn: string;
  checkOut: string;
  status: AvailabilityDayStatus;
}

export interface RangeAvailabilityResponse {
  available: boolean;
  from: string;
  to: string;
  conflicts: AvailabilityConflict[];
}

export interface StaffCalendarAction {
  type: "approval-request" | "receipt-approval" | "booking-detail";
  href: string;
}

export interface StaffCalendarBookingBlock {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  action: StaffCalendarAction;
  customer: Pick<AuthUser, "id" | "firstName" | "lastName" | "email" | "phone">;
  room: Pick<Room, "id" | "roomNumber" | "floor"> & {
    roomType: Pick<RoomType, "id" | "name">;
  };
}

export interface StaffCalendarRoom {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomType: Pick<RoomType, "id" | "name" | "maxGuests">;
  branch: Pick<HotelBranch, "id" | "name" | "city">;
  bookings: StaffCalendarBookingBlock[];
}

export interface StaffBookingCalendarResponse {
  from: string;
  to: string;
  days: string[];
  rooms: StaffCalendarRoom[];
}
