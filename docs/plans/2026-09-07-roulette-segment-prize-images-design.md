# Imágenes de premio y colores por segmento en Ruleta

## Objetivo

Corregir la configuración visual de la Ruleta para que cada segmento conserve su color de fondo y color de texto, y para que los segmentos de tipo premio puedan mostrar una imagen asociada al finalizar el giro.

## Alcance aprobado

- Cada segmento mantiene nombre, tipo, probabilidad, color de fondo y color de texto.
- El panel muestra controles claros y una vista previa inmediata de ambos colores.
- Los segmentos de tipo `prize` permiten seleccionar una imagen de la biblioteca de medios.
- La rueda dibuja únicamente el color y el texto de cada segmento; no dibuja imágenes dentro de la rueda.
- La imagen se muestra solo en el resultado de un segmento ganador de tipo `prize`.
- Los resultados `thanks` y `retry` no muestran imagen.

## Arquitectura y flujo de datos

Se reutiliza la relación existente `roulette_segments.asset_id -> media_assets.id`. El panel administrativo continúa guardando el identificador del recurso junto con los demás campos del segmento.

En `panel-juegos`, la carga de configuración resolverá `asset_id` contra `media_assets` y añadirá la URL resuelta al contrato runtime del segmento. Cuando el servidor devuelva el identificador ganador, la pantalla localizará ese segmento en la configuración vigente y entregará su imagen y textos a la presentación del resultado.

No se agregan URLs duplicadas ni nuevas tablas. Tampoco se modifica la selección ponderada ni la lógica de inventario.

## Experiencia del administrador

Cada editor de segmento permitirá configurar:

- color de fondo;
- color del texto;
- imagen del premio, cuando el tipo sea `prize`.

La tarjeta ofrecerá una vista previa representativa del segmento. Cambiar el orden, editar otros campos, recargar la página o recibir una actualización en tiempo real no debe perder la asociación de imagen.

## Resultado y tolerancia a errores

La imagen es decorativa y opcional. Si falta, fue desactivada o no puede cargarse, el resultado seguirá mostrando el nombre y los textos del premio. Los resultados que no sean premios conservarán su presentación sin imagen.

El color de fondo y el color de texto siempre se aplican al segmento de la rueda. Los valores inválidos seguirán siendo rechazados por la validación existente.

## Verificación

- Guardar y volver a cargar segmentos con colores distintos.
- Guardar, reemplazar y quitar la imagen de un premio.
- Confirmar que la imagen sobrevive a reordenamientos y actualizaciones en tiempo real.
- Confirmar que la rueda no dibuja imágenes dentro de los segmentos.
- Confirmar que un premio muestra su imagen al finalizar y que `thanks`/`retry` no la muestran.
- Confirmar el fallback de resultado cuando no existe una imagen válida.
- Ejecutar TypeScript, lint y compilación de `panel-cbs` y `panel-juegos`.
