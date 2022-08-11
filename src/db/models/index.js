'use strict';

const bcrypt = require('bcrypt')
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};
const force = process.env.FORCE_SYNC_DB || false

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db.init = (db) => {
//   return db.sequelize.sync({ force })
//     .then(async _ => {
//       if (force) {
//         await db.Artist.create({ idArtist: 194, name: 'Various' })

//         let userCreated = await db.User.create({ username: 'admin', password: 'password', role: 'admin' })
//         await userCreated.createCollection()
//         await userCreated.createWishlist()

//         await db.User.create({ username: 'scraping', password: 'sf"r0sjdjb@j323DFS"4vfv', role: 'admin' })

//         userCreated = await db.User.create({ username: 'qbekkai', password: 'qbekkai', email: 'quentinbekkai@gmail.com', phoneNumber: '0615183111', role: 'basic' })
//         await userCreated.createCollection()
//         await userCreated.createWishlist()

//         userCreated = await db.User.create({ username: 'ybenamor', password: 'ybenamor', email: 'benamoyoussef@gmail.com', phoneNumber: '+33645437176', role: 'basic' })
//         await userCreated.createCollection()
//         await userCreated.createWishlist()

//         userCreated = await db.User.create({
//           username: 'morgand',
//           email: 'morgand.mickael@gmail.com',
//           firstName: 'Mickaël',
//           lastName: 'MORGAND',
//           showName: 'Mickaël Morgand',
//           birthDate: '1998-03-24',
//           description: 'My bio test',
//           password: 'morgand',
//           role: 'basic'
//         })
//         await userCreated.createCollection()
//         await userCreated.createWishlist()

//         userCreated = await db.User.create({
//           username: 'kabylou213',
//           email: 'adam.bak82@gmail.com',
//           firstName: 'Adam',
//           lastName: 'BAKIR',
//           showName: 'Kabylou',
//           birthDate: '1996-05-08',
//           description: 'J\'aime Audi et Porsche',
//           password: 'kabylou213',
//           role: 'basic'
//         })
//         await userCreated.createCollection()
//         await userCreated.createWishlist()

//         userCreated = await db.User.create({
//           username: 'kylianrm',
//           email: 'kylian@gmail.com',
//           firstName: 'Kylian',
//           lastName: 'kylane',
//           birthDate: '1998-01-1',
//           note: 3,
//           password: 'kylianrm',
//           role: 'basic'
//         })
//         await userCreated.createCollection()
//         await userCreated.createWishlist()

//         await sequelize.query('INSERT INTO FormatDescriptions(id, name) VALUES (1, "Advance"),(2, "Album"),(3, "Card Backed"),(4, "Club Edition"),(5, "Compilation"),(6, "Deluxe Edition"),(7, "Enhanced"),(8, "EP"),(9, "Etched"),(10, "Gatefold"),(11, "Jukebox"),(12, "Limited Edition"),(13, "Maxi-Single"),(14, "Mini-Album"),(15, "Mispress"), (16, "Misprint"),(17, "Mixed"),(18, "Mixtape"),(19, "Numbered"),(20, "Partially Mixed"),(21, "Partially unofficial"),(22, "Picture Disc"),(23, "Promo"),(24, "Reissue"),(25, "Remastered"),(26, "Repress"),(27, "Sampler"),(28, "Single"),(29, "Special Edition"),(30, "Styrene"),(31, "Test Pressing"),(32, "Transcription"),(33, "Unofficial Release"),(34, "White Label"); ')

//         await sequelize.query('INSERT INTO FormatSides(id, name) VALUES (1, "Single Sided");')

//         await sequelize.query('INSERT INTO FormatSizes(id, name) VALUES (1, "1\\\""),(2, "2\\\""),(3, "3\\\""),(4, "3½\\\""),(5, "4\\\""),(6, "5\\\""),(7, "5½\\\""),(8, "6\\\""),(9, "6½\\\""),(10, "7\\\""),(11, "8\\\""),(12, "9\\\""),(13, "10\\\""),(14, "11\\\""),(15, "12\\\""),(16, "16\\\""),(17, "LP");')

//         await sequelize.query('INSERT INTO FormatSpeeds(id, name) VALUES (1, "33 ⅓ RPM"),(2, "45 RPM"),(3, "78 RPM"),(4, "80 RPM"),(5, "16 ⅔ RPM"),(6, "8 ⅓ RPM");')

//         await sequelize.query('INSERT INTO FormatVoices(id, name) VALUES (1, "Stereo"),(2, "Mono"),(3, "Ambisonic"),(4, "Quadraphonic");')


//         await sequelize.query('INSERT INTO Genres(id, name) VALUES (1, "Blues"), (2, "Brass & Military"), (3, "Children\'s"), (4, "Classical"), (5, "Electronic"), (6, "Folk, World, & Country"), (7, "Funk / Soul"), (8, "Hip-Hop"), (9, "Jazz"), (10, "Latin"), (11, "Non-Music"), (12, "Pop"), (13, "Reggae"), (14, "Rock"), (15, "Stage & Screen");')

//         await sequelize.query('INSERT INTO Styles(name, GenreId) VALUES ("Boogie Woogie", 1),("Chicago Blues", 1),("Country Blues", 1),("Delta Blues", 1),("East Coast Blues", 1),("Electric Blues", 1),("Harmonica Blues", 1),("Hill Country Blues", 1),("Jump Blues", 1),("Louisiana Blues", 1),("Memphis Blues", 1),("Modern Electric Blues", 1),("Piano Blues", 1),("Piedmont Blues", 1),("Rhythm & Blues", 1),("Texas Blues", 1),("Brass Band", 2),("Marches", 2),("Military", 2),("Pipe & Drum", 2),("Educational", 3),("Nursery Rhymes", 3),("Story", 3),("Baroque", 4),("Choral", 4),("Classical", 4),("Contemporary", 4),("Early", 4),("Impressionist", 4),("Medieval", 4),("Modern", 4),("Neo-Classical", 4),("Neo-Romantic", 4),("Opera", 4),("Operetta", 4),("Oratorio", 4),("Post-Modern", 4),("Renaissance", 4),("Romantic", 4),("Serial", 4),("Twelve-tone", 4),("Zarzuela", 4),("Abstract", 5),("Acid", 5),("Acid House", 5),("Acid Jazz", 5),("Ambient", 5),("Ballroom", 5),("Baltimore Club", 5),("Bassline", 5),("Beatdown", 5),("Berlin-School", 5),("Big Beat", 5),("Bleep", 5),("Breakbeat", 5),("Breakcore", 5),("Breaks", 5),("Broken Beat", 5),("Chillwave", 5),("Chiptune", 5),("Dance-pop", 5),("Dark Ambient", 5),("Darkwave", 5),("Deep House", 5),("Deep Techno", 5),("Disco", 5),("Disco Polo", 5),("Donk", 5),("Doomcore", 5),("Downtempo", 5),("Drone", 5),("Drum n Bass", 5),("Dub", 5),("Dub Techno", 5),("Dubstep", 5),("Dungeon Synth", 5),("EBM", 5),("Electro", 5),("Electro House", 5),("Electro Swing", 5),("Electroacoustic", 5),("Electroclash", 5),("Euro House", 5),("Euro-Disco", 5),("Eurobeat", 5),("Eurodance", 5),("Experimental", 5),("Footwork", 5),("Freestyle", 5),("Funkot", 5),("Future Jazz", 5),("Gabber", 5),("Garage House", 5),("Ghetto", 5),("Ghetto House", 5),("Ghettotech", 5),("Glitch", 5),("Glitch Hop", 5),("Goa Trance", 5),("Grime", 5),("Halftime", 5),("Hands Up", 5),("Happy Hardcore", 5),("Hard Beat", 5),("Hard House", 5),("Hard Techno", 5),("Hard Trance", 5),("Hardcore", 5),("Hardstyle", 5),("Harsh Noise Wall", 5),("Hi NRG", 5),("Hip Hop", 5),("Hip-House", 5),("House", 5),("IDM", 5),("Illbient", 5),("Industrial", 5),("Italo House", 5),("Italo-Disco", 5),("Italodance", 5),("J-Core", 5),("Jazzdance", 5),("Jersey Club", 5),("Juke", 5),("Jumpstyle", 5),("Jungle", 5),("Latin", 5),("Leftfield", 5),("Lento Violento", 5),("Makina", 5),("Minimal", 5),("Minimal Techno", 5),("Modern Classical", 5),("Moombahton", 5),("Musique Concrète", 5),("Neo Trance", 5),("Neofolk", 5),("Nerdcore Techno", 5),("New Age", 5),("New Beat", 5),("New Wave", 5),("Noise", 5),("Nu-Disco", 5),("Power Electronics", 5),("Progressive Breaks", 5),("Progressive House", 5),("Progressive Trance", 5),("Psy-Trance", 5),("Rhythmic Noise", 5),("Schranz", 5),("Skweee", 5),("Sound Collage", 5),("Speed Garage", 5),("Speedcore", 5),("Synth-pop", 5),("Synthwave", 5),("Tech House", 5),("Tech Trance", 5),("Techno", 5),("Trance", 5),("Tribal", 5),("Tribal House", 5),("Trip Hop", 5),("Tropical House", 5),("UK Funky", 5),("UK Garage", 5),("Vaporwave", 5),("Witch House", 5),("Aboriginal", 6),("African", 6),("Andalusian Classical", 6),("Andean Music", 6),("Appalachian Music", 6),("Bangladeshi Classical", 6),("Basque Music", 6),("Bengali Music", 6),("Bhangra", 6),("Bluegrass", 6),("Cajun", 6),("Cambodian Classical", 6),("Canzone Napoletana", 6),("Carnatic", 6),("Catalan Music", 6),("Celtic", 6),("Chacarera", 6),("Chamamé", 6),("Chinese Classical", 6),("Chutney", 6),("Cobla", 6),("Copla", 6),("Country", 6),("Cretan", 6),("Dangdut", 6),("Fado", 6),("Filk", 6),("Flamenco", 6),("Folk", 6),("Funaná", 6),("Gagaku", 6),("Galician Traditional", 6),("Gamelan", 6),("Ghazal", 6),("Gospel", 6),("Griot", 6),("Guarania", 6),("Gwo Ka", 6),("Għana", 6),("Hawaiian", 6),("Highlife", 6),("Hillbilly", 6),("Hindustani", 6),("Honky Tonk", 6),("Huayno", 6),("Indian Classical", 6),("Jota", 6),("Jug Band", 6),("Kaseko", 6),("Keroncong", 6),("Kizomba", 6),("Klasik", 6),("Klezmer", 6),("Korean Court Music", 6),("Lao Music", 6),("Laïkó", 6),("Liscio", 6),("Luk Krung", 6),("Luk Thung", 6),("Maloya", 6),("Mbalax", 6),("Min\'yō", 6),("Mizrahi", 6),("Mo Lam", 6),("Morna", 6),("Mouth Music", 6),("Mugham", 6),("Nhạc Vàng", 6),("Nordic", 6),("Népzene", 6),("Ottoman Classical", 6),("Overtone Singing", 6),("Pacific", 6),("Pasodoble", 6),("Persian Classical", 6),("Philippine Classical", 6),("Phleng Phuea Chiwit", 6),("Piobaireachd", 6),("Polka", 6),("Progressive Bluegrass", 6),("Qawwali", 6),("Raï", 6),("Rebetiko", 6),("Romani", 6),("Rune Singing", 6),("Salegy", 6),("Sea Shanties", 6),("Sephardic", 6),("Soukous", 6),("Sámi Music", 6),("Séga", 6),("Taarab", 6),("Tamil Film Music", 6),("Thai Classical", 6),("Volksmusik", 6),("Waiata", 6),("Western Swing", 6),("Yemenite Jewish", 6),("Zamba", 6),("Zemer Ivri", 6),("Zouk", 6),("Zydeco", 6),("Éntekhno", 6),("Afrobeat", 7),("Bayou Funk", 7),("Boogie", 7),("Contemporary R & B", 7),("Disco", 7),("Free Funk", 7),("Funk", 7),("Gogo", 7),("Gospel", 7),("Minneapolis Sound", 7),("Neo Soul", 7),("New Jack Swing", 7),("P.Funk", 7),("Psychedelic", 7),("Rhythm & Blues", 7),("Soul", 7),("Swingbeat", 7),("UK Street Soul", 7),("Bass Music", 8),("Beatbox", 8),("Bongo Flava", 8),("Boom Bap", 8),("Bounce", 8),("Britcore", 8),("Cloud Rap", 8),("Conscious", 8),("Crunk", 8),("Cut-up / DJ", 8),("DJ Battle Tool", 8),("Electro", 8),("Favela Funk", 8),("G-Funk", 8),("Gangsta", 8),("Go-Go", 8),("Grime", 8),("Hardcore Hip-Hop", 8),("Hiplife", 8),("Horrorcore", 8),("Hyphy", 8),("Instrumental", 8),("Jazzy Hip-Hop", 8),("Kwaito", 8),("Miami Bass", 8),("Motswako", 8),("Phonk", 8),("Pop Rap", 8),("Ragga HipHop", 8),("RnB / Swing", 8),("Screw", 8),("Spaza", 8),("Thug Rap", 8),("Trap", 8),("Trip Hop", 8),("Turntablism", 8),("Afro-Cuban Jazz", 9),("Afrobeat", 9),("Avant-garde Jazz", 9),("Big Band", 9),("Bop", 9),("Bossa Nova", 9),("Cape Jazz", 9),("Contemporary Jazz", 9),("Cool Jazz", 9),("Dark Jazz", 9),("Dixieland", 9),("Free Improvisation", 9),("Free Jazz", 9),("Fusion", 9),("Gypsy Jazz", 9),("Hard Bop", 9),("Jazz-Funk", 9),("Jazz-Rock", 9),("Latin Jazz", 9),("Modal", 9),("Post Bop", 9),("Ragtime", 9),("Smooth Jazz", 9),("Soul-Jazz", 9),("Space-Age", 9),("Stride", 9),("Swing", 9),("Afro-Cuban", 10),("Aguinaldo", 10),("Axé", 10),("Bachata", 10),("Baião", 10),("Bambuco", 10),("Batucada", 10),("Beguine", 10),("Bolero", 10),("Bomba", 10),("Boogaloo", 10),("Bossanova", 10),("Candombe", 10),("Carimbó", 10),("Cha-Cha", 10),("Champeta", 10),("Charanga", 10),("Choro", 10),("Compas", 10),("Conjunto", 10),("Corrido", 10),("Cuatro", 10),("Cubano", 10),("Cumbia", 10),("Danzon", 10),("Descarga", 10),("Forró", 10),("Gaita", 10),("Guaguancó", 10),("Guajira", 10),("Guaracha", 10),("Jibaro", 10),("Joropo", 10),("Lambada", 10),("MPB", 10),("Mambo", 10),("Marcha Carnavalesca", 10),("Mariachi", 10),("Marimba", 10),("Merengue", 10),("Musette", 10),("Música Criolla", 10),("Norteño", 10),("Nueva Cancion", 10),("Nueva Trova", 10),("Occitan", 10),("Pachanga", 10),("Plena", 10),("Porro", 10),("Quechua", 10),("Ranchera", 10),("Reggaeton", 10),("Rumba", 10),("Salsa", 10),("Samba", 10),("Samba-Canção", 10),("Seresta", 10),("Son", 10),("Son Montuno", 10),("Sonero", 10),("Tango", 10),("Tejano", 10),("Timba", 10),("Trova", 10),("Vallenato", 10),("Audiobook", 11),("Comedy", 11),("Dialogue", 11),("Education", 11),("Erotic", 11),("Field Recording", 11),("Health-Fitness", 11),("Interview", 11),("Monolog", 11),("Movie Effects", 11),("Poetry", 11),("Political", 11),("Promotional", 11),("Public Broadcast", 11),("Public Service Announcement", 11),("Radioplay", 11),("Religious", 11),("Sermon", 11),("Sound Art", 11),("Sound Poetry", 11),("Special Effects", 11),("Speech", 11),("Spoken Word", 11),("Technical", 11),("Therapy", 11),("Ballad",12),("Barbershop",12),("Bollywood",12),("Break-In",12),("Bubblegum",12),("Cantopop",12),("Chanson",12),("City Pop",12),("Enka",12),("Ethno-pop",12),("Europop",12),("Hokkien Pop",12),("Indie Pop",12),("Indo-Pop",12),("J-pop",12),("K-pop",12),("Karaoke",12),("Kayōkyoku",12),("Levenslied",12),("Light Music",12),("Mandopop",12),("Music Hall",12),("Novelty",12),("Néo Kyma",12),("Parody",12),("Ryūkōka",12),("Schlager",12),("Villancicos",12),("Vocal",12),("Azonto", 13),("Bubbling", 13),("Calypso", 13),("Dancehall", 13),("Dub", 13),("Dub Poetry", 13),("Junkanoo", 13),("Lovers Rock", 13),("Mento", 13),("Ragga", 13),("Rapso", 13),("Reggae", 13),("Reggae Gospel", 13),("Reggae-Pop", 13),("Rocksteady", 13),("Roots Reggae", 13),("Ska", 13),("Soca", 13),("Steel Band", 13),("AOR", 14),("Acid Rock", 14),("Acoustic", 14),("Alternative Rock", 14),("Arena Rock", 14),("Art Rock", 14),("Atmospheric Black Metal", 14),("Avantgarde", 14),("Beat", 14),("Black Metal", 14),("Blues Rock", 14),("Brit Pop", 14),("Classic Rock", 14),("Coldwave", 14),("Country Rock", 14),("Crust", 14),("Death Metal", 14),("Deathcore", 14),("Deathrock", 14),("Depressive Black Metal", 14),("Doo Wop", 14),("Doom Metal", 14),("Dream Pop", 14),("Emo", 14),("Ethereal", 14),("Experimental", 14),("Folk Metal", 14),("Folk Rock", 14),("Funeral Doom Metal", 14),("Funk Metal", 14),("Garage Rock", 14),("Glam", 14),("Goregrind", 14),("Goth Rock", 14),("Gothic Metal", 14),("Grindcore", 14),("Groove Metal", 14),("Grunge", 14),("Hard Rock", 14),("Hardcore", 14),("Heavy Metal", 14),("Horror Rock", 14),("Indie Rock", 14),("Industrial", 14),("Industrial Metal", 14),("J-Rock", 14),("Jangle Pop", 14),("K-Rock", 14),("Krautrock", 14),("Lo-Fi", 14),("Lounge", 14),("Math Rock", 14),("Melodic Death Metal", 14),("Melodic Hardcore", 14),("Metalcore", 14),("Mod", 14),("NDW", 14),("Neofolk", 14),("New Wave", 14),("No Wave", 14),("Noise", 14),("Noisecore", 14),("Nu Metal", 14),("Oi", 14),("Parody", 14),("Pop Punk", 14),("Pop Rock", 14),("Pornogrind", 14),("Post Rock", 14),("Post-Hardcore", 14),("Post-Metal", 14),("Post-Punk", 14),("Power Metal", 14),("Power Pop", 14),("Power Violence", 14),("Prog Rock", 14),("Progressive Metal", 14),("Psychedelic Rock", 14),("Psychobilly", 14),("Pub Rock", 14),("Punk", 14),("Rock & Roll", 14),("Rock Opera", 14),("Rockabilly", 14),("Shoegaze", 14),("Ska", 14),("Skiffle", 14),("Sludge Metal", 14),("Soft Rock", 14),("Southern Rock", 14),("Space Rock", 14),("Speed Metal", 14),("Stoner Rock", 14),("Surf", 14),("Swamp Pop", 14),("Symphonic Metal", 14),("Symphonic Rock", 14),("Technical Death Metal", 14),("Thrash", 14),("Twist", 14),("Viking Metal", 14),("Yé-Yé", 14),("Cabaret", 15),("Musical", 15),("Score", 15),("Soundtrack", 15),("Theme", 15),("Vaudeville", 15),("Video Game Music", 15);')
//         // const article = {
//         //   title: "Bohemian Rhapsody",
//         //   country: "Belgium",
//         //   released_year: 1975,
//         //   artist: { name: "Queen" },
//         //   label: { name: "EMI" },
//         //   genre: { name: "rock" },
//         //   style: [
//         //     { name: "pop rock" },
//         //   ],
//         //   format: { name: "vynil" },
//         //   subformat: [
//         //     { name: "7\"" },
//         //     { name: "45 RPM" },
//         //     { name: "Single" },
//         //     { name: "Stereo" }
//         //   ]
//         // }
//         // const ArticleCreated = await db.Article.create(article)
//         // const FormatCreated = await db.Format.create(article.format)
//         // const GenreCreated = await db.Genre.create(article.genre)
//         // const StyleCreated = await db.Style.create(article.style[0])
//         // const SubformatCreated = await db.SubFormat.create(article.subformat[0])
//         // const SubformatCreated1 = await db.SubFormat.create(article.subformat[1])
//         // const SubformatCreated2 = await db.SubFormat.create(article.subformat[2])
//         // const SubformatCreated3 = await db.SubFormat.create(article.subformat[3])

//         // await ArticleCreated.createArtist(article.artist)
//         // await ArticleCreated.createLabel(article.label)
//         // await GenreCreated.addArticle(ArticleCreated)
//         // await FormatCreated.addArticle(ArticleCreated)
//         // await ArticleCreated.addStyles([StyleCreated])
//         // await ArticleCreated.addSubFormats([SubformatCreated, SubformatCreated2, SubformatCreated3])

//         // await FormatCreated.addSubFormats([SubformatCreated, SubformatCreated1, SubformatCreated2, SubformatCreated3])


//         // const releases = [2911293, 763889, 939963, 1251143, 39303]
//       }

//       console.log('Sync DB : OK')
//     })
//     .catch(err => console.log(`Sync DB : ERROR \n ${err}`))
// }

module.exports = db;
