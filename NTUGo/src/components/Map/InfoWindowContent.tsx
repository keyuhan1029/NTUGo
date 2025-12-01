'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { YouBikeStation } from '@/services/youbikeApi';
import type { BusStop, BusRealTimeInfo } from '@/services/busApi';
import BusInfoContent from './BusInfoContent';
import BikeInfoContent from './BikeInfoContent';
import GymInfoContent from './GymInfoContent';
import LibraryInfoContent from './LibraryInfoContent';

interface GymOccupancy {
  fitnessCenter: { current: number; optimal: number; max: number };
  swimmingPool: { current: number; optimal: number; max: number };
  status: string;
  totalCurrent: number;
  totalMax: number;
  lastUpdated: string;
}

interface LibraryInfo {
  openingHours: { today: string; status: string; hours: string };
  studyRoom: { occupied: number; available: number; total: number };
  lastUpdated: string;
}

interface InfoWindowContentProps {
  selectedMarker: any;
  selectedYouBikeStation: YouBikeStation | null;
  selectedBusStop: BusStop | null;
  busRealTimeInfo: BusRealTimeInfo[];
  busRealTimeLoading: boolean;
  busError: string | null;
  youbikeLoading: boolean;
  youbikeError: string | null;
  gymOccupancy: GymOccupancy | null;
  gymLoading: boolean;
  gymError: string | null;
  libraryInfo: LibraryInfo | null;
  libraryLoading: boolean;
  libraryError: string | null;
}

export default function InfoWindowContent({
  selectedMarker,
  selectedYouBikeStation,
  selectedBusStop,
  busRealTimeInfo,
  busRealTimeLoading,
  busError,
  youbikeLoading,
  youbikeError,
  gymOccupancy,
  gymLoading,
  gymError,
  libraryInfo,
  libraryLoading,
  libraryError,
}: InfoWindowContentProps) {
  return (
    <Box sx={{ p: 2 }}>
      {selectedMarker.type === 'bus' && (
        <BusInfoContent
          selectedBusStop={selectedBusStop}
          busRealTimeInfo={busRealTimeInfo}
          busRealTimeLoading={busRealTimeLoading}
          busError={busError}
        />
      )}
      
      {selectedMarker.type === 'bike' && (
        <BikeInfoContent
          selectedYouBikeStation={selectedYouBikeStation}
          youbikeLoading={youbikeLoading}
          youbikeError={youbikeError}
        />
      )}
      
      {selectedMarker.type === 'food' && (
        <Box
          sx={{
            p: 1.5,
            backgroundColor: '#fff3e0',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100' }}>
            ⭐ 美食評分: 4.5 / 5.0
          </Typography>
        </Box>
      )}
      
      {selectedMarker.type === 'metro' && (
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                backgroundColor: '#e8f5e9',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                往象山
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                3 分
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                backgroundColor: '#e3f2fd',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                往淡水
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2' }}>
                5 分
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
      
      {selectedMarker.type === 'library' && (
        <LibraryInfoContent
          libraryInfo={libraryInfo}
          libraryLoading={libraryLoading}
          libraryError={libraryError}
        />
      )}
      
      {selectedMarker.type === 'gym' && (
        <GymInfoContent
          gymOccupancy={gymOccupancy}
          gymLoading={gymLoading}
          gymError={gymError}
        />
      )}
    </Box>
  );
}

