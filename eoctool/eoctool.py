#!/usr/bin/env python3  
"""  
EOC Builder - A fluent API for generating Cataclysm: DDA Effect on Condition JSON  
"""  
  
import json  
from typing import Any, Dict, List, Union, Optional  
  
  
class Condition:  
    """Helper class for building condition objects"""  
      
    @staticmethod  
    def u_has_trait(trait_id: str) -> Dict[str, str]:  
        return {"u_has_trait": trait_id}  
      
    @staticmethod  
    def npc_has_trait(trait_id: str) -> Dict[str, str]:  
        return {"npc_has_trait": trait_id}  
      
    @staticmethod  
    def u_has_effect(effect_id: str, intensity: Optional[int] = None,   
                     bodypart: Optional[str] = None) -> Dict[str, Any]:  
        result = {"u_has_effect": effect_id}  
        if intensity is not None:  
            result["intensity"] = intensity  
        if bodypart is not None:  
            result["bodypart"] = bodypart  
        return result  
      
    @staticmethod  
    def u_has_bionic(bionic_id: str) -> Dict[str, str]:  
        return {"u_has_bionics": bionic_id}  
      
    @staticmethod  
    def math(expression: str) -> Dict[str, List[str]]:  
        return {"math": [expression]}  
      
    @staticmethod  
    def and_(*conditions: Dict) -> Dict[str, List[Dict]]:  
        return {"and": list(conditions)}  
      
    @staticmethod  
    def or_(*conditions: Dict) -> Dict[str, List[Dict]]:  
        return {"or": list(conditions)}  
      
    @staticmethod  
    def not_(condition: Dict) -> Dict[str, Dict]:  
        return {"not": condition}  
      
    @staticmethod  
    def compare_string(str1: str, str2: Union[str, Dict]) -> List:  
        return {"compare_string": [str1, str2]}  
      
    @staticmethod  
    def u_has_items_sum(items: List[Dict[str, Any]]) -> Dict:  
        return {"u_has_items_sum": items}  
  
  
class Effect:  
    """Helper class for building effect objects"""  
      
    @staticmethod  
    def u_message(text: str, msg_type: str = "neutral") -> Dict[str, str]:  
        return {"u_message": text, "type": msg_type}  
      
    @staticmethod  
    def npc_message(text: str, msg_type: str = "neutral") -> Dict[str, str]:  
        return {"npc_message": text, "type": msg_type}  
      
    @staticmethod  
    def u_spawn_item(item_id: Union[str, Dict], count: Union[int, Dict] = 1) -> Dict[str, Any]:  
        result = {"u_spawn_item": item_id}  
        if count != 1:  
            result["count"] = count  
        return result  
      
    @staticmethod  
    def u_add_effect(effect_id: str, duration: Union[int, str],   
                     bodypart: Optional[str] = None, intensity: int = 1) -> Dict[str, Any]:  
        result = {"u_add_effect": effect_id, "duration": duration}  
        if intensity != 1:  
            result["intensity"] = intensity  
        if bodypart:  
            result["bodypart"] = bodypart  
        return result  
      
    @staticmethod  
    def u_add_morale(morale_type: str, bonus: Union[int, Dict]) -> Dict[str, Any]:  
        return {"u_add_morale": morale_type, "bonus": bonus}  
      
    @staticmethod  
    def run_eocs(eoc_id: Union[str, List[str]],   
                 variables: Optional[Dict[str, str]] = None,  
                 beta_loc: Optional[Dict] = None,  
                 iterations: Optional[int] = None) -> Dict[str, Any]:  
        result = {"run_eocs": eoc_id}  
        if variables:  
            result["variables"] = variables  
        if beta_loc:  
            result["beta_loc"] = beta_loc  
        if iterations:  
            result["iterations"] = iterations  
        return result  
      
    @staticmethod  
    def math(expression: str) -> Dict[str, List[str]]:  
        return {"math": [expression]}  
      
    @staticmethod  
    def u_location_variable(var_name: Union[str, Dict],   
                           x_adjust: int = 0, y_adjust: int = 0,  
                           min_radius: int = 0, max_radius: int = 0) -> Dict[str, Any]:  
        result = {"u_location_variable": var_name}  
        if x_adjust != 0:  
            result["x_adjust"] = x_adjust  
        if y_adjust != 0:  
            result["y_adjust"] = y_adjust  
        if min_radius != 0:  
            result["min_radius"] = min_radius  
        if max_radius != 0:  
            result["max_radius"] = max_radius  
        return result  
      
    @staticmethod  
    def copy_var(source_var: Dict, target_var: Dict) -> Dict[str, Dict]:  
        return {"copy_var": source_var, "target_var": target_var}  
      
    @staticmethod  
    def u_run_inv_eocs(mode: str, search_data: Optional[List[Dict]] = None,  
                       true_eocs: Optional[List[str]] = None) -> Dict[str, Any]:  
        result = {"u_run_inv_eocs": mode}  
        if search_data:  
            result["search_data"] = search_data  
        if true_eocs:  
            result["true_eocs"] = true_eocs  
        return result  
      
    @staticmethod  
    def if_then_else(condition: Dict, then_effect: Union[Dict, List[Dict]],   
                     else_effect: Optional[Union[Dict, List[Dict]]] = None) -> Dict[str, Any]:  
        result = {"if": condition, "then": then_effect}  
        if else_effect:  
            result["else"] = else_effect  
        return result  
  
  
