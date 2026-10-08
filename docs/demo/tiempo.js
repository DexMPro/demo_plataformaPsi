/*
 * Plataforma Psicológica · demo estática
 * Congela la FECHA del navegador en el día en que se generó la demo
 * (la hora del día sigue siendo la real), para que las agendas, los
 * calendarios y los cobros se vean siempre "al día" con los datos ficticios.
 */
(function () {
  var hoy = window.DEMO_HOY;
  if (!hoy) return;
  var Real = Date;
  var ahora = new Real();
  var base = new Real(hoy + 'T00:00:00');
  var hoyReal = new Real(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  var desfase = base.getTime() - hoyReal.getTime();
  if (!desfase) return;

  function DemoDate(a, b, c, d, e, f, g) {
    if (!(this instanceof DemoDate)) return new Real(Real.now() + desfase).toString();
    switch (arguments.length) {
      case 0: return new Real(Real.now() + desfase);
      case 1: return new Real(a);
      case 2: return new Real(a, b);
      case 3: return new Real(a, b, c);
      case 4: return new Real(a, b, c, d);
      case 5: return new Real(a, b, c, d, e);
      case 6: return new Real(a, b, c, d, e, f);
      default: return new Real(a, b, c, d, e, f, g);
    }
  }
  DemoDate.prototype = Real.prototype;
  DemoDate.now = function () { return Real.now() + desfase; };
  DemoDate.parse = Real.parse;
  DemoDate.UTC = Real.UTC;
  window.Date = DemoDate;
})();
