export interface Department {
  id: number;
  name: string;
  description: string;
  locationId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  parentId?: number;
  type?: 'device' | 'license' | 'certificate' | 'accessory';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Manufacturer {
  id: number;
  name: string;
  description: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  description: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractNumber?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Room {
  id: number;
  name: string;
  description: string;
  floor?: string;
  building?: string;
  capacity?: number;
  locationId?: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Location {
  id: number;
  name: string;
  description: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface DeviceModel {
  id: number;
  name: string;
  description: string;
  manufacturerId: number;
  categoryId: number;
  specifications?: string;
  eol?: string; // End of Life Datum
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Switch {
  id: number;
  name: string;
  description: string;
  ip: string;
  model?: string;
  locationId?: number;
  roomId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkOutlet {
  id: number;
  name: string;
  description: string;
  locationId?: number;
  roomId?: number;
  wallPosition?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Port {
  id: number;
  name: string;
  description: string;
  switchId?: number;
  networkOutletId?: number;
  vlan?: number;
  patchField?: string;
  patchPort?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface NetworkPort {
  id: number;
  name: string;
  switchId: number;
  portNumber?: string;
  vlan?: string;
  patchPanel?: string;
  patchPort?: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
