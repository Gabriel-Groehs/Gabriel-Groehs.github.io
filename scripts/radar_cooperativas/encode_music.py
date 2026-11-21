"""encode_music.py <in.ogg> <out_prefix> — decodifica, apara silêncio das pontas, fade-out de 1,5 s e grava MP3 VBR em alguns níveis."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pylibs'))
import numpy as np
import soundfile as sf

src, pre = sys.argv[1], sys.argv[2]
print(sf.info(src))
data, sr = sf.read(src, dtype='float32', always_2d=True)
peak = float(np.abs(data).max()); rms = float(np.sqrt((data ** 2).mean()))
print('shape', data.shape, 'sr', sr, 'peak %.3f' % peak, 'rms %.1f dBFS' % (20 * np.log10(rms)), 'dur %.1f s' % (len(data) / sr))
thr = 10 ** (-55 / 20)
env = np.abs(data).max(axis=1)
idx = np.where(env > thr)[0]
a = max(0, idx[0] - int(0.25 * sr)); b = min(len(data), idx[-1] + int(1.0 * sr))
data = data[a:b].copy()
n = int(1.5 * sr)
data[-n:] *= np.linspace(1.0, 0.0, n, dtype=np.float32)[:, None]
pk = float(np.abs(data).max())
if pk > 0.95:
    data *= np.float32(0.95 / pk)   # o Vorbis decodificado passa de 1,0: normaliza o pico para não estourar no MP3
print('pico depois: %.3f' % float(np.abs(data).max()))
print('aparado: início %.2f s, fim %.2f s, nova duração %.1f s' % (a / sr, b / sr, len(data) / sr))
for lvl in [float(x) for x in (sys.argv[3].split(',') if len(sys.argv) > 3 else ['0.5', '0.6', '0.7'])]:
    o = '%s_q%02d.mp3' % (pre, int(round(lvl * 100)))
    sf.write(o, data, sr, format='MP3', subtype='MPEG_LAYER_III', bitrate_mode='VARIABLE', compression_level=lvl)
    sz = os.path.getsize(o)
    print('%s  %.2f MB  %.0f kbps' % (os.path.basename(o), sz / 1e6, sz * 8 / (len(data) / sr) / 1000))
