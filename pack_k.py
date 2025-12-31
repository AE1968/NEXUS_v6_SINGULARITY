import zipfile
from pathlib import Path

def pack_k():
    root = Path.cwd()
    products_dir = root / "MIGRATION_PACKAGE_V142" / "assets" / "images" / "products"
    
    # Files to include
    files_to_pack = []
    
    # 1. The 10 "product_X" files
    for i in range(1, 11):
        # extension differs, product_1 is jpg, rest svg
        if i == 1:
            name = "product_1.jpg"
        else:
            name = f"product_{i}.svg"
        
        p = products_dir / name
        if p.exists():
            files_to_pack.append(p)
        else:
            print(f"Warning: {name} not found")

    # 2. The hologram
    hologram = root / "assets" / "hologram.glb"
    if hologram.exists():
        files_to_pack.append(hologram)
    else:
        print("Warning: hologram.glb not found")

    # Create zip
    out_zip = "k.zip"
    print(f"Creating {out_zip} with {len(files_to_pack)} files in root...")
    
    with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for p in files_to_pack:
            # arcname=p.name puts it in the root of the zip
            z.write(p, arcname=p.name)
            print(f"Added: {p.name}")

if __name__ == "__main__":
    pack_k()
