import os
import json

TESTS_DIR = os.path.join("public", "tests")
REGISTRY_FILE = os.path.join(TESTS_DIR, "registry.json")
PROCESSED_FILE = os.path.join(TESTS_DIR, "processed_tests.json")

def main():
    # Load processed tests
    if os.path.exists(PROCESSED_FILE):
        with open(PROCESSED_FILE, 'r', encoding='utf-8') as f:
            try:
                processed = json.load(f)
            except json.JSONDecodeError:
                processed = []
    else:
        processed = []

    # Load current registry
    if os.path.exists(REGISTRY_FILE):
        with open(REGISTRY_FILE, 'r', encoding='utf-8') as f:
            try:
                registry = json.load(f)
            except json.JSONDecodeError:
                registry = []
    else:
        registry = []

    # Scan tests directory for new folders
    new_tests = []
    for item in os.listdir(TESTS_DIR):
        item_path = os.path.join(TESTS_DIR, item)
        if os.path.isdir(item_path):
            if item not in processed:
                # Check if questions.json exists
                if os.path.exists(os.path.join(item_path, "questions.json")):
                    new_tests.append(item)

    if not new_tests:
        print("No new tests found to process.")
        return

    # Process new tests
    for test_id in new_tests:
        print(f"Discovered new test: {test_id}")
        title = input(f"Enter title for '{test_id}': ") or test_id
        description = input(f"Enter description for '{test_id}': ") or "No description provided."
        
        registry.append({
            "id": test_id,
            "title": title,
            "description": description
        })
        processed.append(test_id)

    # Save registry
    with open(REGISTRY_FILE, 'w', encoding='utf-8') as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)

    # Save processed file
    with open(PROCESSED_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)

    print(f"Successfully processed {len(new_tests)} new test(s) and updated the registry.")

if __name__ == "__main__":
    main()
