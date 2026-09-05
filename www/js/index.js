// URL RAW exacta de tu Gist
const GIST_RAW_URL = "https://gist.githubusercontent.com/juanpixel71/4dea433e849fcfda4869b1463f55e1f9/raw/canales.json";

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
    
    statusMsg.innerText = "Cargando lista de canales...";
    statusMsg.style.display = "block";
    reloadBtn.style.display = "none";
    container.innerHTML = "";

    // Evitar almacenamiento en caché añadiendo timestamp
    const urlConCache = GIST_RAW_URL + "?nocache=" + new Date().getTime();

    // Intento 1: Fetch directo
    fetch(urlConCache)
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            statusMsg.style.display = "none";
            generarBotones(data);
        })
        .catch(err => {
            console.warn("Falló el fetch directo, intentando vía proxy AllOrigins...", err);
            // Intento 2: Proxy CORS AllOrigins
            cargarViaProxy();
        });
}

function cargarViaProxy() {
    const statusMsg = document.getElementById('statusMessage');
    const reloadBtn = document.getElementById('reloadBtn');
    
    const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(GIST_RAW_URL + "?nocache=" + new Date().getTime());

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error("Proxy error " + response.status);
            return response.json();
        })
        .then(data => {
            // AllOrigins devuelve el contenido dentro de data.contents
            const canales = JSON.parse(data.contents);
            statusMsg.style.display = "none";
            generarBotones(canales);
        })
        .catch(err => {
            console.error("Falló la conexión con la lista de canales:", err);
            statusMsg.innerText = "Error al cargar los canales. Comprueba tu conexión.";
            reloadBtn.style.display = "block";
        });
}

function generarBotones(listaVideos) {
    const container = document.getElementById('buttonsContainer');
    container.innerHTML = "";

    if (!Array.isArray(listaVideos) || listaVideos.length === 0) {
        document.getElementById('statusMessage').innerText = "La lista JSON no contiene canales válidos.";
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
        alert('Este canal no tiene una URL de reproducción válida.');
        return;
    }

    titleElement.innerText = titulo || 'Reproduciendo...';

    // Limpiar reproductor HLS previo
    if (hlsPlayer) {
        hlsPlayer.destroy();
        hlsPlayer = null;
    }

    // Configuración para transmisiones HLS (.m3u8)
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
        hlsPlayer.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                console.error('Error fatal de HLS:', data);
            }
        });
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
        // Soporte nativo para HLS (Safari/iOS)
        player.src = url;
        player.play().catch(e => console.warn('Autoplay bloqueado:', e));
    } else {
        // Reproducción de video normal (MP4)
        player.src = url;
        player.play().catch(e => console.warn('Autoplay bloqueado:', e));
    }
}
