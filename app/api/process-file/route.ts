import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 400 },
      );
    }

    const text = await file.text();

    // Parse CSV
    const results = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
    });

    if (!results.data || results.data.length === 0) {
      return NextResponse.json(
        { error: 'CSV vazio ou inválido' },
        { status: 400 },
      );
    }

    // Geocoding para cada empresa
    const empresasComCoordenadas = [];

    for (const row of results.data as any[]) {
      const endereco = row.endereco || row.address || '';
      const nome = row.nome || row.name || 'Sem nome';

      if (!endereco) continue;

      const coords = await geocodeAddress(endereco);

      if (coords) {
        empresasComCoordenadas.push({
          nome,
          endereco,
          latitude: coords.lat,
          longitude: coords.lng,
        });
      }

      // Rate limiting: aguarda 1s entre requisições
      await sleep(1000);
    }

    return NextResponse.json({
      success: true,
      empresas: empresasComCoordenadas,
      total: empresasComCoordenadas.length,
      totalProcessado: results.data.length,
    });
  } catch (error) {
    console.error('Erro no processamento:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar arquivo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address,
      )}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'NextJS-Route-Optimizer/1.0',
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      console.error(
        `Geocoding falhou para: ${address} - Status: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao geocodificar:', address, error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
