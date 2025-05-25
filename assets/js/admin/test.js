"use strict";

/**
 * Destinations Manager Module
 * Handles all destination-related functionality
 */
const DestinationsManager = (function() {
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
      statusSelect: document.querySelector(SELECTORS.STATUS_SELECT)
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
    const status = dest.STATUS.toLowerCase();
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
   * Load destinations from API
   */
  async function loadDestinations() {
  try {
    console.log("Attempting to fetch from:", API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/destinations`, {
      mode: 'cors', // Explicitly enable CORS
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("API response:", data);
    
    if (data.success) {
      renderDestinations(data.destinations);
    } else {
      throw new Error("API returned success:false");
    }
  } catch (error) {
    console.error("Full error details:", error);
    showError(`Connection failed: ${error.message}`);
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
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async function handleFormSubmit(e) {
  e.preventDefault();

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
  submitBtn.disabled = true;

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append("name", elements.nameInput.value);
    formData.append("country", elements.countryInput.value);
    formData.append("description", elements.descriptionInput.value);
    formData.append("status", elements.statusSelect.value);
    
    if (elements.imageInput.files[0]) {
      formData.append("image", elements.imageInput.files[0]);
    }

    console.log("[DEBUG] Submitting:", {
      name: elements.nameInput.value,
      country: elements.countryInput.value,
      hasImage: !!elements.imageInput.files[0]
    });

    // Make API request
    const response = await fetch(`${API_BASE_URL}/destinations`, {
      method: "POST",
      body: formData
    });

    console.log("[DEBUG] Response status:", response.status);

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: await response.text() };
      }
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    // Parse successful response
    const result = await response.json();
    console.log("[DEBUG] Full response:", result);

    // Verify API-level success
    if (!result.success) {
      throw new Error(result.message || "API returned success: false");
    }

    /* SUCCESS CASE */
    
    // 1. Add new card to UI
    const newCardHtml = createCardHtml(result.destination);
    elements.cardsGrid.insertAdjacentHTML("afterbegin", newCardHtml);
    
    // 2. Reset form
    elements.form.reset();
    elements.imagePreview.style.display = "none";
    elements.modal.style.display = "none";
    
    // 3. Show success notification
    showNotification("Destination added successfully!", "success");

  } catch (error) {
    console.error("[ERROR] Submission failed:", {
      error: error.message,
      stack: error.stack
    });
    
    // Don't show error for successful operations
    if (!error.message.includes("200") && !error.message.includes("success: false")) {
      showNotification(error.message || "Failed to add destination", "error");
    }
  } finally {
    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }

    }
    // Add this helper function
function showNotification(message, type = "error") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === "success" ? "check" : "exclamation"}-circle"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    elements.form.addEventListener("submit", handleFormSubmit);
    
    // Event delegation for dynamic elements
    elements.cardsGrid.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".action-btn.edit");
      const deleteBtn = e.target.closest(".action-btn.delete");
      
      if (editBtn) {
        handleEdit(editBtn.dataset.id);
      }
      
      if (deleteBtn) {
        handleDelete(deleteBtn.dataset.id);
      }
    });
  }



  /**
   * Show error message to user
   * @param {string} message - Error message
   */
  function showError(message) {
    // You can replace this with a proper notification system
    alert(message);
  }

  // Public API
  return {
    /**
     * Initialize the destinations manager
     */
    init: function() {
      try {
        initElements();
        initModal();
        initImagePreview();
        initEventListeners();
        loadDestinations();
      } catch (error) {
        console.error("Initialization error:", error);
        showError("Failed to initialize page. Please refresh.");
      }
    }
  };
})();

// Initialize when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
  DestinationsManager.init();
});

// Add to your existing DestinationsManager module

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
        elements.nameInput.value = destination.name || '';
        elements.countryInput.value = destination.country || '';
        elements.descriptionInput.value = destination.description || '';
        elements.statusSelect.value = destination.status || 'active';
        
        // Set image preview if exists
        if (destination.imagePath) {
            elements.previewImage.src = destination.imagePath;
            elements.imagePreview.style.display = "block";
        }
        
        // Store the ID being edited
        elements.form.dataset.editingId = id;
        
        // Update modal UI for editing
        const modalTitle = document.querySelector('.modal-content h2');
        if (modalTitle) modalTitle.textContent = 'Edit Destination';
        
        const submitBtn = elements.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Destination';
            submitBtn.innerHTML = 'Update Destination';
        }
        
        // Show modal
        elements.modal.style.display = "block";

    } catch (error) {
        console.error("Error editing destination:", error);
        showNotification(`Failed to edit destination: ${error.message}`, "error");
    }
}

/**
 * Handle delete action
 * @param {string} id - Destination ID
 */
async function handleDelete(id) {
  console.group(`[Debug] Deleting destination ${id}`);
  
  try {
    // 1. Verify ID exists
    if (!id) throw new Error("No destination ID provided");
    console.log("Deleting destination ID:", id);

    // 2. Find the card element
    const card = document.querySelector(`.destination-card[data-id="${id}"]`);
    if (!card) throw new Error("Destination card not found in DOM");
    
    // 3. Find the delete button
    const deleteBtn = card.querySelector(".action-btn.delete");
    const originalBtnHTML = deleteBtn?.innerHTML;

    // 4. Visual feedback
    card.style.opacity = "0.6";
    if (deleteBtn) {
      deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      deleteBtn.disabled = true;
    }

    // 5. API call
    console.log("Calling DELETE endpoint...");
    const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    // 6. Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data?.success) throw new Error(data.message || "Delete failed");

    // 7. Success - animate removal
    card.classList.add("fading-out");
    setTimeout(() => card.remove(), 300);
    showNotification("Destination deleted!", "success");
    
  } catch (error) {
    console.error("Delete failed:", error);
    showNotification(error.message, "error");
    
    // Reset UI
    if (card) {
      card.style.opacity = "";
      if (deleteBtn && originalBtnHTML) {
        deleteBtn.innerHTML = originalBtnHTML;
        deleteBtn.disabled = false;
      }
    }
  } finally {
    console.groupEnd();
  }
}

// Update your form submission handler to handle both create and update
async function handleFormSubmit(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("name", elements.nameInput.value);
    formData.append("country", elements.countryInput.value);
    formData.append("description", elements.descriptionInput.value);
    formData.append("status", elements.statusSelect.value);
    
    if (elements.imageInput.files[0]) {
      formData.append("image", elements.imageInput.files[0]);
    }

    // Determine if we're creating or updating
    const isEditing = elements.form.dataset.editingId;
    const url = isEditing 
      ? `${API_BASE_URL}/destinations/${elements.form.dataset.editingId}`
      : `${API_BASE_URL}/destinations`;
    
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || "Operation failed");
    }

    /* Success case */
    if (isEditing) {
      // Update existing card
      const card = document.querySelector(`.destination-card[data-id="${elements.form.dataset.editingId}"]`);
      if (card) {
        card.outerHTML = createCardHtml(result.destination);
      }
      showNotification('Destination updated successfully!', 'success');
    } else {
      // Add new card
      elements.cardsGrid.insertAdjacentHTML('afterbegin', createCardHtml(result.destination));
      showNotification('Destination added successfully!', 'success');
    }

    // Reset form
    elements.form.reset();
    delete elements.form.dataset.editingId;
    elements.imagePreview.style.display = 'none';
    elements.modal.style.display = 'none';
    document.querySelector('.modal-content h2').textContent = 'Add New Destination';
    submitBtn.textContent = 'Add Destination';

  } catch (error) {
    console.error('Form submission error:', error);
    showNotification(error.message || 'Operation failed. Please try again.', 'error');
  } finally {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
}