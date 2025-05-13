// Seed script to populate the database with sample artworks and artists

const mongoose = require("mongoose")
const Artwork = require("../models/Artwork")
const Artist = require("../models/Artist")
const { connectDB } = require("../config/db")

// Sample artists data
const artistsData = [
  {
    name: "Leonardo da Vinci",
    birthYear: 1452,
    deathYear: 1519,
    nationality: "Italian",
    biography:
      "Leonardo di ser Piero da Vinci was an Italian polymath of the High Renaissance who was active as a painter, draughtsman, engineer, scientist, theorist, sculptor, and architect.",
    avatar: "/images/artists/leonardo.jpg",
  },
  {
    name: "Vincent van Gogh",
    birthYear: 1853,
    deathYear: 1890,
    nationality: "Dutch",
    biography:
      "Vincent Willem van Gogh was a Dutch post-impressionist painter who posthumously became one of the most famous and influential figures in Western art history.",
    avatar: "/images/artists/vangogh.jpg",
  },
  {
    name: "Claude Monet",
    birthYear: 1840,
    deathYear: 1926,
    nationality: "French",
    biography:
      "Oscar-Claude Monet was a French painter and founder of impressionist painting who is seen as a key precursor to modernism, especially in his attempts to paint nature as he perceived it.",
    avatar: "/images/artists/monet.jpg",
  },
  {
    name: "Pablo Picasso",
    birthYear: 1881,
    deathYear: 1973,
    nationality: "Spanish",
    biography:
      "Pablo Ruiz Picasso was a Spanish painter, sculptor, printmaker, ceramicist and theatre designer who spent most of his adult life in France.",
    avatar: "/images/artists/picasso.jpg",
  },
  {
    name: "Frida Kahlo",
    birthYear: 1907,
    deathYear: 1954,
    nationality: "Mexican",
    biography:
      "Frida Kahlo was a Mexican painter known for her many portraits, self-portraits, and works inspired by the nature and artifacts of Mexico.",
    avatar: "/images/artists/kahlo.jpg",
  },
  {
    name: "Georgia O'Keeffe",
    birthYear: 1887,
    deathYear: 1986,
    nationality: "American",
    biography:
      "Georgia Totto O'Keeffe was an American artist. She was known for her paintings of enlarged flowers, New York skyscrapers, and New Mexico landscapes.",
    avatar: "/images/artists/okeeffe.jpg",
  },
  {
    name: "Salvador Dalí",
    birthYear: 1904,
    deathYear: 1989,
    nationality: "Spanish",
    biography:
      "Salvador Domingo Felipe Jacinto Dalí i Domènech, Marquis of Dalí de Púbol was a Spanish surrealist artist renowned for his technical skill, precise draftsmanship, and the striking and bizarre images in his work.",
    avatar: "/images/artists/dali.jpg",
  },
  {
    name: "Rembrandt",
    birthYear: 1606,
    deathYear: 1669,
    nationality: "Dutch",
    biography:
      "Rembrandt Harmenszoon van Rijn was a Dutch draughtsman, painter, and printmaker. An innovative and prolific master in three media, he is generally considered one of the greatest visual artists in the history of art.",
    avatar: "/images/artists/rembrandt.jpg",
  },
]

