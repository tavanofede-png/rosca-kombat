# Third-party notices

The original Rosca Kombat game source, scripts and project assets are provided
under the MIT license in `LICENSE`, to the extent the contributors hold rights.
The character illustrations were generated with OpenAI imagegen and converted
to native Game Boy Color graphics; the prompts and conversion process are in
`docs/arte-personajes.md` and `docs/prompts-personajes.md`.

## GBDK-2020 / SDCC

The ROM is built with GBDK-2020 4.5.0 and links its runtime, standard font,
console, sound-register support and metasprite routines. These are third-party
components, not original Rosca Kombat code.

The GBDK runtime is distributed under GPL version 2 with a linking exception;
individual components may have their own notices. A copy of the upstream
runtime license and exception is in `licenses/GBDK-GPLV2-LINKING-EXCEPTION.txt`.
Full source and notices for the exact toolchain version are available at:
https://github.com/gbdk-2020/gbdk-2020/tree/4.5.0

The GBDK compiler binaries are not included in this repository or source ZIP.

## Optional desktop and hardware tools

- PyBoy 2.8.1: https://github.com/Baekalfen/PyBoy/tree/v2.8.1 (LGPL-3.0).
- Pillow: https://python-pillow.org/ (HPND license).
- NumPy: https://numpy.org/ (BSD-3-Clause).
- ModRetro Chromatic CLI: https://www.npmjs.com/package/@modretro/chromatic-cli.

These are installed separately; their binaries and Python packages are not
redistributed in the source package. Their own upstream licenses apply.
