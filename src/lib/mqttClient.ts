import mqtt from 'mqtt';

export const MQTT_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
export const MQTT_BASE_TOPIC = 'miaw_iot_randside';

let client: mqtt.MqttClient | null = null;

export const getMqttClient = () => {
  if (typeof window === 'undefined') return null;
  
  if (!client) {
    client = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `miaw_web_${Math.random().toString(16).substring(2, 8)}`,
      keepalive: 60,
      reconnectPeriod: 1000,
    });
    
    client.on('connect', () => {
      console.log('[MQTT] Terhubung ke Broker EMQX via WSS');
    });

    client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err);
    });
  }
  return client;
};
