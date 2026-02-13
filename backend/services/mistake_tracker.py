from database import get_db_connection
import random

class MistakeTracker:
    def __init__(self):
        pass

    def get_stats(self, words):
        """
        Fetch stats for a list of words.
        Returns a dict mapping word -> {mistake_count, correct_count, recent_correct, recent_mistake, ratio}
        """
        if not words:
            return {}
            
        conn = get_db_connection()
        placeholders = ','.join(['?'] * len(words))
        query = f"SELECT * FROM word_stats WHERE word IN ({placeholders})"
        rows = conn.execute(query, words).fetchall()
        
        # Get recent stats for THESE words
        # (Could optimize with a WHERE IN clause in get_recent_performance, but for simplicity we fetch all or filter)
        # Let's filter the get_recent_performance logic to accept words list
        recent_stats = self.get_recent_performance(words)
        
        conn.close()

        stats = {}
        # Fill with defaults first (for words not in word_stats yet)
        for w in words:
            stats[w] = {
                'mistake_count': 0, 
                'correct_count': 0,
                'ratio': 0,
                'recent_correct': 0,
                'recent_mistake': 0,
                'recent_ratio': 0
            }

        for row in rows:
            word = row['word']
            total = row['correct_count'] + row['mistake_count']
            ratio = 0
            if total > 0:
                ratio = round(row['correct_count'] / total * 100, 1)

            recent = recent_stats.get(word, {'recent_correct': 0, 'recent_mistake': 0})
            r_total = recent['recent_correct'] + recent['recent_mistake']
            r_ratio = 0
            if r_total > 0:
                r_ratio = round(recent['recent_correct'] / r_total * 100, 1)

            stats[word] = {
                'mistake_count': row['mistake_count'],
                'correct_count': row['correct_count'],
                'ratio': ratio,
                'recent_correct': recent['recent_correct'],
                'recent_mistake': recent['recent_mistake'],
                'recent_ratio': r_ratio
            }
        
        return stats

    def get_recent_performance(self, word_list=None):
        """
        Get recent 20 exam performance for words.
        :param word_list: Optional list of words to filter. If None, returns all.
        Returns: dict mapping word -> {recent_correct, recent_mistake}
        """
        conn = get_db_connection()
        try:
            where_clause = ""
            params = []
            if word_list:
                placeholders = ','.join(['?'] * len(word_list))
                where_clause = f"WHERE word IN ({placeholders})"
                params = word_list

            # Improved query with optional filtering
            # Note: Filtering before window function is more efficient if possible, 
            # but window function needs PARTITION BY word.
            # So filtering the base table is fine.
            
            base_query = f"""
                SELECT word, is_correct, timestamp, id
                FROM exam_attempts
                {where_clause}
            """
            
            query = f"""
                SELECT word, 
                       SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as recent_correct,
                       SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as recent_mistake
                FROM (
                    SELECT word, is_correct, row_number() OVER (PARTITION BY word ORDER BY timestamp DESC, id DESC) as rn
                    FROM ({base_query})
                )
                WHERE rn <= 20
                GROUP BY word
            """
            
            # Param usage: base_query needs params
            rows = conn.execute(query, params).fetchall()
            recent_stats = {}
            for row in rows:
                recent_stats[row['word']] = {
                    'recent_correct': row['recent_correct'],
                    'recent_mistake': row['recent_mistake']
                }
            return recent_stats
        except Exception as e:
            print(f"Error fetching recent stats: {e}")
            return {}
        finally:
            conn.close()

    def get_all_stats(self):
        """Fetch stats for all words in the database, including recent 20."""
        conn = get_db_connection()
        rows = conn.execute("SELECT * FROM word_stats").fetchall()
        conn.close()

        recent_stats = self.get_recent_performance()

        stats = []
        for row in rows:
            total = row['correct_count'] + row['mistake_count']
            ratio = 0
            if total > 0:
                ratio = round(row['correct_count'] / total * 100, 1)
            
            recent = recent_stats.get(row['word'], {'recent_correct': 0, 'recent_mistake': 0})
            r_total = recent['recent_correct'] + recent['recent_mistake']
            r_ratio = 0
            if r_total > 0:
                r_ratio = round(recent['recent_correct'] / r_total * 100, 1)

            stats.append({
                'word': row['word'],
                'correct_count': row['correct_count'],
                'mistake_count': row['mistake_count'],
                'ratio': ratio,
                'recent_correct': recent['recent_correct'],
                'recent_mistake': recent['recent_mistake'],
                'recent_ratio': r_ratio
            })
        return stats

    def reset_stats(self):
        """Clear all statistics from the database."""
        conn = get_db_connection()
        conn.execute("DELETE FROM word_stats")
        conn.execute("DELETE FROM exam_attempts") # Clear history too
        conn.commit()
        conn.close()

    def record_result(self, word, is_correct):
        """Update stats for a single word."""
        conn = get_db_connection()
        c = conn.cursor()
        
        # 1. Update Aggregate Stats (Lifetime)
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
        
        # 2. Log History for Recent Stats
        c.execute("INSERT INTO exam_attempts (word, is_correct) VALUES (?, ?)", (word, is_correct))

        conn.commit()
        conn.close()

    def generate_exam(self, all_words, num_questions=10, new_ratio=0.2, mistake_weight=2.0):
        """
        Generate an exam based on settings.
        Uses Recent 20 Mistake Count for weighting.
        :param new_ratio: Float 0.0-1.0, probability of picking a new word (0 stats).
        :param mistake_weight: Float >= 1.0, multiplier for mistake count in weighting.
        """
        if not all_words:
            return []

        # Get stats for all available words (Including recent!)
        # We need recent stats specifically for weighting mistakes
        recent_stats = self.get_recent_performance()
        
        # Also limit lifetime stats to distinguish new words (0 attempts)
        lifetime_stats = self.get_stats([w['word'] for w in all_words])

        # Split into pools
        new_words = []
        old_words = []
        old_weights = []

        for w in all_words:
            # Check if NEW (Lifetime attempts = 0)
            l_stats = lifetime_stats.get(w['word'], {'mistake_count': 0, 'correct_count': 0})
            total_attempts = l_stats['mistake_count'] + l_stats['correct_count']
            
            if total_attempts == 0:
                new_words.append(w)
            else:
                old_words.append(w)
                
                # Calculate weight based on RECENT mistakes
                # If no recent history, assume weight 1 (neutral)
                r_stats = recent_stats.get(w['word'], {'recent_correct': 0, 'recent_mistake': 0})
                recent_mistakes = r_stats['recent_mistake']
                
                # Base 1 + (Recent Mistakes * Weight)
                # This ensures we only penalize RECENT failures
                weight = 1 + (recent_mistakes * mistake_weight)
                old_weights.append(weight)

        selected_words = []
        
        # Calculate target counts
        target_new_count = int(num_questions * new_ratio)
        
        # Selection Logic
        for _ in range(num_questions):
            use_new = False
            if new_words and old_words:
                if len([x for x in selected_words if x in new_words]) < target_new_count:
                    use_new = True
                else:
                    use_new = False
            elif new_words:
                use_new = True
            else:
                use_new = False
            
            if use_new and new_words:
                selected_words.append(random.choice(new_words))
            elif old_words:
                # Weighted selection for old words
                choice = random.choices(old_words, weights=old_weights, k=1)[0]
                selected_words.append(choice)
            elif new_words:
                selected_words.append(random.choice(new_words))

        # Generate questions with options
        exam = []
        for target in selected_words:
            options = [target]
            # Pick 3 distractors
            distractors = [w for w in all_words if w['word'] != target['word']]
            if len(distractors) >= 3:
                options.extend(random.sample(distractors, 3))
            else:
                options.extend(distractors) 
            
            random.shuffle(options)
            
            exam.append({
                'word': target['word'],
                'correct_translation': target['translation'],
                'options': [{'word': o['word'], 'translation': o['translation']} for o in options]
            })

        return exam
