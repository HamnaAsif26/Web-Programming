# Arte Gallery

A Node.js/Express.js based art gallery management system with MongoDB database.

## 🎨 Current Features

### Artwork Management
- Browse and search artworks
- Advanced filtering by style, medium, price, and size
- High-resolution artwork zoom functionality
- Artwork categorization and tagging

### Artist Features
- Artist profiles and portfolios
- Artist verification system
- Contribution tracking
- Profile management

### Exhibition System
- Exhibition creation and management
- Upcoming exhibitions listing
- Exhibition notifications
- Exhibition status tracking (current/upcoming/past)

### Basic E-commerce
- Product listing and management
- Order tracking
- Basic shopping cart functionality
- Order status updates

## 🏗️ Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Image Storage**: Cloudinary
- **Authentication**: Basic auth with sessions
- **Email**: Nodemailer

## 📁 Project Structure

```
arte-gallery/
├── config/
│   └── db.js             # Database configuration
├── controllers/
│   ├── artwork.controller.js    # Artwork management
│   ├── artist.controller.js     # Artist management
│   ├── exhibition.controller.js # Exhibition management
│   └── shop.controller.js       # Shop functionality
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   ├── Artwork.js        # Artwork schema
│   ├── Artist.js         # Artist schema
│   ├── Exhibition.js     # Exhibition schema
│   ├── Order.js          # Order schema
│   └── User.js           # User schema
├── routes/
│   ├── artwork.routes.js
│   ├── artist.routes.js
│   ├── exhibition.routes.js
│   └── shop.routes.js
├── utils/
│   ├── cloudinary.js    # Image upload utility
│   └── mailer.js        # Email utility
├── .env
└── server.js
```

## 🔑 Current API Endpoints

### Artworks
- `GET /api/artworks` - Get all artworks
- `GET /api/artworks/:id` - Get artwork by ID
- `GET /api/artworks/zoom/:id` - Get zoomable artwork
- `GET /api/artworks/filter` - Filter artworks

### Artists
- `GET /api/artists` - Get all artists
- `GET /api/artists/:id` - Get artist by ID
- `POST /api/artists/verify/request/:id` - Request verification
- `GET /api/artists/verify/status/:id` - Check verification status

### Exhibitions
- `GET /api/exhibitions` - Get all exhibitions
- `GET /api/exhibitions/upcoming` - Get upcoming exhibitions
- `POST /api/exhibitions/notifications/subscribe` - Subscribe to notifications

### Shop
- `GET /api/shop/products` - Get all products
- `GET /api/shop/orders/:id` - Get order by ID
- `POST /api/shop/orders` - Create order

## 🔒 Implemented Security

- Basic authentication
- Session management
- Input validation
- Secure file uploads

## 📧 Current Notifications

The system currently handles:
- Exhibition notifications
- Artist verification updates
- Order confirmations
