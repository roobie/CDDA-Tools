import json
import unittest

from .builder import EOCBuilder
from .data import EOCType
from .serialization import EOCSerializer  
  
class TestEOCGeneration(unittest.TestCase):  
    def test_basic_eoc_creation(self):  
        eoc = EOCBuilder("TEST_EOC").with_effect({"u_message": "test"}).build()  
        self.assertEqual(eoc.id, "TEST_EOC")  
      
    def test_validation_catches_errors(self):  
        with self.assertRaises(ValueError):  
            EOCBuilder("TEST").with_type(EOCType.EVENT).build()  # Missing required_event  
      
    def test_serialization_matches_expected(self):  
        eoc = EOCBuilder("TEST").with_effect({"u_message": "test"}).build()  
        json_str = EOCSerializer().serialize(eoc)  
        data = json.loads(json_str)  
        self.assertEqual(data["type"], "effect_on_condition")