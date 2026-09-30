# Plantilla de Simulacion Financiacion

Aplicacion estatica para crear propuestas comerciales de Avovite.

## Archivos principales

- `index.html`: aplicacion completa para asesoras, clientes, precios actuales y administrador.
- `support.js`: runtime requerido por `index.html`.
- `config.json`: precios, categorias, descuentos, asesoras, beneficios y nota.
- `assets/logo.png`: logo usado por la aplicacion.
- `legacy/`: respaldo de la version anterior publicada.

## Uso

1. Abre la pagina publicada en GitHub Pages.
2. Llena los datos del cliente y selecciona asesora.
3. Ajusta cantidad de Vites. La categoria y el descuento maximo se calculan solos.
4. Elige pago de contado o financiado.
5. Revisa cuotas, fechas y avisos de diferencia.
6. Descarga PDF, imagen o copia el link para el cliente.

## Vistas

- `#precios`: abre la tabla de precios actuales.
- `#p=<datos>`: abre una propuesta para cliente desde un link codificado.

## Configuracion

El administrador edita `config.json` desde la misma aplicacion. Los cambios locales quedan en este equipo; la publicacion a GitHub requiere un token con permiso de escritura sobre este repositorio.
