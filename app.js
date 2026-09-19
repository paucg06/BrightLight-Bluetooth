const connectedDevices = new Map();
let currentColor = { r: 255, g: 255, b: 255 };
let currentBrightness = 100;
let throttleTimeout = null;

const btnConnect = document.getElementById('btnConnect');
const btnAddAnother = document.getElementById('btnAddAnother');
const initialConnectBox = document.getElementById('initialConnectBox');
const devicesContainer = document.getElementById('devicesContainer');
const devicesList = document.getElementById('devicesList');
const targetModeBar = document.getElementById('targetModeBar');
const targetSelect = document.getElementById('targetSelect');

const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const btnPowerOn = document.getElementById('btnPowerOn');
const btnPowerOff = document.getElementById('btnPowerOff');
const colorPicker = document.getElementById('colorPicker');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');
const bulbPreview = document.getElementById('bulbPreview');
const modeSelector = document.getElementById('modeSelector');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const logBox = document.getElementById('logBox');
const btnClearLog = document.getElementById('btnClearLog');

function log(msg, type = 'normal') {
  if (!logBox) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  entry.textContent = `[${time}] ${msg}`;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
}

btnClearLog.addEventListener('click', () => { logBox.innerHTML = ''; });

function updateGlow(r, g, b, brightness) {
  const scale = brightness / 100;
  const displayR = Math.round(r * scale);
  const displayG = Math.round(g * scale);
  const displayB = Math.round(b * scale);
  const hex = `rgb(${displayR}, ${displayG}, ${displayB})`;
  bulbPreview.style.background = hex;
  bulbPreview.style.boxShadow = `0 0 35px ${hex}`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

let gattQueue = Promise.resolve();

function sendCommand(bytes, label = "Comando") {
  if (connectedDevices.size === 0) {
    log(`No hay dispositivo conectado para enviar: ${label}`, 'error');
    return Promise.resolve();
  }

  const target = targetSelect ? targetSelect.value : 'ALL';
  const hexDump = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  let targets = [];
  if (target === 'ALL') {
    targets = Array.from(connectedDevices.values());
  } else if (connectedDevices.has(target)) {
    targets = [connectedDevices.get(target)];
  }

  // Encolar operaciones Bluetooth secuencialmente para evitar 'GATT operation already in progress'
  gattQueue = gattQueue.then(async () => {
    for (const item of targets) {
      try {
        if (!item.char || !item.device || !item.device.gatt.connected) continue;
        log(`TX [${item.name}]: ${hexDump} (${label})`, 'tx');
        if (item.char.writeValueWithoutResponse) {
          await item.char.writeValueWithoutResponse(bytes);
        } else {
          await item.char.writeValueWithResponse(bytes);
        }
        // Pequeña pausa de seguridad (35ms) para que el chip Bluetooth procese la trama
        await new Promise(r => setTimeout(r, 35));
      } catch (err) {
        log(`Error enviando a ${item.name}: ${err.message}`, 'error');
      }
    }
  }).catch(err => {
    console.error("GATT Queue error:", err);
  });

  return gattQueue;
}

async function connectBluetooth() {
  if (!navigator.bluetooth) {
    log("Web Bluetooth no soportado. Usa Google Chrome o Microsoft Edge.", "error");
    alert("Tu navegador no soporta Web Bluetooth. Abre esta página en Google Chrome o Microsoft Edge.");
    return;
  }

  log("Buscando dispositivos Bluetooth...", "info");

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        0xFFD5, 0xFFD0, 0xFFE0, 0xFFF0,
        '0000ffd5-0000-1000-8000-00805f9b34fb',
        '0000ffd0-0000-1000-8000-00805f9b34fb',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000fff0-0000-1000-8000-00805f9b34fb'
      ]
    });

    if (connectedDevices.has(device.id)) {
      log(`El dispositivo ${device.name || device.id} ya está conectado.`, 'info');
      return;
    }

    const deviceNameStr = device.name || `Luz #${connectedDevices.size + 1}`;
    log(`Conectando a ${deviceNameStr}...`, 'info');
    const server = await device.gatt.connect();

    log("Descubriendo servicios...", "info");
    const services = await server.getPrimaryServices();
    let targetChar = null;

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            targetChar = char;
            if (char.uuid.includes('ffd9') || char.uuid.includes('ffe1') || char.uuid.includes('fff3')) {
              break;
            }
          }
        }
      } catch (e) {}
      if (targetChar && targetChar.uuid.includes('ffd9')) break;
    }

    if (!targetChar) {
      throw new Error("No se encontró característica de escritura compatible.");
    }

    const entry = {
      device: device,
      server: server,
      char: targetChar,
      name: deviceNameStr,
      id: device.id
    };

    connectedDevices.set(device.id, entry);

    device.addEventListener('gattserverdisconnected', () => {
      log(`Dispositivo desconectado: ${entry.name}`, 'error');
      connectedDevices.delete(device.id);
      renderDevices();
    });

    log(`¡Conectado exitosamente con ${entry.name}!`, 'success');
    renderDevices();
    sendRGB(currentColor.r, currentColor.g, currentColor.b, currentBrightness);

  } catch (error) {
    log(`Error al conectar: ${error.message}`, 'error');
  }
}

