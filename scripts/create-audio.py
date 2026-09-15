"""Create original, loop-safe tomb ambience and an audible media sound check."""
import math
import struct
import wave
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'out' / 'assets'
root.mkdir(exist_ok=True)
rate = 22050

def write(name, duration, signal):
    with wave.open(str(root / name), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(rate)
        samples = (max(-1, min(1, signal(i / rate))) for i in range(int(duration * rate)))
        output.writeframes(b''.join(struct.pack('<h', int(v * 32767)) for v in samples))

def ambience(t):
    # All drone periods divide 16 seconds; sparse bells are smoothly windowed.
    swell = 0.65 + 0.2 * math.sin(2 * math.pi * t / 16)
    drone = sum(math.sin(2 * math.pi * f * t) * a for f, a in [(55, .09), (82.5, .065), (110, .035), (165, .015)])
    bells = 0
    for start, frequency in [(0.5, 220), (4.5, 330), (8.5, 247.5), (12.5, 165)]:
        age = t-start
        if 0 < age < 3:
            envelope = math.sin(math.pi * age / 3)**2 * math.exp(-age*1.5)
            bells += envelope * .22 * (math.sin(2*math.pi*frequency*age) + .3*math.sin(2*math.pi*frequency*2.01*age))
    return drone*swell + bells

write('tomb-ambience.wav', 16, ambience)
write('sound-check.wav', 1.2, lambda t: .35*math.sin(math.pi*t/1.2)**2 * math.sin(2*math.pi*(440 if t<.6 else 660)*t))
