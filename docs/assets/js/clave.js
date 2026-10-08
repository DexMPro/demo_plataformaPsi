/* Mostrar/ocultar contraseña y medidor de fortaleza (formularios de usuarios). */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-clave]').forEach(function (caja) {
        var input = caja.querySelector('input[type="password"], input[type="text"]');
        var ojo = caja.querySelector('.password-toggle-icon');
        var barras = caja.querySelectorAll('.strength-bar');
        var texto = caja.querySelector('.strength-text');
        if (!input) return;

        if (ojo) {
            ojo.addEventListener('click', function () {
                var visible = input.getAttribute('type') === 'password';
                input.setAttribute('type', visible ? 'text' : 'password');
                var i = ojo.querySelector('i');
                if (i) { i.classList.toggle('fa-eye', !visible); i.classList.toggle('fa-eye-slash', visible); }
                ojo.style.color = visible ? '#667eea' : '#adb5bd';
            });
        }

        var colores = ['#ef4444', '#f97316', '#eab308', '#2dce89'];
        var textos = ['Muy débil', 'Débil', 'Buena', 'Fuerte'];
        input.addEventListener('input', function () {
            var c = input.value;
            var f = 0;
            if (c.length >= 8) f++;
            if (/[A-Z]/.test(c)) f++;
            if (/[0-9]/.test(c)) f++;
            if (/[^A-Za-z0-9]/.test(c)) f++;
            barras.forEach(function (b, i) { b.style.background = i < f ? colores[f - 1] : '#e9ecef'; });
            if (!texto) return;
            if (!c.length) {
                texto.textContent = '';
            } else if (c.length < 8) {
                texto.textContent = 'Muy débil · use al menos 8 caracteres';
                texto.style.color = '#ef4444';
            } else {
                texto.textContent = textos[f - 1];
                texto.style.color = colores[f - 1];
            }
        });
    });

    // El selector de empleado no aplica a usuarios de familia.
    var rol = document.querySelector('select[name="rol_id"]');
    var bloque = document.querySelector('[data-bloque-empleado]');
    if (rol && bloque) {
        var actualizar = function () {
            var op = rol.options[rol.selectedIndex];
            var familia = op && op.getAttribute('data-rol') === 'familia';
            bloque.style.display = familia ? 'none' : '';
            if (familia) {
                var sel = bloque.querySelector('select');
                if (sel) sel.value = '';
            }
        };
        rol.addEventListener('change', actualizar);
        actualizar();
    }
});