function disconnectDevice(id) {
  if (connectedDevices.has(id)) {
    const item = connectedDevices.get(id);
    if (item.device && item.device.gatt.connected) {
      item.device.gatt.disconnect();
    }
    connectedDevices.delete(id);
    renderDevices();
  }
}

function renderDevices() {
  const count = connectedDevices.size;
  devicesList.innerHTML = '';

  if (count === 0) {
    statusBadge.classList.remove('connected');
    statusText.textContent = 'Desconectado';
    initialConnectBox.style.display = 'block';
    devicesContainer.style.display = 'none';
    targetModeBar.style.display = 'none';
  } else {
    statusBadge.classList.add('connected');
    statusText.textContent = `${count} Luz${count > 1 ? 'ces' : ''} Conectada${count > 1 ? 's' : ''}`;
    initialConnectBox.style.display = 'none';
    devicesContainer.style.display = 'block';

    connectedDevices.forEach((item, id) => {
      const chip = document.createElement('div');
      chip.className = 'device-chip';
      chip.innerHTML = `
        <div class="device-chip-info">
          <svg class="icon-svg" style="color:var(--accent);" viewBox="0 0 24 24"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          <span>${item.name}</span>
        </div>
        <div class="device-chip-actions">
          <button class="btn-chip-disconnect" onclick="disconnectDevice('${id}')">Desconectar</button>
        </div>
      `;
      devicesList.appendChild(chip);
    });

    if (count > 1) {
      targetModeBar.style.display = 'flex';
      targetSelect.innerHTML = `<option value="ALL">Todas las luces (${count})</option>`;
      connectedDevices.forEach((item, id) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = `Solo ${item.name}`;
        targetSelect.appendChild(opt);
      });
    } else {
      targetModeBar.style.display = 'none';
      targetSelect.innerHTML = '<option value="ALL">Todas las luces</option>';
    }
  }
}

// Configuración de Secuencia Personalizada con persistencia en LocalStorage
function loadCustomColors() {
  try {
    const saved = localStorage.getItem('brightlight_custom_colors');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error cargando customColors de localStorage', e);
  }
  return ['#00ff00', '#ff0000', '#ffff00'];
}

function saveCustomColors() {
  try {
    localStorage.setItem('brightlight_custom_colors', JSON.stringify(customColors));
  } catch (e) {
    console.warn('Error guardando customColors en localStorage', e);
  }
}

let customColors = loadCustomColors();
let customLoopInterval = null;
let customIndex = 0;
let isPresetRunning = false;

const customEffectsBox = document.getElementById('customEffectsBox');
const customColorsTrack = document.getElementById('customColorsTrack');
const btnStartEffect = document.getElementById('btnStartEffect');
const btnStopEffect = document.getElementById('btnStopEffect');
const customLoopStatus = document.getElementById('customLoopStatus');
const customTransitionType = document.getElementById('customTransitionType');

window.disconnectDevice = disconnectDevice;

