import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function Map({ latitude, longitude, className = '' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap Contributors',
              maxzoom: 19
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [longitude || 0, latitude || 0],
        zoom: 4
      });

      marker.current = new maplibregl.Marker({
        color: 'hsl(var(--primary))'
      })
        .setLngLat([longitude || 0, latitude || 0])
        .addTo(map.current);

      // Add zoom and navigation controls
      map.current.addControl(new maplibregl.NavigationControl());
    } else {
      marker.current?.setLngLat([longitude || 0, latitude || 0]);
      map.current.flyTo({
        center: [longitude || 0, latitude || 0],
        duration: 2000
      });
    }
  }, [latitude, longitude]);

  return (
    <div ref={mapContainer} className={`h-[300px] rounded-lg overflow-hidden ${className}`} />
  );
}