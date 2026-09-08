# Fondo e imágenes por segmento para Ruleta

## Objetivo

Permitir que la pantalla del juego Ruleta tenga un fondo configurable propio y que cada segmento de la rueda muestre una imagen junto con su texto, siguiendo la composición visual de la referencia provista.

## Alcance aprobado

- El fondo se configura dentro de la sección `Ruleta` del panel administrativo.
- El fondo cubre toda la pantalla del juego con recorte centrado y sin franjas vacías.
- Cada segmento, independientemente de su tipo, puede tener una imagen.
- La rueda conserva el texto y los colores configurables de cada segmento.
- La imagen gira como parte del segmento y se ajusta sin deformarse.
- La imagen del premio puede seguir utilizándose en la pantalla final cuando corresponda.

## Modelo y flujo de datos

No se agregan tablas ni columnas. El fondo reutiliza `games.theme_config.backgroundAssetId`; la imagen de cada segmento reutiliza `roulette_segments.asset_id`.

La pantalla `Ruleta` leerá y guardará el identificador del fondo junto con su configuración. Al guardar, actualizará únicamente `backgroundAssetId` dentro de `games.theme_config`, conservando los demás colores, fuentes y opciones visuales del juego.

`panel-juegos` resolverá los recursos mediante `media_assets`. El fondo resuelto se aplicará únicamente a la pantalla de Ruleta. Las imágenes resueltas de todos los segmentos se precargarán y quedarán disponibles para el canvas.

## Presentación

El fondo utilizará un ajuste equivalente a `cover`, centrado y con una capa de contraste suave para mantener legibles el título, la rueda y el botón.

El canvas dibujará cada imagen dentro de su porción, recortando el área de dibujo al segmento y usando un ajuste proporcional equivalente a `contain`. El tamaño se adaptará al ángulo disponible para evitar invadir segmentos vecinos. El texto permanecerá visible debajo o junto a la imagen.

## Errores y compatibilidad

- Sin fondo configurado se mantiene el fondo actual del tema.
- Si una imagen no carga, se dibujan normalmente el color y el texto del segmento.
- Reemplazar o quitar un recurso se refleja mediante las suscripciones existentes de tiempo real.
- El cambio no modifica probabilidades, inventario ni selección del resultado.

## Verificación

- Guardar, recargar, reemplazar y quitar el fondo de Ruleta.
- Probar fondos verticales y horizontales en distintos viewports.
- Probar segmentos con y sin imagen y con distintas cantidades de porciones.
- Confirmar que imágenes y textos giran alineados.
- Confirmar el fallback ante recursos que no cargan.
- Ejecutar TypeScript, compilaciones de producción y validación visual del tótem.
