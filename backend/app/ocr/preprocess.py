import cv2
import numpy as np
import math
from typing import Tuple, Optional

def deskew_image(image: np.ndarray) -> np.ndarray:
    """
    Detects text block angle and rotates the image to deskew it.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    # Inverse threshold to find text regions
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Get coordinates of all non-zero pixels
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) == 0:
        return image
        
    # Get minAreaRect
    angle = cv2.minAreaRect(coords)[-1]
    
    # The cv2.minAreaRect returns values in range [-90, 0)
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # If the angle is very small, ignore it (likely noise or already straight)
    if abs(angle) < 0.5:
        return image
        
    # Rotate image
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    
    # Determine the new bounding box to prevent cropping
    cos = np.abs(M[0, 0])
    sin = np.abs(M[0, 1])
    nW = int((h * sin) + (w * cos))
    nH = int((h * cos) + (w * sin))
    M[0, 2] += (nW / 2) - center[0]
    M[1, 2] += (nH / 2) - center[1]
    
    rotated = cv2.warpAffine(image, M, (nW, nH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated

def preprocess_image(image_path: str) -> np.ndarray:
    """
    Preprocess image for OCR:
    1. Read image
    2. Mild deskew
    3. Convert to grayscale
    4. CLAHE contrast enhancement
    """
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image from {image_path}")
        
    # Mild deskew
    img = deskew_image(img)
    
    # Grayscale
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
        
    # CLAHE contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    
    return enhanced
