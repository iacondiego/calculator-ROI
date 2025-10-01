/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Configuración para manejar html2pdf.js en el servidor
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'html2pdf.js': 'html2pdf.js'
      });
    }
    return config;
  },
}

module.exports = nextConfig
