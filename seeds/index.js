const mongoose = require("mongoose")
const dotenv = require("dotenv")
const User = require("../models/User")
const Artist = require("../models/Artist")
const Artwork = require("../models/Artwork")
const Exhibition = require("../models/Exhibition")
const Product = require("../models/Product")
const BlogPost = require("../models/BlogPost")

// Load environment variables
dotenv.config()

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: "admin@gmail.com" })

    if (adminExists) {
      console.log("Admin user already exists")
      return adminExists
    }

    const admin = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@gmail.com",
      password: "Admin123!",
      isAdmin: true,
    })

    await admin.save()
    console.log("Admin user created successfully")
    return admin
  } catch (error) {
    console.error("Error creating admin user:", error)
  }
}

// Create artists
const createArtists = async () => {
  try {
    // Check if artists already exist
    const artistCount = await Artist.countDocuments()

    if (artistCount > 0) {
      console.log("Artists already exist")
      return await Artist.find()
    }

    const artists = [
      {
        name: "Leonardo da Vinci",
        biography:
          "Leonardo di ser Piero da Vinci was an Italian polymath of the High Renaissance who was active as a painter, draughtsman, engineer, scientist, theorist, sculptor, and architect.",
        birthYear: 1452,
        deathYear: 1519,
        nationality: "Italian",
        photo: "/da vinci.jpeg",
        featured: true,
      },
      {
        name: "Vincent van Gogh",
        biography:
          "Vincent Willem van Gogh was a Dutch post-impressionist painter who posthumously became one of the most famous and influential figures in Western art history.",
        birthYear: 1853,
        deathYear: 1890,
        nationality: "Dutch",
        photo: "/van gogh.jpeg",
        featured: true,
      },
      {
        name: "Pablo Picasso",
        biography:
          "Pablo Ruiz Picasso was a Spanish painter, sculptor, printmaker, ceramicist and theatre designer who spent most of his adult life in France.",
        birthYear: 1881,
        deathYear: 1973,
        nationality: "Spanish",
        photo: "/pablo.jpeg",
        featured: true,
      },
      {
        name: "Claude Monet",
        biography:
          "Oscar-Claude Monet was a French painter and founder of impressionist painting who is seen as a key precursor to modernism, especially in his attempts to paint nature as he perceived it.",
        birthYear: 1840,
        deathYear: 1926,
        nationality: "French",
        photo: "/monet.jpeg",
        featured: false,
      },
      {
        name: "Rembrandt",
        biography:
          "Rembrandt Harmenszoon van Rijn was a Dutch draughtsman, painter, and printmaker. An innovative and prolific master in three media, he is generally considered one of the greatest visual artists in the history of art.",
        birthYear: 1606,
        deathYear: 1669,
        nationality: "Dutch",
        photo: "/rembrandt.jpeg",
        featured: false,
      },
      {
        name: "Frida Kahlo",
        biography:
          "Frida Kahlo was a Mexican painter known for her many portraits, self-portraits, and works inspired by the nature and artifacts of Mexico.",
        birthYear: 1907,
        deathYear: 1954,
        nationality: "Mexican",
        photo: "/artist.jpeg",
        featured: true,
      },
    ]

    const createdArtists = await Artist.insertMany(artists)
    console.log(`${createdArtists.length} artists created successfully`)
    return createdArtists
  } catch (error) {
    console.error("Error creating artists:", error)
  }
}

