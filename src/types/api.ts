export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number;
}
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
export interface ApiErrorBody {
  success: false;
  statusCode: number;
  error: string;
  code: string;
  message: string;
  details?: string[];
  path: string;
  timestamp: string;
}
export interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}
