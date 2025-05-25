const API_BASE_URL = "http://localhost:3000/api"; // or your actual base URL
document.addEventListener('DOMContentLoaded', function () {
    const bookingsTableBody = document.getElementById('bookings-table-body');

    // Load all bookings without any filters
    async function loadBookings() {
        try {
            // Show loading state
            bookingsTableBody.innerHTML = '<tr><td colspan="9" class="loading">Loading bookings...</td></tr>';

            // Fetch ALL bookings (no query parameters)
            const response = await fetch(`${API_BASE_URL}/bookings`);

            if (!response.ok) throw new Error(`Failed to load: ${response.status}`);

            const data = await response.json();

            if (!data.bookings || data.bookings.length === 0) {
                bookingsTableBody.innerHTML = '<tr><td colspan="9">No bookings found.</td></tr>';
                return;
            }

            renderBookingsTable(data.bookings);
        } catch (error) {
            console.error("Error:", error);
            bookingsTableBody.innerHTML = `<tr><td colspan="9" class="error">Error: ${error.message}</td></tr>`;
        }
    }

    // Render the table (simplified)
    function renderBookingsTable(bookings) {
        bookingsTableBody.innerHTML = '';

        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${booking.BOOKING_ID}</td>
                <td>${booking.CUSTOMER_NAME}</td>
                <td>${booking.PACKAGE_TITLE}</td>
                <td>${formatDate(booking.BOOKING_DATE)}</td>
                <td>${formatDate(booking.TRAVEL_DATE)}</td>
                <td>${booking.PARTICIPANTS}</td>
                <td>$${booking.TOTAL_AMOUNT?.toFixed(2) || '0.00'}</td>
                <td><span class="status-badge ${booking.STATUS?.toLowerCase()}">${capitalizeFirstLetter(booking.STATUS)}</span></td>
                <td>
                    <select class="status-select" data-booking-id="${booking.BOOKING_ID}">
                        <option value="pending" ${booking.STATUS === 'PENDING' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${booking.STATUS === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                        <option value="cancelled" ${booking.STATUS === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            `;
            bookingsTableBody.appendChild(row);

            // Add status change handler
            row.querySelector('.status-select').addEventListener('change', updateBookingStatus);
        });
    }

    // Update booking status (unchanged)
    async function updateBookingStatus(e) {
        const bookingId = e.target.dataset.bookingId;
        const newStatus = e.target.value;

        try {
            const response = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update status');

            const data = await response.json();
            if (!data.success) throw new Error(data.message);

            console.log("Status updated successfully");
            loadBookings(); // Refresh table
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update status: " + error.message);
        }
    }

    // Helper functions (unchanged)
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function capitalizeFirstLetter(string) {
        return string?.charAt(0).toUpperCase() + string?.slice(1).toLowerCase();
    }

    // Initialize
    loadBookings();
});