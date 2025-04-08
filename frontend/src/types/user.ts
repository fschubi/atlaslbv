export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department_id?: string;
  title?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  created_at?: string;
  updated_at?: string;
  active?: boolean;
}

export type Department = {
  id: string;
  name: string;
  description?: string;
  location_id?: string;
};

export type UserRole = {
  id: string;
  name: string;
  description?: string;
};

export interface UserFilters {
  name?: string;
  department?: string;
  role?: string;
  email?: string;
  search?: string;
}

export interface UserGroup {
  id: number;
  name: string;
  description: string;
  added_at: string;
  added_by: string;
}

export interface Role {
  id: number;
  name: string;
  label: string;
}
