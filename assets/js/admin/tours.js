"use strict";

const ToursManager = (function () {
    const API_BASE_URL = "http://localhost:3000/api";
    const SELECTORS = {
        TABLE_BODY: ".data-table tbody",
        MODAL: "#addTourModal",
        MODAL_TITLE: "#modalTitle",  // Add this line
        ADD_BTN: ".btn-primary",
        CLOSE_BTN: "#closeModal",
        FORM: "#tourForm",
        IMAGE_INPUT: "#packageImage",
        IMAGE_PREVIEW: "#imagePreview",
        PREVIEW_IMAGE: "#previewImage",
        TITLE_INPUT: "#tourTitle",
        DESTINATION_INPUT: "#Destination",
        ITINERARY_INPUT: "#itinerary",
        DURATION_INPUT: "#Duration", // Add this
        SLOTS_AVAILABLE_INPUT: "#slotsAvailable", // Add this
        DESCRIPTION_INPUT: "#description",
        PRICE_INPUT: "#price",
        STATUS_SELECT: "#status"
    };

    const DEFAULTS = {
        FALLBACK_IMAGE: "/assets/images/gallery-1.jpg",
        STATUS_CLASSES: {
            active: "active",
            inactive: "inactive"
        }
    };

    let elements = {};

    /* ========== PRIVATE FUNCTIONS ========== */

    function initElements() {
        elements = {
            tableBody: document.querySelector(SELECTORS.TABLE_BODY),
            modal: document.querySelector(SELECTORS.MODAL),
            addBtn: document.querySelector(SELECTORS.ADD_BTN),
            closeBtn: document.querySelector(SELECTORS.CLOSE_BTN),
            form: document.querySelector(SELECTORS.FORM),
            imageInput: document.querySelector(SELECTORS.IMAGE_INPUT),
            imagePreview: document.querySelector(SELECTORS.IMAGE_PREVIEW),
            previewImage: document.querySelector(SELECTORS.PREVIEW_IMAGE),
            titleInput: document.querySelector(SELECTORS.TITLE_INPUT),
            destinationInput: document.querySelector(SELECTORS.DESTINATION_INPUT),
            itineraryInput: document.querySelector(SELECTORS.ITINERARY_INPUT),
            startDateInput: document.querySelector(SELECTORS.START_DATE_INPUT),
            endDateInput: document.querySelector(SELECTORS.END_DATE_INPUT),
            priceInput: document.querySelector(SELECTORS.PRICE_INPUT),
            statusSelect: document.querySelector(SELECTORS.STATUS_SELECT),
            durationInput: document.querySelector(SELECTORS.DURATION_INPUT), // Add this
            slotsAvailableInput: document.querySelector(SELECTORS.SLOTS_AVAILABLE_INPUT), // Add this
            descriptionInput: document.querySelector(SELECTORS.DESCRIPTION_INPUT), // Add this
            submitBtn: document.querySelector(`${SELECTORS.FORM} button[type="submit"]`),
            modalTitle: document.querySelector(SELECTORS.MODAL_TITLE)

        };
    }

    function initModal() {
        elements.addBtn.addEventListener("click", () => {
            resetFormAndUI(); // Reset form first
            elements.modalTitle.textContent = "Add New Tour Package";
            elements.submitBtn.textContent = "Add Package";
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
    function resetFormAndUI() {
        if (elements.form) elements.form.reset();
        if (elements.form?.dataset) delete elements.form.dataset.editingId;
        if (elements.imagePreview) elements.imagePreview.style.display = 'none';
        if (elements.modal) elements.modal.style.display = 'none';

        // Reset modal title and button text
        if (elements.modalTitle) elements.modalTitle.textContent = "Add New Tour Package";
        if (elements.submitBtn) elements.submitBtn.textContent = "Add Package";
    }

    async function fetchDestinations() {
        console.log("[1] Starting fetchDestinations");

        // 1. Verify select element exists
        if (!elements.destinationInput) {
            console.error("[ERROR] Destination select element not found in elements object");
            console.log("Current elements:", elements);
            return;
        }
        const select = elements.destinationInput;

        try {
            // 2. Show loading state
            select.disabled = true;
            select.innerHTML = '<option value="">Loading destinations...</option>';

            console.log("[2] Making API request to:", `${API_BASE_URL}/destinations`);

            // 3. Make API request
            const response = await fetch(`${API_BASE_URL}/destinations`);
            console.log("[3] Received response, status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[ERROR] Bad response:", response.status, errorText);
                throw new Error(`Server error: ${response.status}`);
            }

            // 4. Parse response
            const data = await response.json();
            console.log("[4] Parsed data:", data);

            // 5. Verify data structure
            if (!data?.destinations || !Array.isArray(data.destinations)) {
                console.error("[ERROR] Invalid data structure:", data);
                throw new Error("Invalid destinations data format");
            }

            // 6. Populate select
            console.log("[5] Populating select with", data.destinations.length, "destinations");
            select.innerHTML = '<option value="">Select Destination</option>';

            data.destinations.forEach(dest => {
                console.log("Adding destination:", dest.ID, dest.NAME);
                const option = new Option(dest.NAME, dest.ID);
                select.add(option);
            });

            console.log("[6] Successfully populated destinations dropdown");

        } catch (error) {
            console.error("[FINAL ERROR] in fetchDestinations:", error);

            // Show error in UI
            if (select) {
                select.innerHTML = `
                    <option value="">Select Destination</option>
                    <option value="" disabled>Error: ${error.message}</option>
                `;
            }

            showNotification("Failed to load destinations", "error");
        } finally {
            if (select) {
                select.disabled = false;
            }
            console.log("[7] fetchDestinations completed");
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const isEditMode = !!elements.form.dataset.editingId;

        try {
            // Set loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            const statusValue = elements.statusSelect ? elements.statusSelect.value : 'active';
            // Validate required fields
            const requiredFields = ['title', 'destination', 'itinerary', 'duration', 'price', 'slotsAvailable', 'description'];
            const missingFields = [];
            const payload = {
                agency_id: 1,
                status: statusValue
            };

            // Build payload and check for missing fields
            requiredFields.forEach(field => {
                const input = elements[`${field}Input`];
                if (!input) {
                    console.error(`Input element for ${field} not found`);
                    missingFields.push(field);
                    return;
                }
                const value = input.value.trim();
                if (!value) missingFields.push(field);
                // Map field names for API compatibility
                payload[field === 'slotsAvailable' ? 'slots_available' : field] =
                    field === 'price' || field === 'slotsAvailable' || field === 'duration'
                        ? parseFloat(value) || 0
                        : value;
            });

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Handle image upload if exists
            let formData;
            if (elements.imageInput.files[0]) {
                formData = new FormData();
                formData.append('image', elements.imageInput.files[0]);
                Object.entries(payload).forEach(([key, value]) => {
                    formData.append(key, value);
                });
            }

            // Send request
            const url = isEditMode
                ? `${API_BASE_URL}/tours/${elements.form.dataset.editingId}`
                : `${API_BASE_URL}/tours`;

            const options = {
                method: isEditMode ? 'PUT' : 'POST',
                body: formData || JSON.stringify(payload),
                headers: formData ? {} : { 'Content-Type': 'application/json' }
            };

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server response:", response.status, errorText);
                let error;
                try {
                    error = JSON.parse(errorText);
                } catch {
                    error = {};
                }
                throw new Error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} tour: ${errorText}`);
            }

            // Success handling
            showNotification(
                isEditMode ? "Tour updated successfully!" : "Tour created successfully!",
                "success"
            );

            resetFormAndUI();
            await loadTours();

        } catch (error) {
            console.error("Form error:", error);
            showNotification(error.message, "error");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async function handleEditTour(tourId) {
        try {
            console.log("Fetching tour with ID:", tourId);
            elements.modal.style.display = "block";
            elements.form.dataset.editingId = tourId;
            elements.submitBtn.textContent = "Update Tour";

            elements.modalTitle.textContent = "Edit Tour Package";
            elements.submitBtn.textContent = "Update Package";

            const response = await fetch(`${API_BASE_URL}/tours/${tourId}`);
            if (!response.ok) throw new Error("Failed to fetch tour data");

            const tour = await response.json();
            console.log("API Response:", tour);

            // Safely populate form fields
            const fields = {
                titleInput: tour.title || '',
                destinationInput: tour.destination || '',
                itineraryInput: tour.itinerary || '',
                durationInput: tour.duration || '',
                priceInput: tour.price || '',
                slotsAvailableInput: tour.slots_available || '',
                descriptionInput: tour.description || '',
                statusSelect: tour.status || 'active'
            };

            // Only try to set values for elements that exist
            Object.entries(fields).forEach(([elementName, value]) => {
                if (elements[elementName]) {
                    elements[elementName].value = value;
                } else {
                    console.warn(`Element ${elementName} not found`);
                }
            });
            // Safely populate status field
            if (elements.statusSelect) {
                elements.statusSelect.value = tour.status || 'active';
            } else {
                console.warn('Status select element not found');
            }

            if (tour.imageUrl) {
                elements.previewImage.src = tour.imageUrl;
                elements.imagePreview.style.display = "block";
            }

        } catch (error) {
            console.error("Error editing tour:", error);
            showNotification("Failed to load tour for editing: " + error.message, "error");
            elements.modal.style.display = "none";
        }
    }

    async function handleDeleteTour(tourId) {
        try {
            if (!confirm("Are you sure you want to delete this tour?")) return;

            const response = await fetch(`${API_BASE_URL}/tours/${tourId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete tour");
            }

            showNotification("Tour deleted successfully", "success");
            await loadTours();

        } catch (error) {
            console.error("Error deleting tour:", error);
            showNotification("Failed to delete tour: " + error.message, "error");
        }
    }

    async function loadTours() {
        try {
            elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i> Loading tours...
                    </td>
                </tr>
            `;

            const response = await fetch(`${API_BASE_URL}/tours`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server responded with status ${response.status}`);
            }

            const data = await response.json();
            // Check if data has expected structure
            if (!data?.packages) {
                throw new Error("Invalid data format received from server");
            }

            // Clear existing table rows
            elements.tableBody.innerHTML = '';

            if (data.packages.length === 0) {
                elements.tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="no-tours">
                            No tours available. <a href="#" id="addFirstTour">Add your first tour</a>
                        </td>
                    </tr>
                `;

                // Add click handler for "Add first tour" link
                document.getElementById('addFirstTour')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    elements.modal.style.display = "block";
                });
                return;
            }

            // Populate table with tour data
            data.packages.forEach(tour => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tour.package_id || '-'}</td>
                    <td>${tour.title || 'Untitled Tour'}</td>
                    <td>${tour.destination || 'No destination'}</td>
                    <td>${tour.duration + 'days' || '-'}</td>
                    <td>${tour.price ? `${parseFloat(tour.price).toFixed(2)}DA` : 'N/A'}</td>
                    <td>${tour.slots_available || 0}</td>
                    <td>
                        <span class="status-badge ${tour.STATUS === 'active' ? 'active' : 'inactive'}">
                            ${tour.status || 'unknown'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-edit" data-id="${tour.package_id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" data-id="${tour.package_id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                elements.tableBody.appendChild(row);
            });

            // Initialize edit/delete button handlers
            initTableActionButtons();

        } catch (error) {
            console.error("Error loading tours:", error);
            elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="error-state">
                        <i class="fas fa-exclamation-triangle"></i> ${error.message}
                        <button class="btn-retry" onclick="ToursManager.loadTours()">
                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
            showNotification("Failed to load tours: " + error.message, "error");
        }
    }

    // Add this helper function
    function initTableActionButtons() {
        // Edit button handlers
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tourId = e.currentTarget.dataset.id;
                handleEditTour(tourId);
            });
        });

        // Delete button handlers
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tourId = e.currentTarget.dataset.id;
                handleDeleteTour(tourId);
            });
        });
    }


    // Add this to your init function
    function initEventListeners() {
        if (elements.form) {
            elements.form.addEventListener("submit", handleFormSubmit);

            // Add input validation
            const validateInput = (input) => {
                if (!input.value.trim()) {
                    input.classList.add('error');
                    return false;
                }
                input.classList.remove('error');
                return true;
            };

            // Add to all required inputs
            document.querySelectorAll('[required]').forEach(input => {
                input.addEventListener('blur', () => validateInput(input));
            });
        }
    }

    /* ========== PUBLIC API ========== */
    return {
        init: function () {
            initElements();
            initModal();
            initImagePreview();
            fetchDestinations();
            loadTours();
            initEventListeners();
        },
        loadTours: loadTours // Make it publicly accessible

    };
})();

// Only initialization
document.addEventListener("DOMContentLoaded", function () {
    ToursManager.init();
});