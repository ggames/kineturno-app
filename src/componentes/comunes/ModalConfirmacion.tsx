import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface PropiedadesModalConfirmacion {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipoAccion?: 'peligro' | 'primario';
  alConfirmar: () => void;
  alCancelar: () => void;
}

export const ModalConfirmacion: React.FC<PropiedadesModalConfirmacion> = ({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Volver atras',
  tipoAccion = 'primario',
  alConfirmar,
  alCancelar,
}) => {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animacion-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-100/60 relative">
        <button
          onClick={alCancelar}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div
            className={`p-3 rounded-xl ${
              tipoAccion === 'peligro' ? 'bg-rose-100 text-rose-700' : 'bg-verde-suave text-verde-principal'
            }`}
          >
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
        </div>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{mensaje}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={alCancelar}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            {textoCancelar}
          </button>
          <button
            onClick={alConfirmar}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all ${
              tipoAccion === 'peligro'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-verde-principal hover:bg-emerald-700 shadow-teal-100'
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};
