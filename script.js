let currentPlaca = '';
let currentData = {};
let currentTipoAutorizacion = '';

// Función para obtener el texto del tipo de autorización
function getTipoAutorizacionText(value, customText = '') {
    const tipos = {
        'aut-est-liviano': 'Estacionamiento Liviano',
        'aut-est-pesado': 'Estacionamiento Pesado',
        'carga-des-liviano': 'Carga y Descarga Liviana',
        'carga-des-pesado': 'Carga y Descarga Pesada',
        'circulacion-liviana': 'Circulación Liviana',
        'circulacion-pesada': 'Circulación Pesada',
        'circulacion-esc-pesado': 'Circulación Escolar Pesado',
        'otro': customText || 'Otro'
    };
    return tipos[value] || 'No especificado';
}

// Función para validar correo electrónico
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar teléfono ecuatoriano (solo móviles que comienzan con 09)
function validateTelefono(telefono) {
    // Eliminar espacios, guiones y paréntesis
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
    
    // Validar que solo contenga números y tenga 10 dígitos que comiencen con 09
    return /^09\d{8}$/.test(telefonoLimpio);
}

// Función para verificar si la autorización está caducada
function isAuthorizationExpired(caducidad) {
    const caducidadDate = new Date(caducidad);
    const today = new Date();
    
    // La autorización caduca al día siguiente de la fecha de caducidad a las 00:00 AM
    const fechaCaducidad = new Date(caducidadDate);
    fechaCaducidad.setDate(fechaCaducidad.getDate() + 1); // Sumar 1 día
    fechaCaducidad.setHours(0, 0, 0, 0); // Establecer a 00:00 AM
    
    return today >= fechaCaducidad;
}

// Función para mostrar alerta de caducidad
function showExpirationAlert() {
    alert('⚠️ SU AUTORIZACIÓN HA CADUCADO\n\nSu permiso ya no está vigente. Por favor, renueve su autorización para continuar utilizando este servicio.');
}

function mostrarInputID() {
    const tipo = document.getElementById('tipo-id').value;
    const container = document.getElementById('input-id-container');

    container.innerHTML = '';
    if (tipo === 'cedula') {
        container.innerHTML = `
            <label for="cedula-input">Cédula (10 dígitos)</label>
            <input type="text" id="cedula-input" placeholder="Cédula" oninput="this.value = this.value.replace(/[^0-9]/g, '')" maxlength="10">
        `;
    } else if (tipo === 'ruc') {
        container.innerHTML = `
            <label for="ruc-input">RUC (13 dígitos)</label>
            <input type="text" id="ruc-input" placeholder="RUC" oninput="this.value = this.value.replace(/[^0-9]/g, '')" maxlength="13">
        `;
    } else if (tipo === 'ambos') {
        container.innerHTML = `
            <label for="cedula-input">Cédula (10 dígitos)</label>
            <input type="text" id="cedula-input" placeholder="Cédula" oninput="this.value = this.value.replace(/[^0-9]/g, '')" maxlength="10">
            <label for="ruc-input" style="margin-top:10px;">RUC (13 dígitos)</label>
            <input type="text" id="ruc-input" placeholder="RUC" oninput="this.value = this.value.replace(/[^0-9]/g, '')" maxlength="13">
        `;
    }
}

function mostrarInputAutorizacion() {
    const autorizacion = document.getElementById('autorizacion-id').value;
    const container = document.getElementById('input-autorizacion-container');

    container.innerHTML = '';
    if (autorizacion === 'otro') {
        container.innerHTML = `
            <label for="otro-input">Especifique el tipo de autorización</label>
            <input type="text" id="otro-input" placeholder="Ingrese el tipo de autorización" maxlength="50">
        `;
    }
}

