import type { LocationDef } from './types';

// Average annual peak sun hours (PSH, kWh/m²/day) — regional averages for
// Southern Africa where SmartTech Academy operates, plus a manual option.
export const LOCATIONS: LocationDef[] = [
  { id: 'harare', name: 'Harare', country: 'Zimbabwe', psh: 5.3 },
  { id: 'bulawayo', name: 'Bulawayo', country: 'Zimbabwe', psh: 5.6 },
  { id: 'mutare', name: 'Mutare', country: 'Zimbabwe', psh: 5.0 },
  { id: 'gweru', name: 'Gweru', country: 'Zimbabwe', psh: 5.4 },
  { id: 'victoria-falls', name: 'Victoria Falls', country: 'Zimbabwe', psh: 5.8 },
  { id: 'masvingo', name: 'Masvingo', country: 'Zimbabwe', psh: 5.5 },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', psh: 5.2 },
  { id: 'cape-town', name: 'Cape Town', country: 'South Africa', psh: 5.0 },
  { id: 'durban', name: 'Durban', country: 'South Africa', psh: 4.7 },
  { id: 'lusaka', name: 'Lusaka', country: 'Zambia', psh: 5.5 },
  { id: 'gaborone', name: 'Gaborone', country: 'Botswana', psh: 5.9 },
  { id: 'maputo', name: 'Maputo', country: 'Mozambique', psh: 5.4 },
  { id: 'custom', name: 'Custom / manual PSH', country: '—', psh: 5.0 },
];
