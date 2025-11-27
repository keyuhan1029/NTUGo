'use client';

import * as React from 'react';

interface MapContextType {
  showYouBikeStations: boolean;
  setShowYouBikeStations: (show: boolean) => void;
  showBusStops: boolean;
  setShowBusStops: (show: boolean) => void;
}

const MapContext = React.createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [showYouBikeStations, setShowYouBikeStations] = React.useState(false);
  const [showBusStops, setShowBusStops] = React.useState(false);

  return (
    <MapContext.Provider value={{ 
      showYouBikeStations, 
      setShowYouBikeStations,
      showBusStops,
      setShowBusStops,
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = React.useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}

