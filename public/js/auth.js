// auth.js - Handles authentication functions for ARTE Gallery

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem("userToken") !== null
}

// Get current user info
function getCurrentUser() {
  const userInfo = localStorage.getItem("userInfo")
  return userInfo ? JSON.parse(userInfo) : null
}

// Check if user is admin
function isAdmin() {
  const user = getCurrentUser()
  return user && user.isAdmin === true
}

// Logout user
function logout() {
  localStorage.removeItem("userToken")
  localStorage.removeItem("userInfo")
  localStorage.removeItem("userAvatar")
  window.location.href = "/login.html"
}

// Update UI based on authentication status
function updateAuthUI() {
  const loginSignupContainer = document.querySelector(".login-signup")

  if (!loginSignupContainer) return

  if (isLoggedIn()) {
    const user = getCurrentUser()
    const avatarSrc = localStorage.getItem("userAvatar") || "/placeholder.svg?height=30&width=30"

    loginSignupContainer.innerHTML = `
      <div class="profile-dropdown">
        <div class="profile-dropdown-toggle">
          <img src="${avatarSrc}" alt="Profile">
          <span>${user.firstName || "User"}</span>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="profile-dropdown-menu">
          <a href="profile.html" class="profile-dropdown-item">
            <i class="fas fa-user"></i> My Profile
          </a>
          ${
            user.isAdmin
              ? `
          <a href="admin/dashboard.html" class="profile-dropdown-item">
            <i class="fas fa-tachometer-alt"></i> Admin Dashboard
          </a>
          `
              : ""
          }
          <a href="#" class="profile-dropdown-item danger" id="navLogoutBtn">
            <i class="fas fa-sign-out-alt"></i> Logout
          </a>
        </div>
      </div>
    `

    // Add event listener to navbar logout button
    const navLogoutBtn = document.getElementById("navLogoutBtn")
    if (navLogoutBtn) {
      navLogoutBtn.addEventListener("click", (e) => {
        e.preventDefault()
        logout()
      })
    }

    // Add event listener to toggle dropdown
    const dropdownToggle = document.querySelector(".profile-dropdown-toggle")
    if (dropdownToggle) {
      dropdownToggle.addEventListener("click", (e) => {
        e.stopPropagation()
        const menu = document.querySelector(".profile-dropdown-menu")
        menu.classList.toggle("show")
      })

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        const dropdown = document.querySelector(".profile-dropdown")
        if (dropdown && !dropdown.contains(e.target)) {
          const menu = document.querySelector(".profile-dropdown-menu")
          if (menu) menu.classList.remove("show")
        }
      })
    }
  } else {
    loginSignupContainer.innerHTML = `
      <a href="/login.html"><button class="btn btn-login me-2">Login</button></a>
      <a href="/signup.html"><button class="btn btn-signup">Sign Up</button></a>
    `
  }
}

// Protect routes that require authentication
function protectRoute() {
  const protectedRoutes = ["/profile.html", "/checkout.html", "/orders.html"]

  const adminRoutes = [
    "/admin/",
    "/admin/dashboard.html",
    "/admin/artworks.html",
    "/admin/artists.html",
    "/admin/exhibitions.html",
    "/admin/products.html",
    "/admin/orders.html",
    "/admin/users.html",
    "/admin/blog.html",
  ]

  const currentPath = window.location.pathname

  // Check if current path is a protected route
  if (protectedRoutes.some((route) => currentPath === route)) {
    if (!isLoggedIn()) {
      window.location.href = "/login.html?redirect=" + encodeURIComponent(currentPath)
    }
  }

  // Check if current path is an admin route
  if (adminRoutes.some((route) => currentPath === route || currentPath.startsWith("/admin/"))) {
    if (!isLoggedIn() || !isAdmin()) {
      window.location.href = "/login.html?redirect=" + encodeURIComponent(currentPath)
    }
  }
}

// Handle redirect after login
function handleLoginRedirect() {
  if (window.location.pathname === "/login.html") {
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get("redirect")

    if (redirect && isLoggedIn()) {
      window.location.href = redirect
    }
  }
}

// Save artwork to user's favorites
async function saveArtwork(artworkId) {
  if (!isLoggedIn()) {
    window.location.href = "/login.html?redirect=" + encodeURIComponent(window.location.pathname)
    return
  }

  try {
    const token = localStorage.getItem("userToken")
    const response = await fetch(`/api/users/saved-artworks/${artworkId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (response.ok) {
      showToast("Artwork saved to your favorites", "success")
      return true
    } else {
      showToast(data.error || "Failed to save artwork", "error")
      return false
    }
  } catch (error) {
    console.error("Error saving artwork:", error)
    showToast("An unexpected error occurred", "error")
    return false
  }
}

// Remove artwork from user's favorites
async function removeSavedArtwork(artworkId) {
  if (!isLoggedIn()) return false

  try {
    const token = localStorage.getItem("userToken")
    const response = await fetch(`/api/users/saved-artworks/${artworkId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      showToast("Artwork removed from your favorites", "success")
      return true
    } else {
      const data = await response.json()
      showToast(data.error || "Failed to remove artwork", "error")
      return false
    }
  } catch (error) {
    console.error("Error removing artwork:", error)
    showToast("An unexpected error occurred", "error")
    return false
  }
}

// Check if artwork is saved by user
async function isArtworkSaved(artworkId) {
  if (!isLoggedIn()) return false

  try {
    const token = localStorage.getItem("userToken")
    const response = await fetch(`/api/users/saved-artworks/check/${artworkId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return response.ok && data.isSaved
  } catch (error) {
    console.error("Error checking if artwork is saved:", error)
    return false
  }
}

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) return

  const toast = document.createElement("div")
  toast.className = `toast align-items-center text-white bg-${type === "error" ? "danger" : type} border-0`
  toast.setAttribute("role", "alert")
  toast.setAttribute("aria-live", "assertive")
  toast.setAttribute("aria-atomic", "true")

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `

  toastContainer.appendChild(toast)

  // Initialize Bootstrap Toast
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 3000,
  })

  bsToast.show()

  // Remove toast from DOM after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove()
  })
}

// Initialize auth functionality
document.addEventListener("DOMContentLoaded", () => {
  console.log("Auth.js loaded")

  // Update UI based on authentication status
  updateAuthUI()

  // Protect routes
  protectRoute()

  // Handle redirect after login
  handleLoginRedirect()
})
