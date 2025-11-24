import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Location {
  lat: number;
  lng: number;
}

interface Empresa {
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
}

interface EmpresaComDistancia extends Empresa {
  distanciaDoAnterior: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userLocation, empresas } = body as {
      userLocation: Location;
      empresas: Empresa[];
    };

    if (!userLocation || !empresas || empresas.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Algoritmo Nearest Neighbor
    const rotaOtimizada = optimizeRoute(userLocation, empresas);

    return NextResponse.json({
      success: true,
      rota: rotaOtimizada,
    });
  } catch (error) {
    console.error('Erro na otimização:', error);
    return NextResponse.json(
      {
        error: 'Erro ao otimizar rota',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

function optimizeRoute(start: Location, empresas: Empresa[]) {
  const visited: EmpresaComDistancia[] = [];
  const remaining = [...empresas];
  let current = start;
  let distanciaTotal = 0;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    remaining.forEach((empresa, index) => {
      const distance = calculateDistance(
        current.lat,
        current.lng,
        empresa.latitude,
        empresa.longitude,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    const nearest = remaining.splice(nearestIndex, 1)[0];
    visited.push({
      ...nearest,
      distanciaDoAnterior: parseFloat(minDistance.toFixed(2)),
    });
    distanciaTotal += minDistance;
    current = { lat: nearest.latitude, lng: nearest.longitude };
  }

  return {
    empresas: visited,
    distanciaTotal: parseFloat(distanciaTotal.toFixed(2)),
  };
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
