import type { ThemeName } from '@trackflow/shared-types';

export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0A1428' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ba3c0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A1428' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c8d8eb' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6c8aa8' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0F2230' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#152840' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0F1B30' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8ba3c0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1E3150' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0A1428' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#152840' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#08111F' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d5573' }] },
];

export const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F4F6FB' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5b6a82' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1f2a40' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7d8ba1' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#E2ECE3' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E1E6F0' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5b6a82' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#E8EFFA' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#D4DCEC' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#EAEEF6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CDD9EC' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7388a4' }] },
];

export function getMapStyle(themeName: ThemeName) {
  return themeName === 'light' ? LIGHT_MAP_STYLE : DARK_MAP_STYLE;
}
