'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false });

interface Empresa {
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  distanciaDoAnterior?: number;
}

interface Rota {
  empresas: Empresa[];
  distanciaTotal: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [rota, setRota] = useState<Rota | null>(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert(
            'Não foi possível obter sua localização. Verifique as permissões do navegador.',
          );
        },
      );
    } else {
      alert('Geolocalização não é suportada pelo seu navegador');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/process-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setEmpresas(data.empresas);
        alert(`✅ ${data.total} empresas processadas com sucesso!`);
      } else {
        alert(
          '❌ Erro ao processar arquivo: ' +
            (data.error || 'Erro desconhecido'),
        );
      }
    } catch (error) {
      alert('❌ Erro ao fazer upload');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!userLocation || empresas.length === 0) {
      alert('⚠️ Faça o upload do arquivo e permita acesso à localização');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userLocation, empresas }),
      });

      const data = await response.json();

      if (data.success) {
        setRota(data.rota);
      } else {
        alert(
          '❌ Erro ao otimizar rota: ' + (data.error || 'Erro desconhecido'),
        );
      }
    } catch (error) {
      alert('❌ Erro ao calcular rota');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">
          🗺️ Otimizador de Rotas - versão beta (em teste)
        </h1>
        <p className="text-gray-600 mb-8">
          Encontre o caminho mais curto para visitar cooperados
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Upload */}
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              📄 1. Upload do Arquivo CSV
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Formato esperado:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                nome, endereco
              </code>
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-4 w-full text-sm"
            />
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '⏳ Processando...' : '📤 Fazer Upload'}
            </button>
            {empresas.length > 0 && (
              <p className="mt-3 text-sm text-green-600 font-medium">
                ✓ {empresas.length} empresas carregadas
              </p>
            )}
          </div>

          {/* Localização */}
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              📍 2. Sua Localização
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Precisamos saber onde você está para calcular a melhor rota
            </p>
            <button
              onClick={getUserLocation}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              📡 Clique para carregar localização
            </button>
            {userLocation && (
              <p className="mt-3 text-sm text-green-600 font-medium">
                ✓ Localização obtida: {userLocation.lat.toFixed(4)},{' '}
                {userLocation.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* Otimizar */}
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">
            🚀 3. Calcular melhor rota
          </h2>
          <button
            onClick={handleOptimize}
            disabled={!userLocation || empresas.length === 0 || loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
          >
            {loading ? '⏳ Calculando...' : '🎯 Otimizar Rota'}
          </button>
        </div>

        {/* Resultado */}
        {rota && (
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-green-700">
              ✅ Rota Otimizada
            </h2>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-2xl font-bold text-green-800">
                📏 Distância Total: {rota.distanciaTotal} km
              </p>
            </div>

            <h3 className="font-semibold text-lg mb-3">Ordem de visitas:</h3>
            <ol className="space-y-3">
              {rota.empresas.map((empresa, index) => (
                <li
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded"
                >
                  <div className="flex items-start">
                    <span className="font-bold text-blue-600 text-xl mr-3">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{empresa.nome}</p>
                      <p className="text-sm text-gray-600">
                        {empresa.endereco}
                      </p>
                      {empresa.distanciaDoAnterior !== undefined && (
                        <p className="text-xs text-blue-600 mt-1">
                          ➜ {empresa.distanciaDoAnterior} km do ponto anterior
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Mapa */}
        {rota && userLocation && (
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">🗺️ Rota no mapa </h2>
            <MapComponent
              userLocation={userLocation}
              empresas={rota.empresas}
            />
          </div>
        )}
      </div>

      <p className="text-gray-600 mb-8">Desenvolvido por André Dias</p>
    </main>
  );
}
