import os

def find_settings_gradle():
    """
    Locates the android/settings.gradle file required for fixing 
    the Notifee build error.
    """
    # Define the target relative path from the root
    target_rel_path = os.path.join("android", "settings.gradle")
    
    # Check if we are already in the root or need to search
    current_dir = os.getcwd()
    
    # Check common locations (Current Dir or child AlarmApp dir)
    possible_paths = [
        os.path.abspath(target_rel_path),
        os.path.abspath(os.path.join("AlarmApp", target_rel_path))
    ]

    for path in possible_paths:
        if os.path.exists(path):
            return path

    # Fallback: Walk the directory tree if structure is nested
    for root, dirs, files in os.walk(current_dir):
        if "settings.gradle" in files and "android" in root:
            return os.path.join(root, "settings.gradle")

    return "File not found. Ensure you are running this from the project root."

if __name__ == "__main__":
    print(find_settings_gradle())