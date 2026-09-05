// URL RAW de tu Gist
const GIST_RAW_URL = "https://gist.githubusercontent.com/juanpixel71/4dea433e849fcfda4869b1463f55e1f9/raw/canales.json";

let hlsPlayer = null;

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Evitar que la pantalla se apague/desvanezca durante la reproducción
    if (window.plugins && window.plugins.insomnia) {
        window.plugins.insomnia.keepAwake();
    }

    // Ocultar barras de Android (Batería, reloj, botones de navegación)
    activarModoInmersivo();

    cargarListaVideos();
    document.getElementById('reloadBtn').addEventListener('click', cargarListaVideos);
}

if (!window.cordova) {
    document.addEventListener('DOMContentLoaded', () => {
        cargarListaVideos();
        document.getElementById('reloadBtn').addEventListener('click', cargarListaVideos);
    });
}

function activarModoInmersivo() {
    if (window.AndroidFullScreen) {
        window.AndroidFullScreen.immersiveMode(
            () => console.log("Modo inmersivo activo"),
            (err) => console.warn("Error en modo inmersivo:", err)
        );
    }
}

window.addEventListener("orientationchange", function() {
    setTimeout(activarModoInmersivo, 300);
});

function logPantalla(mensaje, esError = false) {
    const statusMsg = document.getElementById('statusMessage');
    if (statusMsg) {
        statusMsg.innerText = mensaje;
        statusMsg.style.color = esError ? "#ff5555" : "#ffffff";
        statusMsg.style.display = "block";
    }
}

function cargarListaVideos() {
    const reloadBtn = document.getElementById('reloadBtn');
    const container = document.getElementById('buttonsContainer');
    
    // Asegurar que el botón de reintentar esté oculto al iniciar
    reloadBtn.style.display = "none";
    logPantalla("Cargando canales...");
    container.innerHTML = "";

    let completado = false;

    // ESTRATEGIA RÁPIDA: Intento directo con timeout de 2 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    fetch(GIST_RAW_URL + "?t=" + new Date().getTime(), { signal: controller.signal })
        .then(res => {
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        })
        .then(data => {
            if (!completado) {
                completado = true;
                finalizarCargaExitosa(data);
            }
        })
        .catch(() => {
            clearTimeout(timeoutId);
            if (!completado) {
                // Si la carga directa tarda o falla, usar inmediatamente el método Script/JSONP
                cargarViaScriptJSONP(() => {
                    if (!completado) {
                        logPantalla("Error al conectar con la lista de canales.", true);
                        reloadBtn.style.display = "block";
                    }
                });
            }
        });
}

function cargarViaScriptJSONP(onErrorCallback) {
    const callbackName = "cb_" + Math.floor(Math.random() * 100000);
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(GIST_RAW_URL)}&callback=${callbackName}`;

    window[callbackName] = function(data) {
        delete window[callbackName];
        const scriptTag = document.getElementById('jsonp_script');
        if (scriptTag) scriptTag.remove();

        try {
            if (data && data.contents) {
                const canales = JSON.parse(data.contents);
                finalizarCargaExitosa(canales);
            } else {
                if (onErrorCallback) onErrorCallback();
            }
        } catch (e) {
            if (onErrorCallback) onErrorCallback();
        }
    };

    const script = document.createElement('script');
    script.id = 'jsonp_script';
    script.src = proxyUrl;
    script.onerror = () => {
        if (onErrorCallback) onErrorCallback();
    };

    document.body.appendChild(script);
}

function finalizarCargaExitosa(canales) {
    const statusMsg = document.getElementById('statusMessage');
    const reloadBtn = document.getElementById('reloadBtn');
    
    // Ocultar explícitamente mensajes y botones de error
    statusMsg.style.display = "none";
    reloadBtn.style.display = "none";
    
    generarBotones(canales);
}

function generarBotones(listaVideos) {
    const container = document.getElementById('buttonsContainer');
    container.innerHTML = "";

    if (!Array.isArray(listaVideos) || listaVideos.length === 0) {
        logPantalla("La lista de canales está vacía.", true);
        document.getElementById('reloadBtn').style.display = "block";
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
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
        player.src = url;
        player.play().catch(e => console.warn('Autoplay prevenido:', e));
    } else {
        player.src = url;
        player.play().catch(e => console.warn('Autoplay prevenido:', e));
    }
}
