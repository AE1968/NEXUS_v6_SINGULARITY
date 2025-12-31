import os
import math
from pathlib import Path

def split_file(filename, parts=2):
    p = Path(filename)
    if not p.exists():
        print(f"File {filename} not found.")
        return

    size = p.stat().st_size
    chunk_size = math.ceil(size / parts)
    
    print(f"Splitting {filename} ({size} bytes) into {parts} parts of approx {chunk_size} bytes.")

    with open(p, 'rb') as f:
        for i in range(parts):
            chunk = f.read(chunk_size)
            part_name = f"{filename}.{i+1:03d}" # .001, .002
            # User asked for "01 si 02", let's try to detect if they want specifically that naming or just split.
            # Standard split extensions are usually .001 or .z01. I'll stick to .001, .002 for safety unless specified.
            if parts == 2:
                 # Special case for "01 and 02" request looks nicer as part1/part2 or just .001/.002
                 pass
            
            with open(part_name, 'wb') as part_file:
                part_file.write(chunk)
            print(f"Created {part_name} ({len(chunk)} bytes)")

if __name__ == "__main__":
    split_file("project_full.zip", 2)