function validateAndGenerate() {
    const placa = document.getElementById('placa-input').value.trim();
    const nombre = document.getElementById('nombre-input').value.trim();
    const tipoID = document.getElementById('tipo-id').value;
    const autorizacionID = document.getElementById('autorizacion-id').value;
    const correo = document.getElementById('correo-input').value.trim();
    const telefono = document.getElementById('telefono-input').value.trim();
    
    let cedula = '';
    let ruc = '';
    
    if (tipoID === 'cedula') {
        cedula = document.getElementById('cedula-input') ? document.getElementById('cedula-input').value.trim() : '';
    } else if (tipoID === 'ruc') {
        ruc = document.getElementById('ruc-input') ? document.getElementById('ruc-input').value.trim() : '';
    } else if (tipoID === 'ambos') {
        cedula = document.getElementById('cedula-input') ? document.getElementById('cedula-input').value.trim() : '';
        ruc = document.getElementById('ruc-input') ? document.getElementById('ruc-input').value.trim() : '';
    }
    
    // Obtener el tipo de autorización
    let tipoAutorizacionTexto = '';
    if (autorizacionID === 'otro') {
        const otroInput = document.getElementById('otro-input');
        tipoAutorizacionTexto = otroInput ? otroInput.value.trim() : '';
    } else {
        tipoAutorizacionTexto = getTipoAutorizacionText(autorizacionID);
    }
    
    const autorizacion = document.getElementById('autorizacion-input').value.trim();
    const caducidad = document.getElementById('caducidad-input').value;
    const message = document.getElementById('result-message');
    const qrContainer = document.getElementById('qr-container');
    const authDetails = document.getElementById('auth-details');

    message.textContent = '';
    message.className = '';
    qrContainer.style.display = 'none';
    authDetails.style.display = 'none';

    // Validaciones básicas
    if (!nombre || !autorizacion || !caducidad || !tipoID || !autorizacionID || !correo || !telefono ||
        (tipoID === 'cedula' && !cedula) ||
        (tipoID === 'ruc' && !ruc) ||
        (tipoID === 'ambos' && (!cedula || !ruc)) ||
        (autorizacionID === 'otro' && !tipoAutorizacionTexto)) {
        message.textContent = 'Por favor, complete todos los campos requeridos.';
        message.className = 'error';
        return;
    }

    // Validar correo electrónico
    if (!validateEmail(correo)) {
        message.textContent = 'Por favor, ingrese un correo electrónico válido.';
        message.className = 'error';
        return;
    }

    // Validar teléfono (debe comenzar con 09 y tener 10 dígitos)
    if (!validateTelefono(telefono)) {
        message.textContent = 'El teléfono debe comenzar con 09 y tener 10 dígitos. Ejemplo: 0987654321';
        message.className = 'error';
        return;
    }

    // Validar que la fecha no sea del pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(caducidad);
    
    if (selectedDate < today) {
        message.textContent = 'La fecha de vigencia no puede ser anterior a la fecha actual.';
        message.className = 'error';
        return;
    }

    // Verificar si la autorización ya está caducada
    if (isAuthorizationExpired(caducidad)) {
        showExpirationAlert();
        message.textContent = 'La autorización ha caducado. No se puede generar el QR.';
        message.className = 'error';
        return;
    }

    // Validaciones de cédula y RUC
    if (tipoID === 'cedula' || tipoID === 'ambos') {
        if (cedula.length !== 10) {
            message.textContent = 'La cédula debe tener exactamente 10 dígitos.';
            message.className = 'error';
            return;
        }
        if (!validateEcuadorianID(cedula)) {
            message.textContent = 'La cédula ingresada no es válida.';
            message.className = 'error';
            return;
        }
    }
    if (tipoID === 'ruc' || tipoID === 'ambos') {
        if (ruc.length !== 13) {
            message.textContent = 'El RUC debe tener exactamente 13 dígitos.';
            message.className = 'error';
            return;
        }
    }

    currentPlaca = placa;
    currentTipoAutorizacion = tipoAutorizacionTexto;
    currentData = { 
        placa, 
        nombre, 
        cedula, 
        ruc, 
        correo,
        telefono,
        autorizacion, 
        caducidad,
        tipoAutorizacion: tipoAutorizacionTexto 
    };

    // Actualizar detalles mostrados (SOLO los campos requeridos)
    document.getElementById('auth-placa').textContent = placa;
    document.getElementById('auth-nombre').textContent = nombre;
    document.getElementById('auth-autorizacion').textContent = autorizacion;
    document.getElementById('auth-tipo-autorizacion').textContent = tipoAutorizacionTexto;
    document.getElementById('auth-caducidad').textContent = caducidad;

    message.textContent = '✅ Placa autorizada. Generando QR...';
    message.className = 'success';

    setTimeout(() => {
        const qrGenerated = generateQR();
        if (qrGenerated) {
            authDetails.style.display = 'block';
            message.textContent = '';
        } else {
            message.textContent = 'Error al generar el QR. Los datos pueden ser demasiado largos.';
            message.className = 'error';
            authDetails.style.display = 'none'; // No mostrar detalles si no hay QR
        }
    }, 1000);
}

