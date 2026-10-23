"""Interactive SDL2 emulator; it runs the same ROM as the Chromatic."""
import pathlib
import sys
ROOT=pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'tools/python-packages'))
from pyboy import PyBoy
print('ROSCA KOMBAT: Flechas = cruceta | X = A | Z = B | Enter = START | Retroceso = SELECT')
print('Cerra la ventana para salir. No se guarda la partida.')
game=PyBoy(str(ROOT/'build/rosca-kombat.gbc'),window='SDL2',scale=4,cgb=True)
game.set_emulation_speed(1)
try:
    while game.tick():
        pass
finally:
    game.stop(save=False)
