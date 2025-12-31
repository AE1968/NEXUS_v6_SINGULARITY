
import os

def fix_demo():
    path = 'demo.html'
    if not os.path.exists(path): return
    
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    skip = False
    
    # Logic: detect start of simulateLipSync and replace until end of it
    
    for line in lines:
        if 'simulateLipSync() {' in line:
            new_lines.append(line) # keep function sig
            # Add corrected body
            new_lines.append("""                // Using LipSyncSystem if available
                if (window.LipSyncSystem && window.LipSyncSystem.analyser) {
                    const viseme = window.LipSyncSystem.getViseme();
                    Object.values(this.morphTargets).forEach(mesh => {
                        const idx = mesh.morphTargetDictionary['jawOpen'] || mesh.morphTargetDictionary['mouthOpen'] || 0;
                        let val = 0;
                        if (viseme === 'aa' || viseme === 'oo') val = 0.8;
                        else if (viseme === 'ee' || viseme === 'ch') val = 0.4;
                        else if (viseme === 'mm') val = 0;
                        
                        if (mesh.morphTargetInfluences && idx !== undefined) {
                             mesh.morphTargetInfluences[idx] = val;
                        }
                    });
                } else {
                    // Fallback
                     Object.values(this.morphTargets).forEach(mesh => {
                        const idx = mesh.morphTargetDictionary['jawOpen'] || mesh.morphTargetDictionary['mouthOpen'] || 0;
                        if (mesh.morphTargetInfluences && idx !== undefined) {
                            mesh.morphTargetInfluences[idx] = Math.abs(Math.sin(Date.now() * 0.01)) * 0.3;
                        }
                    });
                }
            },
""")
            skip = True
        
        if skip:
            # Check for end of function block to stop skipping
            # The original code ended with `            },` around line 225
            if line.strip() == '},':
                skip = False
                continue # The new body includes the closing brace and comma? Yes
                # My appended block ends with },\n. So I should skip the original }, line
            if 'setEmotion(emotion)' in line: # Fallback safety
                 skip = False
                 new_lines.append(line)
        else:
            new_lines.append(line)

    # Scriu înapoi
    # Dar trebuie să fiu atent la duplicate },
    # Metoda de mai sus e riscantă la matching },
    
    # Mai bine: citesc tot contentul, fac string replace la blocul stricat (identificat prin start și un substring unic din mijloc).
    
    content = "".join(lines)
    # Fragmentul stricat din view_file:
    # me === 'ee' || viseme === 'ch') val = 0.4;
    # else if (viseme === 'mm') val =                             mesh.morphTargetInfluen                                   });
    
    # Voi folosi Python replace simplu pe un substring cheie.
    
    bad_part = "viseme === 'ch') val = 0.4;"
    if bad_part in content:
        print("Found bad part, attempting logic replacement...")
        # Aici e greu.
        
    # Varianta 3: Rescriem tot fișierul `demo.html` cu o versiune curată (template).
    # Nu e ideal să distrug ce era.
    
    pass

# De fapt, scriu un fișier demo_fixed.html complet și îl suprascriu. 
# Am conținutul din step 834. Pot să-l copiez local, îl repar și îl scriu.

if __name__ == "__main__":
    pass
