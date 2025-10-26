import React, { useEffect, useRef } from 'react';

const ClinicMap = ({ clinics, selectedMunicipality }) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  

  useEffect(() => {
    // Load Google Maps script
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  useEffect(() => {
    if (googleMapRef.current) {
      updateMarkers();
    }
  }, [clinics, selectedMunicipality]);

  const initMap = () => {
    // Default center (Cavite province)
    const caviteCenter = { lat: 14.2456, lng: 120.8783 };
    
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: caviteCenter,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    updateMarkers();
  };

  const updateMarkers = () => {
    if (!googleMapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (clinics.length === 0) {
      // Center on Cavite if no clinics
      googleMapRef.current.setCenter({ lat: 14.2456, lng: 120.8783 });
      googleMapRef.current.setZoom(10);
      return;
    }

    // Create bounds to fit all markers
    const bounds = new window.google.maps.LatLngBounds();

    // Add markers for each clinic
    clinics.forEach((clinic) => {
      const position = { lat: clinic.lat, lng: clinic.lng };
      
      const marker = new window.google.maps.Marker({
        position: position,
        map: googleMapRef.current,
        title: clinic.name,
        animation: window.google.maps.Animation.DROP,
      });

      // Info window with clinic details
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1e40af;">
              ${clinic.name}
            </h3>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>📍 Location:</strong><br/>
              ${clinic.address}
            </p>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>📞 Contact:</strong><br/>
              ${clinic.contact}
            </p>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>🕒 Hours:</strong><br/>
              ${clinic.hours}
            </p>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}" 
              target="_blank"
              style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-size: 13px;"
            >
              Get Directions
            </a>
          </div>
        `,
      });

      // Show info window on marker click
      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (clinics.length === 1) {
      googleMapRef.current.setCenter(bounds.getCenter());
      googleMapRef.current.setZoom(15);
    } else {
      googleMapRef.current.fitBounds(bounds);
    }
  };

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    />
  );
};

export default ClinicMap;