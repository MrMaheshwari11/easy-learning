import { shuffleArray, sanitizeInput } from './utils.js';
import { conceptsData } from './data.js';

export const AppState = {
  currentIndex: 0,
  filteredConcepts: [],
  allFilteredConcepts: [],
  bookmarks: [],
  learnedConcepts: new Set(),
  searchQuery: '',
  difficultyFilter: '',
  points: 0,
  currentPage: 1,
  limit: 20,
  isLoading: false,
  settings: {
    animations: true,
    theme: 'dark',
    fontSize: 'medium'
  },

  init() {
    this.loadSettings();
    this.loadBookmarks();
    this.loadLearnedConcepts();
    this.loadPoints();
    this.applySettings();
    // Fetch initial concepts and return the promise
    return this.fetchConcepts(false);
  },

  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('easyLearningSettings');
      if (savedSettings) this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    } catch (error) {
      console.error('Settings load error:', error);
    }
  },

  saveSettings() {
    try {
      localStorage.setItem('easyLearningSettings', JSON.stringify(this.settings));
      this.applySettings();
    } catch (error) {
      console.error('Settings save error:', error);
    }
  },

  applySettings() {
    document.body.setAttribute('data-theme', this.settings.theme);
    document.body.setAttribute('data-font-size', this.settings.fontSize);
    document.body.setAttribute('data-animations', this.settings.animations ? 'enabled' : 'disabled');
    const animationsToggle = document.getElementById('animationsToggle');
    const themeSelector = document.getElementById('themeSelector');
    const fontSizeSelector = document.getElementById('fontSizeSelector');
    if (animationsToggle) animationsToggle.checked = this.settings.animations;
    if (themeSelector) themeSelector.value = this.settings.theme;
    if (fontSizeSelector) fontSizeSelector.value = this.settings.fontSize;
  },

  loadBookmarks() {
    try {
      const savedBookmarks = localStorage.getItem('easyLearningBookmarks');
      if (savedBookmarks) this.bookmarks = JSON.parse(savedBookmarks);
    } catch (error) {
      console.error('Bookmarks load error:', error);
    }
  },

  saveBookmarks() {
    try {
      localStorage.setItem('easyLearningBookmarks', JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('Bookmarks save error:', error);
    }
  },

  loadLearnedConcepts() {
    try {
      const savedLearned = localStorage.getItem('learnedConcepts');
      if (savedLearned) this.learnedConcepts = new Set(JSON.parse(savedLearned));
    } catch (error) {
      console.error('Learned concepts load error:', error);
    }
  },

  saveLearnedConcepts() {
    try {
      localStorage.setItem('learnedConcepts', JSON.stringify([...this.learnedConcepts]));
    } catch (error) {
      console.error('Learned concepts save error:', error);
    }
  },

  loadPoints() {
    try {
      this.points = parseInt(localStorage.getItem('points') || '0');
    } catch (error) {
      console.error('Points load error:', error);
      this.points = 0;
    }
  },

  addPoints(amount) {
    try {
      this.points += amount;
      localStorage.setItem('points', this.points);
    } catch (error) {
      console.error('Points save error:', error);
    }
  },

  isBookmarked(title) {
    return this.bookmarks.includes(title);
  },

  toggleBookmark(title) {
    if (this.isBookmarked(title)) {
      this.bookmarks = this.bookmarks.filter(bookmark => bookmark !== title);
    } else {
      this.bookmarks.push(title);
      this.addPoints(5);
    }
    this.saveBookmarks();
  },

  isLearned(title) {
    return this.learnedConcepts.has(title);
  },

  toggleLearned(title) {
    if (this.isLearned(title)) {
      this.learnedConcepts.delete(title);
    } else {
      this.learnedConcepts.add(title);
      this.addPoints(10);
    }
    this.saveLearnedConcepts();
  },

  async fetchConcepts(append = false) {
    if (this.isLoading) {
      console.log('Skipping fetch: already loading');
      return Promise.resolve();
    }
    if (append && this.filteredConcepts.length >= this.allFilteredConcepts.length) {
      console.log('Skipping fetch: no more concepts to load');
      return Promise.resolve();
    }
    this.isLoading = true;
    console.log('Fetching concepts...');
    console.log('conceptsData length:', conceptsData.length);
    console.log('searchQuery:', this.searchQuery, 'difficultyFilter:', this.difficultyFilter);

    return new Promise((resolve, reject) => {
      try {
        setTimeout(() => {
          if (!conceptsData || !Array.isArray(conceptsData)) {
            throw new Error('conceptsData is not defined or not an array');
          }
          if (!append || this.allFilteredConcepts.length === 0) {
            this.allFilteredConcepts = conceptsData.filter(concept => 
              (concept.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
               concept.explanation.toLowerCase().includes(this.searchQuery.toLowerCase())) &&
              (!this.difficultyFilter || concept.difficulty === this.difficultyFilter)
            );
            console.log('allFilteredConcepts length:', this.allFilteredConcepts.length);
          }
          const start = append ? this.filteredConcepts.length : 0;
          const end = start + this.limit;
          const newConcepts = shuffleArray(this.allFilteredConcepts.slice(start, end));
          this.filteredConcepts = append ? [...this.filteredConcepts, ...newConcepts] : newConcepts;
          this.currentPage = Math.ceil(this.filteredConcepts.length / this.limit);
          console.log('filteredConcepts length after fetch:', this.filteredConcepts.length);
          this.isLoading = false;
          resolve();
        }, 300);
      } catch (error) {
        console.error('Fetch concepts error:', error);
        this.filteredConcepts = [];
        this.isLoading = false;
        reject(error);
      }
    });
  },

  filterConcepts(query, difficulty = '') {
    this.searchQuery = sanitizeInput(query);
    this.difficultyFilter = difficulty;
    this.currentIndex = 0;
    this.currentPage = 1;
    this.filteredConcepts = [];
    return this.fetchConcepts(false);
  }
};