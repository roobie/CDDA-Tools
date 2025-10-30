from enum import Enum
import json  
from typing import Any

from eoctool.data import EffectOnCondition  
  
class EOCSerializer:  
    """Converts Python EOC objects to JSON"""  
      
    def serialize(self, eoc: EffectOnCondition, indent: int = 2) -> str:  
        """Serialize EOC to JSON string"""  
        data = self._to_dict(eoc)  
        return json.dumps(data, indent=indent, ensure_ascii=False)  
      
    def _to_dict(self, obj: Any) -> Any:  
        """Convert dataclass to dict, handling special cases"""  
        if hasattr(obj, '__dataclass_fields__'):  
            result = {}  
            for field_name, field_def in obj.__dataclass_fields__.items():  
                value = getattr(obj, field_name)  
                  
                # Skip None values  
                if value is None:  
                    continue  
                  
                # Handle metadata for JSON key mapping  
                json_key = field_def.metadata.get('json_key', field_name)  
                # Remove trailing underscore (for Python reserved keywords)  
                if json_key.endswith('_'):  
                    json_key = json_key[:-1]  
                  
                result[json_key] = self._to_dict(value)  
              
            return result  
        elif isinstance(obj, Enum):  
            return obj.value  
        elif isinstance(obj, (list, tuple)):  
            return [self._to_dict(item) for item in obj]  
        elif isinstance(obj, dict):  
            return {k: self._to_dict(v) for k, v in obj.items()}  
        else:  
            return obj