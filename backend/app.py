from flask import Flask, jsonify, request
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
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'Filename is required'}), 400
    
    try:
        words = data_loader.load_words(filename)
        return jsonify(words)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exam', methods=['POST'])
def generate_exam():
    data = request.json
    filename = data.get('filename')
    num_questions = data.get('num_questions', 10)
    
    if not filename:
        return jsonify({'error': 'Filename is required'}), 400
        
    try:
        all_words = data_loader.load_words(filename)
        exam = mistake_tracker.generate_exam(all_words, num_questions)
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

if __name__ == '__main__':
    app.run(debug=True, port=5001)
