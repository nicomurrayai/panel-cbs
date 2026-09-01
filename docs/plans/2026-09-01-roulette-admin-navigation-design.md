# Acceso de Ruleta en el panel CBS

## Objetivo

Permitir que una persona administradora encuentre y gestione el juego Ruleta desde la navegación principal del panel CBS, manteniendo la separación actual entre la configuración general del juego y su contenido específico.

## Contexto

El panel ya contiene una ruta `/ruleta`, un editor completo, validación, acciones de servidor y lecturas de Supabase para premios, segmentos, probabilidades e inventario. La ruta dejó de aparecer porque un cambio anterior quitó explícitamente su enlace de la navegación. La pantalla `/juegos` obtiene las tarjetas directamente de la tabla `games`; la migración del proyecto ya crea la fila con ID `roulette`.

## Diseño aprobado

- Restaurar un enlace **Ruleta** en la navegación lateral de escritorio y en la navegación móvil.
- Usar un icono de ruleta consistente con la biblioteca Lucide ya instalada.
- Mantener `/juegos` como lugar para editar portada, título, descripción, visibilidad, disponibilidad y tema propio de Ruleta.
- Mantener `/ruleta` como lugar para administrar segmentos, premios, pesos de probabilidad, colores, textos de resultado e inventario.
- No duplicar el editor ni incorporar sus controles dentro de `/juegos`.

## Flujo de datos

El nuevo enlace solo recupera el acceso a la funcionalidad existente. Los cambios generales continúan escribiéndose en `games`; los cambios específicos continúan escribiéndose en `roulette_settings`, `roulette_segments` y `roulette_prize_inventory`. `panel-juegos` seguirá leyendo esas mismas tablas sin cambios de contrato.

## Errores y compatibilidad

La ruta `/ruleta` conserva su aviso de configuración cuando Supabase no está disponible. La navegación no introduce nuevas escrituras ni estados. El resaltado activo y el título superior seguirán derivándose de `NAV_LINKS`, por lo que incluir el enlace cubre escritorio, móvil y encabezado.

## Verificación

- Ejecutar el linter y la compilación de producción de `panel-cbs`.
- Comprobar que `NAV_LINKS` incluya `/ruleta` y que el estado activo funcione.
- Verificar que no se hayan alterado los contratos de datos consumidos por `panel-juegos`.
