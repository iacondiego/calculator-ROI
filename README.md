# Calculadora ROI Setterless 360°

Formulario moderno y responsivo para calcular ROI inmobiliario desarrollado con Next.js 14, React y Tailwind CSS.

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 3. Build para producción
```bash
npm run build
npm start
```

## 📋 Características

- ✅ Formulario responsivo y moderno
- ✅ Validación de campos en tiempo real
- ✅ Envío de datos vía POST a webhook
- ✅ Mensajes de éxito y error
- ✅ Diseño limpio y profesional
- ✅ Optimizado para móvil y desktop

## 🛠️ Integración en Proyecto Existente

### Opción 1: Usar el componente directamente

```tsx
import CalculadoraROI from './components/CalculadoraROI';

export default function MiPagina() {
  return (
    <div>
      <CalculadoraROI />
    </div>
  );
}
```

### Opción 2: Integrar en una página existente

```tsx
import CalculadoraROI from './components/CalculadoraROI';

export default function LandingPage() {
  return (
    <main>
      {/* Tu contenido existente */}
      <section className="py-16">
        <CalculadoraROI />
      </section>
      {/* Más contenido */}
    </main>
  );
}
```

### Opción 3: Usar como modal o popup

```tsx
import { useState } from 'react';
import CalculadoraROI from './components/CalculadoraROI';

export default function ConModal() {
  const [showCalculadora, setShowCalculadora] = useState(false);

  return (
    <>
      <button onClick={() => setShowCalculadora(true)}>
        Abrir Calculadora ROI
      </button>
      
      {showCalculadora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative max-w-md w-full mx-4">
            <button 
              onClick={() => setShowCalculadora(false)}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg z-10"
            >
              ✕
            </button>
            <CalculadoraROI />
          </div>
        </div>
      )}
    </>
  );
}
```

## 📦 Estructura de Archivos

```
├── app/
│   ├── globals.css          # Estilos de Tailwind
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página principal
├── components/
│   └── CalculadoraROI.tsx   # Componente principal
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 🎨 Personalización

### Cambiar colores
Edita `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      'blue-primary': '#tu-color-aqui',
    },
  },
}
```

### Modificar webhook
Edita la URL en `components/CalculadoraROI.tsx`, línea 61:

```tsx
const response = await fetch('TU_WEBHOOK_URL', {
  // ...
});
```

## 📱 Campos del Formulario

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| consultas | number | ✅ | Número de consultas mensuales |
| conversion | number | ✅ | % de conversión (0-100) |
| ticket | number | ❌ | Ticket promedio (opcional) |
| telefono | tel | ✅ | Número de teléfono |

## 🔗 API Webhook

**Endpoint:** `https://devwebhook.iacondiego.es/webhook/c04ec428-b03e-48ea-af9b-e0551d7a6e59`

**Método:** POST

**Body (JSON):**
```json
{
  "consultas": 100,
  "conversion": 25.5,
  "ticket": 500000,
  "telefono": "+34 600 123 456"
}
```

## 🎯 Tecnologías Utilizadas

- **Next.js 14** - Framework de React
- **React 18** - Biblioteca de interfaz de usuario
- **Tailwind CSS** - Framework de CSS
- **TypeScript** - Tipado estático
- **Fetch API** - Para peticiones HTTP

## 📄 Licencia

Este proyecto está creado para uso específico de Setterless 360°.


