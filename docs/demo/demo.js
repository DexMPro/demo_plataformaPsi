/*
 * Plataforma Psicológica · capa de demo estática
 *
 * Cada pantalla de esta demo es HTML generado por la aplicación PHP real
 * con datos ficticios. Este archivo hace que se pueda usar sin servidor:
 *   · inicio de sesión de demostración (administración o familia)
 *   · filtros y buscadores (GET) → la página exportada equivalente
 *   · formularios que guardan (POST) → acción simulada con aviso
 *   · portal de familias → agendar y cancelar citas en el navegador
 */
(function () {
  'use strict';

  var ROOT = window.DEMO_ROOT || '.';
  var MAP = window.DEMO_MAP || {};
  var KEY = window.DEMO_KEY || '';
  var PATH = KEY.split('?')[0];
  var REPO = ''; // ← opcional: URL del repositorio para el botón «Ver código»
  var ES_PORTAL = PATH.indexOf('/portal/') === 0;

  function ir(archivo, hash) {
    window.location.href = (ROOT === '.' ? '' : ROOT + '/') + archivo + (hash || '');
  }

  function claveDe(ruta, pares) {
    var limpios = pares.filter(function (p) {
      return p[1] !== '' && p[1] != null && p[0] !== '_csrf' && p[0] !== 'v';
    }).map(function (p) { return [p[0], String(p[1])]; });
    limpios.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : (a[1] < b[1] ? -1 : 1); });
    if (!limpios.length) return ruta;
    return ruta + '?' + limpios.map(function (p) {
      return encodeURIComponent(p[0]) + '=' + encodeURIComponent(p[1]).replace(/%20/g, '+');
    }).join('&');
  }

  function quitarTildes(s) {
    return (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  // ------------------------------------------------------------------ avisos
  function toast(titulo, texto, tipo) {
    var caja = document.getElementById('demo-toasts');
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'demo-toasts';
      document.body.appendChild(caja);
    }
    var t = document.createElement('div');
    t.className = 'demo-toast demo-toast-' + (tipo || 'info');
    var icono = tipo === 'ok' ? 'fa-circle-check' : tipo === 'warn' ? 'fa-triangle-exclamation' : 'fa-flask';
    t.innerHTML = '<i class="fa-solid ' + icono + '"></i><div><strong></strong><p></p></div><button type="button" aria-label="Cerrar">&times;</button>';
    t.querySelector('strong').textContent = titulo;
    t.querySelector('p').textContent = texto;
    t.querySelector('button').addEventListener('click', function () { t.remove(); });
    caja.appendChild(t);
    setTimeout(function () { t.classList.add('saliendo'); }, 6500);
    setTimeout(function () { t.remove(); }, 7000);
  }

  function avisoPendiente() {
    try {
      var a = sessionStorage.getItem('demo-aviso');
      if (a) {
        sessionStorage.removeItem('demo-aviso');
        var d = JSON.parse(a);
        toast(d[0], d[1], d[2]);
      }
    } catch (e) { /* sin sessionStorage */ }
  }
  function avisarDespues(titulo, texto, tipo) {
    try { sessionStorage.setItem('demo-aviso', JSON.stringify([titulo, texto, tipo || 'info'])); } catch (e) { /* nada */ }
  }

  // ------------------------------------------------------------------ inicio de sesión
  var USUARIOS_FAMILIA = ['familia', 'fhernandez', 'scastro', 'familia.rojas@correo-demo.co'];

  function entrar(usuario) {
    usuario = (usuario || '').trim().toLowerCase();
    if (USUARIOS_FAMILIA.indexOf(usuario) !== -1) {
      avisarDespues('Portal de familias', 'Entró como Patricia Rojas (acudiente). Puede agendar y cancelar citas de prueba.', 'ok');
      ir('portal/index.html');
    } else {
      avisarDespues('Bienvenido a la demo', 'Entró como administrador. Todos los datos son ficticios y nada se guarda.', 'ok');
      ir('inicio.html');
    }
  }

  function prepararLogin() {
    var form = document.querySelector('.login-section form');
    if (!form) return;
    var tarjeta = document.createElement('div');
    tarjeta.className = 'demo-login';
    tarjeta.innerHTML =
      '<div class="demo-login-cab"><i class="fa-solid fa-flask"></i> Demo interactiva · datos ficticios</div>' +
      '<p>Elija con qué perfil quiere recorrer la plataforma:</p>' +
      '<div class="demo-login-botones">' +
      '<button type="button" data-u="admin"><i class="fa-solid fa-user-shield"></i><span><strong>Administración</strong><small>Pacientes, historia clínica, citas, pagos…</small></span></button>' +
      '<button type="button" data-u="familia"><i class="fa-solid fa-people-roof"></i><span><strong>Familia</strong><small>Portal de acudientes y agenda en línea</small></span></button>' +
      '</div>' +
      '<p class="demo-login-pie">O use <code>admin</code> / <code>familia</code> con la clave <code>demo1234</code>.</p>';
    form.parentNode.insertBefore(tarjeta, form);
    tarjeta.querySelectorAll('button[data-u]').forEach(function (b) {
      b.addEventListener('click', function () { entrar(b.dataset.u); });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var u = form.querySelector('[name=usuario]').value;
      var c = form.querySelector('[name=clave]').value;
      if (c !== 'demo1234') {
        toast('Clave incorrecta', 'En la demo la clave de todos los usuarios es demo1234.', 'warn');
        return;
      }
      entrar(u);
    });
  }

  // ------------------------------------------------------------------ formularios GET (filtros y buscadores)
  function enviarGet(form, submitter) {
    var accion = form.getAttribute('data-demo-action') || PATH;
    var ruta = accion.split('?')[0];
    var pares = [];
    new FormData(form).forEach(function (v, k) { if (typeof v === 'string') pares.push([k, v.trim()]); });
    if (submitter && submitter.name) pares.push([submitter.name, submitter.value]);

    var exacta = claveDe(ruta, pares);
    if (MAP[exacta]) return ir(MAP[exacta]);

    var termino = '';
    var resto = pares.filter(function (p) {
      if (p[0] === 'buscar' || p[0] === 'q') { termino = p[1]; return false; }
      return p[0] !== 'pagina';
    });
    var sinBusqueda = claveDe(ruta, resto);
    if (termino) {
      var todo = claveDe(ruta, resto.concat([['demo_todo', '1']]));
      if (MAP[todo]) return ir(MAP[todo], '#buscar=' + encodeURIComponent(termino));
      var todoBase = claveDe(ruta, [['demo_todo', '1']]);
      if (MAP[todoBase]) return ir(MAP[todoBase], '#buscar=' + encodeURIComponent(termino));
    }
    if (MAP[sinBusqueda]) return ir(MAP[sinBusqueda]);
    // una sola variable a la vez: se intenta con cada filtro por separado
    for (var i = 0; i < resto.length; i++) {
      var una = claveDe(ruta, [resto[i]]);
      if (MAP[una]) {
        avisarDespues('Filtro aproximado', 'En la demo estática los filtros combinados se muestran de a uno.', 'info');
        return ir(MAP[una]);
      }
    }
    if (MAP[ruta]) {
      avisarDespues('Filtro no disponible en la demo', 'Se muestra la vista general. En la versión real el filtro se aplica en el servidor.', 'warn');
      return ir(MAP[ruta]);
    }
    toast('No disponible en la demo', 'Esta combinación de filtros no se exportó.', 'warn');
  }

  function aplicarBusquedaLocal() {
    var m = /[#&]buscar=([^&]*)/.exec(window.location.hash);
    if (!m) return;
    var termino = decodeURIComponent(m[1].replace(/\+/g, ' '));
    var t = quitarTildes(termino);
    document.querySelectorAll('input[name=buscar], input[name=q]').forEach(function (i) { i.value = termino; });
    var items = Array.prototype.slice.call(document.querySelectorAll('.contenido tbody > tr, main tbody > tr, tbody > tr'));
    if (!items.length) {
      items = Array.prototype.slice.call(document.querySelectorAll('.columns.is-multiline > .column'))
        .filter(function (c) { return c.querySelector('.card, .tarjeta, [class*="tarjeta"]') || /tarjeta/.test(c.className); });
    }
    var visibles = 0;
    items.forEach(function (el) {
      var ok = quitarTildes(el.textContent).indexOf(t) !== -1;
      el.style.display = ok ? '' : 'none';
      if (ok) visibles++;
    });
    document.querySelectorAll('.pagination, nav.pagination').forEach(function (p) { p.style.display = 'none'; });
    toast('Búsqueda: «' + termino + '»', visibles + (visibles === 1 ? ' resultado' : ' resultados') + ' (búsqueda hecha en el navegador para la demo).', visibles ? 'ok' : 'warn');
  }

  // ------------------------------------------------------------------ formularios POST (simulados)
  function nombreAccion(form, submitter) {
    var t = submitter && (submitter.textContent || submitter.value);
    if (!t) {
      var b = form.querySelector('button[type=submit], button:not([type]), input[type=submit]');
      t = b && (b.textContent || b.value);
    }
    t = (t || '').replace(/\s+/g, ' ').trim();
    if (!t) {
      var modal = form.closest('.modal');
      var h = modal && modal.querySelector('.modal-card-title, h2, h3');
      t = h ? h.textContent.trim() : 'Guardar';
    }
    return t;
  }

  function simularPost(form, submitter) {
    var accion = nombreAccion(form, submitter);
    document.querySelectorAll('.modal.is-active').forEach(function (m) { m.classList.remove('is-active'); });
    document.documentElement.classList.remove('is-clipped');
    var destino = form.getAttribute('data-demo-action') || '';
    var detalle = 'En la versión real se valida, se guarda en MariaDB y queda registrado en la auditoría.';
    if (/historias\/(crear|editar)/.test(destino) || /cerrar/i.test(accion)) {
      detalle = 'En la versión real la historia se guarda firmada; una vez cerrada, los triggers de la base impiden modificarla.';
    } else if (/pagos/.test(destino) && /pago/i.test(accion)) {
      detalle = 'En la versión real se registra el abono, se recalcula el saldo del cobro y se genera el recibo de caja en PDF.';
    } else if (/anular|archivar|eliminar|finalizar/i.test(accion)) {
      detalle = 'En la versión real los datos clínicos y financieros no se borran: se anulan o archivan y queda la trazabilidad.';
    }
    toast('Acción simulada: «' + accion + '»', detalle, 'info');
  }

  function alEnviar(form, submitter) {
    if (PATH === '/index.php' || form.closest('.login-section')) return;
    if (/salir\.php$/.test(form.getAttribute('data-demo-action') || '')) return ir('index.html');
    var metodo = (form.getAttribute('method') || 'get').toLowerCase();
    if (metodo === 'get') enviarGet(form, submitter);
    else simularPost(form, submitter);
  }

  document.addEventListener('submit', function (ev) {
    if (ev.defaultPrevented) return; // p. ej. el usuario canceló un window.confirm
    var form = ev.target;
    if (PATH === '/index.php') return;
    ev.preventDefault();
    alEnviar(form, ev.submitter);
  });

  // form.submit() (onchange="this.form.submit()") no dispara el evento submit
  var submitNativo = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    if (PATH === '/index.php') return submitNativo.call(this);
    alEnviar(this, null);
  };

  // ------------------------------------------------------------------ enlaces
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href === '#demo-no-disponible') {
      ev.preventDefault();
      toast('No incluido en la demo', 'Esta pantalla depende de datos que no se exportaron a la versión estática.', 'warn');
    } else if (/salir\.html$/.test(href) || /salir\.php$/.test(href)) {
      ev.preventDefault();
      ir('index.html');
    } else if (/#demo-sin-filtro$/.test(href)) {
      avisarDespues('Vista aproximada', 'Ese filtro exacto no se exportó; se muestra la vista general.', 'info');
    }
  }, true);

  // ------------------------------------------------------------------ calendario del personal
  // eventos.json trae todas las citas; aquí se aplican los filtros de la página.
  window.demoFiltrarEventos = function (lista, cfg) {
    return lista.filter(function (ev) {
      var p = ev.extendedProps || {};
      if (cfg.canceladas !== '1' && p.estado === 'Cancelada') return false;
      if (cfg.prof && cfg.prof !== 'todos' && String(p.profesional_id) !== String(cfg.prof)) return false;
      return true;
    }).map(function (ev) {
      if (cfg.prof && cfg.prof !== 'todos' && ev.extendedProps && ev.extendedProps.titulo_solo) ev.title = ev.extendedProps.titulo_solo;
      return ev;
    });
  };

  // ------------------------------------------------------------------ portal de familias (API simulada)
  var PORTAL = window.DEMO_PORTAL;
  function estadoPortal() {
    try { return JSON.parse(sessionStorage.getItem('demo-portal') || '{"nuevas":[],"canceladas":[],"motivosUsados":[]}'); }
    catch (e) { return { nuevas: [], canceladas: [], motivosUsados: [] }; }
  }
  function guardarPortal(e) { try { sessionStorage.setItem('demo-portal', JSON.stringify(e)); } catch (x) { /* nada */ } }

  function eventosPortal() {
    var e = estadoPortal();
    return PORTAL.eventos.concat(e.nuevas).map(function (ev) {
      ev = JSON.parse(JSON.stringify(ev));
      if (e.canceladas.indexOf(ev.id) !== -1) {
        ev.color = '#9e9e9e';
        ev.extendedProps.estado = 'Cancelada';
        ev.extendedProps.cancelable = false;
      }
      return ev;
    });
  }
  function motivosLibres() {
    var e = estadoPortal();
    var usados = e.motivosUsados;
    var base = (PORTAL.config.motivos || []).slice();
    // Un motivo cuya cita demo se canceló vuelve a quedar libre
    return base.filter(function (m) { return usados.indexOf(m.id) === -1; });
  }
  function respuesta(datos, estado) {
    return Promise.resolve(new Response(JSON.stringify(datos), {
      status: estado || 200, headers: { 'Content-Type': 'application/json' }
    }));
  }
  function apiPortal(url, opciones) {
    var metodo = (opciones && opciones.method || 'GET').toUpperCase();
    var params = metodo === 'GET'
      ? new URLSearchParams(url.split('?')[1] || '')
      : new URLSearchParams(opciones.body || '');
    var accion = params.get('accion');
    var e = estadoPortal();
    if (metodo === 'GET' && accion === 'eventos') {
      var ini = params.get('start') || '', fin = params.get('end') || '9999';
      return respuesta(eventosPortal().filter(function (ev) { return ev.start < fin && ev.end > ini; }));
    }
    if (metodo === 'GET' && accion === 'horas') {
      var d = PORTAL.horas[params.get('motivo') + '|' + params.get('fecha')];
      if (!d) return respuesta({ error: 'En la demo solo se puede agendar en las próximas semanas.' }, 422);
      d = JSON.parse(JSON.stringify(d));
      if (d.horas) {
        var tomadas = e.nuevas.filter(function (ev) { return e.canceladas.indexOf(ev.id) === -1 && ev.start.slice(0, 10) === params.get('fecha'); })
          .map(function (ev) { return ev.start.slice(11, 16); });
        d.horas = d.horas.filter(function (h) { return tomadas.indexOf(h.valor) === -1; });
      }
      return respuesta(d, d.error ? 422 : 200);
    }
    if (metodo === 'POST' && accion === 'agendar') {
      var mid = parseInt(params.get('motivo_id'), 10);
      var fecha = params.get('fecha'), hora = params.get('hora');
      var motivo = (PORTAL.config.motivos || []).filter(function (m) { return m.id === mid; })[0];
      var info = PORTAL.horas[mid + '|' + fecha] || {};
      var texto = (info.horas || []).filter(function (h) { return h.valor === hora; })[0];
      var inicio = fecha + 'T' + hora + ':00';
      var finD = new Date(inicio); finD.setMinutes(finD.getMinutes() + (PORTAL.config.duracion || 30));
      var pad = function (n) { return String(n).padStart(2, '0'); };
      var finS = fecha + 'T' + pad(finD.getHours()) + ':' + pad(finD.getMinutes()) + ':00';
      var paciente = motivo ? (motivo.paciente || motivo.texto || 'Paciente') : 'Paciente';
      var hh = parseInt(hora, 10), mm = hora.slice(3, 5);
      var horaTxt = pad(hh % 12 || 12) + ':' + mm + (hh < 12 ? ' am' : ' pm');
      var ev = {
        id: 900000 + e.nuevas.length + 1, title: paciente, start: inicio, end: finS, color: '#3273dc',
        extendedProps: {
          paciente: paciente, profesional: motivo ? (motivo.profesional || '') : '', motivo: motivo ? (motivo.motivo || '') : '',
          estado: 'Agendada', fecha: info.fecha_texto || fecha, hora: horaTxt, modalidad: 'Presencial', cancelable: true
        }
      };
      e.nuevas.push(ev);
      if (motivo) e.motivosUsados.push(mid);
      guardarPortal(e);
      return respuesta({ ok: true, id: ev.id, mensaje: '¡Listo! Su cita quedó agendada para el ' + (info.fecha_texto || fecha).toLowerCase() + ' a las ' + horaTxt + '. (Demo: solo se guarda en este navegador.)', motivos: motivosLibres() });
    }
    if (metodo === 'POST' && accion === 'cancelar') {
      var cid = parseInt(params.get('cita_id'), 10);
      if (e.canceladas.indexOf(cid) === -1) e.canceladas.push(cid);
      var nueva = e.nuevas.filter(function (x) { return x.id === cid; })[0];
      if (nueva) {
        var mot = (PORTAL.config.motivos || []).filter(function (m) { return nueva.title === (m.paciente || m.texto); })[0];
        if (mot) e.motivosUsados = e.motivosUsados.filter(function (x) { return x !== mot.id; });
      }
      guardarPortal(e);
      var c = eventosPortal().filter(function (x) { return x.id === cid; })[0];
      return respuesta({ ok: true, mensaje: 'La cita' + (c ? ' del ' + c.extendedProps.fecha.toLowerCase() + ' a las ' + c.extendedProps.hora : '') + ' fue cancelada. (Demo)', motivos: motivosLibres() });
    }
    return respuesta({ error: 'Acción no disponible en la demo.' }, 400);
  }

  if (PORTAL) {
    var fetchNativo = window.fetch;
    window.fetch = function (url, opciones) {
      if (typeof url === 'string' && url.indexOf('demo-api:portal') === 0) return apiPortal(url, opciones);
      return fetchNativo.apply(this, arguments);
    };
    // Motivos ya usados en esta sesión de demo
    var cal = document.getElementById('calendario');
    if (cal && cal.dataset.config) {
      try {
        var cfg = JSON.parse(cal.dataset.config);
        cfg.motivos = motivosLibres();
        cal.dataset.config = JSON.stringify(cfg);
      } catch (x) { /* nada */ }
    }
  }

  // ------------------------------------------------------------------ insignia flotante
  function insignia() {
    if (PATH === '/index.php') return;
    var d = document.createElement('div');
    d.className = 'demo-insignia';
    d.innerHTML =
      '<button type="button" class="demo-insignia-btn" aria-expanded="false"><i class="fa-solid fa-flask"></i> <span>Demo</span></button>' +
      '<div class="demo-insignia-panel">' +
      '<strong>Plataforma Psicológica · demo interactiva</strong>' +
      '<p>Pantallas generadas por la aplicación real con datos ficticios. Los cambios se simulan y no se guardan.</p>' +
      '<div class="demo-insignia-acciones">' +
      (ES_PORTAL ? '<a data-ir="inicio.html"><i class="fa-solid fa-user-shield"></i> Ver como administración</a>'
                 : '<a data-ir="portal/index.html"><i class="fa-solid fa-people-roof"></i> Ver como familia</a>') +
      '<a data-ir="index.html"><i class="fa-solid fa-right-from-bracket"></i> Volver al inicio de sesión</a>' +
      (REPO ? '<a href="' + REPO + '" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> Ver código</a>' : '') +
      '<a data-reset="1"><i class="fa-solid fa-rotate-left"></i> Reiniciar datos de la demo</a>' +
      '</div></div>';
    document.body.appendChild(d);
    var btn = d.querySelector('.demo-insignia-btn');
    btn.addEventListener('click', function () {
      var abierto = d.classList.toggle('abierta');
      btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
    d.querySelectorAll('[data-ir]').forEach(function (a) {
      a.href = (ROOT === '.' ? '' : ROOT + '/') + a.dataset.ir;
    });
    var r = d.querySelector('[data-reset]');
    r.href = '#';
    r.addEventListener('click', function (ev) {
      ev.preventDefault();
      try { sessionStorage.clear(); } catch (x) { /* nada */ }
      window.location.reload();
    });
  }

  // ------------------------------------------------------------------ arranque
  function iniciar() {
    if (PATH === '/index.php') prepararLogin();
    insignia();
    aplicarBusquedaLocal();
    avisoPendiente();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
