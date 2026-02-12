import os
import sys

# Add backend to path to import modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.data_loader import DataLoader

try:
    # Mimic app.py logic
    backend_dir = os.path.join(os.getcwd(), 'backend')
    data_dir = os.path.join(backend_dir, 'data')
    
    print(f"Testing DataLoader with path: {data_dir}")
    loader = DataLoader(data_dir)
    files = loader.list_files()
    print("Files found:", files)
    
    if 'sample_vocab.csv' in files:
        print("SUCCESS: sample_vocab.csv found.")
    else:
        print("FAILURE: sample_vocab.csv NOT found.")

except Exception as e:
    print(f"Error: {e}")
