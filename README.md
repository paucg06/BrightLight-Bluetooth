# 💡 BrightLight - Smart Bluetooth LED Controller

[![Web Bluetooth](https://img.shields.io/badge/Web%20Bluetooth-API-0ea5e9?style=flat-square&logo=bluetooth)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
[![No Installation Required](https://img.shields.io/badge/Zero%20Install-Browser%20Ready-10b981?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**BrightLight** es un controlador web moderno e intuitivo para gestionar bombillas y tiras LED Bluetooth (BLE) compatibles con los protocolos **Triones**, **HappyLighting**, **QHM** y controladores LED BLE genéricos (IP66).

Funciona directamente desde el navegador web mediante la **Web Bluetooth API**, sin requerir instalación de programas externos, controladores ni servidores locales.

---

## ✨ Características Principales

- ⚡ **Acceso Directo y Seguro**: Conexión instantánea a través de navegadores con soporte Web Bluetooth (**Google Chrome**, **Microsoft Edge**, **Opera**).
- 💡 **Gestión Multi-Luz**: Empareja y controla múltiples bombillas simultáneamente en modo sincronizado o individual.
- 🎨 **Selector de Color & Potencia**:
  - Rueda cromática con vista previa en tiempo real.
  - Paleta de 12 colores rápidos predefinidos (blanco cálido, frío, primarios y secundarios).
  - Regulación continua de brillo (1% a 100%).
- 🌈 **Efectos Predefinidos & Secuencias Personalizadas**:
  - Efectos esenciales integrados: *Fundido Arcoíris*, *Salto de 7 Colores*, *Estrobo Blanco* y *Pulso Suave*.
  - **Creador de Secuencias Custom**: Selecciona una cadena de colores personalizada (ej. Verde ➔ Rojo ➔ Amarillo), define la velocidad y el tipo de transición (*Fade suave*, *Salto directo* o *Flash*).
- 📡 **Consola de Diagnóstico BLE**: Registro desplegable y minimalista para inspeccionar en tiempo real los paquetes transmitidos al hardware.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 & CSS3 Moderno**: Diseño responsivo con paleta oscura, efecto de brillo neon y tipografía *Plus Jakarta Sans*.
- **JavaScript Vanilla (ES6+)**: Comunicación GATT / BLE directa y motor de interpolación de color.
- **Web Bluetooth API**: Protocolo de comunicación con servicios `0xFFD5` y características de escritura `0xFFD9`.

---

## 🚀 Despliegue en GitHub Pages

Para publicar tu propia versión en la web:

1. Ve a la pestaña **Settings** > **Pages** en tu repositorio:
   `https://github.com/paucg06/BrightLight-Bluetooth/settings/pages`
2. En la sección **Build and deployment > Source**, selecciona **Deploy from a branch**.
3. Selecciona la rama **`main`** y la carpeta **`/ (root)`**.
4. Haz clic en **Save**.
5. En unos segundos tu aplicación estará activa y disponible con HTTPS en:
   👉 **`https://paucg06.github.io/BrightLight-Bluetooth/`**

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
