import json
from abc import ABC
from unittest import TestCase
from textwrap import dedent

from eoctool.enums import MessageType
from eoctool.builder import EOCBuilder
from eoctool.serialization import EOCSerializer
from eoctool.builder import EOCBuilder


def read_json_file(file_path: str) -> dict:
    """Helper to read a JSON file and return its content as a dictionary."""
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


serializer = EOCSerializer()


def serialize_eoc(eoc: EOCBuilder) -> dict:
    """Helper to serialize an EOC object to a dictionary."""
    return serializer._to_dict(eoc)


class BaseEOCJsonTest(ABC, TestCase):
    """Tests for comparing EOCBuilder output with static JSON files."""

    def _run_test(self, JSON_FILE_PATH: str, eoc_builder: EOCBuilder):
        """Test that EOCBuilder output for EOC_DRAIN_EFFECT_CHECK_HEADACHE matches the static JSON definition."""
        try:
            expected_data = read_json_file(JSON_FILE_PATH)
        except FileNotFoundError:
            self.fail(f"Static JSON file not found: {JSON_FILE_PATH}")
        except json.JSONDecodeError as e:
            self.fail(f"Failed to decode JSON file {JSON_FILE_PATH}: {e}")

        eoc = eoc_builder.build()

        to_compare = serialize_eoc(eoc)
        self.assertDictEqual(
            to_compare, expected_data, "Differences found in EOC output."
        )