class Variable:  
    """Helper class for variable objects"""  
      
    @staticmethod  
    def u_val(var_name: str) -> Dict[str, str]:  
        return {"u_val": var_name}  
      
    @staticmethod  
    def npc_val(var_name: str) -> Dict[str, str]:  
        return {"npc_val": var_name}  
      
    @staticmethod  
    def global_val(var_name: str) -> Dict[str, str]:  
        return {"global_val": var_name}  
      
    @staticmethod  
    def context_val(var_name: str) -> Dict[str, str]:  
        return {"context_val": var_name}  
      
    @staticmethod  
    def math(expression: str) -> Dict[str, List[str]]:  
        return {"math": [expression]}  
  
  
class EOC:  
    """Main EOC builder class with fluent interface"""  
      
    def __init__(self, eoc_id: str):  
        self.data: Dict[str, Any] = {  
            "type": "effect_on_condition",  
            "id": eoc_id  
        }  
      
    def activation(self) -> 'EOC':  
        """Set EOC type to ACTIVATION"""  
        self.data["eoc_type"] = "ACTIVATION"  
        return self  
      
    def recurring(self, seconds: Union[int, str, List]) -> 'EOC':  
        """Set EOC type to RECURRING with recurrence interval"""  
        self.data["eoc_type"] = "RECURRING"  
        self.data["recurrence"] = seconds  
        return self  
      
    def event(self, event_name: str) -> 'EOC':  
        """Set EOC type to EVENT with required event"""  
        self.data["eoc_type"] = "EVENT"  
        self.data["required_event"] = event_name  
        return self  
      
    def avatar_death(self) -> 'EOC':  
        """Set EOC type to AVATAR_DEATH"""  
        self.data["eoc_type"] = "AVATAR_DEATH"  
        return self  
      
    def npc_death(self) -> 'EOC':  
        """Set EOC type to NPC_DEATH"""  
        self.data["eoc_type"] = "NPC_DEATH"  
        return self  
      
    def condition(self, cond: Dict) -> 'EOC':  
        """Set the condition for this EOC"""  
        self.data["condition"] = cond  
        return self  
      
    def deactivate_condition(self, cond: Dict) -> 'EOC':  
        """Set the deactivate condition for this EOC"""  
        self.data["deactivate_condition"] = cond  
        return self  
      
    def effect(self, *effects: Union[Dict, List[Dict]]) -> 'EOC':  
        """Set the effects to execute when condition is true"""  
        if len(effects) == 1 and isinstance(effects[0], list):  
            self.data["effect"] = effects[0]  
        else:  
            self.data["effect"] = list(effects)  
        return self  
      
    def false_effect(self, *effects: Union[Dict, List[Dict]]) -> 'EOC':  
        """Set the effects to execute when condition is false"""  
        if len(effects) == 1 and isinstance(effects[0], list):  
            self.data["false_effect"] = effects[0]  
        else:  
            self.data["false_effect"] = list(effects)  
        return self  
      
    def global_eoc(self, run_for_npcs: bool = False) -> 'EOC':  
        """Make this a global EOC"""  
        self.data["global"] = True  
        if run_for_npcs:  
            self.data["run_for_npcs"] = True  
        return self  
      
    def to_json(self, indent: int = 2) -> str:  
        """Convert to JSON string"""  
        return json.dumps(self.data, indent=indent)  
      
    def to_dict(self) -> Dict[str, Any]:  
        """Get the raw dictionary"""  
        return self.data  
  
  