// Create artworks
const createArtworks = async (artists) => {
  try {
    // Check if artworks already exist
    const artworkCount = await Artwork.countDocuments()

    if (artworkCount > 0) {
      console.log("Artworks already exist")
      return await Artwork.find()
    }

    // Find artists by name
    const daVinci = artists.find((a) => a.name === "Leonardo da Vinci")
    const vanGogh = artists.find((a) => a.name === "Vincent van Gogh")
    const picasso = artists.find((a) => a.name === "Pablo Picasso")
    const monet = artists.find((a) => a.name === "Claude Monet")

    const artworks = [
      {
        title: "Mona Lisa",
        artist: daVinci._id,
        description:
          'The Mona Lisa is a half-length portrait painting by Italian artist Leonardo da Vinci. Considered an archetypal masterpiece of the Italian Renaissance, it has been described as "the best known, the most visited, the most written about, the most sung about, the most parodied work of art in the world".',
        medium: "Oil on poplar panel",
        dimensions: {
          width: 53,
          height: 77,
          unit: "cm",
        },
        year: 1503,
        price: 860000000,
        forSale: false,
        images: [
          {
            url: "/mona lisa.jpeg",
            isPrimary: true,
          },
        ],
        categories: ["painting"],
        tags: ["renaissance", "portrait", "masterpiece"],
        featured: true,
      },
      {
        title: "The Starry Night",
        artist: vanGogh._id,
        description:
          "The Starry Night is an oil on canvas painting by Dutch Post-Impressionist painter Vincent van Gogh. Painted in June 1889, it depicts the view from the east-facing window of his asylum room at Saint-Rémy-de-Provence, just before sunrise, with the addition of an imaginary village.",
        medium: "Oil on canvas",
        dimensions: {
          width: 74,
          height: 92,
          unit: "cm",
        },
        year: 1889,
        price: 100000000,
        forSale: false,
        images: [
          {
            url: "/starry night.jpeg",
            isPrimary: true,
          },
        ],
        categories: ["painting"],
        tags: ["post-impressionism", "landscape", "night", "masterpiece"],
        featured: true,
      },
      {
        title: "Water Lilies",
        artist: monet._id,
        description:
          "Water Lilies is a series of approximately 250 oil paintings by French Impressionist Claude Monet. The paintings depict Monet's flower garden at his home in Giverny, and were the main focus of his artistic production during the last thirty years of his life.",
        medium: "Oil on canvas",
        dimensions: {
          width: 200,
          height: 180,
          unit: "cm",
        },
        year: 1919,
        price: 80000000,
        forSale: false,
        images: [
          {
            url: "/water lillies.jpeg",
            isPrimary: true,
          },
        ],
        categories: ["painting"],
        tags: ["impressionism", "landscape", "nature", "masterpiece"],
        featured: true,
      },
      {
        title: "The Last Supper",
        artist: daVinci._id,
        description:
          "The Last Supper is a late 15th-century mural painting by Italian artist Leonardo da Vinci housed by the refectory of the Convent of Santa Maria delle Grazie in Milan, Italy. It is one of the Western world's most recognizable paintings.",
        medium: "Tempera on gesso, pitch, and mastic",
        dimensions: {
          width: 880,
          height: 460,
          unit: "cm",
        },
        year: 1498,
        price: 450000000,
        forSale: false,
        images: [
          {
            url: "/last supper.jpeg",
            isPrimary: true,
          },
        ],
        categories: ["painting"],
        tags: ["renaissance", "religious", "masterpiece"],
        featured: false,
      },
      {
        title: "The Raft of the Medusa",
        artist: picasso._id,
        description:
          "The Raft of the Medusa is an oil painting of 1818–1819 by the French Romantic painter and lithographer Théodore Géricault. Completed when the artist was 27, the work has become an icon of French Romanticism.",
        medium: "Oil on canvas",
        dimensions: {
          width: 491,
          height: 716,
          unit: "cm",
        },
        year: 1819,
        price: 120000000,
        forSale: false,
        images: [
          {
            url: "/raft.jpeg",
            isPrimary: true,
          },
        ],
        categories: ["painting"],
        tags: ["romanticism", "historical", "masterpiece"],
        featured: false,
      },
    ]

    const createdArtworks = await Artwork.insertMany(artworks)

    // Update artists with artworks
    for (const artwork of createdArtworks) {
      await Artist.findByIdAndUpdate(artwork.artist, {
        $push: { artworks: artwork._id },
      })
    }

    console.log(`${createdArtworks.length} artworks created successfully`)
    return createdArtworks
  } catch (error) {
    console.error("Error creating artworks:", error)
  }
}

