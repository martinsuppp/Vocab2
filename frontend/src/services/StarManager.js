class StarManager {
    constructor() {
        this.storageKey = 'starredWords';
    }

    getStarredWords() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    isStarred(word) {
        if (!word) return false;
        const words = this.getStarredWords();
        return words.includes(word);
    }

    toggleStar(word) {
        if (!word) return false;
        let words = this.getStarredWords();
        let currentlyStarred = false;

        if (words.includes(word)) {
            // Remove
            words = words.filter(w => w !== word);
        } else {
            // Add
            words.push(word);
            currentlyStarred = true;
        }

        localStorage.setItem(this.storageKey, JSON.stringify(words));
        return currentlyStarred;
    }
}

export default new StarManager();
