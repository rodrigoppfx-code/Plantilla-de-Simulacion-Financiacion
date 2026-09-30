# Plantilla de Simulacion Financiacion

Herramienta web estatica para generar propuestas comerciales de Avovite con descuento, abono inicial, saldo financiado, cuotas editables y descarga en PDF o imagen.

## Uso

1. Abre la pagina publicada en GitHub Pages.
2. Ingresa asesor/a y datos del cliente.
3. Abre `Descuentos actuales` si necesitas consultar la tabla vigente de precios y descuentos.
4. Ajusta cantidad de Vites, valor unitario y porcentaje de descuento.
5. Elige `Pagar de contado` o `Financiado`.
6. Si eliges financiado, ingresa abono inicial y revisa las cuotas.
7. Usa `Autorrellenar cuotas iguales` o edita las cuotas manualmente.
8. Si necesitas apoyo, usa las calculadoras internas para encontrar el porcentaje de descuento o simular cuotas antes de aplicar los cambios.
9. Verifica que el contador cierre en `$0`.
10. Descarga la propuesta en PDF o imagen.

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
