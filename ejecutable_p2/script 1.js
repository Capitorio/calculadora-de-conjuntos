//AUTO INICIO DE SESION 
if (!localStorage.getItem('perfil_usuario')) {
    localStorage.setItem('perfil_usuario', JSON.stringify({suscrito: true}));
    console.log("Sesión activada.");
}


// ==========================================
// 1. OBJETO GLOBAL (Estado de la aplicación)
// ==========================================
let memoriaConjuntos = {
    U: new Set(),
    A: new Set(),
    B: new Set()
};


// ==========================================
// 2. LECTURA DE ARCHIVOS
// ==========================================
function leerArchivo(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const contenido = e.target.result
                .split(/[\r\n,]+/) // separa por saltos de línea o comas
                .map(item => item.trim())
                .filter(item => item !== "");

            resolve(new Set(contenido)); // usamos Set para evitar repetidos
        };

        reader.onerror = reject;
        reader.readAsText(file);
    });
}


// ==========================================
// 3. CARGA DE CONJUNTOS INDIVIDUAL
// ==========================================
async function cargarConjunto(evento, letra) {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    try {
        const conjunto = await leerArchivo(archivo);
        memoriaConjuntos[letra] = conjunto;

        const pantalla = document.getElementById(`pantalla${letra}`);
        if (pantalla) {
            pantalla.innerText = `${letra} = { ${Array.from(conjunto).join(', ')} }`;
        }

        console.log(`Conjunto ${letra} cargado:`, conjunto);

    } catch (error) {
        Swal.fire('Error', `No se pudo leer el archivo de ${letra}`, 'error');
    }
}


// ==========================================
// 4. OPERACIONES DE CONJUNTOS (con Set)
// ==========================================
const operaciones = {
    union: (a, b) => new Set([...a, ...b]),

    interseccion: (a, b) =>
        new Set([...a].filter(x => b.has(x))),

    diferencia: (a, b) =>
        new Set([...a].filter(x => !b.has(x))),

    simetrica: (a, b) => {
        const soloA = [...a].filter(x => !b.has(x));
        const soloB = [...b].filter(x => !a.has(x));
        return new Set([...soloA, ...soloB]);
    }
};


// ==========================================
// 5. EJECUTAR OPERACIÓN (botón calcular)
// ==========================================
function ejecutarOperacion() {
    const user = JSON.parse(localStorage.getItem('perfil_usuario'));

    if (!user || !user.suscrito) {
        Swal.fire({
            title: '¡Suscripción necesaria!',
            icon: 'warning',
            text: 'Debes estar suscrito para calcular.'
        });
        return;
    }

    const c1Key = document.getElementById('selectConjunto1').value.toUpperCase();
    const c2Key = document.getElementById('selectConjunto2').value.toUpperCase();
    const opKey = document.getElementById('selectOperacion').value;

    const setA = memoriaConjuntos[c1Key];
    const setB = memoriaConjuntos[c2Key];

    // validación básica
    if (!setA || !setB || setA.size === 0 || setB.size === 0) {
        Swal.fire('Atención', 'Uno o ambos conjuntos están vacíos o no cargados.', 'info');
        return;
    }

    const resultado = operaciones[opKey](setA, setB);

    const pantallaRes = document.getElementById('pantallaResultado');
    pantallaRes.innerText =
        `Resultado (${c1Key} ${opKey} ${c2Key}): { ${Array.from(resultado).sort().join(', ')} }`;

    Swal.fire({
        title: '¡Calculado!',
        icon: 'success',
        timer: 1000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
}


// ==========================================
// 6. PROCESAR TODOS LOS ARCHIVOS (botón principal)
// ==========================================
async function procesar() {
    const user = JSON.parse(localStorage.getItem('perfil_usuario'));

    if (!user || !user.suscrito) {
        Swal.fire({
            title: '¡Suscripción necesaria!',
            icon: 'warning',
            text: 'Debes estar suscrito para usar esta función.'
        });
        return;
    }

    const inputs = document.querySelectorAll('input[type="file"]');
    let promesas = [];

    for (let input of inputs) {
        if (input.files[0]) {
            const letra = input.id.replace('archivo', '');

            const promesa = leerArchivo(input.files[0]).then(conjunto => {
                memoriaConjuntos[letra] = conjunto;

                let pantalla = document.getElementById(`pantalla${letra}`);
                if (!pantalla) {
                    pantalla = document.createElement('p');
                    pantalla.id = `pantalla${letra}`;
                    pantalla.className = "small text-muted";
                    document.getElementById('resultados').appendChild(pantalla);
                }

                pantalla.innerText =
                    `${letra} = { ${Array.from(conjunto).join(', ')} }`;
            });

            promesas.push(promesa);
        }
    }

    if (promesas.length === 0) {
        Swal.fire('Error', 'No seleccionaste ningún archivo', 'error');
        return;
    }

    await Promise.all(promesas);

    // cuando ya todo está cargado, ejecutamos la operación
    ejecutarOperacion();
}


// ==========================================
// 7. LISTENERS (Delegación de eventos global)
// ==========================================
document.body.addEventListener('change', (e) => {
    // Si el elemento que cambió es un input de tipo archivo y su ID empieza con "archivo"
    if (e.target && e.target.type === 'file' && e.target.id.startsWith('archivo')) {
        const letra = e.target.id.replace('archivo', ''); // Extrae la letra (U, A, B, C...)
        cargarConjunto(e, letra);
    }
});