import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/lib/config';

export const GEOFENCE_TASK_NAME = 'GEOFENCE_ENTRY_TASK';

TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }

  const { eventType, region } = data as Location.LocationGeofencingEvent;
  if (eventType === Location.LocationGeofencingEventType.Enter) {
    const { pedidoId } = JSON.parse(region.identifier);
    const payload = {
      lat: region.latitude,
      lng: region.longitude,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_URL}/api/pedidos/${pedidoId}/llegada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Server error');
      await removeFromPendingQueue(pedidoId);
    } catch (error) {
      console.error('Failed to send arrival, queueing...', error);
      await addToPendingQueue({ pedidoId, payload });
    }
  }
});

const PENDING_QUEUE_KEY = 'geofence_pending_events';

async function addToPendingQueue(item: any) {
  const queue = JSON.parse((await AsyncStorage.getItem(PENDING_QUEUE_KEY)) || '[]');
  queue.push(item);
  await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
}

async function removeFromPendingQueue(pedidoId: number) {
  let queue = JSON.parse((await AsyncStorage.getItem(PENDING_QUEUE_KEY)) || '[]');
  queue = queue.filter((item: any) => item.pedidoId !== pedidoId);
  await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
}

export async function retryPendingGeofenceEvents() {
  const queue = JSON.parse((await AsyncStorage.getItem(PENDING_QUEUE_KEY)) || '[]');
  for (const item of queue) {
    try {
      await fetch(`${API_URL}/api/pedidos/${item.pedidoId}/llegada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      await removeFromPendingQueue(item.pedidoId);
    } catch (e) {
      console.error('Retry failed for pedido', item.pedidoId, e);
    }
  }
}

export async function startGeofencesForOrders(orders: { id: number; lat: number; lng: number; radio_geocerca?: number }[]) {
  await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);

  const regions: Location.LocationGeofencingRegion[] = orders
    .filter(o => o.lat != null && o.lng != null)
    .map(o => ({
      identifier: JSON.stringify({ pedidoId: o.id }),
      latitude: o.lat,
      longitude: o.lng,
      radius: o.radio_geocerca || 100, // default 100 meters
      notifyOnEntry: true,
      notifyOnExit: false,
    }));

  if (regions.length > 0) {
    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
    console.log(`Geofences started for ${regions.length} orders`);
  }
}

export async function stopAllGeofences() {
  await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
  console.log('All geofences stopped');
}
