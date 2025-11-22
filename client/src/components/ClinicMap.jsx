// client/src/components/ClinicMap.jsx - WITH DARK MODE AND FIXED CLOSE BUTTON
import React, { useEffect, useRef, useState } from 'react';

const ClinicMap = ({ clinics, selectedMunicipality }) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const initAttempted = useRef(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Check initially
    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const loadGoogleMaps = () => {
    return new Promise((resolve, reject) => {
      // If already loaded
      if (window.google?.maps) {
        resolve();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load')));
        return;
      }

      const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    loadGoogleMaps()
      .then(() => {
        console.log('✅ Google Maps loaded');
        setIsLoaded(true);
        // Wait a bit for the DOM to be ready
        setTimeout(() => {
          initMap();
        }, 100);
      })
      .catch((error) => {
        console.error('❌ Error loading Google Maps:', error);
      });
  }, []);

  useEffect(() => {
    if (isLoaded && googleMapRef.current) {
      updateMarkers();
    }
  }, [clinics, selectedMunicipality, isLoaded]);

  // Update map style when dark mode changes
  useEffect(() => {
    if (googleMapRef.current && isLoaded) {
      const styles = getMapStyles(isDarkMode);
      googleMapRef.current.setOptions({ styles });
    }
  }, [isDarkMode, isLoaded]);

  const getMapStyles = (darkMode) => {
    if (darkMode) {
      // Dark mode styles
      return [
        { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d1d5db" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b7280" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#1f2937" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b7280" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#374151" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2937" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca3af" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#4b5563" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2937" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d1d5db" }],
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [{ color: "#1f2937" }],
        },
        {
          featureType: "transit.station",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b7280" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#111827" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#4b5563" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#0a0a0a" }],
        },
      ];
    } else {
      // Light mode styles (default Google Maps)
      return [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "on" }]
        },
        {
          featureType: "transit",
          elementType: "labels",
          stylers: [{ visibility: "on" }]
        }
      ];
    }
  };

  const initMap = () => {
    if (!window.google?.maps || !mapRef.current || googleMapRef.current) {
      return;
    }

    const caviteCenter = { lat: 14.2456, lng: 120.8783 };
    
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: caviteCenter,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      styles: getMapStyles(isDarkMode),
    });

    updateMarkers();
  };

  const updateMarkers = () => {
    if (!googleMapRef.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (clinics.length === 0) {
      googleMapRef.current.setCenter({ lat: 14.2456, lng: 120.8783 });
      googleMapRef.current.setZoom(10);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    clinics.forEach((clinic) => {
      const position = { lat: clinic.lat, lng: clinic.lng };
      
      const marker = new window.google.maps.Marker({
        position: position,
        map: googleMapRef.current,
        title: clinic.name,
        animation: window.google.maps.Animation.DROP,
      });

      // Info window content - using light background in both modes so X button is always visible
      // In dark mode, we use a subtle gray background with darker text
      const infoWindowContent = `
        <div style="padding: 12px; max-width: 260px; background: ${isDarkMode ? '#f3f4f6' : '#ffffff'};">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #3b82f6;">
            ${clinic.name}
          </h3>
          <p style="margin: 6px 0; font-size: 14px; color: #374151; line-height: 1.5;">
            <strong style="color: #1f2937;">📍 Location:</strong><br/>
            ${clinic.address}
          </p>
          <p style="margin: 6px 0; font-size: 14px; color: #374151; line-height: 1.5;">
            <strong style="color: #1f2937;">📞 Contact:</strong><br/>
            ${clinic.contact}
          </p>
          <p style="margin: 6px 0; font-size: 14px; color: #374151; line-height: 1.5;">
            <strong style="color: #1f2937;">🕒 Hours:</strong><br/>
            ${clinic.hours}
          </p>
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}" 
            target="_blank"
            rel="noopener noreferrer"
            style="display: inline-block; margin-top: 10px; padding: 8px 14px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; transition: background 0.2s;"
            onmouseover="this.style.background='#2563eb'"
            onmouseout="this.style.background='#3b82f6'"
          >
            Get Directions →
          </a>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

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
      className="w-full h-full rounded-lg transition-colors duration-200"
      style={{ 
        backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb'
      }}
    >
      {!isLoaded && (
        <div 
          className={`flex flex-col items-center justify-center h-full transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          <div 
            className="animate-spin rounded-full border-4 mb-4"
            style={{
              width: '40px',
              height: '40px',
              borderColor: isDarkMode ? '#374151' : '#d1d5db',
              borderTopColor: isDarkMode ? '#60a5fa' : '#3b82f6'
            }}
          ></div>
          <div className="text-sm font-medium">Loading map...</div>
        </div>
      )}
    </div>
  );
};

export default ClinicMap;