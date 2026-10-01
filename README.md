# Plantilla de Simulacion Financiacion

Aplicacion estatica para crear propuestas comerciales de Avovite.

## Archivos principales

- `index.html`: aplicacion completa para asesoras, clientes, precios actuales y administrador.
- `support.js`: runtime requerido por `index.html`.
- `config.json`: precios, categorias, descuentos, asesoras, beneficios y nota.
- `assets/logo.png`: original del logo; el HTML tambien lo incorpora para las vistas y descargas.
- `legacy/`: respaldo de la version anterior publicada.

## Uso

1. Abre la pagina publicada en GitHub Pages.
2. Llena los datos del cliente y selecciona asesora.
3. Ajusta cantidad de Vites. La categoria y el descuento maximo se calculan solos.
4. Elige pago de contado o financiado.
5. Revisa cuotas y fechas. Las cuotas editadas mantienen su valor; las demas se recalculan automaticamente con el saldo restante. Desmarca un valor para liberarlo o pulsa `Repartir todo por igual`.
6. Descarga PDF, imagen o copia el link para el cliente.

## Vistas

`Calcular porcentaje para la app` toma cantidad y precio vigentes y muestra el porcentaje equivalente al valor final total ingresado. Solo sirve para consultar: no cambia la propuesta ni aparece en el documento del cliente.

- `#precios`: abre la tabla de precios actuales.
- `#p=<datos>`: abre una propuesta para cliente desde un link codificado.

## Configuracion

El administrador edita `config.json` desde la misma aplicacion. `Guardar cambios` pide la misma clave de acceso y publica para todas las asesoras mediante el servicio `https://avovite-propuestas-admin.vercel.app/api/settings`. No se ingresan tokens en la aplicacion. Las credenciales de publicacion y la verificacion de clave quedan en el servicio, fuera del HTML.
# Pagina publica de precios y beneficios

`precios.html` muestra los precios y la tabla de beneficios sin navegacion al simulador ni al administrador. Lee el mismo `config.json` remoto al abrir o actualizar la pagina. Si no puede cargarlo, ofrece reintentar en lugar de mostrar precios locales desactualizados.

Al seleccionar una tarjeta se resaltan su columna de beneficios, sus filas de precios y el salto desde esa categoria hacia la siguiente. Vite Private no tiene un salto posterior. La seleccion es solo visual y no modifica propuestas, cuotas ni descuentos.

En Precios actuales, el boton Copiar link de pagina publica copia directamente este enlace. Es un enlace publico: cualquier persona que lo reciba puede abrirlo.

La pagina se genera desde la plantilla unica `index.html`. La tabla marcada `benefits-table:source` se reutiliza en precios con su propio sombreado. Despues de editarla, ejecutar `node build-public-page.cjs` antes de publicar ambos HTML. No editar la tabla generada ni `precios.html` manualmente ni duplicar configuraciones.