// Sample artworks data
const getArtworksData = (artists) => {
  return [
    {
      title: "Mona Lisa",
      artist: artists[0]._id, // Leonardo da Vinci
      year: "1503-1506",
      medium: "Oil on poplar panel",
      dimensions: "77 cm × 53 cm",
      description:
        'The Mona Lisa is a half-length portrait painting by Italian artist Leonardo da Vinci. Considered an archetypal masterpiece of the Italian Renaissance, it has been described as "the best known, the most visited, the most written about, the most sung about, the most parodied work of art in the world".',
      images: ["/images/artworks/mona-lisa.jpg", "/images/artworks/mona-lisa-detail.jpg"],
      period: "Renaissance",
      category: "Portrait",
      location: "Louvre Museum, Paris",
      price: null, // Not for sale
      available: false,
      historicalContext:
        "The Mona Lisa was painted at a time when Leonardo was at the height of his career. The Renaissance period was characterized by a renewed interest in classical learning and values. Leonardo's innovative techniques, including sfumato (the blending of light and shadow) are exemplified in this work.",
    },
    {
      title: "Starry Night",
      artist: artists[1]._id, // Vincent van Gogh
      year: "1889",
      medium: "Oil on canvas",
      dimensions: "74 cm × 92 cm",
      description:
        "The Starry Night is an oil on canvas painting by Dutch Post-Impressionist painter Vincent van Gogh. Painted in June 1889, it depicts the view from the east-facing window of his asylum room at Saint-Rémy-de-Provence, just before sunrise, with the addition of an imaginary village.",
      images: ["/images/artworks/starry-night.jpg", "/images/artworks/starry-night-detail.jpg"],
      period: "Post-Impressionism",
      category: "Landscape",
      location: "Museum of Modern Art, New York",
      price: null, // Not for sale
      available: false,
      historicalContext:
        "Van Gogh painted Starry Night during his 12-month stay at the asylum of Saint-Paul-de-Mausole near Saint-Rémy-de-Provence. This period was one of intense creativity for the artist, despite his struggles with mental illness.",
    },
    {
      title: "Water Lilies",
      artist: artists[2]._id, // Claude Monet
      year: "1914-1926",
      medium: "Oil on canvas",
      dimensions: "200 cm × 200 cm",
      description:
        "Water Lilies (or Nymphéas) is a series of approximately 250 oil paintings by French Impressionist Claude Monet. The paintings depict Monet's flower garden at his home in Giverny, and were the main focus of his artistic production during the last thirty years of his life.",
      images: ["/images/artworks/water-lilies.jpg", "/images/artworks/water-lilies-detail.jpg"],
      period: "Impressionism",
      category: "Landscape",
      location: "Musée de l'Orangerie, Paris",
      price: null, // Not for sale
      available: false,
      historicalContext:
        "Monet's Water Lilies series represents the culmination of his artistic vision and his fascination with light, color, and atmosphere. The series was created during a period when Impressionism was giving way to newer artistic movements, yet Monet continued to refine his distinctive style.",
    },
    {
      title: "Guernica",
      artist: artists[3]._id, // Pablo Picasso
      year: "1937",
      medium: "Oil on canvas",
      dimensions: "349 cm × 776 cm",
      description:
        "Guernica is a large oil painting on canvas by Spanish artist Pablo Picasso. It is one of his best-known works, regarded by many art critics as the most moving and powerful anti-war painting in history. It is exhibited in the Museo Reina Sofía in Madrid.",
      images: ["/images/artworks/guernica.jpg", "/images/artworks/guernica-detail.jpg"],
      period: "Cubism",
      category: "Historical",
      location: "Museo Reina Sofía, Madrid",
      price: null, // Not for sale
      available: false,
      historicalContext:
        "Guernica was created in response to the bombing of Guernica, a Basque Country town in northern Spain, by Nazi Germany and Fascist Italy at the request of the Spanish Nationalists during the Spanish Civil War. The painting has become a universal symbol of the horrors of war and the suffering it inflicts upon civilians.",
    },
    {
      title: "The Two Fridas",
      artist: artists[4]._id, // Frida Kahlo
      year: "1939",
      medium: "Oil on canvas",
      dimensions: "173.5 cm × 173 cm",
      description:
        "The Two Fridas is a double self-portrait, showing two versions of Frida Kahlo seated together. One is wearing a white European-style Victorian dress while the other is wearing a traditional Tehuana dress. The two Fridas are holding hands, and both have exposed hearts.",
      images: ["/images/artworks/two-fridas.jpg", "/images/artworks/two-fridas-detail.jpg"],
      period: "Surrealism",
      category: "Portrait",
      location: "Museo de Arte Moderno, Mexico City",
      price: null, // Not for sale
      available: false,
      historicalContext:
        "Kahlo painted The Two Fridas shortly after her divorce from Diego Rivera. The painting is believed to express her feelings of abandonment and pain following the separation. The European Frida is the one that Diego rejected, while the traditional Mexican Frida is the one Diego loved.",
    },
    {
      title: "Jimson Weed/White Flower No. 1",
      artist: artists[5]._id, // Georgia O'Keeffe
      year: "1932",
      medium: "Oil on canvas",
      dimensions: "121.9 cm × 101.6 cm",
      description:
        "Jimson Weed/White Flower No. 1 is a 1932 painting by American artist Georgia O'Keeffe. The painting is of a white jimson weed, a common desert plant. O'Keeffe's large-scale depictions of flowers, which she began in the 1920s, are among her most famous works.",
      images: ["/images/artworks/jimson-weed.jpg", "/images/artworks/jimson-weed-detail.jpg"],
      period: "American Modernism",
      category: "Still Life",
      location: "Crystal Bridges Museum of American Art, Arkansas",
      price: null, // Not for sale
      available: false,
      historicalContext:
        "O'Keeffe's large flower paintings represented a significant shift in American art. By magnifying the flowers to fill the canvas, O'Keeffe forced viewers to observe the intricate details they might otherwise overlook. This work exemplifies her unique contribution to American Modernism.",
    },
    {
      title: "The Persistence of Memory",
      artist: artists[6]._id, // Salvador Dalí
      year: "1931",
      medium: "Oil on canvas",
      dimensions: "24 cm × 33 cm",
      description:
        "The Persistence of Memory is a 1931 painting by artist Salvador Dalí, and one of the most recognizable works of Surrealism. First shown at the Julien Levy Gallery in 1932, since 1934 the painting has been in the collection of the Museum of Modern Art (MoMA) in New York City.",
      images: ["/images/artworks/persistence-of-memory.jpg", "/images/artworks/persistence-of-memory-detail.jpg"],
      period: "Surrealism",
      category: "Abstract",
      location: "Museum of Modern Art, New York",
      price: null, // Not for sale
      available: false,
      historicalContext:
        "The Persistence of Memory was created during the height of the Surrealist movement, which sought to release the creative potential of the unconscious mind. Dalí's melting clocks have been interpreted as a rejection of rigid time, possibly influenced by Einstein's Theory of Relativity.",
    },
    {
      title: "The Night Watch",
      artist: artists[7]._id, // Rembrandt
      year: "1642",
      medium: "Oil on canvas",
      dimensions: "363 cm × 437 cm",
      description:
        "The Night Watch is a 1642 painting by Rembrandt van Rijn. It is in the collection of the Amsterdam Museum but is prominently displayed in the Rijksmuseum as the best-known painting in its collection. The Night Watch is one of the most famous Dutch Golden Age paintings.",
      images: ["/images/artworks/night-watch.jpg", "/images/artworks/night-watch-detail.jpg"],
      period: "Baroque",
      category: "Historical",
      location: "Rijksmuseum, Amsterdam",
      price: null, // Not for sale
      available: false,
      historicalContext:
        "The Night Watch was commissioned as a group portrait of a militia company. Unlike the conventional group portraits of the time, which showed subjects posed stiffly in rows, Rembrandt created a dynamic scene full of movement. This innovative approach revolutionized group portraiture.",
    },
    // Contemporary artworks for sale
    {
      title: "Urban Rhythm",
      artist: artists[3]._id, // Pablo Picasso (for example)
      year: "2020",
      medium: "Acrylic on canvas",
      dimensions: "90 cm × 120 cm",
      description:
        "Urban Rhythm is a vibrant contemporary piece that captures the energy and movement of modern city life. Bold brushstrokes and a dynamic color palette create a sense of constant motion and urban vitality.",
      images: ["/images/artworks/urban-rhythm.jpg", "/images/artworks/urban-rhythm-detail.jpg"],
      period: "Contemporary",
      category: "Abstract",
      location: "ARTE Gallery",
      price: 4500,
      available: true,
      historicalContext:
        "This contemporary work draws inspiration from both abstract expressionism and urban art, creating a dialogue between formal artistic traditions and the energy of street art and graffiti.",
    },
    {
      title: "Serenity in Blue",
      artist: artists[2]._id, // Claude Monet (for example)
      year: "2021",
      medium: "Oil on canvas",
      dimensions: "80 cm × 100 cm",
      description:
        "Serenity in Blue is a contemplative seascape that evokes a sense of calm and tranquility. The various shades of blue create depth and movement, inviting the viewer to lose themselves in the peaceful scene.",
      images: ["/images/artworks/serenity-blue.jpg", "/images/artworks/serenity-blue-detail.jpg"],
      period: "Contemporary",
      category: "Landscape",
      location: "ARTE Gallery",
      price: 3800,
      available: true,
      historicalContext:
        "This work continues the long tradition of seascape painting while incorporating contemporary techniques and sensibilities. It reflects our ongoing fascination with the sea as a source of both beauty and contemplation.",
    },
    {
      title: "Digital Dreams",
      artist: artists[6]._id, // Salvador Dalí (for example)
      year: "2022",
      medium: "Digital",
      dimensions: "Variable",
      description:
        "Digital Dreams is a cutting-edge digital artwork that explores the intersection of technology and human consciousness. Using advanced digital techniques, the artist creates a surreal dreamscape that questions our relationship with the digital world.",
      images: ["/images/artworks/digital-dreams.jpg", "/images/artworks/digital-dreams-detail.jpg"],
      period: "Contemporary",
      category: "Digital",
      location: "ARTE Gallery",
      price: 2200,
      available: true,
      historicalContext:
        "As digital art gains recognition in the contemporary art world, works like Digital Dreams represent the evolving nature of artistic expression in the digital age. This piece reflects on how technology shapes our perceptions and experiences.",
    },
    {
      title: "Fragmented Identity",
      artist: artists[4]._id, // Frida Kahlo (for example)
      year: "2019",
      medium: "Mixed media",
      dimensions: "100 cm × 150 cm",
      description:
        "Fragmented Identity is a powerful mixed media work that explores themes of personal and cultural identity in the modern world. Through a combination of traditional and contemporary techniques, the artist creates a multi-layered narrative about belonging and self-discovery.",
      images: ["/images/artworks/fragmented-identity.jpg", "/images/artworks/fragmented-identity-detail.jpg"],
      period: "Contemporary",
      category: "Portrait",
      location: "ARTE Gallery",
      price: 5200,
      available: true,
      historicalContext:
        "This work engages with contemporary discussions about identity, drawing on both personal experience and broader cultural narratives. It reflects the complex nature of identity formation in our globalized, multicultural society.",
    },
    {
      title: "Concrete Jungle",
      artist: artists[5]._id, // Georgia O'Keeffe (for example)
      year: "2020",
      medium: "Photography",
      dimensions: "60 cm × 90 cm",
      description:
        "Concrete Jungle is a striking photographic work that captures the geometric patterns and textures of urban architecture. Through careful composition and lighting, the artist transforms mundane city structures into abstract forms of remarkable beauty.",
      images: ["/images/artworks/concrete-jungle.jpg", "/images/artworks/concrete-jungle-detail.jpg"],
      period: "Contemporary",
      category: "Photography",
      location: "ARTE Gallery",
      price: 1800,
      available: true,
      historicalContext:
        "This work is part of a growing trend in contemporary photography that finds beauty and meaning in urban environments. It continues the tradition of photographers who have documented and interpreted the built environment throughout the 20th and 21st centuries.",
    },
    {
      title: "Ephemeral Moment",
      artist: artists[1]._id, // Vincent van Gogh (for example)
      year: "2021",
      medium: "Watercolor",
      dimensions: "40 cm × 50 cm",
      description:
        "Ephemeral Moment captures a fleeting instant of natural beauty through delicate watercolor techniques. The artist's masterful use of light and color creates a sense of immediacy and presence, inviting the viewer to share in this transient experience.",
      images: ["/images/artworks/ephemeral-moment.jpg", "/images/artworks/ephemeral-moment-detail.jpg"],
      period: "Contemporary",
      category: "Landscape",
      location: "ARTE Gallery",
      price: 2400,
      available: true,
      historicalContext:
        "This work draws on the rich tradition of watercolor painting while addressing contemporary concerns about the fragility of natural beauty in a rapidly changing world. It invites reflection on the value of mindfulness and presence in our fast-paced society.",
    },
    {
      title: "Cultural Tapestry",
      artist: artists[0]._id, // Leonardo da Vinci (for example)
      year: "2022",
      medium: "Textile",
      dimensions: "120 cm × 180 cm",
      description:
        "Cultural Tapestry is an innovative textile work that weaves together diverse cultural motifs and symbols into a unified whole. Through traditional weaving techniques combined with contemporary design, the artist creates a visual metaphor for cultural exchange and harmony.",
      images: ["/images/artworks/cultural-tapestry.jpg", "/images/artworks/cultural-tapestry-detail.jpg"],
      period: "Contemporary",
      category: "Textile",
      location: "ARTE Gallery",
      price: 6800,
      available: true,
      historicalContext:
        "This work is part of a revival of interest in traditional textile arts within contemporary fine art. It engages with important conversations about cultural heritage, appropriation, and exchange in our globalized world.",
    },
    {
      title: "Sustainable Vision",
      artist: artists[7]._id, // Rembrandt (for example)
      year: "2023",
      medium: "Recycled materials",
      dimensions: "150 cm × 200 cm",
      description:
        "Sustainable Vision is an innovative sculpture created entirely from recycled and repurposed materials. The work transforms discarded objects into a thought-provoking statement about consumption, waste, and environmental responsibility.",
      images: ["/images/artworks/sustainable-vision.jpg", "/images/artworks/sustainable-vision-detail.jpg"],
      period: "Contemporary",
      category: "Sculpture",
      location: "ARTE Gallery",
      price: 7500,
      available: true,
      historicalContext:
        "This work is part of a growing movement in contemporary art that addresses environmental concerns through both materials and subject matter. It reflects the urgent need for sustainable practices in all aspects of human activity, including artistic production.",
    },
  ]
}

// Seed function
async function seedDatabase() {
  try {
    // Connect to database
    await connectDB()

    // Clear existing data
    await Artist.deleteMany({})
    await Artwork.deleteMany({})

    console.log("Previous data cleared")

    // Insert artists
    const insertedArtists = await Artist.insertMany(artistsData)
    console.log(`${insertedArtists.length} artists inserted`)

    // Insert artworks
    const artworksData = getArtworksData(insertedArtists)
    const insertedArtworks = await Artwork.insertMany(artworksData)
    console.log(`${insertedArtworks.length} artworks inserted`)

    console.log("Database seeded successfully!")

    // Close connection
    await mongoose.connection.close()
    console.log("Database connection closed")
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()
