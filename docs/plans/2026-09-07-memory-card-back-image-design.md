# Imagen configurable para el reverso del Memory

## Objetivo

Permitir que una persona administradora cargue desde el panel CBS una imagen unica para el reverso de todas las cartas del juego Memory Card.

## Experiencia de administracion

La pantalla `/memory` incorporara un campo **Reverso de las cartas** dentro de la configuracion general. El control reutilizara la carga directa de imagenes existente y mostrara una vista previa, junto con las acciones para subir, reemplazar o quitar la imagen.

La seleccion formara parte del mismo guardado que el tiempo limite, el modo de jugadores y las caras del juego. Quitarla restaurara el reverso visual actual.

## Modelo y flujo de datos

- `memory_settings` tendra una columna nullable `back_asset_id` con clave foranea a `media_assets` y comportamiento `on delete set null`.
- El panel guardara el identificador del recurso en `memory_settings` y resolvera su URL para la vista previa.
- El juego cargara el recurso desde el snapshot actual de Supabase, lo incorporara a `config.memory` y reaccionara a los cambios en tiempo real ya configurados para `memory_settings` y `media_assets`.
- La imagen se incluira en la precarga de recursos para reducir apariciones tardias en el tablero.

## Presentacion en el juego

Todas las cartas ocultas usaran la misma imagen. La imagen llenara el reverso con `object-fit: cover`, conservara el radio y el borde actuales, y no agregara texto sobre la fotografia.

Cuando no haya imagen configurada, el recurso deje de estar disponible o no pueda resolverse, el juego conservara el reverso actual basado en el color de acento y el nombre de marca.

## Validacion y errores

La carga seguira las reglas existentes del panel: PNG, JPG, WEBP o SVG, hasta 8 MB y hasta 4096 px por dimension cuando sea posible medirla. Un fallo de carga o guardado se mostrara con las notificaciones actuales y no reemplazara la configuracion guardada.

## Verificacion

- Validar tipos y compilacion de ambos proyectos.
- Verificar que el panel pueda cargar, reemplazar, guardar y quitar la imagen.
- Verificar que todas las cartas ocultas usen la imagen y que las caras reveladas no cambien.
- Verificar el fallback sin imagen y ante una referencia no resoluble.
- Verificar que una actualizacion remota refresque tanto el panel como el juego.
