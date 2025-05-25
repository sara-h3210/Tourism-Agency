
      document.addEventListener("DOMContentLoaded", function () {
        // Get modal elements
        const addBtn = document.querySelector(".btn-primary");
        const modal = document.getElementById("addDestinationModal");
        const closeBtn = document.getElementById("closeModal");
        const form = document.getElementById("destinationForm");

        // Image preview elements
        const destinationImage = document.getElementById("destinationImage");
        const imagePreview = document.getElementById("imagePreview");
        const previewImage = document.getElementById("previewImage");

        // Show modal when Add Destination button is clicked
        addBtn.addEventListener("click", function () {
          modal.style.display = "block";
        });

        // Close modal when X button is clicked
        closeBtn.addEventListener("click", function () {
          modal.style.display = "none";
        });

        // Close modal when clicking outside the modal content
        window.addEventListener("click", function (event) {
          if (event.target === modal) {
            modal.style.display = "none";
          }
        });

        // Image preview functionality
        destinationImage.addEventListener("change", function (event) {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
              previewImage.src = e.target.result;
              imagePreview.style.display = "block";
            };

            reader.readAsDataURL(file);
          }
        });

        // Form submission handler
        form.addEventListener("submit", async function (e) {
          e.preventDefault();

          // Get form values
          const API_BASE_URL = "http://localhost:3000/api";
          const name = document.getElementById("destinationName").value;
          const country = document.getElementById("country").value;
          const description = document.getElementById("description").value;
          const status = document.getElementById("destinationStatus").value;
          const imageFile =
            document.getElementById("destinationImage").files[0];
          // Create FormData to handle file upload
          const formData = new FormData();
          formData.append("name", name);
          formData.append("country", country);
          formData.append("description", description);
          formData.append("status", status);
          if (imageFile) {
            formData.append("image", imageFile);
          }
          try {
            const response = await fetch(`${API_BASE_URL}/destinations`, {
              method: "POST",
              body: formData,
            });

            const data = await response.json();

            if (data.success) {
              // Create new destination card with data from server
              const cardsGrid = document.querySelector(".cards-grid");
              const newCard = document.createElement("div");
              newCard.className = "destination-card";
              newCard.innerHTML = `
                <div class="card-image">
                  <img src="${
                    data.destination.image_path || "/images/home-slide-2.jpg"
                  }" alt="${name}" />
                  <div class="card-actions">
                    <button class="action-btn edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <h3>${name}</h3>
                  <p class="country">${country}</p>
                  <p class="description">${description}</p>
                  <div class="card-footer">
                    <span class="status ${status}">${
                status.charAt(0).toUpperCase() + status.slice(1)
              }</span>
                  </div>
                </div>
              `;

              // Add the new card to the grid
              cardsGrid.insertBefore(newCard, cardsGrid.firstChild);

              // Reset form and close modal
              form.reset();
              imagePreview.style.display = "none";
              modal.style.display = "none";
            } else {
              alert(
                "Error adding destination: " + (data.error || "Unknown error")
              );
            }
          } catch (err) {
            console.error("Error:", err);
            alert("Failed to add destination");
          }
        });
        const API_BASE_URL = "http://localhost:3000/api";
        // Function to load destinations on page load
        async function loadDestinations() {
          try {
            const response = await fetch(`${API_BASE_URL}/destinations`);
            const data = await response.json();

            if (data.success) {
              const cardsGrid = document.querySelector(".cards-grid");
              cardsGrid.innerHTML = ""; // Clear existing cards

              data.destinations.forEach((dest) => {
                const card = document.createElement("div");
                card.className = "destination-card";
                card.innerHTML = `
                  <div class="card-image">
                    <img src="${
                      dest.IMAGE_PATH || "/images/home-slide-2.jpg"
                    }" alt="${dest.name}" />
                    <div class="card-actions">
                      <button class="action-btn edit">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="action-btn delete">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div class="card-body">
                    <h3>${dest.NAME}</h3>
                    <p class="country">${dest.COUNTRY}</p>
                    <p class="description">${dest.DESCRIPTION}</p>
                    <div class="card-footer">
                      <span class="status ${dest.STATUS.toLowerCase()}">${
                  dest.STATUS.charAt(0).toUpperCase() + dest.STATUS.slice(1)
                }</span>
                    </div>
                  </div>
                `;
                cardsGrid.appendChild(card);
              });
            }
          } catch (err) {
            console.error("Error loading destinations:", err);
          }
        }

        // Load destinations when page loads
        loadDestinations();
      });
    