from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from database import init_db
from services.data_loader import DataLoader
from services.mistake_tracker import MistakeTracker
import os

app = Flask(__name__)
CORS(app)

# Initialize services
basedir = os.path.abspath(os.path.dirname(__file__))
data_path = os.path.join(basedir, 'data')
data_loader = DataLoader(data_path)
mistake_tracker = MistakeTracker()

# Ensure DB is initialized
init_db()

@app.route('/api/files', methods=['GET'])
def list_files():
    try:
        files = data_loader.list_files()
        return jsonify(files)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/words', methods=['GET'])
def get_words():
    filename_param = request.args.get('filename')
    if not filename_param:
        return jsonify({'error': 'Filename is required'}), 400
    
    try:
        filenames = [f.strip() for f in filename_param.split(',')]
        all_words = []
        for fname in filenames:
            words = data_loader.load_words(fname)
            all_words.extend(words)
            
        return jsonify(all_words)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exam', methods=['POST'])
def generate_exam():
    data = request.json
    filename_param = data.get('filename')
    
    if not filename_param:
        return jsonify({'error': 'Filename is required'}), 400
        
    try:
        num_questions = int(data.get('num_questions', 10))
        new_ratio = float(data.get('new_ratio', 20)) / 100.0  # Frontend sends 0-100
        mistake_weight = float(data.get('mistake_weight', 5.0))

        filenames = [f.strip() for f in filename_param.split(',')]
        all_words = []
        for fname in filenames:
            words = data_loader.load_words(fname)
            all_words.extend(words)

        if not all_words:
             return jsonify([])

        exam = mistake_tracker.generate_exam(all_words, num_questions, new_ratio, mistake_weight)
        return jsonify(exam)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit', methods=['POST'])
def submit_result():
    data = request.json
    results = data.get('results') # List of {word: 'apple', is_correct: True}
    
    if not results:
        return jsonify({'error': 'Results are required'}), 400
        
    try:
        for result in results:
            mistake_tracker.record_result(result['word'], result['is_correct'])
            
        # Fetch updated stats for the words just submitted
        word_list = [r['word'] for r in results]
        updated_stats = mistake_tracker.get_stats(word_list)
        
        return jsonify({
            'message': 'Results recorded successfully',
            'updated_stats': updated_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        stats = mistake_tracker.get_all_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['DELETE'])
def reset_stats():
    try:
        mistake_tracker.reset_stats()
        return jsonify({'message': 'Stats reset successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder = os.path.join(basedir, '../frontend/dist')
    
    # Debug logging
    print(f"DEBUG: Current CWD: {os.getcwd()}", flush=True)
    print(f"DEBUG: Serving path: {path}", flush=True)
    print(f"DEBUG: Static folder: {static_folder}", flush=True)
    print(f"DEBUG: Exists? {os.path.exists(static_folder)}", flush=True)
    
    # Check parent directory structure
    try:
        parent_dir = os.path.join(basedir, '..')
        print(f"DEBUG: Parent contents: {os.listdir(parent_dir)}", flush=True)
        frontend_dir = os.path.join(parent_dir, 'frontend')
        if os.path.exists(frontend_dir):
            print(f"DEBUG: Frontend contents: {os.listdir(frontend_dir)}", flush=True)
    except Exception as e:
        print(f"DEBUG: Error checking dirs: {e}", flush=True)

    if os.path.exists(static_folder):
        print(f"DEBUG: Dist Contents: {os.listdir(static_folder)}", flush=True)
    
    if path != "" and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    else:
        return send_from_directory(static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')
