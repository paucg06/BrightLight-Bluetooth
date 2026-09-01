<div align="center">
  <a href="https://paucg06.github.io/BrightLight-Bluetooth/">
    <img src="icon.png" width="100" height="100" alt="BrightLight Logo" style="border-radius: 20px;" />
  </a>

  # <a href="https://paucg06.github.io/BrightLight-Bluetooth/" style="text-decoration: none; color: inherit;">BrightLight ↗</a>

  **Controlador Web Bluetooth para bombillas y tiras LED (Triones / HappyLighting / IP66)**

  <p>
    <a href="https://paucg06.github.io/BrightLight-Bluetooth/">
      <img src="https://img.shields.io/badge/Web-Abrir_Aplicación-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Web" />
    </a>
    <a href="https://developer.mozilla.org/es/docs/Web/API/Web_Bluetooth_API">
      <img src="https://img.shields.io/badge/Web_Bluetooth-API_Standard-0ea5e9?style=for-the-badge&logo=bluetooth&logoColor=white" alt="Web Bluetooth API" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/Licencia-MIT-10b981?style=for-the-badge" alt="Licencia MIT" />
    </a>
  </p>
</div>

---

## Demostración Visual

### 1. Conexión Bluetooth y Gestión Multi-Dispositivo
Emparejamiento directo mediante Web Bluetooth API. Permite conectar y sincronizar múltiples bombillas en una misma sesión o gestionarlas de manera individual.

<div align="center">
  <img src="assets/bluetooth_conect.png" width="85%" alt="Conexión Bluetooth y Multi-Luz" style="border-radius: 10px;" />
</div>

<br />

### 2. Control de Color y Regulación de Brillo
Selector cromático continuo con previsualización en tiempo real y paleta rápida de 12 colores esenciales con regulación de potencia del 1% al 100%.

<div align="center">
  <img src="assets/color_brillo.png" width="45%" alt="Paleta de colores y control de potencia" style="border-radius: 8px;" />
  &nbsp;&nbsp;
  <img src="assets/color_brillo_especial.png" width="45%" alt="Selector de color especial" style="border-radius: 8px;" />
</div>

<br />

### 3. Modos Dinámicos y Secuencias Personalizadas
Efectos integrados (Fundido Multicolor, Salto de colores, Estrobo, Pulso) y un motor de secuencias custom para encadenar colores personalizados con transiciones de velocidad regulable.

<div align="center">
  <img src="assets/efect_dinamicos.png" width="85%" alt="Efectos dinámicos y secuencias personalizadas" style="border-radius: 10px;" />
</div>

<br />

### 4. Registro de Comunicación BLE en Tiempo Real
Consola de diagnóstico minimalista para monitorizar los paquetes de bytes enviados al hardware.

<div align="center">
  <img src="assets/reg_comunic_BLE.png" width="85%" alt="Registro de comunicación BLE" style="border-radius: 10px;" />
</div>

---

## Características Técnicas

- **Sin dependencias de backend**: Ejecución 100% en el lado del cliente a través del navegador.
- **Compatibilidad de protocolo**: Comunicación directa con el servicio GATT `0xFFD5` y la característica de escritura `0xFFD9` (protocolos Triones, HappyLighting y QHM).
- **Interfaz moderna**: Diseño oscuro con tipografía *Plus Jakarta Sans* e iconografía vectorial SVG nativa.
- **Compatibilidad**: Compatible con Google Chrome, Microsoft Edge y Opera en Windows, macOS, Linux y Android.

---

## Licencia

Distribuido bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
