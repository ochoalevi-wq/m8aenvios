import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Pickup, PickupStats, PickupStatus, Zone } from '@/types/delivery';

const STORAGE_KEY = '@pickups';

export const [PickupProvider, usePickups] = createContextHook(() => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPickups();
  }, []);

  const loadPickups = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPickups(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pickups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePickups = async (newPickups: Pickup[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPickups));
      setPickups(newPickups);
    } catch (error) {
      console.error('Error saving pickups:', error);
    }
  };

  const addPickup = useCallback(async (pickup: Omit<Pickup, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPickup: Pickup = {
      ...pickup,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await savePickups([newPickup, ...pickups]);
  }, [pickups]);

  const updatePickup = useCallback(async (id: string, updates: Partial<Pickup>) => {
    console.log('Actualizando recolección:', { id, updates });
    const updated = pickups.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    console.log('Recolección actualizada:', updated.find(p => p.id === id));
    await savePickups(updated);
  }, [pickups]);

  const deletePickup = useCallback(async (id: string) => {
    const filtered = pickups.filter((p) => p.id !== id);
    await savePickups(filtered);
  }, [pickups]);

  const updateStatus = useCallback(async (id: string, status: PickupStatus) => {
    await updatePickup(id, { status });
  }, [updatePickup]);

  return useMemo(() => ({
    pickups,
    isLoading,
    addPickup,
    updatePickup,
    deletePickup,
    updateStatus,
  }), [pickups, isLoading, addPickup, updatePickup, deletePickup, updateStatus]);
});

export const usePickupStats = (): PickupStats => {
  const { pickups } = usePickups();

  return useMemo(() => {
    const stats: PickupStats = {
      total: pickups.length,
      scheduled: 0,
      collected: 0,
      cancelled: 0,
    };

    pickups.forEach((pickup) => {
      if (pickup.status === 'scheduled') stats.scheduled++;
      if (pickup.status === 'collected') stats.collected++;
      if (pickup.status === 'cancelled') stats.cancelled++;
    });

    return stats;
  }, [pickups]);
};

export const useFilteredPickups = (
  status?: PickupStatus,
  zone?: Zone,
  search?: string
) => {
  const { pickups } = usePickups();

  return useMemo(() => {
    return pickups.filter((pickup) => {
      if (status && pickup.status !== status) return false;
      if (zone && pickup.zone !== zone) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          pickup.sender.name.toLowerCase().includes(searchLower) ||
          pickup.messenger.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [pickups, status, zone, search]);
};
