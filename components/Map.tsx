'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix ícones Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  userLocation: { lat: number; lng: number };
  empresas: Array<{
    nome: string;
    endereco: string;
    latitude: number;
    longitude: number;
  }>;
}

export default function Map({ userLocation, empresas }: MapProps) {
  const positions: [number, number][] = [
    [userLocation.lat, userLocation.lng],
    ...empresas.map((e) => [e.latitude, e.longitude] as [number, number]),
  ];

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={12}
      style={{ height: '600px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />

      {/* Você */}
      <Marker position={[userLocation.lat, userLocation.lng]}>
        <Popup>
          <strong>📍 Você está aqui</strong>
        </Popup>
      </Marker>

      {/* Empresas */}
      {empresas.map((empresa, index) => (
        <Marker key={index} position={[empresa.latitude, empresa.longitude]}>
          <Popup>
            <strong>
              {index + 1}. {empresa.nome}
            </strong>
            <br />
            <small>{empresa.endereco}</small>
          </Popup>
        </Marker>
      ))}

      {/* Linha da rota */}
      <Polyline positions={positions} color="#3b82f6" weight={3} />
    </MapContainer>
  );
}
