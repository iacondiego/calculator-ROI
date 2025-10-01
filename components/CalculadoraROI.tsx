'use client';

import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';

interface FormData {
  consultas: number | '';
  consultasConversion: number | '';
  oportunidadesPerdidas: number | '';
  tiempoSemanal: number | '';
  ticket: number | '';
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

export default function CalculadoraROI() {
  const [formData, setFormData] = useState<FormData>({
    consultas: '',
    consultasConversion: '',
    oportunidadesPerdidas: '',
    tiempoSemanal: '',
    ticket: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [roiResult, setRoiResult] = useState<string | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    if (!pdfContentRef.current || !roiResult) return;
    
    try {
      const element = pdfContentRef.current;
      
      // Hacer visible temporalmente el elemento
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.zIndex = '9999';
      element.style.backgroundColor = 'white';
      
      const options = {
        margin: 0.5,
        filename: `Analisis_ROI_Setterless_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      html2pdf().set(options).from(element).save().then(() => {
        // Ocultar el elemento después de generar el PDF
        element.style.position = 'fixed';
        element.style.top = '-9999px';
        element.style.left = '0';
        element.style.zIndex = '-1';
      });
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    }
  };

  const formatRoiResult = (result: string) => {
    // Limpiar y dividir el texto
    const cleanText = result.replace(/\*\*/g, '').trim();
    const paragraphs = cleanText.split('\n').filter(p => p.trim());
    
    const elements: JSX.Element[] = [];
    
    paragraphs.forEach((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      if (!trimmed) return;
      
      // Detectar títulos principales (contienen emojis)
      if (trimmed.includes('🙌') || trimmed.includes('📈') || trimmed.includes('💰') || trimmed.includes('⏰') || trimmed.includes('🎯')) {
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-cyan-700 mb-6 mt-8 first:mt-0 text-center">
            {trimmed}
          </h2>
        );
      }
      // Detectar subtítulos (terminan con : o son preguntas)
      else if (trimmed.endsWith(':') || trimmed.endsWith('?')) {
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-slate-800 mb-3 mt-6 first:mt-0">
            {trimmed}
          </h3>
        );
      }
      // Detectar elementos de lista
      else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        elements.push(
          <div key={index} className="flex items-start mb-2 ml-4">
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-cyan-600 rounded-full mt-2.5 mr-3"></div>
            <p className="text-slate-700 leading-relaxed">
              {trimmed.substring(1).trim()}
            </p>
          </div>
        );
      }
      // Todos los párrafos normales (incluyendo métricas) con formato uniforme
      else {
        elements.push(
          <p key={index} className="text-slate-700 leading-relaxed text-base mb-4">
            {trimmed}
          </p>
        );
      }
    });
    
    return elements;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setRoiResult(null);

    try {
      // Validación básica
      if (!formData.consultas || !formData.oportunidadesPerdidas) {
        setMessage({
          text: 'Por favor completa todos los campos obligatorios',
          type: 'error'
        });
        setIsLoading(false);
        return;
      }

      // Preparar datos para envío
      const dataToSend = {
        consultas: Number(formData.consultas),
        consultasConversion: formData.consultasConversion ? Number(formData.consultasConversion) : null,
        oportunidadesPerdidas: Number(formData.oportunidadesPerdidas),
        tiempoSemanal: formData.tiempoSemanal ? Number(formData.tiempoSemanal) : null,
        ticket: formData.ticket ? Number(formData.ticket) : null
      };

      const response = await fetch('https://devwebhook.iacondiego.es/webhook/c04ec428-b03e-48ea-af9b-e0551d7a6e59', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.text();
        // Intentar parsear como JSON, si no es posible usar el texto tal como está
        let parsedResult;
        try {
          const jsonResult = JSON.parse(result);
          parsedResult = jsonResult.response || result;
        } catch {
          parsedResult = result;
        }
        setRoiResult(parsedResult);
        setMessage({
          text: '¡Cálculo completado exitosamente!',
          type: 'success'
        });
        
        // Limpiar formulario después del éxito
        setFormData({
          consultas: '',
          consultasConversion: '',
          oportunidadesPerdidas: '',
          tiempoSemanal: '',
          ticket: ''
        });
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (error) {
      setMessage({
        text: 'Error al procesar los datos. Por favor intenta de nuevo.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%2306B6D4%22%20fill-opacity=%220.08%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Pantalla de carga */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl border border-cyan-200/30">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Calculando tu ROI</h3>
              <p className="text-slate-600">Analizando tus datos...</p>
            </div>
          </div>
        )}

        {/* Pantalla de resultado */}
        {roiResult && !isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-cyan-200/30 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="text-center mb-6 flex-shrink-0">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Tu Análisis ROI
                </h3>
                <p className="text-slate-600 text-sm">Setterless 360° - {new Date().toLocaleDateString('es-ES')}</p>
              </div>
              
              {/* Content */}
              <div className="bg-white rounded-2xl p-6 shadow-inner border border-slate-100 flex-1 overflow-y-auto mb-6">
                <div className="prose prose-slate max-w-none">
                  {formatRoiResult(roiResult)}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-center flex-shrink-0">
                <button
                  onClick={() => setRoiResult(null)}
                  className="bg-gradient-to-r from-slate-500 to-slate-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-slate-400 hover:to-slate-500 transition-all duration-300 transform hover:scale-105"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido oculto para PDF */}
        {roiResult && (
          <div ref={pdfContentRef} className="fixed -top-[9999px] left-0 w-[800px] bg-white p-12 min-h-screen" style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px', lineHeight: '1.6' }}>
            {/* Header del PDF */}
            <div className="text-center mb-12">
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0891b2', marginBottom: '8px' }}>ANÁLISIS ROI</h1>
              <h2 style={{ fontSize: '20px', color: '#64748b', marginBottom: '16px' }}>Setterless 360°</h2>
              <div style={{ width: '100%', height: '2px', backgroundColor: '#0891b2', marginBottom: '16px' }}></div>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Generado el: {new Date().toLocaleDateString('es-ES')}</p>
            </div>
            
            {/* Contenido del PDF */}
            <div style={{ color: '#1e293b', lineHeight: '1.8' }}>
              {roiResult.split('\n').filter(line => line.trim()).map((line, index) => {
                const trimmed = line.trim();
                
                // Títulos principales (con emojis)
                if (trimmed.includes('🙌') || trimmed.includes('📈') || trimmed.includes('💰') || trimmed.includes('⏰') || trimmed.includes('🎯')) {
                  const cleanTitle = trimmed.replace(/[🙌📈💰⏰🎯]/g, '').trim();
                  return (
                    <h2 key={index} style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#0891b2', 
                      textAlign: 'center', 
                      marginTop: '32px', 
                      marginBottom: '24px' 
                    }}>
                      {cleanTitle}
                    </h2>
                  );
                }
                
                // Subtítulos
                if (trimmed.endsWith(':') || trimmed.endsWith('?')) {
                  return (
                    <h3 key={index} style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: '#334155', 
                      marginTop: '24px', 
                      marginBottom: '12px' 
                    }}>
                      {trimmed}
                    </h3>
                  );
                }
                
                // Elementos de lista
                if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                  return (
                    <div key={index} style={{ 
                      marginLeft: '24px', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ color: '#0891b2', marginRight: '8px', fontSize: '18px' }}>•</span>
                      <span>{trimmed.substring(1).trim()}</span>
                    </div>
                  );
                }
                
                // Párrafos normales
                return (
                  <p key={index} style={{ 
                    marginBottom: '16px', 
                    textAlign: 'justify',
                    fontSize: '16px'
                  }}>
                    {trimmed}
                  </p>
                );
              })}
            </div>
            
            {/* Footer del PDF */}
            <div style={{ 
              marginTop: '48px', 
              paddingTop: '16px', 
              borderTop: '1px solid #e2e8f0', 
              textAlign: 'center' 
            }}>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Setterless 360° - Análisis ROI</p>
            </div>
          </div>
        )}

        {/* Título con efecto futurista */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-4 tracking-tight">
            Calculadora ROI
          </h1>
          <div className="text-xl sm:text-2xl font-semibold text-slate-700 mb-4">
            Setterless 360°
          </div>
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full mb-6"></div>
          
          {/* Texto explicativo */}
          <div className="max-w-md mx-auto mb-8">
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed text-center">
              Las cifras que brindes nos permitirán construir un <span className="font-semibold text-cyan-600">Roadmap de Implementación</span>. Con el objetivo de recuperar consultas y liberar tiempo. Y así en los próximos <span className="font-semibold text-cyan-600">90 días</span> mejorar drásticamente los resultados de la metodología de trabajo actual.
            </p>
          </div>
        </div>

        {/* Card del formulario con glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl border border-cyan-200/30 p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 relative overflow-hidden">
          {/* Efecto de brillo interno */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-blue-50/30 rounded-3xl"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 relative z-10">
            {/* Número de consultas mensuales */}
            <div className="group">
              <label htmlFor="consultas" className="block text-sm font-semibold text-black mb-3 group-focus-within:text-cyan-600 transition-colors duration-200">
                Número de consultas mensuales? *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="consultas"
                  name="consultas"
                  value={formData.consultas}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-white/60 backdrop-blur-sm border border-cyan-200/40 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:bg-white/70 transition-all duration-300 group-focus-within:shadow-lg group-focus-within:shadow-cyan-500/20 text-sm sm:text-base"
                  placeholder="Ej: 100"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-teal-500/0 group-focus-within:from-cyan-500/10 group-focus-within:via-blue-500/5 group-focus-within:to-teal-500/10 transition-all duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Cuántas se convierten en visitas */}
            <div className="group">
              <label htmlFor="consultasConversion" className="block text-sm font-semibold text-black mb-3 group-focus-within:text-cyan-600 transition-colors duration-200">
                Cuántas de estas consultas se convierten en visitas reales?
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="consultasConversion"
                  name="consultasConversion"
                  value={formData.consultasConversion}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-white/60 backdrop-blur-sm border border-cyan-200/40 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:bg-white/70 transition-all duration-300 group-focus-within:shadow-lg group-focus-within:shadow-cyan-500/20 text-sm sm:text-base"
                  placeholder="Ej: 10"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-teal-500/0 group-focus-within:from-cyan-500/10 group-focus-within:via-blue-500/5 group-focus-within:to-teal-500/10 transition-all duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Oportunidades perdidas */}
            <div className="group">
              <label htmlFor="oportunidadesPerdidas" className="block text-sm font-semibold text-black mb-3 group-focus-within:text-cyan-600 transition-colors duration-200">
                ¿Cuántas oportunidades crees que se pierden por no responder a tiempo o por falta de seguimiento? *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="oportunidadesPerdidas"
                  name="oportunidadesPerdidas"
                  value={formData.oportunidadesPerdidas}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-white/60 backdrop-blur-sm border border-cyan-200/40 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:bg-white/70 transition-all duration-300 group-focus-within:shadow-lg group-focus-within:shadow-cyan-500/20 text-sm sm:text-base"
                  placeholder="Ej: 6"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-teal-500/0 group-focus-within:from-cyan-500/10 group-focus-within:via-blue-500/5 group-focus-within:to-teal-500/10 transition-all duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Tiempo semanal */}
            <div className="group">
              <label htmlFor="tiempoSemanal" className="block text-sm font-semibold text-black mb-3 group-focus-within:text-cyan-600 transition-colors duration-200">
                ¿Cuánto tiempo dedicas tú o tu equipo a responder consultas cada semana? (en horas)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="tiempoSemanal"
                  name="tiempoSemanal"
                  value={formData.tiempoSemanal}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-white/60 backdrop-blur-sm border border-cyan-200/40 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:bg-white/70 transition-all duration-300 group-focus-within:shadow-lg group-focus-within:shadow-cyan-500/20 text-sm sm:text-base"
                  placeholder="Ej: 10"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-teal-500/0 group-focus-within:from-cyan-500/10 group-focus-within:via-blue-500/5 group-focus-within:to-teal-500/10 transition-all duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Ticket promedio */}
            <div className="group">
              <label htmlFor="ticket" className="block text-sm font-semibold text-black mb-3 group-focus-within:text-cyan-600 transition-colors duration-200">
                Ticket promedio por cliente (USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="ticket"
                  name="ticket"
                  value={formData.ticket}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-white/60 backdrop-blur-sm border border-cyan-200/40 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:bg-white/70 transition-all duration-300 group-focus-within:shadow-lg group-focus-within:shadow-cyan-500/20 text-sm sm:text-base"
                  placeholder="Ej: 5000"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-teal-500/0 group-focus-within:from-cyan-500/10 group-focus-within:via-blue-500/5 group-focus-within:to-teal-500/10 transition-all duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Mensaje de estado */}
            {message && (
              <div className={`p-4 rounded-xl text-center font-semibold backdrop-blur-sm border transition-all duration-300 ${
                message.type === 'success' 
                  ? 'bg-green-50/80 text-green-700 border-green-300/50 shadow-lg shadow-green-400/20' 
                  : 'bg-red-50/80 text-red-700 border-red-300/50 shadow-lg shadow-red-400/20'
              }`}>
                {message.text}
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 text-white font-bold py-3 px-4 sm:py-4 sm:px-6 rounded-xl hover:from-cyan-400 hover:via-blue-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-cyan-500/25 group text-sm sm:text-base"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative z-10">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Calculando tu ROI...
                  </div>
                ) : (
                  'Calcular ROI'
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Texto adicional */}
        <p className="text-center text-slate-600 text-xs sm:text-sm mt-6 sm:mt-8 font-medium">
          * Campos obligatorios
        </p>
      </div>
    </div>
  );
}


