"use strict";

/**
 * Destinations Manager Module
 * Handles all destination-related functionality
 */
const DestinationsManager = (function () {
  // Configuration constants
  const API_BASE_URL = "http://localhost:3000/api";
  const SELECTORS = {
    CARDS_GRID: ".cards-grid",
    MODAL: "#addDestinationModal",
    ADD_BTN: ".btn-primary",
    CLOSE_BTN: "#closeModal",
    FORM: "#destinationForm",
    IMAGE_INPUT: "#destinationImage",
    IMAGE_PREVIEW: "#imagePreview",
    PREVIEW_IMAGE: "#previewImage",
    NAME_INPUT: "#destinationName",
    COUNTRY_INPUT: "#country",
    DESCRIPTION_INPUT: "#description",
    STATUS_SELECT: "#destinationStatus"
  };

  const DEFAULTS = {
    FALLBACK_IMAGE: "/assets/images/gallery-1.jpg",
    STATUS_CLASSES: {
      active: "active",
      inactive: "inactive"
    }
  };

  // DOM elements cache
  let elements = {};

  /* ========== PRIVATE FUNCTIONS ========== */

  /**
   * Initialize DOM elements
   */
  function initElements() {
    elements = {
      cardsGrid: document.querySelector(SELECTORS.CARDS_GRID),
      modal: document.querySelector(SELECTORS.MODAL),
      addBtn: document.querySelector(SELECTORS.ADD_BTN),
      closeBtn: document.querySelector(SELECTORS.CLOSE_BTN),
      form: document.querySelector(SELECTORS.FORM),
      imageInput: document.querySelector(SELECTORS.IMAGE_INPUT),
      imagePreview: document.querySelector(SELECTORS.IMAGE_PREVIEW),
      previewImage: document.querySelector(SELECTORS.PREVIEW_IMAGE),
      nameInput: document.querySelector(SELECTORS.NAME_INPUT),
      countryInput: document.querySelector(SELECTORS.COUNTRY_INPUT),
      descriptionInput: document.querySelector(SELECTORS.DESCRIPTION_INPUT),
      statusSelect: document.querySelector(SELECTORS.STATUS_SELECT),
      modalTitle: document.querySelector('.modal-content h2'),
      submitBtn: document.querySelector(`${SELECTORS.FORM} button[type="submit"]`)
    };
  }

  /**
   * Initialize modal functionality
   */
  function initModal() {
    elements.addBtn.addEventListener("click", () => {
      elements.modal.style.display = "block";
    });

    elements.closeBtn.addEventListener("click", () => {
      elements.modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === elements.modal) {
        elements.modal.style.display = "none";
      }
    });
  }

  /**
   * Handle image preview functionality
   */
  function initImagePreview() {
    elements.imageInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          elements.previewImage.src = e.target.result;
          elements.imagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  /**
   * Create destination card HTML
   * @param {Object} dest - Destination data
   * @returns {string} HTML string
   */
  function createCardHtml(dest) {
    const status = (dest.STATUS || 'active').toLowerCase();
    const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

    return `
      <div class="destination-card" data-id="${dest.ID}">
        <div class="card-image">
          <img src="${dest.IMAGE_PATH || DEFAULTS.FALLBACK_IMAGE}" alt="${dest.NAME}" />
          <div class="card-actions">
            <button class="action-btn edit" data-id="${dest.ID}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" data-id="${dest.ID}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <h3>${dest.NAME}</h3>
          <p class="country">${dest.COUNTRY}</p>
          <p class="description">${dest.DESCRIPTION}</p>
          <div class="card-footer">
            <span class="status ${status}">${statusDisplay}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Shows a notification with consistent timing
   * @param {string} message - The message to display
   * @param {string} type - 'success', 'error', or 'info'
   * @param {number} duration - Display time in milliseconds (default 5000ms)
   */
  function showNotification(message, type = 'success', duration = 5000) {
    // Store notification in session storage before showing
    const notification = {
      message,
      type,
      timestamp: new Date().getTime()
    };
    sessionStorage.setItem('pendingNotification', JSON.stringify(notification));

    // Then show as normal
    _displayNotification(message, type, duration);
  }

  function _displayNotification(message, type, duration) {
    const container = document.getElementById('notification-container');

    // Clear previous notifications of the same type if needed
    const existingNotifications = container.querySelectorAll(`.notification.${type}`);
    if (existingNotifications.length > 2) {
      existingNotifications[0].remove();
    }
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Add icon based on type
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' :
      type === 'error' ? 'fas fa-exclamation-circle' :
        'fas fa-info-circle';

    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    // Build notification
    notification.appendChild(icon);
    notification.appendChild(messageSpan);

    // Add to container
    container.appendChild(notification);

    // Set up fade out
    const startFadeOut = () => {
      notification.style.opacity = '0';
      notification.addEventListener('transitionend', () => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, { once: true });
    };

    // Auto-remove after duration
    const fadeTimer = setTimeout(startFadeOut, duration);

    // Pause on hover
    notification.addEventListener('mouseenter', () => {
      clearTimeout(fadeTimer);
      notification.style.opacity = '1';
    });

    // Resume on mouse leave (after 1 second delay)
    notification.addEventListener('mouseleave', () => {
      setTimeout(startFadeOut, 1000);
    });
  }

  /**
   * Reset form and modal UI to default state
   */
  function resetFormAndUI() {
    elements.form.reset();
    delete elements.form.dataset.editingId;
    elements.imagePreview.style.display = 'none';
    elements.modal.style.display = 'none';

    // Reset modal title and button text
    if (elements.modalTitle) elements.modalTitle.textContent = 'Add New Destination';
    if (elements.submitBtn) elements.submitBtn.textContent = 'Add Destination';
  }

  /**
   * Load destinations from API
   */
  async function loadDestinations() {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations`, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();


      if (data.success) {
        renderDestinations(data.destinations);
        // Re-display any notification that might have been cleared
        const pendingNotification = sessionStorage.getItem('pendingNotification');
        if (pendingNotification) {
          const { message, type } = JSON.parse(pendingNotification);
          _displayNotification(message, type, 5000);
          sessionStorage.removeItem('pendingNotification');
        }
      } else {
        throw new Error("API returned success:false");
      }
    } catch (error) {
      console.error("Non-blocking error:", error);
      // Only show error if cards grid is empty
      if (elements.cardsGrid.innerHTML === "") {
        showNotification(`Connection issue: ${error.message}`, "error", 5000);
      }
    }
  }

  /**
   * Render destinations to the page
   * @param {Array} destinations - Array of destination objects
   */
  function renderDestinations(destinations) {
    elements.cardsGrid.innerHTML = "";

    destinations.forEach(dest => {
      const cardHtml = createCardHtml(dest);
      elements.cardsGrid.insertAdjacentHTML("beforeend", cardHtml);
    });
  }

  /**
   * Handle edit action
   * @param {string} id - Destination ID
   */
  async function handleEdit(id) {
    try {
      // Fetch destination data from API
      const response = await fetch(`${API_BASE_URL}/destinations/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch destination: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to load destination data");
      }

      const destination = result.destination;

      // Populate the form with existing data
      elements.nameInput.value = destination.NAME || '';
      elements.countryInput.value = destination.COUNTRY || '';
      elements.descriptionInput.value = destination.DESCRIPTION || '';
      elements.statusSelect.value = destination.STATUS || 'active';

      // Set image preview if exists
      if (destination.image_path) {
        elements.previewImage.src = destination.image_path;
        elements.imagePreview.style.display = "block";
      }

      // Store the ID being edited
      elements.form.dataset.editingId = id;

      // Update modal UI for editing
      if (elements.modalTitle) elements.modalTitle.textContent = 'Edit Destination';
      if (elements.submitBtn) elements.submitBtn.textContent = 'Update Destination';

      // Show modal
      elements.modal.style.display = "block";

    } catch (error) {
      console.error("Error editing destination:", error);
      showNotification(`Failed to edit destination: ${error.message}`, "error", 5000);
    }
  }

  /**
   * Handle delete action
   * @param {string} id - Destination ID
   */
  async function handleDelete(id) {
    try {
      // Verify ID exists
      if (!id) throw new Error("No destination ID provided");

      // Find the card element
      const card = document.querySelector(`.destination-card[data-id="${id}"]`);
      if (!card) throw new Error("Destination card not found in DOM");

      // Find the delete button
      const deleteBtn = card.querySelector(".action-btn.delete");
      const originalBtnHTML = deleteBtn?.innerHTML;

      // Visual feedback
      card.style.opacity = "0.6";
      if (deleteBtn) {
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        deleteBtn.disabled = true;
      }

      // API call
      const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data?.success) throw new Error(data.message || "Delete failed");

      // Success - animate removal
      card.classList.add("fading-out");
      setTimeout(() => {
        card.remove()
        showNotification('Destination deleted successfully!', 'success', 5000);
      }, 300); // Adjust timing to match CSS transition
    } catch (error) {
      console.error("Delete failed:", error);
      showNotification('Operation failed: ' + error.message, 'error', 5000);

      // Reset UI
      if (card) {
        card.style.opacity = "";
        if (deleteBtn && originalBtnHTML) {
          deleteBtn.innerHTML = originalBtnHTML;
          deleteBtn.disabled = false;
        }
      }
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(e.target);
      const isEditing = elements.form.dataset.editingId;
      // Add consistent field names that match your backend
      if (isEditing) {
        formData.append('id', isEditing);
      }

      const response = await fetch(isEditing
        ? `${API_BASE_URL}/destinations/${elements.form.dataset.editingId}`
        : `${API_BASE_URL}/destinations`, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Server returned non-JSON response');
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Operation failed');
      }

      // SUCCESS NOTIFICATION HERE - This is where you add it
      showNotification(
        isEditing
          ? 'Destination updated successfully!'
          : 'Destination added successfully!',
        'success',
        5000 // 5 seconds display time
      );

      // Reset form and reload destinations
      resetFormAndUI();
      await loadDestinations();

    } catch (error) {
      console.error('Form submission error:', error);
      showNotification(
        error.message.includes('<!DOCTYPE')
          ? 'Server error occurred. Please check console.'
          : error.message,
        'error', 5000
      );
    } finally {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  }
  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    elements.form.addEventListener("submit", handleFormSubmit);

    // Single event delegation for all card actions
    elements.cardsGrid.addEventListener("click", (e) => {
      const cardAction = e.target.closest(".action-btn");
      if (!cardAction) return;

      const { id } = cardAction.dataset;
      if (!id) return;

      if (cardAction.classList.contains("edit")) {
        handleEdit(id);
      } else if (cardAction.classList.contains("delete")) {
        handleDelete(id);
      }
    });
  }

  /* ========== PUBLIC API ========== */
  return {
    /**
     * Initialize the destinations manager
     */
    init: function () {
      try {
        initElements();
        initModal();
        initImagePreview();
        initEventListeners();
        loadDestinations();
        // Check for pending notifications from previous action
        const pendingNotification = sessionStorage.getItem('pendingNotification');
        if (pendingNotification) {
          const { message, type } = JSON.parse(pendingNotification);
          _displayNotification(message, type, 5000);
          sessionStorage.removeItem('pendingNotification');
        }

      } catch (error) {
        console.error("Initialization error:", error);
        showNotification("Failed to initialize page. Please refresh.", "error", 5000);
      }
    }
  };
})();

// Initialize when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  DestinationsManager.init();
});