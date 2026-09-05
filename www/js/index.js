// URL de tu Gist JSON (Asegúrate de cambiarla por la TUYA)
// TIP: Usa la URL Raw de GitHub Gist o mediante CDN para evitar fallos de CORS
const GIST_URL = "https://gist.githubusercontent.com/TU_USUARIO/TU_GIST_ID/raw/lista.json";

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova listo');
    cargarListaVideos();
    
    document.getElementById('reloadBtn').addEventListener('click', cargarListaVideos);
}

// Alternativa por si se prueba directo en navegador de escritorio
if (!window.cordova) {
    document.addEventListener('DOMContentLoaded', cargarListaVideos);
}

function cargarListaVideos() {
    const statusMsg = document.getElementById('statusMessage');
    const reloadBtn = document.getElementById('reloadBtn');
    const container = document.getElementById('buttonsContainer');
    
    statusMsg.innerText = "Cargando lista...";
    statusMsg.style.display = "block";
    reloadBtn.style.display = "none";
    container.innerHTML = "";

    // Agregamos parámetro 'cache-bust' para asegurar que descargue la versión más reciente del JSON
    const fetchUrl = `${GIST_URL}?nocache=${new Date().getTime()}`;

    fetch(fetchUrl, { method: 'GET', mode: 'cors' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de red: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            statusMsg.style.display = "none";
            generarBotones(data);
        })
        .catch(error => {
            console.error('Error al obtener el JSON:', error);
            statusMsg.innerText = "Error al cargar la lista. Verifica la URL de Gist o tu conexión.";
            reloadBtn.style.display = "block";
        });
}

function generarBotones(listaVideos) {
    const container = document.getElementById('buttonsContainer');
    container.innerHTML = "";

    if (!Array.isArray(listaVideos) || listaVideos.length === 0) {
        document.getElementById('statusMessage').innerText = "El JSON no contiene enlaces válidos.";
        document.getElementById('statusMessage').style.display = "block";
        return;
    }

    listaVideos.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-stream';
        btn.innerText = item.nombre || `Opción ${index + 1}`;
        
        btn.addEventListener('click', () => {
            reproducirVideo(item.url, item.nombre);
        });

        container.appendChild(btn);
    });
}

function reproducirVideo(url, titulo) {
    const player = document.getElementById('mainPlayer');
    const titleElement = document.getElementById('videoTitle');

    if (!url) {
        alert('Este enlace no tiene una URL válida.');
        return;
    }

    titleElement.innerText = titulo || 'Reproduciendo...';
    player.src = url;
    player.play().catch(e => {
        console.warn('Auto-play prevenido o error de reproducción:', e);
    });
}
