import os
import pandas as pd

class DataLoader:
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir

    def list_files(self):
        """List all supported files in the data directory."""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        files = [f for f in os.listdir(self.data_dir) if f.endswith('.csv') or f.endswith('.xlsx')]
        return files

    def load_words(self, filename):
        """
        Load words from a file. 
        Expected format: Column A = English, Column B = Chinese (or Translation)
        Returns a list of dicts: [{'word': 'apple', 'translation': '蘋果'}, ...]
        """
        file_path = os.path.join(self.data_dir, filename)
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {filename} not found.")

        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(file_path, header=None)
            else:
                df = pd.read_excel(file_path, header=None)
            
            # Assuming Column 0 is English, Column 1 is Translation
            # Adjust according to actual file structure
            words = []
            for _, row in df.iterrows():
                if pd.notna(row[0]) and pd.notna(row[1]):
                    words.append({
                        'word': str(row[0]).strip(),
                        'translation': str(row[1]).strip()
                    })
            return words
            
        except Exception as e:
            print(f"Error loading file {filename}: {e}")
            return []
