document.addEventListener("DOMContentLoaded", () => {
  // Newsletter form submission
  const newsletterForm = document.getElementById("newsletterForm")
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async function (e) {
      e.preventDefault()

      const emailInput = this.querySelector('input[type="email"]')
      const email = emailInput.value

      try {
        const response = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (response.ok) {
          // Clear the form
          emailInput.value = ""

          // Show success message
          showToast("Thank you for subscribing to our newsletter!", "success")
        } else {
          // Show error
          showToast(data.error || "Subscription failed. Please try again.", "error")
        }
      } catch (error) {
        console.error("Newsletter subscription error:", error)
        showToast("An error occurred. Please try again later.", "error")
      }
    })
  }

  // Toast notification function
  function showToast(message, type = "info") {
    const toastContainer = document.querySelector(".toast-container")
    if (!toastContainer) return

    // Create toast element
    const toastEl = document.createElement("div")
    toastEl.className = "toast"
    toastEl.setAttribute("role", "alert")
    toastEl.setAttribute("aria-live", "assertive")
    toastEl.setAttribute("aria-atomic", "true")

    // Set toast content
    let iconClass = "fas fa-info-circle"
    let bgColor = "#1a1a1a"

    if (type === "success") {
      iconClass = "fas fa-check-circle"
      bgColor = "#1a3a1a"
    } else if (type === "warning") {
      iconClass = "fas fa-exclamation-triangle"
      bgColor = "#3a2a1a"
    } else if (type === "error") {
      iconClass = "fas fa-times-circle"
      bgColor = "#3a1a1a"
    }

    toastEl.style.backgroundColor = bgColor

    toastEl.innerHTML = `
      <div class="toast-header">
        <i class="${iconClass}" style="color: #D2B48C; margin-right: 8px;"></i>
        <strong class="me-auto">ARTE Gallery</strong>
        <small>Just now</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `

    // Add toast to container
    toastContainer.appendChild(toastEl)

    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, {
      autohide: true,
      delay: 5000,
    })
    toast.show()

    // Remove toast after it's hidden
    toastEl.addEventListener("hidden.bs.toast", () => {
      toastEl.remove()
    })
  }
})
