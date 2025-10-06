export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';

export type PickupStatus = 'scheduled' | 'collected' | 'cancelled';

export type Zone = 'zona_1' | 'zona_2' | 'zona_3' | 'zona_4' | 'zona_5';

export interface Person {
  name: string;
  phone: string;
  address: string;
}

export interface Delivery {
  id: string;
  sender: Person;
  receiver: Person;
  messenger: string;
  messengerId?: string;
  zone: Zone;
  packageCost: number;
  shippingCost: number;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
  description?: string;
  photos?: string[];
}

export interface DeliveryStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  totalRevenue: number;
}

export interface Pickup {
  id: string;
  sender: Person;
  messenger: string;
  messengerId?: string;
  zone: Zone;
  scheduledDate: string;
  scheduledTime: string;
  status: PickupStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  packageCount: number;
  pickupOnly?: boolean;
  cost?: number;
}

export interface PickupStats {
  total: number;
  scheduled: number;
  collected: number;
  cancelled: number;
}

export interface MessengerAvailability {
  messengerId: string;
  isAvailable: boolean;
  updatedAt: string;
}

export interface MessengerLocation {
  messengerId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export const ZONE_LABELS: Record<Zone, string> = {
  zona_1: 'Zona 1',
  zona_2: 'Zona 2',
  zona_3: 'Zona 3',
  zona_4: 'Zona 4',
  zona_5: 'Zona 5',
};

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pendiente',
  in_transit: 'En Tránsito',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  scheduled: 'Agendado',
  collected: 'Recolectado',
  cancelled: 'Cancelado',
};

export const ZONE_SHIPPING_COSTS: Record<Zone, number> = {
  zona_1: 15,
  zona_2: 20,
  zona_3: 25,
  zona_4: 30,
  zona_5: 35,
};