function validateEcuadorianID(cedula) {
    return /^\d{10}$/.test(cedula) && cedula.startsWith('09');
}

// Función para comprimir datos en formato JSON compacto
function compressData(data) {
    const compressed = {
        p: data.placa, // placa
        n: data.nombre.substring(0, 15), // nombre (muy corto)
        a: data.autorizacion.substring(0, 20), // autorización (corto)
        c: data.caducidad, // caducidad
        ta: data.tipoAutorizacion.substring(0, 2), // tipo autorización (solo 2 chars)
        e: data.correo.substring(0, 15), // email (corto)
        t: data.telefono.replace(/[\s\-\(\)]/g, ''), // teléfono
        ci: data.cedula || '', // cédula
        r: data.ruc || '' // ruc
    };
    return JSON.stringify(compressed);
}

// Función para descomprimir datos
function decompressData(compressedString) {
    try {
        return JSON.parse(compressedString);
    } catch (e) {
        return null;
    }
}

function generateQR() {
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    qrContainer.style.display = 'flex';
    qrContainer.style.justifyContent = 'center';
    qrContainer.style.alignItems = 'center';

    if (isAuthorizationExpired(currentData.caducidad)) {
        showExpirationAlert();
        document.getElementById('result-message').textContent = 'No se puede generar QR: autorización caducada.';
        document.getElementById('result-message').className = 'error';
        return false;
    }

    let baseUrl = window.location.href.split('?')[0];
    baseUrl = baseUrl.replace('localhost', '192.168.137.2').replace('127.0.0.1', '192.168.137.2');
    
    // Método 1: Comprimir todos los datos en un JSON stringificado
    const compressedData = compressData(currentData);
    const authUrl = `${baseUrl}?d=${encodeURIComponent(compressedData)}`;
    
    console.log('Longitud URL QR:', authUrl.length);
    console.log('URL QR:', authUrl);

    if (authUrl.length > 800) {
        // Método 2: Si sigue siendo muy larga, usar solo datos esenciales
        const essentialData = {
            p: currentData.placa,
            n: currentData.nombre.substring(0, 10),
            a: currentData.autorizacion.substring(0, 15),
            c: currentData.caducidad,
            ta: getTipoAuthCode(currentData.tipoAutorizacion)
        };
        const essentialUrl = `${baseUrl}?d=${encodeURIComponent(JSON.stringify(essentialData))}`;
        
        console.log('URL esencial:', essentialUrl.length);
        
        if (essentialUrl.length > 800) {
            // Método 3: URL mínima absoluta
            const minimalData = `${currentData.placa}|${currentData.nombre.substring(0, 8)}|${currentData.autorizacion.substring(0, 10)}|${currentData.caducidad}|${getTipoAuthCode(currentData.tipoAutorizacion)}`;
            const minimalUrl = `${baseUrl}?m=${encodeURIComponent(minimalData)}`;
            
            console.log('URL mínima:', minimalUrl.length);
            
            if (minimalUrl.length > 800) {
                alert('Los datos son demasiado largos. Por favor, use textos más cortos en nombre y número de autorización.');
                return false;
            }
            
            return generateQRCode(qrContainer, minimalUrl);
        }
        
        return generateQRCode(qrContainer, essentialUrl);
    }
    
    return generateQRCode(qrContainer, authUrl);
}