// Create exhibitions
const createExhibitions = async (artists, artworks) => {
  try {
    // Check if exhibitions already exist
    const exhibitionCount = await Exhibition.countDocuments()

    if (exhibitionCount > 0) {
      console.log("Exhibitions already exist")
      return await Exhibition.find()
    }

    // Current date for reference
    const now = new Date()

    // Create dates for exhibitions
    const pastDate = new Date(now)
    pastDate.setMonth(pastDate.getMonth() - 3)

    const currentStartDate = new Date(now)
    currentStartDate.setDate(currentStartDate.getDate() - 15)

    const currentEndDate = new Date(now)
    currentEndDate.setDate(currentEndDate.getDate() + 15)

    const upcomingStartDate = new Date(now)
    upcomingStartDate.setMonth(upcomingStartDate.getMonth() + 1)

    const upcomingEndDate = new Date(upcomingStartDate)
    upcomingEndDate.setMonth(upcomingEndDate.getMonth() + 2)

    const exhibitions = [
      {
        title: "Renaissance Masters",
        description:
          "Experience the brilliance of Renaissance art in this exclusive exhibition featuring works by Leonardo da Vinci and other masters of the period.",
        startDate: pastDate,
        endDate: new Date(pastDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        location: {
          name: "ARTE Gallery - Main Hall",
          address: {
            street: "123 Art Avenue",
            city: "New York",
            state: "NY",
            zipCode: "10001",
            country: "USA",
          },
        },
        coverImage: "/t.jpg",
        artists: [artists.find((a) => a.name === "Leonardo da Vinci")._id],
        artworks: [
          artworks.find((a) => a.title === "Mona Lisa")._id,
          artworks.find((a) => a.title === "The Last Supper")._id,
        ],
        featured: true,
        status: "past",
        openingHours: {
          monday: "10:00 - 18:00",
          tuesday: "10:00 - 18:00",
          wednesday: "10:00 - 18:00",
          thursday: "10:00 - 18:00",
          friday: "10:00 - 20:00",
          saturday: "10:00 - 20:00",
          sunday: "12:00 - 18:00",
        },
        ticketPrice: 15,
      },
      {
        title: "Impressionist Landscapes",
        description:
          "Immerse yourself in the beauty of nature through the eyes of the Impressionist masters. This exhibition showcases stunning landscapes that capture light and atmosphere in unique ways.",
        startDate: currentStartDate,
        endDate: currentEndDate,
        location: {
          name: "ARTE Gallery - East Wing",
          address: {
            street: "123 Art Avenue",
            city: "New York",
            state: "NY",
            zipCode: "10001",
            country: "USA",
          },
        },
        coverImage: "/water lillies.jpeg",
        artists: [artists.find((a) => a.name === "Claude Monet")._id],
        artworks: [artworks.find((a) => a.title === "Water Lilies")._id],
        featured: true,
        status: "current",
        openingHours: {
          monday: "10:00 - 18:00",
          tuesday: "10:00 - 18:00",
          wednesday: "10:00 - 18:00",
          thursday: "10:00 - 18:00",
          friday: "10:00 - 20:00",
          saturday: "10:00 - 20:00",
          sunday: "12:00 - 18:00",
        },
        ticketPrice: 18,
      },
      {
        title: "Modern Visionaries",
        description:
          "Explore the revolutionary works of modern art masters who changed the course of art history with their bold visions and innovative techniques.",
        startDate: upcomingStartDate,
        endDate: upcomingEndDate,
        location: {
          name: "ARTE Gallery - West Wing",
          address: {
            street: "123 Art Avenue",
            city: "New York",
            state: "NY",
            zipCode: "10001",
            country: "USA",
          },
        },
        coverImage: "/starry night.jpeg",
        artists: [
          artists.find((a) => a.name === "Vincent van Gogh")._id,
          artists.find((a) => a.name === "Pablo Picasso")._id,
        ],
        artworks: [
          artworks.find((a) => a.title === "The Starry Night")._id,
          artworks.find((a) => a.title === "The Raft of the Medusa")._id,
        ],
        featured: true,
        status: "upcoming",
        openingHours: {
          monday: "10:00 - 18:00",
          tuesday: "10:00 - 18:00",
          wednesday: "10:00 - 18:00",
          thursday: "10:00 - 18:00",
          friday: "10:00 - 20:00",
          saturday: "10:00 - 20:00",
          sunday: "12:00 - 18:00",
        },
        ticketPrice: 20,
      },
    ]

    const createdExhibitions = await Exhibition.insertMany(exhibitions)

    // Update artists and artworks with exhibitions
    for (const exhibition of createdExhibitions) {
      // Update artists
      for (const artistId of exhibition.artists) {
        await Artist.findByIdAndUpdate(artistId, {
          $push: { exhibitions: exhibition._id },
        })
      }

      // Update artworks
      for (const artworkId of exhibition.artworks) {
        await Artwork.findByIdAndUpdate(artworkId, {
          $push: { exhibitions: exhibition._id },
        })
      }
    }

    console.log(`${createdExhibitions.length} exhibitions created successfully`)
    return createdExhibitions
  } catch (error) {
    console.error("Error creating exhibitions:", error)
  }
}

// Create products
const createProducts = async (artists, artworks) => {
  try {
    // Check if products already exist
    const productCount = await Product.countDocuments()

    if (productCount > 0) {
      console.log("Products already exist")
      return await Product.find()
    }

    const products = [
      {
        name: "Mona Lisa Print",
        description:
          "High-quality print of Leonardo da Vinci's masterpiece, the Mona Lisa. Printed on premium archival paper with fade-resistant inks.",
        price: 49.99,
        images: [
          {
            url: "/mona lisa.jpeg",
            isPrimary: true,
          },
        ],
        category: "print",
        relatedArtwork: artworks.find((a) => a.title === "Mona Lisa")._id,
        relatedArtist: artists.find((a) => a.name === "Leonardo da Vinci")._id,
        stock: 100,
        featured: true,
        dimensions: {
          width: 40,
          height: 50,
          unit: "cm",
        },
      },
      {
        name: "Starry Night Print",
        description:
          "Beautiful reproduction of Vincent van Gogh's The Starry Night. This premium print captures the vibrant colors and expressive brushstrokes of the original.",
        price: 39.99,
        images: [
          {
            url: "/starry night.jpeg",
            isPrimary: true,
          },
        ],
        category: "print",
        relatedArtwork: artworks.find((a) => a.title === "The Starry Night")._id,
        relatedArtist: artists.find((a) => a.name === "Vincent van Gogh")._id,
        stock: 150,
        featured: true,
        dimensions: {
          width: 40,
          height: 30,
          unit: "cm",
        },
      },
      {
        name: "Water Lilies Tote Bag",
        description:
          "Carry your essentials in style with this beautiful tote bag featuring Claude Monet's Water Lilies. Made from durable canvas with comfortable handles.",
        price: 24.99,
        images: [
          {
            url: "/water lillies.jpeg",
            isPrimary: true,
          },
        ],
        category: "merchandise",
        relatedArtwork: artworks.find((a) => a.title === "Water Lilies")._id,
        relatedArtist: artists.find((a) => a.name === "Claude Monet")._id,
        stock: 75,
        featured: true,
        dimensions: {
          width: 40,
          height: 35,
          depth: 10,
          unit: "cm",
        },
      },
      {
        name: "Renaissance Art Book",
        description:
          "Comprehensive guide to Renaissance art featuring works by Leonardo da Vinci and other masters. Hardcover, 250 pages with full-color illustrations.",
        price: 59.99,
        images: [
          {
            url: "/t.jpg",
            isPrimary: true,
          },
        ],
        category: "book",
        relatedArtist: artists.find((a) => a.name === "Leonardo da Vinci")._id,
        stock: 50,
        featured: false,
        dimensions: {
          width: 25,
          height: 30,
          depth: 2.5,
          unit: "cm",
        },
        weight: {
          value: 1.2,
          unit: "kg",
        },
      },
      {
        name: "Van Gogh Coffee Mug",
        description:
          "Start your day with inspiration from Van Gogh's Starry Night on this ceramic mug. Dishwasher and microwave safe.",
        price: 19.99,
        images: [
          {
            url: "/starry night.jpeg",
            isPrimary: true,
          },
        ],
        category: "merchandise",
        relatedArtwork: artworks.find((a) => a.title === "The Starry Night")._id,
        relatedArtist: artists.find((a) => a.name === "Vincent van Gogh")._id,
        stock: 200,
        featured: false,
        dimensions: {
          width: 8,
          height: 10,
          unit: "cm",
        },
        weight: {
          value: 350,
          unit: "g",
        },
      },
    ]

    const createdProducts = await Product.insertMany(products)
    console.log(`${createdProducts.length} products created successfully`)
    return createdProducts
  } catch (error) {
    console.error("Error creating products:", error)
  }
}

// Create blog posts
const createBlogPosts = async (admin, artists, artworks, exhibitions) => {
  try {
    // Check if blog posts already exist
    const blogPostCount = await BlogPost.countDocuments()

    if (blogPostCount > 0) {
      console.log("Blog posts already exist")
      return await BlogPost.find()
    }

    const blogPosts = [
      {
        title: "The Enduring Mystery of the Mona Lisa",
        slug: "enduring-mystery-mona-lisa",
        content: `<p>Few paintings in the world have captivated the public imagination like Leonardo da Vinci's Mona Lisa. For over 500 years, this relatively small portrait (30 x 21 inches) has been the subject of endless fascination, speculation, and admiration.</p>
        <p>What makes this painting so special? Is it the enigmatic smile that seems to change depending on the angle from which you view it? Is it the revolutionary sfumato technique that da Vinci perfected, creating soft, hazy outlines instead of harsh lines? Or perhaps it's the mystery surrounding the subject's identity?</p>
        <p>Art historians have long debated who exactly is depicted in the painting. The most widely accepted theory is that she is Lisa Gherardini, the wife of Florentine merchant Francesco del Giocondo. However, alternative theories abound, with some suggesting she was da Vinci's mother, a self-portrait of the artist himself, or even entirely imagined.</p>
        <p>The painting's journey through history is almost as fascinating as its subject. It was acquired by King Francis I of France shortly after its completion and remained in French royal collections until the Revolution. After a brief stint in Napoleon's bedroom, it found its permanent home in the Louvre Museum.</p>
        <p>The Mona Lisa gained additional fame in 1911 when it was stolen from the Louvre by an Italian handyman who believed it belonged in Italy. The painting was recovered two years later, and the publicity surrounding the theft cemented its status as the world's most famous painting.</p>
        <p>Today, the Mona Lisa sits behind bulletproof glass in the Louvre, viewed by millions of visitors each year. Despite countless studies using the most advanced technology, the painting still holds many secrets, ensuring its place in our collective fascination for generations to come.</p>`,
        excerpt:
          "Exploring the enduring fascination with Leonardo da Vinci's masterpiece and the secrets behind its creation.",
        author: admin._id,
        coverImage: "/blog1.png",
        categories: ["Art History", "Famous Paintings"],
        tags: ["Leonardo da Vinci", "Renaissance", "Mona Lisa"],
        relatedArtworks: [artworks.find((a) => a.title === "Mona Lisa")._id],
        relatedArtists: [artists.find((a) => a.name === "Leonardo da Vinci")._id],
        featured: true,
        status: "published",
        publishDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        title: "Understanding Van Gogh's Starry Night",
        slug: "understanding-van-gogh-starry-night",
        content: `<p>Vincent van Gogh's "The Starry Night" is perhaps one of the most recognized paintings in Western culture. Created in June 1889, it depicts the view from the east-facing window of his asylum room at Saint-Rémy-de-Provence, just before sunrise, with the addition of an imaginary village.</p>
        <p>What many people don't realize is that Van Gogh painted this masterpiece during one of the most difficult periods of his life. He had voluntarily admitted himself to the asylum after the infamous ear-cutting incident, suffering from what modern doctors believe may have been a combination of bipolar disorder, epilepsy, and other conditions.</p>
        <p>The swirling, tumultuous sky in "The Starry Night" is often interpreted as a reflection of his inner turmoil. The cypress tree in the foreground, traditionally associated with cemeteries and mourning, reaches into the sky like a dark flame, connecting earth and heaven. Meanwhile, the sleeping village below represents peace and normalcy—a stark contrast to the emotional sky above.</p>
        <p>Van Gogh's use of color was revolutionary. The deep blues and vibrant yellows create a sense of movement and emotion that transcends the static nature of the canvas. His bold, impasto brushstrokes—where paint is laid on so thickly that it stands out from the surface—add texture and dimension to the work.</p>
        <p>Interestingly, Van Gogh himself didn't consider "The Starry Night" one of his most successful works. In a letter to his brother Theo, he expressed disappointment with the painting, feeling it was too far removed from reality. Little did he know that this departure from literal representation would help pave the way for expressionism and other modern art movements.</p>
        <p>Today, "The Starry Night" hangs in the Museum of Modern Art in New York City, where it continues to inspire visitors with its emotional intensity and visionary style. It has transcended the art world to become a cultural icon, reproduced on everything from coffee mugs to t-shirts, ensuring Van Gogh's vision continues to resonate with new generations.</p>`,
        excerpt:
          "Delving into the history and meaning behind Vincent van Gogh's iconic masterpiece created during his time at an asylum.",
        author: admin._id,
        coverImage: "/blog2.png",
        categories: ["Art History", "Famous Paintings"],
        tags: ["Vincent van Gogh", "Post-Impressionism", "Starry Night"],
        relatedArtworks: [artworks.find((a) => a.title === "The Starry Night")._id],
        relatedArtists: [artists.find((a) => a.name === "Vincent van Gogh")._id],
        featured: true,
        status: "published",
        publishDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
      {
        title: "The Revolutionary Techniques of Claude Monet",
        slug: "revolutionary-techniques-claude-monet",
        content: `<p>Claude Monet, the founder of French Impressionist painting, revolutionized the art world with his unique approach to capturing light and atmosphere. His techniques, radical for their time, continue to influence artists today.</p>
        <p>Perhaps Monet's most significant contribution was his dedication to painting outdoors, or "en plein air." While previous generations of artists might make quick sketches outdoors and then complete their paintings in the studio, Monet insisted on working directly from nature, capturing the changing effects of light in real-time. This often meant working on multiple canvases simultaneously, each representing a different time of day or weather condition.</p>
        <p>Monet's approach to color was equally revolutionary. Rather than mixing colors on the palette to achieve the desired hue, he often applied pure colors in small, broken brushstrokes directly onto the canvas. When viewed from a distance, these individual strokes blend optically in the viewer's eye to create a vibrant, luminous effect that seems to shimmer with life.</p>
        <p>His famous "Water Lilies" series, painted in his garden at Giverny, exemplifies these techniques. In these works, Monet abandoned traditional perspective and compositional structure, creating immersive panoramas that envelop the viewer in a world of water, reflection, and atmosphere. The series represents the culmination of his artistic journey, with some canvases measuring nearly 7 feet tall and 14 feet wide.</p>
        <p>What's particularly fascinating about Monet's later works is how they anticipate developments in abstract art that would come decades later. As his eyesight deteriorated due to cataracts, his paintings became increasingly abstract, with bolder brushwork and a focus on color and form rather than detailed representation.</p>
        <p>Today, Monet's gardens at Giverny have been restored and are open to the public, allowing visitors to experience the same views that inspired his groundbreaking works. Standing on the Japanese bridge overlooking the water lily pond, one can appreciate how Monet's revolutionary techniques transformed not just how artists paint, but how we all see and experience the natural world.</p>`,
        excerpt:
          "Exploring the innovative painting methods that made Claude Monet a pioneer of Impressionism and changed art history.",
        author: admin._id,
        coverImage: "/blog3.png",
        categories: ["Art History", "Techniques"],
        tags: ["Claude Monet", "Impressionism", "Water Lilies"],
        relatedArtworks: [artworks.find((a) => a.title === "Water Lilies")._id],
        relatedArtists: [artists.find((a) => a.name === "Claude Monet")._id],
        relatedExhibitions: [exhibitions.find((e) => e.title === "Impressionist Landscapes")._id],
        featured: false,
        status: "published",
        publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    ]

    const createdBlogPosts = await BlogPost.insertMany(blogPosts)
    console.log(`${createdBlogPosts.length} blog posts created successfully`)
    return createdBlogPosts
  } catch (error) {
    console.error("Error creating blog posts:", error)
  }
}

// Run the seed function
const seedDatabase = async () => {
  try {
    // Create admin user
    const admin = await createAdminUser()

    // Create artists
    const artists = await createArtists()

    // Create artworks
    const artworks = await createArtworks(artists)

    // Create exhibitions
    const exhibitions = await createExhibitions(artists, artworks)

    // Create products
    const products = await createProducts(artists, artworks)

    // Create blog posts
    const blogPosts = await createBlogPosts(admin, artists, artworks, exhibitions)

    console.log("Database seeded successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()
