import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

// Utility function to validate and clamp coordinates
const validateCoordinates = (lat: number, lng: number) => {
  // Clamp latitude to valid range (-90 to 90)
  const validLat = Math.max(-90, Math.min(90, lat || 0));
  // Clamp longitude to valid range (-180 to 180)
  const validLng = Math.max(-180, Math.min(180, lng || 0));

  return { lat: validLat, lng: validLng };
};

export function Map({ latitude, longitude, className = '' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Validate coordinates before using them
    const { lat, lng } = validateCoordinates(latitude, longitude);

    // Check if coordinates are actually invalid (outside valid ranges)
    const isInvalidCoords = latitude > 90 || latitude < -90 || longitude > 180 || longitude < -180;

    try {
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
          center: [lng, lat],
          zoom: 4
        });

        marker.current = new maplibregl.Marker({
          color: isInvalidCoords ? '#ef4444' : 'hsl(var(--primary))'
        })
          .setLngLat([lng, lat])
          .addTo(map.current);

        // Add zoom and navigation controls
        map.current.addControl(new maplibregl.NavigationControl());
      } else {
        // Update marker position and color based on validity
        marker.current?.setLngLat([lng, lat]);

        // Update marker color to indicate invalid coordinates
        if (marker.current) {
          marker.current.remove();
          marker.current = new maplibregl.Marker({
            color: isInvalidCoords ? '#ef4444' : 'hsl(var(--primary))'
          })
            .setLngLat([lng, lat])
            .addTo(map.current);
        }

        map.current.flyTo({
          center: [lng, lat],
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Map rendering error:', error);
      // Fallback: show error message in map container
    }
  }, [latitude, longitude]);

  // Show warning for invalid coordinates
  const isInvalidCoords = latitude > 90 || latitude < -90 || longitude > 180 || longitude < -180;

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className={`h-[300px] rounded-lg overflow-hidden`} />
      {isInvalidCoords && (
        <div className="absolute top-2 left-2 right-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <span className="font-medium">⚠️ Invalid Coordinates</span>
          </div>
          <div className="mt-1">
            {latitude > 90 || latitude < -90 ? `Latitude must be between -90 and 90 (current: ${latitude})` : ''}
            {(latitude > 90 || latitude < -90) && (longitude > 180 || longitude < -180) ? ' • ' : ''}
            {longitude > 180 || longitude < -180 ? `Longitude must be between -180 and 180 (current: ${longitude})` : ''}
          </div>
          <div className="mt-1 text-xs">Map showing clamped coordinates for display purposes.</div>
        </div>
      )}
    </div>
  );
}