import face_recognition
import cv2
import os
import numpy as np

KNOWN_DIR = "known_faces"

known_encodings = []
known_names = []

def reload_faces():
    global known_encodings, known_names
    known_encodings = []
    known_names = []
    if not os.path.exists(KNOWN_DIR):
        os.makedirs(KNOWN_DIR)
    
    for file in os.listdir(KNOWN_DIR):
        if file.endswith((".jpg", ".png", ".jpeg")):
            img = face_recognition.load_image_file(f"{KNOWN_DIR}/{file}")
            enc = face_recognition.face_encodings(img)
            if len(enc) > 0:
                known_encodings.append(enc[0])
                known_names.append(file.split(".")[0])

# Initialize on load
reload_faces()

def recognize(frame):
    if not known_encodings:
        return "Unknown"
        
    rgb = frame[:, :, ::-1]
    locations = face_recognition.face_locations(rgb)
    encodings = face_recognition.face_encodings(rgb, locations)

    for enc in encodings:
        matches = face_recognition.compare_faces(known_encodings, enc)
        if True in matches:
            return known_names[matches.index(True)]
    return "Unknown"
