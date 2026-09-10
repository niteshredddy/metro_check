import easyocr
import numpy as np
from pydantic import BaseModel
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)

# Initialize the EasyOCR reader at the module level.
# This ensures the model is loaded only once when the module is imported.
# Setting gpu=False since we assume CPU environments for hackathons.
reader = easyocr.Reader(['en'], gpu=False)

class TextBlock(BaseModel):
    text: str
    bbox: List[Tuple[int, int]]  # [[x1,y1], [x2,y1], [x2,y2], [x1,y2]]
    confidence: float

def extract_text_blocks(image: np.ndarray) -> List[TextBlock]:
    """
    Extracts text blocks from a preprocessed image using EasyOCR.
    """
    try:
        # EasyOCR readtext returns a list of tuples: (bbox, text, prob)
        # where bbox is [[x, y], [x, y], [x, y], [x, y]]
        results = reader.readtext(image)
        
        blocks = []
        for bbox, text, prob in results:
            # Convert bounding box coordinates to integers
            formatted_bbox = [(int(pt[0]), int(pt[1])) for pt in bbox]
            
            # EasyOCR can sometimes return empty strings
            if text.strip():
                blocks.append(TextBlock(
                    text=text.strip(),
                    bbox=formatted_bbox,
                    confidence=prob
                ))
                
        return blocks
    except Exception as e:
        logger.error(f"Error during OCR extraction: {str(e)}")
        raise
