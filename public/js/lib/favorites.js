// Favorites.js - Handles favorites functionality

document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on the favorites page
  const favoritesContainer = document.getElementById("favorites-container")
  const noFavoritesMessage = document.getElementById("no-favorites-message")

  if (favoritesContainer) {
    loadFavorites()
  }

  // Update favorites count in navbar
  updateFavoritesCount()

  // Functions
  function loadFavorites() {
    const favorites = getFavorites()

    if (favorites.length === 0) {
      if (noFavoritesMessage) {
        noFavoritesMessage.classList.remove("d-none")
      }
      return
    }

    if (noFavoritesMessage) {
      noFavoritesMessage.classList.add("d-none")
    }

    favorites.forEach((artwork) => {
      const favoriteElement = createFavoriteElement(artwork)
      favoritesContainer.appendChild(favoriteElement)
    })
  }

  function createFavoriteElement(artwork) {
    const col = document.createElement("div")
    col.className = "col-md-6 col-lg-4 mb-4"

    col.innerHTML = `
            <div class="card artwork-card h-100" data-id="${artwork._id}">
                <div class="artwork-image-container position-relative">
                    <img src="${artwork.images[0]}" alt="${artwork.title}" class="card-img-top artwork-image">
                    <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 remove-favorite" data-id="${artwork._id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${artwork.title}</h5>
                    <p class="card-text artist-name">${artwork.artist.name}</p>
                    <p class="card-text text-muted">${artwork.year}, ${artwork.medium}</p>
                    ${artwork.price ? `<p class="card-text price">$${formatPrice(artwork.price)}</p>` : ""}
                </div>
                <div class="card-footer bg-white border-top-0 d-flex justify-content-between">
                    <button class="btn btn-outline-primary btn-sm view-details" data-id="${artwork._id}">View Details</button>
                    ${
                      artwork.price && artwork.available
                        ? `<button class="btn btn-outline-success btn-sm add-to-cart" data-id="${artwork._id}">
                            <i class="fas fa-shopping-cart me-1"></i> Add to Cart
                        </button>`
                        : ""
                    }
                </div>
            </div>
        `

    // Add event listeners
    setTimeout(() => {
      const viewDetailsBtn = col.querySelector(".view-details")
      if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener("click", function () {
          const artworkId = this.getAttribute("data-id")
          window.location.href = `artworks.html?id=${artworkId}`
        })
      }

      const removeFavoriteBtn = col.querySelector(".remove-favorite")
      if (removeFavoriteBtn) {
        removeFavoriteBtn.addEventListener("click", function (e) {
          e.stopPropagation()
          const artworkId = this.getAttribute("data-id")
          removeFromFavorites(artworkId)
        })
      }

      const addToCartBtn = col.querySelector(".add-to-cart")
      if (addToCartBtn) {
        addToCartBtn.addEventListener("click", function (e) {
          e.stopPropagation()
          const artworkId = this.getAttribute("data-id")
          addToCart(artworkId)
        })
      }

      const artworkCard = col.querySelector(".artwork-card")
      if (artworkCard) {
        artworkCard.addEventListener("click", function () {
          const artworkId = this.getAttribute("data-id")
          window.location.href = `artworks.html?id=${artworkId}`
        })
      }
    }, 0)

    return col
  }

  function removeFromFavorites(artworkId) {
    const favorites = getFavorites()
    const index = favorites.findIndex((fav) => fav._id === artworkId)

    if (index !== -1) {
      const removedArtwork = favorites[index]
      favorites.splice(index, 1)

      // Save to localStorage
      localStorage.setItem("favorites", JSON.stringify(favorites))

      // Update UI
      const artworkElement = document.querySelector(`.artwork-card[data-id="${artworkId}"]`).closest(".col-md-6")
      if (artworkElement) {
        artworkElement.remove()
      }

      // Update favorites count
      updateFavoritesCount()

      // Show toast
      showToast(`"${removedArtwork.title}" removed from favorites.`, "info")

      // Show no favorites message if no favorites left
      if (favorites.length === 0 && noFavoritesMessage) {
        noFavoritesMessage.classList.remove("d-none")
      }
    }
  }

  function addToCart(artworkId) {
    const favorites = getFavorites()
    const artwork = favorites.find((fav) => fav._id === artworkId)

    if (!artwork || !artwork.available) return

    // Get cart from localStorage
    let cart = localStorage.getItem("cart")
    cart = cart ? JSON.parse(cart) : []

    // Check if artwork is already in cart
    const existingItem = cart.find((item) => item._id === artwork._id)

    if (existingItem) {
      showToast(`"${artwork.title}" is already in your cart.`, "info")
      return
    }

    // Add to cart
    cart.push({
      _id: artwork._id,
      title: artwork.title,
      artist: artwork.artist.name,
      image: artwork.images[0],
      price: artwork.price,
      quantity: 1,
    })

    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(cart))

    // Update cart count
    updateCartCount()

    // Show toast
    showToast(`"${artwork.title}" added to cart!`, "success")
  }

  // Helper functions
  function getFavorites() {
    const favoritesJson = localStorage.getItem("favorites")
    return favoritesJson ? JSON.parse(favoritesJson) : []
  }

  function updateFavoritesCount() {
    const favorites = getFavorites()
    const favoritesCount = document.querySelector(".favorites-count")

    if (favoritesCount) {
      favoritesCount.textContent = favorites.length
    }
  }

  function updateCartCount() {
    const cart = localStorage.getItem("cart")
    const cartItems = cart ? JSON.parse(cart) : []
    const cartCount = document.querySelector(".cart-count")

    if (cartCount) {
      cartCount.textContent = cartItems.length
    }
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("en-US").format(price)
  }

  function showToast(message, type = "info") {
    const toastContainer = document.querySelector(".toast-container")

    if (!toastContainer) return

    const toastId = "toast-" + Date.now()

    const iconClass = {
      success: "fa-check-circle text-success",
      error: "fa-exclamation-circle text-danger",
      warning: "fa-exclamation-triangle text-warning",
      info: "fa-info-circle text-info",
    }

    const toastHtml = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
                <div class="toast-header">
                    <i class="fas ${iconClass[type]} me-2"></i>
                    <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                    <small>Just now</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `

    toastContainer.insertAdjacentHTML("beforeend", toastHtml)

    const toastElement = document.getElementById(toastId)
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 })
    toast.show()

    // Remove toast from DOM after it's hidden
    toastElement.addEventListener("hidden.bs.toast", function () {
      this.remove()
    })
  }
})
