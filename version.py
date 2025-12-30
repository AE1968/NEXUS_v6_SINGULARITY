# ==============================================================================
# KELION VERSION - SINGLE SOURCE OF TRUTH
# ==============================================================================
# Modifică DOAR acest fișier pentru a actualiza versiunea peste tot!
# ==============================================================================

VERSION = "v143.0"
VERSION_DATE = "2025-12-30"
VERSION_CODENAME = "GLOBAL_EYE"

# Build info
BUILD_NUMBER = 143
BUILD_TYPE = "stable"  # stable, beta, alpha

def get_version_info():
    """Returnează toate informațiile despre versiune"""
    return {
        "version": VERSION,
        "date": VERSION_DATE,
        "codename": VERSION_CODENAME,
        "build": BUILD_NUMBER,
        "type": BUILD_TYPE,
        "full": f"{VERSION} ({VERSION_CODENAME}) - {VERSION_DATE}"
    }

def get_version():
    """Returnează doar string-ul versiunii"""
    return VERSION
