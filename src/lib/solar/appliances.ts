import type { ApplianceDef } from './types';

// Curated appliance library — typical running watts + inrush/surge factor for
// motor-driven loads (compressors, pumps, motors need 2-3x running watts to start).
export const APPLIANCE_LIBRARY: ApplianceDef[] = [
  // Lighting
  { id: 'led-bulb', name: 'LED bulb', category: 'Lighting', icon: '💡', watts: 10, surgeFactor: 1, defaultHours: 6, defaultQty: 6 },
  { id: 'led-tube', name: 'LED tube / panel light', category: 'Lighting', icon: '💡', watts: 18, surgeFactor: 1, defaultHours: 6, defaultQty: 4 },
  { id: 'security-floodlight', name: 'Security floodlight', category: 'Lighting', icon: '🔦', watts: 30, surgeFactor: 1, defaultHours: 10, defaultQty: 2 },

  // Kitchen
  { id: 'fridge', name: 'Refrigerator (medium)', category: 'Kitchen', icon: '🧊', watts: 150, surgeFactor: 3, defaultHours: 24, defaultQty: 1 },
  { id: 'chest-freezer', name: 'Chest freezer', category: 'Kitchen', icon: '🧊', watts: 200, surgeFactor: 3, defaultHours: 24, defaultQty: 1 },
  { id: 'microwave', name: 'Microwave', category: 'Kitchen', icon: '🍽️', watts: 1100, surgeFactor: 1.2, defaultHours: 0.3, defaultQty: 1 },
  { id: 'electric-kettle', name: 'Electric kettle', category: 'Kitchen', icon: '🍽️', watts: 2000, surgeFactor: 1, defaultHours: 0.3, defaultQty: 1 },
  { id: 'blender', name: 'Blender', category: 'Kitchen', icon: '🍽️', watts: 400, surgeFactor: 2, defaultHours: 0.2, defaultQty: 1 },
  { id: 'toaster', name: 'Toaster', category: 'Kitchen', icon: '🍽️', watts: 900, surgeFactor: 1, defaultHours: 0.2, defaultQty: 1 },
  { id: 'stove-plate', name: 'Electric hot plate', category: 'Kitchen', icon: '🍳', watts: 1500, surgeFactor: 1, defaultHours: 1, defaultQty: 1 },

  // Entertainment / office
  { id: 'tv-led', name: 'LED TV (43")', category: 'Entertainment', icon: '📺', watts: 80, surgeFactor: 1, defaultHours: 5, defaultQty: 1 },
  { id: 'decoder', name: 'Satellite decoder / router', category: 'Entertainment', icon: '📡', watts: 25, surgeFactor: 1, defaultHours: 6, defaultQty: 1 },
  { id: 'laptop', name: 'Laptop', category: 'Office', icon: '💻', watts: 65, surgeFactor: 1, defaultHours: 8, defaultQty: 1 },
  { id: 'desktop-pc', name: 'Desktop PC + monitor', category: 'Office', icon: '🖥️', watts: 250, surgeFactor: 1, defaultHours: 8, defaultQty: 1 },
  { id: 'wifi-router', name: 'Wi-Fi router', category: 'Office', icon: '📶', watts: 12, surgeFactor: 1, defaultHours: 24, defaultQty: 1 },
  { id: 'phone-charger', name: 'Phone/laptop charger', category: 'Office', icon: '🔌', watts: 20, surgeFactor: 1, defaultHours: 3, defaultQty: 2 },
  { id: 'printer', name: 'Printer', category: 'Office', icon: '🖨️', watts: 350, surgeFactor: 1.3, defaultHours: 0.3, defaultQty: 1 },

  // Climate
  { id: 'ceiling-fan', name: 'Ceiling / standing fan', category: 'Climate', icon: '🌀', watts: 70, surgeFactor: 2, defaultHours: 8, defaultQty: 2 },
  { id: 'ac-1ton', name: 'Air conditioner (1 ton / 12000 BTU)', category: 'Climate', icon: '❄️', watts: 1100, surgeFactor: 3, defaultHours: 6, defaultQty: 1 },
  { id: 'ac-1p5ton', name: 'Air conditioner (1.5 ton / 18000 BTU)', category: 'Climate', icon: '❄️', watts: 1650, surgeFactor: 3, defaultHours: 6, defaultQty: 1 },

  // Water & pumps
  { id: 'borehole-pump-05', name: 'Borehole/water pump (0.5 HP)', category: 'Water', icon: '🚰', watts: 370, surgeFactor: 3, defaultHours: 2, defaultQty: 1 },
  { id: 'borehole-pump-1', name: 'Borehole/water pump (1 HP)', category: 'Water', icon: '🚰', watts: 750, surgeFactor: 3, defaultHours: 2, defaultQty: 1 },
  { id: 'geyser', name: 'Electric geyser / water heater (150L)', category: 'Water', icon: '♨️', watts: 3000, surgeFactor: 1, defaultHours: 2, defaultQty: 1 },
  { id: 'washing-machine', name: 'Washing machine', category: 'Water', icon: '🧺', watts: 500, surgeFactor: 2.5, defaultHours: 1, defaultQty: 1 },

  // Security / trade (SmartTech core categories)
  { id: 'cctv-dvr', name: 'CCTV DVR/NVR + 4 cameras', category: 'Security', icon: '📹', watts: 60, surgeFactor: 1, defaultHours: 24, defaultQty: 1 },
  { id: 'gate-motor', name: 'Electric gate motor', category: 'Security', icon: '🚪', watts: 300, surgeFactor: 2.5, defaultHours: 0.5, defaultQty: 1 },
  { id: 'electric-fence', name: 'Electric fence energizer', category: 'Security', icon: '⚡', watts: 15, surgeFactor: 1, defaultHours: 24, defaultQty: 1 },
  { id: 'alarm-panel', name: 'Alarm panel', category: 'Security', icon: '🚨', watts: 10, surgeFactor: 1, defaultHours: 24, defaultQty: 1 },

  // Workshop / power tools
  { id: 'angle-grinder', name: 'Angle grinder', category: 'Workshop', icon: '🛠️', watts: 900, surgeFactor: 2, defaultHours: 0.3, defaultQty: 1 },
  { id: 'drill', name: 'Power drill', category: 'Workshop', icon: '🛠️', watts: 600, surgeFactor: 2, defaultHours: 0.3, defaultQty: 1 },
  { id: 'welder-inverter', name: 'Inverter welder (small)', category: 'Workshop', icon: '🛠️', watts: 3500, surgeFactor: 1.5, defaultHours: 0.5, defaultQty: 1 },
];

export const APPLIANCE_CATEGORIES = Array.from(new Set(APPLIANCE_LIBRARY.map((a) => a.category)));
