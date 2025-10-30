from enum import Enum


class GameEvent(str, Enum):
    """Common game events that trigger EOCs"""

    CHARACTER_CASTS_SPELL = "character_casts_spell"
    CHARACTER_TAKES_DAMAGE = "character_takes_damage"
    CHARACTER_KILLS_MONSTER = "character_kills_monster"
    CHARACTER_GAINS_EFFECT = "character_gains_effect"
    CHARACTER_LOSES_EFFECT = "character_loses_effect"
    CHARACTER_WAKES_UP = "character_wakes_up"
    SPELLCASTING_FINISH = "spellcasting_finish"
    GAINS_MUTATION = "gains_mutation"


class MessageType(str, Enum):
    """Message display types"""

    GOOD = "good"
    BAD = "bad"
    NEUTRAL = "neutral"
    MIXED = "mixed"
    DEBUG = "debug"


class EOCSearchMode(str, Enum):
    """Inventory search modes for u_run_inv_eocs"""

    ALL = "all"
    RANDOM = "random"
    MANUAL = "manual"
