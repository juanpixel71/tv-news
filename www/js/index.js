// URL RAW de tu Gist
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

// Función auxiliar para mostrar logs en la pantalla del móvil
function logPantalla(mensaje, esError = false) {
    const statusMsg = document.getElementById('statusMessage');
    if (statusMsg) {
        statusMsg.innerText = mensaje;
        statusMsg.style.color = esError ? "#ff5555" : "#ffffff";
        statusMsg.style.display = "block";
    }
    console.log(mensaje);
}

function cargarListaVideos() {
    const reloadBtn = document.getElementById('reloadBtn');
    const container = document.getElementById('buttonsContainer');
    
    logPantalla("Iniciando carga de canales...");
    reloadBtn.style.display = "none";
    container.innerHTML = "";

    // MÉTODO 1: jsonp / script tag injection via AllOrigins
    // Esto evita completamente las restricciones CORS/Fetch de Android WebView
    const callbackName = "callbackCanales_" + Math.floor(Math.random() * 100000);
    const proxyJsonpUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(GIST_RAW_URL)}&callback=${callbackName}`;

    // Creamos una función global temporal para recibir los datos
    window[callbackName] = function(data) {
        // Limpiamos la función y la etiqueta script
        delete window[callbackName];
        const scriptTag = document.getElementById('jsonp_script_tag');
        if (scriptTag) scriptTag.remove();

        try {
            if (data && data.contents) {
                const canales = JSON.parse(data.contents);
                document.getElementById('statusMessage').style.display = "none";
                generarBotones(canales);
            } else {
                logPantalla("Respuesta vacía del servidor proxy.", true);
                reloadBtn.style.display = "block";
            }
        } catch (e) {
            logPantalla("Error al interpretar JSON: " + e.message, true);
            reloadBtn.style.display = "block";
        }
    };

    // Inyectamos el script dinámicamente en el documento
    const script = document.createElement('script');
    script.id = 'jsonp_script_tag';
    script.src = proxyJsonpUrl;
    
    script.onerror = function(err) {
        logPantalla("Error de red cargando script (Red/CORS bloqueado)", true);
        reloadBtn.style.display = "block";
        // Si falla la inyección de script, probamos el último recurso (Fetch directo)
        intentoUltimoRecurso();
    };

    document.body.appendChild(script);
}

function intentoUltimoRecurso() {
    fetch(GIST_RAW_URL + "?t=" + new Date().getTime())
        .then(res => {
            if (!res.ok) throw new Error("HTTP Status " + res.status);
            return res.json();
        })
        .then(data => {
            document.getElementById('statusMessage').style.display = "none";
            generarBotones(data);
        })
        .catch(err => {
            logPantalla("ERROR FINAL DE RED: " + err.message, true);
            document.getElementById('reloadBtn').style.display = "block";
        });
}

function generarBotones(listaVideos) {
    const container = document.getElementById('buttonsContainer');
    container.innerHTML = "";

    if (!Array.isArray(listaVideos) || listaVideos.length === 0) {
        logPantalla("La lista de canales está vacía.", true);
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
            player.play().catch(e => console.warn('Autoplay prevenido:', e));
        });
        hlsPlayer.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                logPantalla("Error de emisión HLS en directo.", true);
            }
        });
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
        player.src = url;
        player.play().catch(e => console.warn('Autoplay prevenido:', e));
    } else {
        player.src = url;
        player.play().catch(e => console.warn('Autoplay prevenido:', e));
    }
}
