// REEMPLAZA ESTA URL POR LA URL RAW DE TU GIST:
const GIST_URL = "https://gist.githubusercontent.com/juanpixel71/4dea433e849fcfda4869b1463f55e1f9/raw/canales.json";

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
    
    statusMsg.innerText = "Cargando lista...";
    statusMsg.style.display = "block";
    reloadBtn.style.display = "none";
    container.innerHTML = "";

    const fetchUrl = `${GIST_URL}?nocache=${new Date().getTime()}`;

    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la respuesta: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            statusMsg.style.display = "none";
            generarBotones(data);
        })
        .catch(error => {
            console.error('Error al obtener el JSON:', error);
            statusMsg.innerText = "Error al cargar la lista. Verifica la URL RAW del Gist o tu conexión.";
            reloadBtn.style.display = "block";
        });
}

function generarBotones(listaVideos) {
    const container = document.getElementById('buttonsContainer');
    container.innerHTML = "";

    if (!Array.isArray(listaVideos) || listaVideos.length === 0) {
        document.getElementById('statusMessage').innerText = "El archivo JSON está vacío o no tiene formato correcto.";
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

    // Limpiar reproductor HLS previo si existía
    if (hlsPlayer) {
        hlsPlayer.destroy();
        hlsPlayer = null;
    }

    // Verificar si es un flujo .m3u8 y si Hls.js es soportado por la WebView
    if (url.includes('.m3u8') && Hls.isSupported()) {
        hlsPlayer = new Hls({
            enableWorker: true,
            lowLatencyMode: true
        });
        hlsPlayer.loadSource(url);
        hlsPlayer.attachMedia(player);
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function () {
            player.play().catch(e => console.warn('Autoplay bloqueado:', e));
        });
        hlsPlayer.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                console.error('Error fatal de HLS:', data);
            }
        });
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
        // Soporte nativo para HLS (ej. dispositivos iOS / Safari)
        player.src = url;
        player.play().catch(e => console.warn('Autoplay bloqueado:', e));
    } else {
        // Reproducción de video estándar (MP4, WebM)
        player.src = url;
        player.play().catch(e => console.warn('Autoplay bloqueado:', e));
    }
}
