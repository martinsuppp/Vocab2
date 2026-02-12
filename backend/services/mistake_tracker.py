from database import get_db_connection
import random

class MistakeTracker:
    def __init__(self):
        pass

    def get_stats(self, words):
        """
        Fetch stats for a list of words.
        Returns a dict mapping word -> {mistake_count, correct_count}
        """
        conn = get_db_connection()
        placeholders = ','.join(['?'] * len(words))
        query = f"SELECT * FROM word_stats WHERE word IN ({placeholders})"
        rows = conn.execute(query, words).fetchall()
        conn.close()

        stats = {}
        for row in rows:
            stats[row['word']] = {
                'mistake_count': row['mistake_count'],
                'correct_count': row['correct_count']
            }
        return stats

    def get_all_stats(self):
        """Fetch stats for all words in the database."""
        conn = get_db_connection()
        rows = conn.execute("SELECT * FROM word_stats").fetchall()
        conn.close()

        stats = []
        for row in rows:
            total = row['correct_count'] + row['mistake_count']
            ratio = 0
            if total > 0:
                ratio = round(row['correct_count'] / total * 100, 1)
            
            stats.append({
                'word': row['word'],
                'correct_count': row['correct_count'],
                'mistake_count': row['mistake_count'],
                'ratio': ratio
            })
        return stats

    def reset_stats(self):
        """Clear all statistics from the database."""
        conn = get_db_connection()
        conn.execute("DELETE FROM word_stats")
        conn.commit()
        conn.close()

    def record_result(self, word, is_correct):
        """Update stats for a single word."""
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if exists
        c.execute("SELECT 1 FROM word_stats WHERE word = ?", (word,))
        exists = c.fetchone()

        if is_correct:
            if exists:
                c.execute("UPDATE word_stats SET correct_count = correct_count + 1, last_review_date = CURRENT_TIMESTAMP WHERE word = ?", (word,))
            else:
                c.execute("INSERT INTO word_stats (word, correct_count, mistake_count) VALUES (?, 1, 0)", (word,))
        else:
            if exists:
                c.execute("UPDATE word_stats SET mistake_count = mistake_count + 1, last_review_date = CURRENT_TIMESTAMP WHERE word = ?", (word,))
            else:
                c.execute("INSERT INTO word_stats (word, correct_count, mistake_count) VALUES (?, 0, 1)", (word,))
        
        conn.commit()
        conn.close()

    def generate_exam(self, all_words, num_questions=10):
        """
        Generate an exam based on mistake weights.
        High mistake count = higher probability.
        """
        if not all_words:
            return []

        # Get stats for all available words
        word_list = [w['word'] for w in all_words]
        stats = self.get_stats(word_list)

        # Calculate weights
        # Base weight = 1
        # Added weight = mistake_count * 2
        weights = []
        for w in all_words:
            word_stats = stats.get(w['word'], {'mistake_count': 0})
            weight = 1 + (word_stats['mistake_count'] * 5) # Heavily favor mistakes
            weights.append(weight)

        # Select words
        # Always allow duplicates as per user request ("unlimited appearances")
        selected_words = random.choices(all_words, weights=weights, k=num_questions)

        # Generate questions with options
        exam = []
        for target in selected_words:
            options = [target]
            # Pick 3 distractors
            distractors = [w for w in all_words if w['word'] != target['word']]
            if len(distractors) >= 3:
                options.extend(random.sample(distractors, 3))
            else:
                options.extend(distractors) # Less than 3 options available
            
            random.shuffle(options)
            
            exam.append({
                'word': target['word'],
                'correct_translation': target['translation'],
                'options': [{'word': o['word'], 'translation': o['translation']} for o in options]
            })

        return exam
