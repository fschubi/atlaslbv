/**
 * API-Antworttyp für die ATLAS-Anwendung
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