# Example usage and tests  
if __name__ == "__main__":  
    print("=== EOC Builder Examples ===\n")  
      
    # Example 1: Simple recurring EOC with condition  
    print("Example 1: Recurring EOC checking stamina")  
    eoc1 = (EOC("EOC_stamina_check")  
        .recurring("1 seconds")  
        .condition(Condition.math("u_val('stamina') == 500"))  
        .effect(  
            Effect.u_add_morale("morale_feeling_good", 10)  
        )  
        .false_effect(  
            Effect.u_message("Low stamina", "bad")  
        ))  
    print(eoc1.to_json())  
    print()  
      
    # Example 2: Event EOC for spell casting  
    print("Example 2: Event EOC for spell casting")  
    eoc2 = (EOC("EOC_spell_event_test")  
        .event("character_casts_spell")  
        .effect(  
            Effect.copy_var(  
                Variable.context_val("spell"),  
                Variable.global_val("key1")  
            ),  
            Effect.math("key3 = _difficulty"),  
            Effect.u_message("You cast a spell with difficulty {_difficulty}")  
        ))  
    print(eoc2.to_json())  
    print()  
      
    # Example 3: EOC with variables passed to another EOC  
    print("Example 3: EOC calling another with variables")  
    eoc3 = (EOC("EOC_I_NEED_AN_AR15")  
        .effect(  
            Effect.run_eocs("EOC_GIVE_A_GUN", variables={  
                "gun_name": "ar15_223medium",  
                "amount_of_guns": "5"  
            })  
        ))  
    print(eoc3.to_json())  
    print()  
      
    # Example 4: Complex condition with AND/OR  
    print("Example 4: Complex conditional logic")  
    eoc4 = (EOC("EOC_complex_condition")  
        .condition(  
            Condition.and_(  
                Condition.u_has_trait("SPIRITUAL"),  
                Condition.or_(  
                    Condition.u_has_effect("infected"),  
                    Condition.math("u_val('health') < 50")  
                )  
            )  
        )  
        .effect(  
            Effect.u_message("You feel spiritually troubled", "bad"),  
            Effect.u_add_effect("infection", "1 hours")  
        ))  
    print(eoc4.to_json())  
    print()  
      
    # Example 5: EOC with if/then/else effect  
    print("Example 5: If/then/else in effects")  
    eoc5 = (EOC("EOC_strength_check")  
        .effect(  
            Effect.if_then_else(  
                Condition.math("u_val('strength') > 8"),  
                Effect.u_message("You are strong!"),  
                Effect.u_message("You are normal")  
            )  
        ))  
    print(eoc5.to_json())  
    print()  
      
    # Example 6: Location variable usage  
    print("Example 6: Location variable")  
    eoc6 = (EOC("EOC_teleport_test")  
        .effect(  
            Effect.u_location_variable(  
                Variable.u_val("tele_test"),  
                x_adjust=1,  
                y_adjust=1  
            ),  
            Effect.u_run_inv_eocs("all", true_eocs=["EOC_nested"])  
        ))  
    print(eoc6.to_json())  
    print()  
      
    print("=== All examples generated successfully! ===")