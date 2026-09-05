// Tu URL RAW de Gist (o enlace directo de archivo de Google Drive / OneDrive)
const GIST_RAW_URL = "https://gist.githubusercontent.com/juanpixel71/4dea433e849fcfda4869b1463f55e1f9/raw/canales.json";

let hlsPlayer = null;

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    cargarListaVideos();
    document.getElementById('reloadBtn').addEventListener('click', cargarListaVideos);
}

// Para pruebas en navegador si no es app compilada
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

    // Intentamos cargar a través del proxy CORS más fiable (AllOrigins)
    const proxyUrl = "https://api.allorigins.win/raw?method=get&url=" + encodeURIComponent(GIST_RAW_URL + "?t=" + new Date().getTime());

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error("Error HTTP: " + response.status);
            return response.text(); // Leemos como Texto Plano primero para evitar fallos de formato
        })
        .then(texto => {
            try {
                const data = JSON.parse(texto);
                statusMsg.style.display = "none";
                generarBotones(data);
            } catch (e) {
                console.error("Error al procesar JSON:", e);
                statusMsg.innerText = "Error: El archivo no tiene un formato JSON/TXT válido.";
                reloadBtn.style.display = "block";
            }
        })
        .catch(err => {
            console.warn("Falló conexión vía Proxy, intentando descarga directa...", err);
            intentoDirecto();
        });
}

function intentoDirecto() {
    const statusMsg = document.getElementById('statusMessage');
    const reloadBtn = document.getElementById('reloadBtn');

    fetch(GIST_RAW_URL + "?t=" + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            statusMsg.style.display = "none";
            generarBotones(data);
        })
        .catch(e => {
            console.error("Falló la descarga directa:", e);
            statusMsg.innerText = "Error de red al conectar con la lista de canales.";
            reloadBtn.style.display = "block";
        });
}

function generarBotones(listaVideos) {
    const container = document.getElementById('buttonsContainer');
    container.innerHTML = "";

    if (!Array.isArray(listaVideos) || listaVideos.length === 0) {
        document.getElementById('statusMessage').innerText = "La lista no contiene canales válidos.";
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

    // Reproducción para flujos HLS (.m3u8)
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
        player.src = url;
        player.play().catch(e => console.warn('Autoplay bloqueado:', e));
    } else {
        player.src = url;
        player.play().catch(e => console.warn('Autoplay bloqueado:', e));
    }
}
