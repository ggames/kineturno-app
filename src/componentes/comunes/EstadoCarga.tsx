import React from 'react';

interface PropiedadesEstadoCarga {
  mensaje?: string;
  pantallaCompleta?: boolean;
}

export const EstadoCarga: React.FC<PropiedadesEstadoCarga> = ({
  mensaje = 'Cargando datos...',
  pantallaCompleta = false,
}) => {
  const contenido = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-verde-principal border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-gray-700 animate-pulse">{mensaje}</p>
    </div>
  );

  if (pantallaCompleta) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-beige-fondo/80 backdrop-blur-xs">
        {contenido}
      </div>
    );
  }

  return contenido;
};
