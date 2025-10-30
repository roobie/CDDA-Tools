import os
import re
import json
import argparse

def extract_eoc_ids(file_path):
    """Extract EOC IDs from the given Python file."""
    eoc_ids = []
    eoc_builder_pattern = re.compile(r"EOCBuilder\(\"(.*?)\"\)")

    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            match = eoc_builder_pattern.search(line)
            if match:
                eoc_ids.append(match.group(1))

    return eoc_ids

def find_matching_json_files(eoc_ids, search_dir):
    """Find JSON files in the directory whose 'id' matches any of the EOC IDs."""
    matched_files = {}

    for root, _, files in os.walk(search_dir):
        for file_name in files:
            if file_name.endswith('.json'):
                file_path = os.path.join(root, file_name)
                with open(file_path, 'r', encoding='utf-8') as json_file:
                    try:
                        # Read as text first to check for potential matches
                        content = json_file.read()
                        if any(eoc_id in content for eoc_id in eoc_ids):
                            # Parse as JSON only if a match is found
                            arr = json.loads(content)
                            for data in arr:
                                if isinstance(data, dict) and data.get('id') in eoc_ids:
                                    matched_files[data['id']] = data
                    except json.JSONDecodeError:
                        print(f"Warning: Failed to parse JSON in file {file_path}")

    return matched_files

def save_json_objects(json_objects, output_dir):
    """Save JSON objects to the output directory with filenames as their IDs."""
    os.makedirs(output_dir, exist_ok=True)

    for eoc_id, data in json_objects.items():
        output_path = os.path.join(output_dir, f"{eoc_id}.json")
        with open(output_path, 'w', encoding='utf-8') as output_file:
            json.dump(data, output_file, indent=4)

def main():
    parser = argparse.ArgumentParser(description="Extract EOC IDs and match JSON files.")
    parser.add_argument("input_python_file", type=str, help="Path to the input Python file.")
    parser.add_argument("json_search_dir", type=str, help="Directory containing JSON files.")
    parser.add_argument("output_dir", type=str, help="Directory to save matched JSON files.")

    args = parser.parse_args()

    # Resolve paths to absolute paths
    input_python_file = os.path.abspath(args.input_python_file)
    json_search_dir = os.path.abspath(args.json_search_dir)
    output_dir = os.path.abspath(args.output_dir)

    # Step 1: Extract EOC IDs from the Python file
    eoc_ids = extract_eoc_ids(input_python_file)
    print(f"Extracted EOC IDs: {eoc_ids}")

    # Step 2: Find matching JSON files
    matched_json_objects = find_matching_json_files(eoc_ids, json_search_dir)
    print(f"Found {len(matched_json_objects)} matching JSON objects.")

    # Step 3: Save matched JSON objects
    save_json_objects(matched_json_objects, output_dir)
    print(f"Saved matched JSON objects to {output_dir}")

if __name__ == "__main__":
    main()