function powerOn() {
  stopCustomSequence();
  isPresetRunning = false;
  btnStopEffect.classList.remove('active');
  updateGlow(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
  sendCommand(new Uint8Array([0xCC, 0x23, 0x33]), "Encender");
  // Restaurar color tras encender
  setTimeout(() => {
    sendRGB(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
  }, 50);
}

function powerOff() {
  stopCustomSequence();
  isPresetRunning = false;
  modeSelector.value = "0x00";
  customEffectsBox.style.display = 'none';
  btnStopEffect.classList.remove('active');
  if (bulbPreview) {
    bulbPreview.style.background = '#111827';
    bulbPreview.style.boxShadow = 'none';
  }
  sendCommand(new Uint8Array([0xCC, 0x24, 0x33]), "Apagar");
}

function sendRGB(r, g, b, brightness) {
  const scale = brightness / 100;
  const scaledR = Math.round(r * scale);
  const scaledG = Math.round(g * scale);
  const scaledB = Math.round(b * scale);
  sendCommand(new Uint8Array([0x56, scaledR, scaledG, scaledB, 0x00, 0xF0, 0xAA]), `RGB(${scaledR},${scaledG},${scaledB})`);
}

function sendMode(modeHex, speedVal) {
  stopCustomSequence();
  const mode = parseInt(modeHex, 16);
  if (isNaN(mode) || mode === 0) return;
  const speed = 32 - speedVal;
  sendCommand(new Uint8Array([0xBB, mode, speed, 0x44]), `Modo 0x${mode.toString(16).toUpperCase()}`);
}

function throttledSendColor() {
  if (throttleTimeout) return;
  throttleTimeout = setTimeout(() => {
    sendRGB(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
    throttleTimeout = null;
  }, 50);
}

function updateSpeedLabel(val) {
  if (val <= 10) {
    speedValue.textContent = 'Lento';
  } else if (val <= 21) {
    speedValue.textContent = 'Medio';
  } else {
    speedValue.textContent = 'Rápido';
  }
}

// GESTIÓN DE SECUENCIA PERSONALIZADA
function renderCustomColors() {
  customColorsTrack.innerHTML = '';
  customColors.forEach((color, idx) => {
    const chip = document.createElement('div');
    chip.className = 'custom-color-chip';
    chip.style.backgroundColor = color;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = color;
    input.addEventListener('input', (e) => {
      customColors[idx] = e.target.value;
      chip.style.backgroundColor = e.target.value;
      saveCustomColors();
      if (customLoopStatus.textContent === 'Ejecutando') {
        startCustomSequence();
      }
    });

    chip.appendChild(input);

    if (customColors.length > 2) {
      const delBtn = document.createElement('div');
      delBtn.className = 'chip-delete-btn';
      delBtn.innerHTML = `<svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:#fff;stroke-width:3;fill:none;display:block;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      delBtn.title = 'Eliminar color';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        customColors.splice(idx, 1);
        saveCustomColors();
        renderCustomColors();
        if (customLoopStatus.textContent === 'Ejecutando') {
          startCustomSequence();
        }
      });
      chip.appendChild(delBtn);
    }

    customColorsTrack.appendChild(chip);
  });

  if (customColors.length < 6) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-color-chip';
    addBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    addBtn.title = 'Añadir color a la secuencia';
    addBtn.addEventListener('click', () => {
      const palette = ['#00ffff', '#ff6600', '#ff00ff', '#ffffff', '#8b5cf6'];
      const next = palette[customColors.length % palette.length];
      customColors.push(next);
      saveCustomColors();
      renderCustomColors();
      if (customLoopStatus.textContent === 'Ejecutando') {
        startCustomSequence();
      }
    });
    customColorsTrack.appendChild(addBtn);
  }
}

function stopCustomSequence() {
  if (customLoopInterval) {
    clearInterval(customLoopInterval);
    customLoopInterval = null;
  }
  customLoopStatus.textContent = 'Inactivo';
  customLoopStatus.style.color = 'var(--text-dim)';
}

function stopAllEffects() {
  stopCustomSequence();
  isPresetRunning = false;
  modeSelector.value = "0x00";
  customEffectsBox.style.display = 'none';
  btnStopEffect.classList.remove('active');
  sendRGB(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
}

function startCustomSequence() {
  stopCustomSequence();
  if (customColors.length === 0) return;

  isPresetRunning = false;
  customLoopStatus.textContent = 'Ejecutando';
  customLoopStatus.style.color = 'var(--success)';
  btnStopEffect.classList.add('active');

  const transition = customTransitionType.value;
  const speedVal = parseInt(speedSlider.value, 10);
  // Mapear slider 1-31 a tiempo por paso (4000ms a 500ms)
  const durationMs = Math.round(4000 - ((speedVal - 1) / 30) * 3500);
  customIndex = 0;

  function step() {
    const fromHex = customColors[customIndex];
    customIndex = (customIndex + 1) % customColors.length;
    const toHex = customColors[customIndex];

    const fromRgb = hexToRgb(fromHex);
    const toRgb = hexToRgb(toHex);

    if (transition === 'jump') {
      currentColor = toRgb;
      updateGlow(toRgb.r, toRgb.g, toRgb.b, currentBrightness);
      sendRGB(toRgb.r, toRgb.g, toRgb.b, currentBrightness);
    } else if (transition === 'strobe') {
      currentColor = toRgb;
      updateGlow(toRgb.r, toRgb.g, toRgb.b, currentBrightness);
      sendRGB(toRgb.r, toRgb.g, toRgb.b, currentBrightness);
      setTimeout(() => {
        if (customLoopStatus.textContent === 'Ejecutando') {
          sendRGB(0, 0, 0, 0);
        }
      }, Math.min(150, durationMs / 4));
    } else {
      // Fade suave interpolando
      const steps = 14;
      const stepTime = durationMs / steps;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        currentStep++;
        const factor = currentStep / steps;
        const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * factor);
        const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * factor);
        const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * factor);

        currentColor = { r, g, b };
        updateGlow(r, g, b, currentBrightness);

        if (currentStep % 2 === 0 || currentStep === steps) {
          sendRGB(r, g, b, currentBrightness);
        }

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
        }
      }, stepTime);
    }
  }

  step();
  customLoopInterval = setInterval(step, durationMs);
  log(`Secuencia personalizada iniciada (${transition}, ${durationMs}ms)`, 'info');
}

// Eventos
btnConnect.addEventListener('click', connectBluetooth);
btnAddAnother.addEventListener('click', connectBluetooth);
btnPowerOn.addEventListener('click', powerOn);
btnPowerOff.addEventListener('click', powerOff);

colorPicker.addEventListener('input', (e) => {
  stopAllEffects();
  currentColor = hexToRgb(e.target.value);
  updateGlow(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
  throttledSendColor();
});

brightnessSlider.addEventListener('input', (e) => {
  currentBrightness = parseInt(e.target.value, 10);
  brightnessValue.textContent = `${currentBrightness}%`;
  updateGlow(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
  throttledSendColor();
});

document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    stopAllEffects();
    const hex = dot.getAttribute('data-color');
    currentColor = hexToRgb(hex);
    colorPicker.value = hex;
    updateGlow(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
    sendRGB(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
  });
});

modeSelector.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === 'custom') {
    stopCustomSequence();
    isPresetRunning = false;
    customEffectsBox.style.display = 'flex';
  } else {
    customEffectsBox.style.display = 'none';
    stopCustomSequence();
    if (val !== '0x00') {
      sendMode(val, parseInt(speedSlider.value, 10));
      isPresetRunning = true;
      btnStopEffect.classList.add('active');
    } else {
      isPresetRunning = false;
      btnStopEffect.classList.remove('active');
      sendRGB(currentColor.r, currentColor.g, currentColor.b, currentBrightness);
    }
  }
});

speedSlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  updateSpeedLabel(val);
  if (modeSelector.value === 'custom') {
    if (customLoopStatus.textContent === 'Ejecutando') {
      startCustomSequence();
    }
  } else if (modeSelector.value !== '0x00' && isPresetRunning) {
    sendMode(modeSelector.value, val);
  }
});

btnStartEffect.addEventListener('click', () => {
  const mode = modeSelector.value;
  if (mode === 'custom') {
    startCustomSequence();
  } else if (mode !== '0x00') {
    sendMode(mode, parseInt(speedSlider.value, 10));
    isPresetRunning = true;
    btnStopEffect.classList.add('active');
  } else {
    modeSelector.value = '0x25';
    sendMode('0x25', parseInt(speedSlider.value, 10));
    isPresetRunning = true;
    btnStopEffect.classList.add('active');
  }
});

btnStopEffect.addEventListener('click', () => {
  stopAllEffects();
});

customTransitionType.addEventListener('change', () => {
  if (customLoopStatus.textContent === 'Ejecutando') {
    startCustomSequence();
  }
});

// Inicializaciones
renderCustomColors();
updateSpeedLabel(parseInt(speedSlider.value, 10));
updateGlow(255, 255, 255, 100);
log("BrightLight listo. Haz clic en 'Conectar Luz' para emparejar.", "info");
