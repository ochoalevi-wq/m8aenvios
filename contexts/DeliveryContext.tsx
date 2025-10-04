import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Delivery, DeliveryStats, DeliveryStatus, Zone } from '@/types/delivery';

const STORAGE_KEY = '@deliveries';

export const [DeliveryProvider, useDeliveries] = createContextHook(() => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDeliveries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDeliveries = async (newDeliveries: Delivery[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDeliveries));
      setDeliveries(newDeliveries);
    } catch (error) {
      console.error('Error saving deliveries:', error);
    }
  };

  const addDelivery = useCallback(async (delivery: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDelivery: Delivery = {
      ...delivery,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveDeliveries([newDelivery, ...deliveries]);
  }, [deliveries]);

  const updateDelivery = useCallback(async (id: string, updates: Partial<Delivery>) => {
    console.log('Actualizando entrega:', { id, updates });
    const updated = deliveries.map((d) =>
      d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
    );
    console.log('Entrega actualizada:', updated.find(d => d.id === id));
    await saveDeliveries(updated);
  }, [deliveries]);

  const deleteDelivery = useCallback(async (id: string) => {
    const filtered = deliveries.filter((d) => d.id !== id);
    await saveDeliveries(filtered);
  }, [deliveries]);

  const updateStatus = useCallback(async (id: string, status: DeliveryStatus) => {
    await updateDelivery(id, { status });
  }, [updateDelivery]);

  return useMemo(() => ({
    deliveries,
    isLoading,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    updateStatus,
  }), [deliveries, isLoading, addDelivery, updateDelivery, deleteDelivery, updateStatus]);
});

export const useDeliveryStats = (): DeliveryStats => {
  const { deliveries } = useDeliveries();

  return useMemo(() => {
    const stats: DeliveryStats = {
      total: deliveries.length,
      pending: 0,
      inTransit: 0,
      delivered: 0,
      totalRevenue: 0,
    };

    deliveries.forEach((delivery) => {
      if (delivery.status === 'pending') stats.pending++;
      if (delivery.status === 'in_transit') stats.inTransit++;
      if (delivery.status === 'delivered') stats.delivered++;
      stats.totalRevenue += delivery.packageCost + delivery.shippingCost;
    });

    return stats;
  }, [deliveries]);
};

export const useFilteredDeliveries = (
  status?: DeliveryStatus,
  zone?: Zone,
  search?: string
) => {
  const { deliveries } = useDeliveries();

  return useMemo(() => {
    return deliveries.filter((delivery) => {
      if (status && delivery.status !== status) return false;
      if (zone && delivery.zone !== zone) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          delivery.sender.name.toLowerCase().includes(searchLower) ||
          delivery.receiver.name.toLowerCase().includes(searchLower) ||
          delivery.messenger.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [deliveries, status, zone, search]);
};
