# Plantilla de Simulacion Financiacion

Herramienta web estatica para generar propuestas comerciales de Avovite con descuento, abono inicial, saldo financiado, cuotas editables y descarga en PDF o imagen.

## Uso

1. Abre la pagina publicada en GitHub Pages.
2. Ingresa asesor/a y datos del cliente.
3. Ajusta cantidad de Vites, valor unitario, descuento y abono inicial.
4. Usa `Autorrellenar cuotas iguales` o edita las cuotas manualmente.
5. Verifica que el contador cierre en `$0`.
6. Descarga la propuesta en PDF o imagen.

## Publicacion en GitHub Pages

Sube estos archivos a la raiz del repositorio:

- `index.html`
- `assets/`
- `.nojekyll`
- `README.md`

Luego activa GitHub Pages desde:

`Settings > Pages > Deploy from a branch > main > /root`

## Datos fijos

- Razon social: AVOVITE S.A.S.
- NIT: 901446849-9

## Notas

La propuesta indica automaticamente la fecha del dia y solo es valida por ese dia.
