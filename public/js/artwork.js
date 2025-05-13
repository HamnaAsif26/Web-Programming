// Artwork zoom functionality
const initializeZoom = () => {
  const artworkImages = document.querySelectorAll('.artwork-image');
  
  artworkImages.forEach(image => {
    let isZoomed = false;
    let originalWidth;
    let originalHeight;

    image.addEventListener('click', function() {
      if (!isZoomed) {
        originalWidth = this.offsetWidth;
        originalHeight = this.offsetHeight;
        
        this.style.position = 'relative';
        this.style.zIndex = '1000';
        this.style.transform = 'scale(1.5)';
        this.style.transition = 'transform 0.3s ease';
        this.style.cursor = 'zoom-out';
      } else {
        this.style.transform = 'scale(1)';
        this.style.cursor = 'zoom-in';
      }
      isZoomed = !isZoomed;
    });
  });
};

// Enhanced filtering system
const initializeFilters = () => {
  const filterForm = document.getElementById('artwork-filters');
  if (!filterForm) return;

  filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(filterForm);
    
    const filters = {
      period: formData.get('period'),
      medium: formData.get('medium'),
      artist: formData.get('artist'),
      price: {
        min: formData.get('price-min'),
        max: formData.get('price-max')
      },
      style: formData.get('style'),
      year: formData.get('year'),
      sortBy: formData.get('sort-by'),
      sortOrder: formData.get('sort-order')
    };

    try {
      const response = await fetch('/api/artworks/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) throw new Error('Filter request failed');
      
      const data = await response.json();
      updateArtworkGrid(data.artworks);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  });
};

// Update artwork grid with filtered results
const updateArtworkGrid = (artworks) => {
  const grid = document.querySelector('.artwork-grid');
  if (!grid) return;

  grid.innerHTML = artworks.map(artwork => `
    <div class="artwork-card">
      <img src="${artwork.imageUrl}" alt="${artwork.title}" class="artwork-image">
      <div class="artwork-info">
        <h3>${artwork.title}</h3>
        <p class="artist">${artwork.artist}</p>
        <p class="period">${artwork.period}</p>
        <p class="medium">${artwork.medium}</p>
        <p class="price">$${artwork.price}</p>
      </div>
    </div>
  `).join('');

  initializeZoom();
};

// Initialize features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeZoom();
  initializeFilters();
}); 