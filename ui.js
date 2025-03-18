import { AppState } from './state.js';

export const UI = {
  isQuizActive: false,
  isFeedbackActive: false,
  panelTimeout: null, // Track timeout for auto-hiding panels
  isMenuActive: false, // Track menu state to prevent interference

  async init() {
    this.setupEventListeners();
    await AppState.init();
    this.renderConcepts(false, true);
    this.updateProgress();
    this.updatePoints();
    this.updateBookmarkPanel();
  },

  setupEventListeners() {
    document.getElementById('prevBtn').addEventListener('click', () => this.navigateToPrevious());
    document.getElementById('nextBtn').addEventListener('click', () => this.navigateToNext());

    let debounceTimer;
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.updateClearSearchButton(e.target.value);
        AppState.filterConcepts(e.target.value, AppState.difficultyFilter).then(() => this.renderConcepts());
      }, 300);
    });

    document.getElementById('clearSearch').addEventListener('click', () => {
      searchInput.value = '';
      this.updateClearSearchButton('');
      AppState.filterConcepts('', AppState.difficultyFilter).then(() => this.renderConcepts());
    });

    document.getElementById('difficultyFilter').addEventListener('change', (e) => {
      AppState.filterConcepts(AppState.searchQuery, e.target.value).then(() => this.renderConcepts());
    });

    document.getElementById('toggleBookmarks').addEventListener('click', () => this.togglePanel('bookmarkPanel'));
    document.getElementById('toggleSettings').addEventListener('click', () => this.togglePanel('settingsPanel'));
    document.getElementById('toggleFeedback').addEventListener('click', () => this.showFeedbackForm());

    document.getElementById('animationsToggle').addEventListener('change', (e) => {
      AppState.settings.animations = e.target.checked;
      AppState.saveSettings();
    });

    document.getElementById('themeSelector').addEventListener('change', (e) => {
      AppState.settings.theme = e.target.value;
      AppState.saveSettings();
    });

    document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
      AppState.settings.fontSize = e.target.value;
      AppState.saveSettings();
    });

    const container = document.getElementById('container');
    container.addEventListener('scroll', (e) => {
      if (!this.isMenuActive && !this.isFeedbackActive) {
        this.handleScroll();
        this.checkForInfiniteScroll();
        container.style.touchAction = 'pan-y'; // Allows vertical scrolling only on touch devices
      }
      // Prevent scroll from closing menu or modal if active
      e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
      if (this.isQuizActive) return;
      if (this.isMenuActive && e.key !== 'Escape') return; // Allow menu to stay open unless Escape
      if (this.isFeedbackActive && e.key !== 'Escape') return; // Allow modal to stay open unless Escape
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') this.navigateToPrevious();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') this.navigateToNext();
      else if (e.key === 'Escape') {
        document.getElementById('bookmarkPanel').classList.remove('show');
        document.getElementById('settingsPanel').classList.remove('show');
        document.getElementById('menuPanel').classList.remove('show');
        const feedbackModal = document.querySelector('.feedback-modal');
        if (feedbackModal) {
          feedbackModal.remove(); // Remove feedback modal
          this.isFeedbackActive = false;
        }
        this.clearPanelTimeout(); // Clear timeout if closing with Escape
        this.isMenuActive = false; // Reset menu state
      }
    });

    // Hamburger menu listener
    document.getElementById('toggleMenu').addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent click event from bubbling up
      this.toggleMenu();
    });

    // Menu search and navigation listeners
    document.getElementById('menuSearchInput').addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        AppState.filterConcepts(e.target.value, AppState.difficultyFilter).then(() => this.renderConcepts());
      }, 300);
    });

    document.getElementById('menuClearSearch').addEventListener('click', () => {
      document.getElementById('menuSearchInput').value = '';
      AppState.filterConcepts('', AppState.difficultyFilter).then(() => this.renderConcepts());
    });

    document.getElementById('menuDifficultyFilter').addEventListener('change', (e) => {
      AppState.filterConcepts(AppState.searchQuery, e.target.value).then(() => this.renderConcepts());
    });

    document.getElementById('menuPrevBtn').addEventListener('click', () => this.navigateToPrevious());
    document.getElementById('menuNextBtn').addEventListener('click', () => this.navigateToNext());
    document.getElementById('menuToggleBookmarks').addEventListener('click', () => this.togglePanel('bookmarkPanel'));
    document.getElementById('menuToggleSettings').addEventListener('click', () => this.togglePanel('settingsPanel'));
    document.getElementById('menuToggleFeedback').addEventListener('click', () => this.showFeedbackForm());
  },

  toggleMenu() {
    const menuPanel = document.getElementById('menuPanel');
    this.isMenuActive = !this.isMenuActive;
    if (this.isMenuActive) {
      console.log('Showing menu panel');
      menuPanel.classList.add('show');
    } else {
      console.log('Hiding menu panel');
      menuPanel.classList.remove('show');
    }
  
    // Clear any existing timeout
    this.clearPanelTimeout();
  
    // Set timeout and interaction listeners when shown
    if (this.isMenuActive) {
      this.panelTimeout = setTimeout(() => {
        console.log('Hiding menu panel due to timeout');
        menuPanel.classList.remove('show');
        this.isMenuActive = false;
      }, 5000); // 5 seconds of inactivity
  
      menuPanel.addEventListener('mouseover', this.resetPanelTimeout.bind(this));
      menuPanel.addEventListener('click', this.resetPanelTimeout.bind(this));
    } else {
      menuPanel.removeEventListener('mouseover', this.resetPanelTimeout.bind(this));
      menuPanel.removeEventListener('click', this.resetPanelTimeout.bind(this));
    }
  },
  
  togglePanel(panelId) {
    console.log(`Toggling panel: ${panelId}`);
    const panel = document.getElementById(panelId);
    const isShowing = panel.classList.contains('show');
    
    // Hide all panels first
    document.getElementById('bookmarkPanel').classList.remove('show');
    document.getElementById('settingsPanel').classList.remove('show');
    
    // If panel wasn't showing before, show it now
    if (!isShowing) {
      panel.classList.add('show');
      // Clear any existing timeout
      this.clearPanelTimeout();
      
      // Set timeout for auto-hiding
      this.panelTimeout = setTimeout(() => {
        console.log(`Hiding ${panelId} due to timeout`);
        panel.classList.remove('show');
      }, 5000); // 5 seconds of inactivity
      
      // Add event listeners to reset timeout on interaction
      panel.addEventListener('mouseover', this.resetPanelTimeout.bind(this));
      panel.addEventListener('click', this.resetPanelTimeout.bind(this));
    } else {
      // If it was already showing, we've hidden it above
      panel.removeEventListener('mouseover', this.resetPanelTimeout.bind(this));
      panel.removeEventListener('click', this.resetPanelTimeout.bind(this));
      this.clearPanelTimeout();
    }
  },
  
  resetPanelTimeout() {
    console.log('Resetting panel timeout');
    this.clearPanelTimeout();
    this.panelTimeout = setTimeout(() => {
      console.log('Hiding panels due to timeout');
      const panels = document.querySelectorAll('.bookmark-panel, .settings-panel, .menu-panel');
      panels.forEach(panel => panel.classList.remove('show'));
      this.isMenuActive = false;
    }, 5000);
  },
  
  clearPanelTimeout() {
    if (this.panelTimeout) {
      clearTimeout(this.panelTimeout);
      this.panelTimeout = null;
    }
  },
  updateClearSearchButton(query) {
    document.getElementById('clearSearch').classList.toggle('visible', !!query);
  },

  handleScroll() {
    if (this.isQuizActive || this.isFeedbackActive) return;
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      if (Math.abs(rect.top - 60) < window.innerHeight / 2) {
        card.classList.add('active');
        AppState.currentIndex = index;
        this.updateProgress();
      } else {
        card.classList.remove('active');
      }
    });
  },

  navigateToPrevious() {
    if (this.isQuizActive || this.isFeedbackActive) return;
    if (AppState.currentIndex > 0) {
      AppState.currentIndex--;
      this.scrollToCard(AppState.currentIndex);
    }
  },

  navigateToNext() {
    if (this.isQuizActive || this.isFeedbackActive) return;
    if (AppState.currentIndex < AppState.filteredConcepts.length - 1) {
      AppState.currentIndex++;
      this.scrollToCard(AppState.currentIndex);
    }
  },

  scrollToCard(index) {
    const cards = document.querySelectorAll('.card');
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: AppState.settings.animations ? 'smooth' : 'auto' });
    }
  },

  updateProgress() {
    document.getElementById('progressIndicator').textContent = `${AppState.currentIndex + 1} of ${AppState.filteredConcepts.length}`;
  },

  updatePoints() {
    document.getElementById('pointsDisplay').textContent = `Points: ${AppState.points}`;
  },

  showFeedbackForm() {
    this.isFeedbackActive = true;

    const container = document.getElementById('container');
    const feedbackModal = document.createElement('div');
    feedbackModal.className = 'feedback-modal';
    feedbackModal.innerHTML = `
      <h3>Share Your Feedback</h3>
      <label for="rating">Rating (1-5):</label>
      <select id="rating" name="rating">
        <option value="1">1 - Poor</option>
        <option value="2">2 - Fair</option>
        <option value="3">3 - Good</option>
        <option value="4">4 - Very Good</option>
        <option value="5">5 - Excellent</option>
      </select>
      <label for="comments">Comments:</label>
      <textarea id="comments" name="comments" rows="3" placeholder="What did you like? What could be improved?"></textarea>
      <button class="submit-feedback">Submit</button>
      <button class="close-feedback">Close</button>
    `;

    // Add overlay to prevent background interaction
    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    document.body.appendChild(overlay);

    container.innerHTML = '';
    container.appendChild(feedbackModal);

    feedbackModal.querySelector('.submit-feedback').addEventListener('click', async () => {
      const rating = feedbackModal.querySelector('#rating').value;
      const comments = feedbackModal.querySelector('#comments').value;
      const feedback = { rating, comments };

      try {
        const response = await fetch('/api/submitFeedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedback),
        });

        if (!response.ok) throw new Error('Failed to submit feedback');
        this.showNotification('Thank you for your feedback!', 'success');
      } catch (error) {
        console.error('Feedback submission error:', error);
        this.showNotification('Failed to submit feedback. Please try again.', 'error');
      }

      setTimeout(() => {
        this.isFeedbackActive = false;
        feedbackModal.remove();
        overlay.remove(); // Remove overlay
        this.renderConcepts();
      }, 2000);
    });

    feedbackModal.querySelector('.close-feedback').addEventListener('click', () => {
      this.isFeedbackActive = false;
      feedbackModal.remove();
      overlay.remove(); // Remove overlay
      this.renderConcepts();
    });

    // Prevent background scroll while modal is open
    document.body.style.overflow = 'hidden';
  },

  async renderConcepts(append = false, skipFetch = false) {
    const container = document.getElementById('container');
    let loadingSpinner = document.getElementById('loadingSpinner');

    if (!loadingSpinner) {
      loadingSpinner = document.createElement('div');
      loadingSpinner.id = 'loadingSpinner';
      loadingSpinner.className = 'loading-spinner';
      loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      container.appendChild(loadingSpinner);
    }

    if (!append) {
      container.innerHTML = '';
      container.appendChild(loadingSpinner);
    }
    loadingSpinner.classList.add('visible');

    try {
      console.log('Before fetchConcepts:', AppState.filteredConcepts.length);
      if (!skipFetch) {
        await AppState.fetchConcepts(append);
      }
      console.log('After fetchConcepts:', AppState.filteredConcepts.length);

      if (AppState.filteredConcepts.length === 0) {
        console.log('No concepts to render');
        container.innerHTML = '<p>No concepts found.</p>';
        loadingSpinner.classList.remove('visible');
        return;
      }

      const startIndex = append ? container.querySelectorAll('.card').length : 0;
      const newConcepts = AppState.filteredConcepts.slice(startIndex);
      console.log('Rendering concepts from index', startIndex, 'with', newConcepts.length, 'new items');

      newConcepts.forEach((concept, index) => {
        const adjustedIndex = startIndex + index;
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('role', 'article');
        card.setAttribute('aria-labelledby', `concept-${concept.id}`);
        if (adjustedIndex === AppState.currentIndex) card.classList.add('active');

        const isBookmarked = AppState.isBookmarked(concept.title);
        const isLearned = AppState.isLearned(concept.title);

        card.innerHTML = `
          <div class="card-content">
            <button class="card-quiz-btn" aria-label="Take quiz for ${concept.title}">
              <i class="fas fa-question"></i>
            </button>
            <button class="card-learned-btn ${isLearned ? 'learned' : ''}" aria-label="${isLearned ? 'Unmark as learned' : 'Mark as learned'}">
              <i class="fas fa-check"></i>
            </button>
            <button class="card-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" aria-label="${isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}">
              <i class="fas fa-bookmark"></i>
            </button>
            <h2 id="concept-${concept.id}" class="title">${concept.title}</h2>
            <p class="explanation">${concept.explanation}</p>
            <div class="card-footer">
              <a href="https://www.google.com/search?q=${encodeURIComponent(concept.title)}" target="_blank" rel="noopener noreferrer">
                Learn More <i class="fas fa-external-link-alt"></i>
              </a>
              <span class="category-tag">${concept.category || ''}</span>
            </div>
          </div>
        `;

        card.querySelector('.card-bookmark-btn').addEventListener('click', () => {
          AppState.toggleBookmark(concept.title);
          this.renderConcepts();
          this.updateBookmarkPanel();
          this.updatePoints();
        });

        card.querySelector('.card-learned-btn').addEventListener('click', () => {
          AppState.toggleLearned(concept.title);
          this.renderConcepts();
          this.updatePoints();
        });

        card.querySelector('.card-quiz-btn').addEventListener('click', () => this.startQuiz(concept));

        container.insertBefore(card, loadingSpinner);
      });

      if (AppState.settings.animations && append) {
        this.animateNewCards(startIndex);
      }
    } catch (error) {
      console.error('Render error:', error);
      container.innerHTML = '<p>Error loading concepts.</p>';
    }

    loadingSpinner.classList.remove('visible');
  },

  animateNewCards(startIndex) {
    if (typeof gsap !== 'undefined' && AppState.settings.animations) {
      const newCards = Array.from(document.querySelectorAll('.card')).slice(startIndex);
      gsap.from(newCards, { opacity: 0, y: 50, duration: 0.6, stagger: 0.2 });
    }
  },

  checkForInfiniteScroll() {
    if (this.isQuizActive || this.isFeedbackActive) return;
    const container = document.getElementById('container');
    const scrollBottom = container.scrollTop + container.clientHeight;
    const threshold = container.scrollHeight - 200;

    if (scrollBottom >= threshold && !AppState.isLoading) {
      this.renderConcepts(true);
    }
  },

  updateBookmarkPanel() {
    const list = document.getElementById('bookmarkList');
    list.innerHTML = AppState.bookmarks.length === 0 
      ? "<p style='text-align:center; color: var(--secondary-text)'>No bookmarks yet.</p>"
      : AppState.bookmarks.map(title => `
        <div class="bookmark-item">
          <span>${title}</span>
          <button class="remove-bookmark" aria-label="Remove ${title} from bookmarks"><i class="fas fa-times"></i></button>
        </div>
      `).join('');

    document.querySelectorAll('.bookmark-item span').forEach((span, idx) => {
      span.addEventListener('click', () => {
        const title = AppState.bookmarks[idx];
        const idxInFiltered = AppState.filteredConcepts.findIndex(c => c.title === title);
        if (idxInFiltered !== -1) {
          AppState.currentIndex = idxInFiltered;
          this.scrollToCard(AppState.currentIndex);
          document.getElementById('bookmarkPanel').classList.remove('show');
          this.clearPanelTimeout(); // Clear timeout on manual close
          this.isMenuActive = false; // Reset menu state
        } else {
          this.showNotification('This concept is not in the current filtered list.', 'error');
        }
      });
    });

    document.querySelectorAll('.remove-bookmark').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        AppState.toggleBookmark(AppState.bookmarks[idx]);
        this.updateBookmarkPanel();
        this.renderConcepts();
        this.updatePoints();
      });
    });

    document.getElementById('bookmarkCount').textContent = AppState.bookmarks.length || '';
    document.getElementById('bookmarkCount').classList.toggle('visible', AppState.bookmarks.length > 0);
  },

  startQuiz(concept) {
    if (!concept.questions || concept.questions.length === 0) {
      this.showNotification('No quiz available for this concept.', 'error');
      return;
    }

    this.isQuizActive = true;

    const question = concept.questions[0];
    const quizModal = document.createElement('div');
    quizModal.className = 'quiz-modal';
    quizModal.innerHTML = `
      <h3>${question.question}</h3>
      ${question.options.map(opt => `
        <button class="quiz-option" data-answer="${opt}">${opt}</button>
      `).join('')}
      <button class="quiz-close">Close</button>
    `;

    const container = document.getElementById('container');
    container.innerHTML = '';
    container.appendChild(quizModal);

    quizModal.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const userAnswer = btn.dataset.answer;
        if (userAnswer === question.answer) {
          AppState.addPoints(20);
          this.showNotification('Correct! +20 points', 'success');
        } else {
          this.showNotification('Incorrect. Try again!', 'error');
        }
        setTimeout(() => {
          this.isQuizActive = false;
          this.renderConcepts();
          this.updatePoints();
        }, 2000);
      });
    });

    quizModal.querySelector('.quiz-close').addEventListener('click', () => {
      this.isQuizActive = false;
      this.renderConcepts();
    });
  },

  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    notificationText.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
  }
};