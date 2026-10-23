# Arte de personajes — Rosca Kombat 1.2

## Entrega

- `assets/portraits/atlas-a.png` y `atlas-b.png`: originales generados con la herramienta integrada **imagegen**, sin API de pago externa ni Fal.
- `assets/portraits/00.png` a `31.png`: retratos separados en el orden del plantel.
- `assets/portraits/cgb-art.json`: índices de color, paletas y poses que se compilan dentro del cartucho. No hay imágenes externas que la consola necesite cargar.
- `build/rosca-kombat.gbc`: ROM nativa de 256 KiB.
- `build/roster-gallery.png` y `build/fighters-in-rom.png`: capturas de los 32 personajes dentro de la ROM, no maquetas.
- `build/arenas-gallery.png`: cuatro combates capturados en la ROM.

## Dirección visual y prompts

Se generaron dos atlas nuevos con caricaturas de los personajes del plantel. La prioridad del prompt fue el parecido individual: edad, forma del cráneo, ojos, nariz, mandíbula, línea de cabello, bigote y barba. Los personajes ficticios también tienen diseños propios. La búsqueda de referencia de Beltrán Briones se usó para precisar su descripción como empresario joven, pelo oscuro, cejas marcadas y rostro sin barba; no se incorporaron fotos a la ROM. Los originales generados se revisaron visualmente antes de la conversión.

Los prompts completos están en `docs/prompts-personajes.md`. Se utilizó el modo integrado de imagegen, no el modo CLI.

## Conversión nativa

`npm run art:pack` exporta las poses de `scripts/body-art.mjs` y ejecuta `scripts/pack-portraits.py` con Pillow y NumPy. Los bordes de las celdas del atlas se revisaron individualmente, pues la imagen generada no tiene una cuadrícula geométricamente exacta.

Cada retrato se reduce a 64×80 y se convierte en 80 tiles de 8×8. Cada tile usa cuatro colores, elegidos entre siete paletas propias del retrato. Los colores se redondean a RGB de cinco bits por canal, como exige CGB. No se aplica dithering para evitar ruido en el LCD.

Los luchadores comparten una cabeza de 32×32 entre sus seis poses, con dos paletas, y un cuerpo animado de 24×32 con otra paleta. El total visible es 32×64. Cada luchador ocupa 88 tiles y catorce sprites de hardware; ambos jugadores caben en el banco 1 de VRAM. Los proyectiles usan dos sprites si hay uno activo y uno por proyectil si ambos están activos; el máximo comprobado es diez por línea. Las manos, pies y posiciones de combate se mantienen en sus coordenadas anteriores.

La ROM se genera con `npm run build`. Para la compilación normal alcanza Node y el GBDK local: el JSON convertido ya está incluido, por lo que no se necesita generar imágenes ni ejecutar Python para cada build.

## Verificación

`npm test` ejecuta 90 comprobaciones de juego y 803 comprobaciones de gráficos en PyBoy: los 32 retratos se comparan con sus colores esperados; se revisan las seis poses, ambos jugadores y ambas orientaciones; y se fuerza el peor caso de proyectiles cruzando las cabezas para comprobar el límite de sprites por línea. Los informes incluyen el SHA256 de la ROM que se verificó.

Las capturas visuales se regeneran con `scripts/visual-review.py`. La versión anterior se conserva en `backups/visual-v1.1/`.
