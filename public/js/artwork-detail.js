// Global variables
let currentArtwork = null
let relatedArtworks = []
let currentPage = 1
let artistId = null
let isLoggedIn = false
let isSaved = false
const perPage = 6

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  // Initialize elements after DOM is loaded
  const loadingSpinner = document.getElementById("loading-spinner")
  const artworkContent = document.getElementById("artwork-detail-content")
  const mainImage = document.getElementById("artwork-main-image")
  const thumbnailsContainer = document.getElementById("artwork-thumbnails")
  const titleElement = document.getElementById("artwork-title")
  const artistElement = document.getElementById("artwork-artist")
  const yearElement = document.getElementById("artwork-year")
  const periodElement = document.getElementById("artwork-period")
  const mediumElement = document.getElementById("artwork-medium")
  const dimensionsElement = document.getElementById("artwork-dimensions")
  const priceContainer = document.getElementById("artwork-price-container")
  const priceElement = document.getElementById("artwork-price")
  const descriptionElement = document.getElementById("artwork-description")
  const exhibitionsContainer = document.getElementById("artwork-exhibitions-container")
  const exhibitionsList = document.getElementById("artwork-exhibitions")
  const relatedArtworksGrid = document.getElementById("related-artworks")
  const loadMoreBtn = document.getElementById("load-more-btn")
  const saveArtworkBtn = document.getElementById("save-artwork-btn")
  const inquireBtn = document.getElementById("artwork-inquire-btn")

  // Modals
  const zoomModal = document.getElementById("zoom-modal")
  const zoomImg = document.getElementById("zoom-img")
  const zoomClose = document.querySelector(".zoom-close")
  const inquiryModal = document.getElementById("inquiry-modal")
  const inquiryForm = document.getElementById("inquiry-form")
  const inquiryArtworkId = document.getElementById("inquiry-artwork-id")
  const loginReminderModal = document.getElementById("login-reminder-modal")
  const closeModalButtons = document.querySelectorAll(".close-modal")

  // Initialize analytics
  window.dataLayer = window.dataLayer || []
  function gtag() {
    dataLayer.push(arguments)
  }

  // Check if user is logged in
  const checkLoginStatus = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        isLoggedIn = false
        return
      }

      const response = await fetch("/api/auth/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        isLoggedIn = true
      } else {
        isLoggedIn = false
        localStorage.removeItem("token")
      }
    } catch (error) {
      console.error("Error checking login status:", error)
      isLoggedIn = false
    }
  }

  // Get artwork ID from URL
  const getArtworkId = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("id")
  }

  // Fetch artwork details
  const fetchArtworkDetails = async (artworkId) => {
    try {
      loadingSpinner.style.display = "flex"
      artworkContent.style.display = "none"

      const response = await fetch(`/api/artworks/${artworkId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch artwork details")
      }

      const data = await response.json()
      currentArtwork = data.artwork
      artistId = currentArtwork.artist._id

      // Check if artwork is saved (if user is logged in)
      if (isLoggedIn) {
        await checkIfArtworkIsSaved(artworkId)
      }

      // Fetch zoomable images
      const zoomResponse = await fetch(`/api/artworks/zoom/${artworkId}`)
      if (zoomResponse.ok) {
        const zoomData = await zoomResponse.json()
        if (zoomData.artwork && zoomData.artwork.zoomableImages) {
          currentArtwork.zoomableImages = zoomData.artwork.zoomableImages
        }
      }

      displayArtworkDetails()
      fetchRelatedArtworks()
    } catch (error) {
      console.error("Error fetching artwork details:", error)
      showErrorMessage("Failed to load artwork details. Please try again later.")
    } finally {
      loadingSpinner.style.display = "none"
      artworkContent.style.display = "flex"
    }
  }

  // Check if artwork is saved
  const checkIfArtworkIsSaved = async (artworkId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/saved-artworks/check/${artworkId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        isSaved = data.isSaved
        updateSaveButton()
      }
    } catch (error) {
      console.error("Error checking if artwork is saved:", error)
    }
  }

  // Update save button appearance
  const updateSaveButton = () => {
    if (isSaved) {
      saveArtworkBtn.innerHTML = '<i class="fas fa-heart"></i> <span>Saved</span>'
      saveArtworkBtn.classList.add("saved")
    } else {
      saveArtworkBtn.innerHTML = '<i class="far fa-heart"></i> <span>Save</span>'
      saveArtworkBtn.classList.remove("saved")
    }
  }

  // Display artwork details
  const displayArtworkDetails = () => {
    // Set main image
    mainImage.src = currentArtwork.imageUrl
    mainImage.alt = currentArtwork.title

    // Set thumbnails if additional images exist
    if (currentArtwork.additionalImages && currentArtwork.additionalImages.length > 0) {
      thumbnailsContainer.innerHTML = `
                <div class="thumbnail active" data-image="${currentArtwork.imageUrl}">
                    <img src="${currentArtwork.imageUrl}" alt="${currentArtwork.title}">
                </div>
                ${currentArtwork.additionalImages
                  .map(
                    (img) => `
                    <div class="thumbnail" data-image="${img}">
                        <img src="${img}" alt="${currentArtwork.title}">
                    </div>
                `,
                  )
                  .join("")}
            `

      // Add event listeners to thumbnails
      document.querySelectorAll(".thumbnail").forEach((thumb) => {
        thumb.addEventListener("click", function () {
          document.querySelectorAll(".thumbnail").forEach((t) => t.classList.remove("active"))
          this.classList.add("active")
          mainImage.src = this.dataset.image
        })
      })
    } else {
      thumbnailsContainer.style.display = "none"
    }

    // Set text content
    titleElement.textContent = currentArtwork.title
    artistElement.textContent = currentArtwork.artist.name
    artistElement.href = `artist.html?id=${currentArtwork.artist._id}`
    yearElement.textContent = currentArtwork.year
    periodElement.textContent = currentArtwork.period
    mediumElement.textContent = currentArtwork.medium

    if (currentArtwork.dimensions) {
      dimensionsElement.textContent = currentArtwork.dimensions
    } else {
      dimensionsElement.style.display = "none"
    }

    // Set price if for sale
    if (currentArtwork.forSale && currentArtwork.price > 0) {
      priceElement.textContent = `$${currentArtwork.price.toLocaleString()}`
      priceContainer.style.display = "flex"
    } else {
      priceContainer.style.display = "none"
    }

    // Set description
    descriptionElement.textContent = currentArtwork.description

    // Set exhibitions if available
    if (currentArtwork.exhibitions && currentArtwork.exhibitions.length > 0) {
      exhibitionsList.innerHTML = currentArtwork.exhibitions
        .map(
          (exhibition) => `
                <li>
                    <a href="exhibition.html?id=${exhibition._id}">${exhibition.title}</a>
                    <span>${formatDate(exhibition.startDate)} - ${formatDate(exhibition.endDate)}</span>
                </li>
            `,
        )
        .join("")
    } else {
      exhibitionsContainer.style.display = "none"
    }

    // Initialize social sharing
    if (typeof window.sharethis !== "undefined") {
      window.sharethis.initialize()
    } else {
      // Create social sharing buttons manually if ShareThis is not available
      const shareContainer = document.querySelector(".sharethis-inline-share-buttons")
      if (shareContainer) {
        shareContainer.innerHTML = `
                    <div class="social-share-buttons">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn facebook">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(currentArtwork.title)}" target="_blank" class="share-btn twitter">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(currentArtwork.imageUrl)}&description=${encodeURIComponent(currentArtwork.title)}" target="_blank" class="share-btn pinterest">
                            <i class="fab fa-pinterest-p"></i>
                        </a>
                        <a href="mailto:?subject=${encodeURIComponent("Check out this artwork: " + currentArtwork.title)}&body=${encodeURIComponent("I thought you might like this artwork: " + window.location.href)}" class="share-btn email">
                            <i class="fas fa-envelope"></i>
                        </a>
                    </div>
                `
      }
    }

    // Track page view for analytics
    if (typeof gtag === "function") {
      gtag("event", "view_item", {
        items: [
          {
            id: currentArtwork._id,
            name: currentArtwork.title,
            category: currentArtwork.category,
            price: currentArtwork.price,
          },
        ],
      })
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Fetch related artworks by the same artist
  const fetchRelatedArtworks = async () => {
    try {
      const response = await fetch(`/api/artworks/artist/${artistId}?page=1&limit=${perPage}`)
      if (!response.ok) {
        throw new Error("Failed to fetch related artworks")
      }

      const data = await response.json()
      relatedArtworks = data.artworks.filter((artwork) => artwork._id !== currentArtwork._id)

      displayRelatedArtworks()

      // Hide load more button if no more artworks
      if (relatedArtworks.length < perPage) {
        loadMoreBtn.style.display = "none"
      }
    } catch (error) {
      console.error("Error fetching related artworks:", error)
    }
  }

  // Display related artworks
  const displayRelatedArtworks = () => {
    if (relatedArtworks.length === 0) {
      document.querySelector(".related-artworks-section").style.display = "none"
      return
    }

    const artworksToShow = relatedArtworks.slice(0, currentPage * perPage)

    relatedArtworksGrid.innerHTML = artworksToShow
      .map(
        (artwork) => `
            <div class="artwork-card">
                <a href="artwork-detail.html?id=${artwork._id}">
                    <img src="${artwork.imageUrl}" alt="${artwork.title}" class="artwork-image">
                    <div class="artwork-info">
                        <h3>${artwork.title}</h3>
                        <p class="artist">${artwork.artist.name}</p>
                        <p class="year">${artwork.year}</p>
                        ${artwork.forSale ? `<p class="price">$${artwork.price.toLocaleString()}</p>` : ""}
                    </div>
                </a>
            </div>
        `,
      )
      .join("")

    // Hide load more button if all artworks are displayed
    if (artworksToShow.length >= relatedArtworks.length) {
      loadMoreBtn.style.display = "none"
    } else {
      loadMoreBtn.style.display = "block"
    }
  }

  // Load more related artworks
  const loadMoreArtworks = () => {
    currentPage++
    displayRelatedArtworks()
  }

  // Save/unsave artwork
  const toggleSaveArtwork = async () => {
    if (!isLoggedIn) {
      loginReminderModal.style.display = "block"
      return
    }

    try {
      const token = localStorage.getItem("token")
      const artworkId = currentArtwork._id
      let response

      if (isSaved) {
        // Unsave artwork
        response = await fetch(`/api/users/saved-artworks/${artworkId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } else {
        // Save artwork
        response = await fetch(`/api/users/saved-artworks/${artworkId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }

      if (response.ok) {
        isSaved = !isSaved
        updateSaveButton()

        // Track event for analytics
        if (typeof gtag === "function") {
          gtag("event", isSaved ? "save_artwork" : "unsave_artwork", {
            artwork_id: artworkId,
            artwork_title: currentArtwork.title,
          })
        }
      }
    } catch (error) {
      console.error("Error toggling save artwork:", error)
    }
  }

  // Show inquiry modal
  const showInquiryModal = () => {
    inquiryArtworkId.value = currentArtwork._id
    inquiryModal.style.display = "block"

    // Pre-fill form if user is logged in
    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem("user"))
      if (user) {
        document.getElementById("inquiry-name").value = `${user.firstName} ${user.lastName}`.trim()
        document.getElementById("inquiry-email").value = user.email || ""
        document.getElementById("inquiry-phone").value = user.phone || ""
      }
    }
  }

  // Submit inquiry form
  const submitInquiry = async (e) => {
    e.preventDefault()

    const formData = new FormData(inquiryForm)
    const inquiryData = {
      artworkId: formData.get("artworkId"),
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message"),
    }

    try {
      const response = await fetch("/api/contact/artwork-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inquiryData),
      })

      if (response.ok) {
        alert("Your inquiry has been sent. We will contact you soon.")
        inquiryModal.style.display = "none"
        inquiryForm.reset()

        // Track event for analytics
        if (typeof gtag === "function") {
          gtag("event", "artwork_inquiry", {
            artwork_id: currentArtwork._id,
            artwork_title: currentArtwork.title,
          })
        }
      } else {
        alert("There was an error sending your inquiry. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting inquiry:", error)
      alert("There was an error sending your inquiry. Please try again.")
    }
  }

  // Image zoom functionality
  const initializeZoom = () => {
    mainImage.addEventListener("click", () => {
      zoomModal.style.display = "block"

      // Use high-res image if available
      if (currentArtwork.zoomableImages && currentArtwork.zoomableImages.length > 0) {
        const currentImageSrc = mainImage.src
        const zoomableImage = currentArtwork.zoomableImages.find((img) => img.original === currentImageSrc)
        zoomImg.src = zoomableImage ? zoomableImage.zoom : currentImageSrc
      } else {
        zoomImg.src = mainImage.src
      }

      // Add zoom functionality
      zoomImg.style.backgroundImage = `url('${zoomImg.src}')`
      zoomImg.style.backgroundSize = "200%"
      zoomImg.style.backgroundRepeat = "no-repeat"

      // Track zoom event for analytics
      if (typeof gtag === "function") {
        gtag("event", "zoom_artwork", {
          artwork_id: currentArtwork._id,
          artwork_title: currentArtwork.title,
        })
      }
    })

    zoomClose.addEventListener("click", () => {
      zoomModal.style.display = "none"
    })

    zoomModal.addEventListener("click", (e) => {
      if (e.target === zoomModal) {
        zoomModal.style.display = "none"
      }
    })

    // Advanced zoom functionality with mouse move
    zoomImg.addEventListener("mousemove", (e) => {
      const zoomer = e.currentTarget
      const offsetX = e.offsetX ? e.offsetX : e.touches[0].pageX
      const offsetY = e.offsetY ? e.offsetY : e.touches[0].pageY
      const x = (offsetX / zoomer.offsetWidth) * 100
      const y = (offsetY / zoomer.offsetHeight) * 100
      zoomer.style.backgroundPosition = x + "% " + y + "%"
    })
  }

  // Close modals
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", function () {
      this.closest(".modal").style.display = "none"
    })
  })

  // Show error message
  const showErrorMessage = (message) => {
    artworkContent.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <a href="artworks.html" class="btn btn-primary">Back to Artworks</a>
            </div>
        `
    artworkContent.style.display = "block"
  }

  // Initialize
  const init = async () => {
    await checkLoginStatus()

    const artworkId = getArtworkId()
    if (!artworkId) {
      window.location.href = "artworks.html"
      return
    }

    await fetchArtworkDetails(artworkId)
    initializeZoom()

    // Event listeners
    loadMoreBtn.addEventListener("click", loadMoreArtworks)
    saveArtworkBtn.addEventListener("click", toggleSaveArtwork)
    inquireBtn.addEventListener("click", showInquiryModal)
    inquiryForm.addEventListener("submit", submitInquiry)

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === inquiryModal) {
        inquiryModal.style.display = "none"
      }
      if (e.target === loginReminderModal) {
        loginReminderModal.style.display = "none"
      }
    })
  }

  // Start the application
  init()
})
