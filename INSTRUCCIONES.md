# Plantilla de Simulacion Financiacion

## Archivos principales

- `index.html`: version principal lista para Avovite, con logo y datos fijos.
- `assets/`: carpeta obligatoria. Contiene logo, estilos, calculos y librerias para descargar PDF/imagen.
- `README.md`: guia para GitHub.
- `.nojekyll`: archivo para evitar problemas de rutas en GitHub Pages.

## Como usarlo

1. Abre `index.html`.
2. Llena asesor/a, cliente y datos de financiacion. La razon social, NIT y logo de Avovite ya vienen cargados.
3. La fecha de validez se coloca sola con la fecha del dia.
4. El sistema calcula automaticamente total, descuento, ahorro, neto y saldo financiado.
5. Las cuotas se autorrellenan en valores iguales, pero puedes editar cada valor y fecha.
6. Puedes agregar o eliminar cuotas hasta maximo 11.
7. Descarga la propuesta en PDF o imagen.

## Para publicarlo en GitHub Pages

Sube `index.html`, `README.md`, `.nojekyll` y la carpeta `assets/`. No cambies los nombres de la carpeta ni de los archivos internos, porque el HTML depende de esas rutas.

Nombre recomendado del repositorio:

`Plantilla de Simulacion Financiacion`

## Nota

La razon social fija es AVOVITE S.A.S. y el NIT fijo es 901446849-9.