// Función para obtener código corto de tipo de autorización
function getTipoAuthCode(tipo) {
    const codes = {
        'Estacionamiento Liviano': 'EL',
        'Estacionamiento Pesado': 'EP', 
        'Carga y Descarga Liviana': 'CL',
        'Carga y Descarga Pesada': 'CP',
        'Circulación Liviana': 'VL',
        'Circulación Pesada': 'VP',
        'Circulación Escolar Pesado': 'CE',
        'Otro': 'OT'
    };
    return codes[tipo] || 'OT';
}

// Función para obtener tipo de autorización desde código corto
function getTipoFromCode(code) {
    const types = {
        'EL': 'Estacionamiento Liviano',
        'EP': 'Estacionamiento Pesado',
        'CL': 'Carga y Descarga Liviana', 
        'CP': 'Carga y Descarga Pesada',
        'VL': 'Circulación Liviana',
        'VP': 'Circulación Pesada',
        'CE': 'Circulación Escolar Pesado',
        'OT': 'Otro'
    };
    return types[code] || 'Otro';
}

// Función separada para generar el QR
function generateQRCode(container, url) {
    try {
        // Limpiar contenedor primero
        container.innerHTML = '';
        
        new QRCode(container, {
            text: url,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        document.getElementById('qr-container').style.display = 'block';
        return true;
    } catch (error) {
        console.error('Error generando QR:', error);
        return false;
    }
}

function downloadQR() {
    if (!currentPlaca) {
        alert('Primero genere un QR válido.');
        return;
    }
    
    if (isAuthorizationExpired(currentData.caducidad)) {
        showExpirationAlert();
        return;
    }
    
    const qrCanvas = document.querySelector('#qrcode canvas');
    if (!qrCanvas) {
        alert('No se encontró el QR para descargar.');
        return;
    }
    const link = document.createElement('a');
    link.download = `placa_${currentPlaca}.png`;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
}

function generatePDF() {
    if (!window.jspdf) {
        alert('Error: La librería jsPDF no está disponible.');
        return;
    }

    if (isAuthorizationExpired(currentData.caducidad)) {
        showExpirationAlert();
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configurar fuente
    doc.setFont("helvetica");

    // Encabezado
    doc.setFontSize(18);
    doc.setTextColor(0, 77, 153);
    doc.text('AUTORIZACIÓN', 105, 25, { align: 'center' });

    // Línea separadora
    doc.line(20, 35, 190, 35);

    // Resto del contenido en negro
    doc.setTextColor(0, 0, 0);

    // Mensaje principal
    doc.setFontSize(12);
    
    const mensaje = `Estimado/a ${currentData.nombre}, este mensaje es para indicarle que se ha emitido la autorización correspondiente desde la Autoridad de Control de Tránsito Milagro (ACT).`;
    
    const margin = 20;
    const maxWidth = 170;
    const lines = doc.splitTextToSize(mensaje, maxWidth);
    
    let y = 50;
    lines.forEach((line, index) => {
        doc.text(line, margin, y + (index * 7));
    });

    // Detalles de la autorización (SOLO los campos requeridos)
    let detailsY = y + (lines.length * 7) + 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('DETALLES DE LA AUTORIZACIÓN:', 20, detailsY);

    detailsY += 10;
    doc.setFont("helvetica", "normal");
    doc.text(`• Número de Documento: ${currentData.autorizacion}`, 25, detailsY);
    detailsY += 8;
    doc.text(`• Placa: ${currentData.placa}`, 25, detailsY);
    detailsY += 8;
    doc.text(`• Nombres: ${currentData.nombre}`, 25, detailsY);
    detailsY += 8;
    doc.text(`• Tipo de Autorización: ${currentData.tipoAutorizacion}`, 25, detailsY);
    detailsY += 8;
    doc.text(`• Vigencia: ${currentData.caducidad}`, 25, detailsY);

    // Pie de página
    doc.line(20, 260, 190, 260);
    doc.setFontSize(8);
    doc.text('Emovip EP Ecuador', 105, 270, { align: 'center' });
    doc.text('gerencia@act.gob.ec', 105, 275, { align: 'center' });

    // Fecha actual
    const now = new Date();
    doc.text(`Fecha de emisión: ${now.toLocaleDateString('es-EC')} ${now.toLocaleTimeString('es-EC')}`, 105, 285, { align: 'center' });

    // Descargar PDF
    doc.save(`Autorizacion_${currentData.placa}_${currentData.nombre}.pdf`);
}

// Mostrar detalles si se accede con parámetros de URL
window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    
    let data = null;
    
    // Intentar diferentes métodos de descompresión
    const compressedData = urlParams.get('d');
    const minimalData = urlParams.get('m');
    
    if (compressedData) {
        data = decompressData(decodeURIComponent(compressedData));
    } else if (minimalData) {
        // Procesar datos mínimos (formato: placa|nombre|autorizacion|caducidad|tipo)
        const parts = decodeURIComponent(minimalData).split('|');
        if (parts.length >= 5) {
            data = {
                p: parts[0],
                n: parts[1],
                a: parts[2],
                c: parts[3],
                ta: getTipoFromCode(parts[4])
            };
        }
    }
    
    if (data) {
        const placa = data.p;
        const nombre = data.n;
        const autorizacion = data.a;
        const caducidad = data.c;
        const tipoAutorizacion = data.ta;
        const cedula = data.ci || '';
        const ruc = data.r || '';
        const correo = data.e || '';
        const telefono = data.t || '';
        
        document.getElementById('auth-details').style.display = 'none';

        if (placa && nombre && autorizacion && caducidad && tipoAutorizacion) {
            currentData = { 
                placa, 
                nombre, 
                cedula, 
                ruc, 
                correo,
                telefono,
                autorizacion, 
                caducidad,
                tipoAutorizacion: tipoAutorizacion 
            };
            currentPlaca = placa;
            currentTipoAutorizacion = tipoAutorizacion;

            if (isAuthorizationExpired(caducidad)) {
                showExpirationAlert();
                document.getElementById('result-message').textContent = '⚠️ AUTORIZACIÓN CADUCADA - Esta autorización ya no es válida';
                document.getElementById('result-message').className = 'error';
                
                document.getElementById('input-section').style.display = 'none';
                document.getElementById('auth-details').style.display = 'block';
                document.getElementById('qr-container').style.display = 'none';
                
                const authDetails = document.getElementById('auth-details');
                const existingExpirationMsg = authDetails.querySelector('.expiration-message');
                if (!existingExpirationMsg) {
                    const expirationDiv = document.createElement('div');
                    expirationDiv.className = 'expiration-message';
                    expirationDiv.style.cssText = 'background-color: #ffebee; border: 2px solid #f44336; border-radius: 5px; padding: 15px; margin-top: 20px;';
                    expirationDiv.innerHTML = `
                        <h4 style="color: #d32f2f; margin: 0;">⚠️ AUTORIZACIÓN CADUCADA</h4>
                        <p style="margin: 5px 0 0 0; color: #b71c1c;">Esta autorización ya no es válida. Por favor, renueve su permiso.</p>
                    `;
                    authDetails.appendChild(expirationDiv);
                }
            } else {
                document.getElementById('input-section').style.display = 'none';
                document.getElementById('auth-details').style.display = 'block';
                document.getElementById('qr-container').style.display = 'none';
            }

            // Mostrar SOLO los campos requeridos en los detalles
            document.getElementById('auth-placa').textContent = placa;
            document.getElementById('auth-nombre').textContent = nombre;
            document.getElementById('auth-autorizacion').textContent = autorizacion;
            document.getElementById('auth-tipo-autorizacion').textContent = tipoAutorizacion;
            document.getElementById('auth-caducidad').textContent = caducidad;

            if (!isAuthorizationExpired(caducidad)) {
                document.getElementById('result-message').textContent = `✅ Autorización válida para placa: ${placa}`;
                document.getElementById('result-message').className = 'success';
            }
        }
    }

    // Establecer fecha mínima como hoy en el input de fecha
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('caducidad-input').min = today;

    // Actualizar fecha actual en el footer
    const now = new Date();
    const fechaActual = now.toLocaleDateString('es-EC') + ', ' + now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = `Fecha: ${fechaActual}`;
};