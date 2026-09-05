// Pon aquí la URL RAW directa de tu Gist
const GIST_RAW_URL = "https://gist.githubusercontent.com/juanpixel71/AQUI_TU_GIST_ID/raw/lista.json";

let hlsPlayer = null;

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    cargarListaVideos();
    document.getElementById('reloadBtn').addEventListener('click', cargarListaVideos);
}

if (!window.cordova) {
    document.addEventListener('DOMContentLoaded', () => {
        cargarListaVideos();
        document.getElementById('reloadBtn').addEventListener('click', cargarListaVideos);
    });
}

function cargarListaVideos() {
    const statusMsg = document.getElementById('statusMessage');
    const reloadBtn = document.getElementById('reloadBtn');
    const container = document.getElementById('buttonsContainer');
    
    statusMsg.innerText = "Cargando lista desde Gist...";
    statusMsg.style.display = "block";
    reloadBtn.style.display = "none";
    container.innerHTML = "";

    // Añadimos timestamp para evitar que Android guarde en caché una lista vieja
    const urlConCacheBuster = GIST_RAW_URL + "?t=" + new Date().getTime();

    const xhr = new XMLHttpRequest();
    xhr.open("GET", urlConCacheBuster, true);
    
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const data = JSON.parse(xhr.responseText);
                statusMsg.style.display = "none";
                generarBotones(data);
            } catch (e) {
                console.error("Error al parsear el JSON:", e);
                statusMsg.innerText = "El formato del JSON no es válido.";
                reloadBtn.style.display = "block";
            }
        } else {
            statusMsg.innerText = "Error HTTP " + xhr.status + " al obtener el JSON.";
            reloadBtn.style.display = "block";
        }
    };

    xhr.onerror = function () {
        // Si falla por CORS de GitHub, intentamos cargar usando proxy alternativo jsDelivr
        statusMsg.innerText = "Intentando conexión alternativa...";
        intentarCargaAlternativa();
    };

    xhr.send();
}

function intentarCargaAlternativa() {
    const statusMsg = document.getElementById('statusMessage');
    const reloadBtn = document.getElementById('reloadBtn');
    
    // Convertimos la URL de Gist a un Proxy CDN libre de restricciones CORS
    const proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(GIST_RAW_URL);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", proxyUrl, true);
    
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const data = JSON.parse(xhr.responseText);
                statusMsg.style.display = "none";
                generarBotones(data);
            } catch (e) {
                statusMsg.innerText = "Error al leer el archivo JSON.";
                reloadBtn.style.display = "block";
            }
        } else {
            statusMsg.innerText = "Error al conectar con la lista de canales.";
            reloadBtn.style.display = "block";
        }
    };

    xhr.onerror = function () {
        statusMsg.innerText = "Error de red. Revisa tu conexión a internet.";
        reloadBtn.style.display = "block";
    };

    xhr.send();
}

function generarBotones(listaVideos) {
    const container = document.getElementById('buttonsContainer');
    container.innerHTML = "";

    if (!Array.isArray(listaVideos) || listaVideos.length === 0) {
        document.getElementById('statusMessage').innerText = "La lista JSON no tiene elementos.";
        document.getElementById('statusMessage').style.display = "block";
        return;
    }

    listaVideos.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-stream';
        btn.innerText = item.nombre || `Canal ${index + 1}`;
        
        btn.addEventListener('click', () => {
            reproducirCanal(item.url, item.nombre);
        });

        container.appendChild(btn);
    });
}

function reproducirCanal(url, titulo) {
    const player = document.getElementById('mainPlayer');
    const titleElement = document.getElementById('videoTitle');

    if (!url) {
        alert('Este canal no tiene un enlace de video válido.');
        return;
    }

    titleElement.innerText = titulo || 'Reproduciendo...';

    if (hlsPlayer) {
        hlsPlayer.destroy();
        hlsPlayer = null;
    }

    if (url.includes('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
        hlsPlayer = new Hls({
            enableWorker: true,
            lowLatencyMode: true
        });
        hlsPlayer.loadSource(url);
        hlsPlayer.attachMedia(player);
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function () {
            player.play().catch(e => console.warn('Autoplay bloqueado:', e));
        });
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
        player.src = url;
        player.play().catch(e => console.warn('Autoplay bloqueado:', e));
    } else {
        player.src = url;
        player.play().catch(e => console.warn('Autoplay bloqueado:', e));
    }
}
