/* Comportamientos comunes de la interfaz. */

function toggleMenu() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

/** Token CSRF para peticiones fetch(). */
function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
}

document.addEventListener('DOMContentLoaded', function () {
    // ---------------------------------------------------------- modales Bulma
    function abrir(el) { if (el) el.classList.add('is-active'); }
    function cerrar(el) { if (el) el.classList.remove('is-active'); }

    document.querySelectorAll('.js-modal-trigger').forEach(function (btn) {
        btn.addEventListener('click', function (ev) {
            ev.preventDefault();
            abrir(document.getElementById(btn.dataset.target));
        });
    });
    document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .js-modal-cerrar, .close-btn-modal')
        .forEach(function (el) {
            el.addEventListener('click', function (ev) {
                ev.preventDefault();
                cerrar(el.closest('.modal'));
            });
        });
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') document.querySelectorAll('.modal.is-active').forEach(cerrar);
    });
    // Si el servidor devolvió errores de un formulario en modal, se reabre.
    document.querySelectorAll('.modal[data-abrir="1"]').forEach(abrir);

    // ---------------------------------------------------------- confirmaciones
    document.querySelectorAll('form[data-confirmar]').forEach(function (f) {
        f.addEventListener('submit', function (ev) {
            if (!window.confirm(f.dataset.confirmar)) ev.preventDefault();
        });
    });

    // ---------------------------------------------------------- zona de arrastre de fotos
    document.querySelectorAll('.foto-upload-box[data-input]').forEach(function (zona) {
        var input = document.getElementById(zona.dataset.input);
        var nombre = zona.querySelector('.file-name-display');
        if (!input) return;
        function mostrar(archivo) {
            if (!nombre || !archivo) return;
            nombre.textContent = '📎 ' + archivo.name;
            nombre.style.display = 'inline-block';
            zona.style.borderColor = '#667eea';
            zona.style.background = '#f0f0ff';
        }
        zona.addEventListener('click', function (ev) { if (ev.target !== input) input.click(); });
        input.addEventListener('change', function () { mostrar(input.files[0]); });
        zona.addEventListener('dragover', function (ev) { ev.preventDefault(); zona.style.borderColor = '#667eea'; });
        zona.addEventListener('dragleave', function () { zona.style.borderColor = ''; });
        zona.addEventListener('drop', function (ev) {
            ev.preventDefault();
            if (ev.dataTransfer.files.length) {
                input.files = ev.dataTransfer.files;
                mostrar(ev.dataTransfer.files[0]);
            }
        });
    });

    // ---------------------------------------------------------- pestañas de formularios largos
    document.querySelectorAll('[data-pestanas]').forEach(function (cont) {
        var tabs = cont.querySelectorAll('.historia-tab');
        var secciones = cont.querySelectorAll('.form-section');
        var siguiente = cont.querySelector('[data-pestana-siguiente]');
        var anterior = cont.querySelector('[data-pestana-anterior]');
        var actual = 0;
        function ir(i) {
            if (i < 0 || i >= secciones.length) return;
            actual = i;
            tabs.forEach(function (t, j) { t.classList.toggle('active', j === i); });
            secciones.forEach(function (s, j) { s.classList.toggle('active', j === i); });
            if (siguiente) siguiente.style.visibility = i === secciones.length - 1 ? 'hidden' : 'visible';
            if (anterior) anterior.style.visibility = i === 0 ? 'hidden' : 'visible';
        }
        tabs.forEach(function (t, i) { t.addEventListener('click', function () { ir(i); }); });
        if (siguiente) siguiente.addEventListener('click', function () { ir(actual + 1); });
        if (anterior) anterior.addEventListener('click', function () { ir(actual - 1); });

        // Al enviar: si falta un campo obligatorio, saltar a su pestaña y marcarlo.
        var form = cont.closest('form') || cont.querySelector('form');
        if (form) {
            form.addEventListener('submit', function (ev) {
                var faltante = null;
                form.querySelectorAll('[required]').forEach(function (c) {
                    var vacio = !String(c.value || '').trim();
                    c.classList.toggle('is-danger', vacio);
                    if (vacio && !faltante) faltante = c;
                });
                if (faltante) {
                    ev.preventDefault();
                    var sec = faltante.closest('.form-section');
                    if (sec) ir(Array.prototype.indexOf.call(secciones, sec));
                    var aviso = document.getElementById('modalWarning');
                    if (aviso) aviso.classList.add('show'); else faltante.focus();
                }
            });
        }
        ir(0);
    });

    // ---------------------------------------------------------- buscador de pacientes
    // <div data-buscador-paciente> con un input de texto, un input hidden (id),
    // un .buscador-resultados y un <script type="application/json" class="buscador-datos">
    // con [{id, t}]. Busca por nombre o documento, sin importar tildes ni puntos.
    function normalizar(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }
    document.querySelectorAll('[data-buscador-paciente]').forEach(function (caja) {
        var texto = caja.querySelector('input[type="text"]');
        var oculto = caja.querySelector('input[type="hidden"]');
        var lista = caja.querySelector('.buscador-resultados');
        var datos = [];
        try { datos = JSON.parse(caja.querySelector('.buscador-datos').textContent); } catch (e) { datos = []; }
        datos.forEach(function (d) {
            d.n = normalizar(d.t);
            d.digitos = d.t.replace(/\D/g, '');
        });
        var activo = -1;
        var visibles = [];

        function elegir(d) {
            texto.value = d.t;
            oculto.value = d.id;
            texto.classList.remove('is-danger');
            cerrarLista();
            texto.dispatchEvent(new Event('change', { bubbles: true }));
        }
        function cerrarLista() { lista.hidden = true; activo = -1; }
        function pintar() {
            lista.innerHTML = '';
            if (!visibles.length) {
                var vacio = document.createElement('div');
                vacio.className = 'buscador-vacio';
                vacio.textContent = 'Sin coincidencias';
                lista.appendChild(vacio);
            }
            visibles.forEach(function (d, i) {
                var op = document.createElement('div');
                op.className = 'buscador-opcion' + (i === activo ? ' activa' : '');
                op.setAttribute('role', 'option');
                op.textContent = d.t;
                op.addEventListener('mousedown', function (ev) { ev.preventDefault(); elegir(d); });
                lista.appendChild(op);
            });
            lista.hidden = false;
        }
        function buscar() {
            oculto.value = '';
            var q = normalizar(texto.value).trim();
            if (q.length < 2) { cerrarLista(); return; }
            var palabras = q.split(/\s+/);
            var soloDigitos = q.replace(/[\s.\-]/g, '');
            visibles = datos.filter(function (d) {
                if (/^\d{3,}$/.test(soloDigitos) && d.digitos.indexOf(soloDigitos) !== -1) return true;
                return palabras.every(function (p) { return d.n.indexOf(p) !== -1; });
            }).slice(0, 12);
            activo = visibles.length ? 0 : -1;
            pintar();
        }
        // Permite fijar el paciente desde otro script: caja.fijar(id)
        caja.fijar = function (id) {
            var d = datos.filter(function (x) { return String(x.id) === String(id); })[0];
            if (d) { elegir(d); } else { texto.value = ''; oculto.value = ''; }
        };
        // Al enviar: si el campo es obligatorio, debe haberse elegido un paciente de la lista.
        var formulario = caja.closest('form');
        if (formulario) {
            formulario.addEventListener('submit', function (ev) {
                if (texto.required && !caja.closest('[hidden]') && !oculto.value) {
                    ev.preventDefault();
                    texto.classList.add('is-danger');
                    texto.setCustomValidity('Elija un paciente de la lista.');
                    texto.reportValidity();
                    texto.setCustomValidity('');
                }
            });
        }
        // Si el servidor devolvió un id (error de validación), mostrar su nombre.
        if (oculto.value && !texto.value) {
            var inicial = datos.filter(function (x) { return String(x.id) === String(oculto.value); })[0];
            if (inicial) texto.value = inicial.t;
        }
        texto.addEventListener('input', buscar);
        texto.addEventListener('focus', function () { if (!oculto.value && texto.value) buscar(); });
        texto.addEventListener('blur', function () { setTimeout(cerrarLista, 150); });
        texto.addEventListener('keydown', function (ev) {
            if (lista.hidden) return;
            if (ev.key === 'ArrowDown') { ev.preventDefault(); activo = Math.min(activo + 1, visibles.length - 1); pintar(); }
            else if (ev.key === 'ArrowUp') { ev.preventDefault(); activo = Math.max(activo - 1, 0); pintar(); }
            else if (ev.key === 'Enter') { if (activo >= 0) { ev.preventDefault(); elegir(visibles[activo]); } }
            else if (ev.key === 'Escape') { ev.stopPropagation(); cerrarLista(); }
        });
    });

    // ---------------------------------------------------------- formato de dinero al escribir
    document.querySelectorAll('input[data-dinero]').forEach(function (inp) {
        inp.addEventListener('input', function () {
            var digitos = inp.value.replace(/\D/g, '');
            inp.value = digitos ? '$ ' + Number(digitos).toLocaleString('es-CO') : '';
        });
    });
});
