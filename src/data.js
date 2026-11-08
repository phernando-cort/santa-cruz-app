// Datos de la app parroquial — todo el contenido devocional/boletines/noticias es original.
// Oraciones tradicionales y cantos antiguos: textos tradicionales de dominio público.
// Citas bíblicas en español: Reina-Valera 1909 (dominio público).

export const PARISHES = [
  {
    id: "santa-cruz",
    name: "Santa Cruz de la Cañada",
    city: "Santa Cruz, NM",
    address: "1332 Holy Cross St, Española, NM 87532",
    phone: "(505) 753-3345",
    web: "https://www.hcccsantacruz.org",
    priest: "Rev Father Hernando Cortes, SF",
    greeting: "Iglesia histórica del norte de Nuevo México. ¡Bienvenidos a casa!",
    massTimes: {
      Sunday: ["7:00 AM", "8:30 AM (Español)", "10:30 AM (en vivo)", "12:30 PM", "6:00 PM"],
      Saturday: ["5:30 PM (Vigilia)"],
      Daily: ["Lun–Mié · 7:00 AM y 6:00 PM", "Jue · no hay Misas", "Vie · 7:00 AM"]
    },
    confession: "Sáb 4:00 PM y con cita",
    adoration: "1er viernes 7:30 AM–4 PM · Rosario diario antes de Misa",
    accent: "#8a2f2f"
  },
  {
    id: "santo-nino",
    name: "Capilla del Santo Niño de Atocha",
    city: "Española, NM",
    address: "Misión de Santa Cruz de la Cañada",
    phone: "(505) 753-3345",
    web: "https://www.hcccsantacruz.org",
    priest: "Rev Father Hernando Cortes, SF",
    greeting: "Capilla misión al servicio de Española.",
    massTimes: {
      Sunday: ["Ver boletín"],
      Saturday: ["Ver boletín"],
      Daily: ["Ver boletín"]
    },
    confession: "Ver boletín",
    adoration: "Ver boletín",
    accent: "#2f6db9"
  },
  {
    id: "san-isidro",
    name: "Capilla de San Isidro",
    city: "La Mesilla, NM",
    address: "Misión de Santa Cruz de la Cañada",
    phone: "(505) 753-3345",
    web: "https://www.hcccsantacruz.org",
    priest: "Rev Father Hernando Cortes, SF",
    greeting: "Capilla misión al servicio de La Mesilla.",
    massTimes: {
      Sunday: ["Ver boletín"],
      Saturday: ["Ver boletín"],
      Daily: ["Ver boletín"]
    },
    confession: "Ver boletín",
    adoration: "Ver boletín",
    accent: "#3d7a52"
  }
];

export const WEEK = [
  {
    key: "sun", weekday: "Domingo", feast: "Día del Señor", rank: "Solemnidad",
    color: "blanco", season: "Tiempo Ordinario",
    citations: { first: "Hch 2:1–11", psalm: "Sal 104", second: "1 Cor 12:3–13", gospel: "Jn 20:19–23" },
    verse: { ref: "Salmo 104:30 (RVR1909)", text: "Envías tu espíritu, son creados: y renuevas la haz de la tierra." },
    reflectionTitle: "El Aliento que reconstruye",
    reflection: "Pentecostés no es un recuerdo sino una misión. El mismo Espíritu que llenó el cenáculo llena hoy el salón parroquial, la cocina y la sala del hospital. Pregunta hoy: ¿dónde necesita aliento mi parroquia? Y ve a estar allí."
  },
  {
    key: "mon", weekday: "Lunes", feast: "María, Madre de la Iglesia", rank: "Memoria",
    color: "blanco", season: "Tiempo Ordinario",
    citations: { first: "Gén 3:9–20", psalm: "Sal 87", second: "—", gospel: "Jn 19:25–34" },
    verse: { ref: "Juan 19:27 (RVR1909)", text: "Después dijo al discípulo: He ahí tu madre." },
    reflectionTitle: "Madre recibida dos veces",
    reflection: "En la cruz, María recibió una segunda maternidad: sobre cada discípulo. La parroquia es donde ese regalo se vuelve concreto: comidas, visitas, compañía. Si recibiste una madre, sé hoy hermano o hermana."
  },
  {
    key: "tue", weekday: "Martes", feast: "Feria", rank: "Ferial",
    color: "verde", season: "Tiempo Ordinario",
    citations: { first: "Sant 4:1–10", psalm: "Sal 55", second: "—", gospel: "Mc 9:30–37" },
    verse: { ref: "Santiago 4:8 (RVR1909)", text: "Acercaos á Dios, y él se acercará á vosotros." },
    reflectionTitle: "La aritmética de la cercanía",
    reflection: "Santiago lo escribe como física: acércate a Dios y Dios se acerca a ti. Diez minutos de silencio, una confesión honesta, una deuda perdonada: los pasos pequeños valen doble en el Reino."
  },
  {
    key: "wed", weekday: "Miércoles", feast: "San Carlos Lwanga y compañeros", rank: "Memoria",
    color: "rojo", season: "Tiempo Ordinario",
    citations: { first: "1 Jn 5:1–5", psalm: "Sal 124", second: "—", gospel: "Mt 10:17–22" },
    verse: { ref: "Mateo 10:22 (RVR1909)", text: "El que perseverare hasta el fin, éste será salvo." },
    reflectionTitle: "Jóvenes, valientes, alegres",
    reflection: "Los mártires de Uganda eran casi todos adolescentes. La valentía no es ausencia de miedo sino presencia de amor. Reza hoy por los jóvenes de tu parroquia que deciden cosas difíciles."
  },
  {
    key: "thu", weekday: "Jueves", feast: "Jueves eucarístico", rank: "Ferial",
    color: "verde", season: "Tiempo Ordinario",
    citations: { first: "Sant 5:1–6", psalm: "Sal 49", second: "—", gospel: "Mc 9:41–50" },
    verse: { ref: "Marcos 9:50 (RVR1909)", text: "Tened sal en vosotros mismos, y tened paz los unos con los otros." },
    reflectionTitle: "La sal se gasta sazonando",
    reflection: "La sal solo sazona lo que toca. Una parroquia encerrada en su templo pierde su sabor. Si puedes, visita la adoración el jueves; y lleva después esa calma a un lugar ruidoso."
  },
  {
    key: "fri", weekday: "Viernes", feast: "Sagrado Corazón de Jesús", rank: "Solemnidad",
    color: "blanco", season: "Tiempo Ordinario",
    citations: { first: "Ez 34:11–16", psalm: "Sal 23", second: "Rom 5:5–11", gospel: "Lc 15:3–7" },
    verse: { ref: "Romanos 5:8 (RVR1909)", text: "Mas Dios encarece su caridad para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros." },
    reflectionTitle: "El Corazón que busca",
    reflection: "El Sagrado Corazón no es el afecto de Dios por los buenos: es su partida de búsqueda por los perdidos. Si te has alejado, esta es la fiesta que te dice: tú eres aquel a quien vino a buscar."
  },
  {
    key: "sat", weekday: "Sábado", feast: "Inmaculado Corazón de María", rank: "Memoria",
    color: "blanco", season: "Tiempo Ordinario",
    citations: { first: "Is 61:9–11", psalm: "1 Sam 2", second: "—", gospel: "Lc 2:41–51" },
    verse: { ref: "Lucas 2:51 (RVR1909)", text: "Y su madre guardaba todas estas cosas en su corazón." },
    reflectionTitle: "Guardar en el corazón",
    reflection: "El modo de María ante el misterio no era resolverlo sino guardarlo. Lleva esta noche a la oración una pregunta sin respuesta. No necesitas una solución: necesitas un lugar donde guardarla. Su corazón tiene sitio."
  }
];

export const INSPIRATIONS = [
  { day: "Hoy", title: "Empieza con silencio", body: "Antes de las notificaciones, antes de las noticias: treinta segundos con la Señal de la Cruz y un Padrenuestro despacio. El día puede esperar. El Cielo está deseando encontrarte.", tag: "Mañana" },
  { day: "Hoy", title: "Lleva un nombre contigo", body: "Escribe hoy un nombre en tu mano: alguien que necesite oración. Cada vez que lo veas, reza un Avemaría. Al anochecer habrás rezado un rosario sin darte cuenta.", tag: "Práctica" },
  { day: "Archivo", title: "El ministerio del banco", body: "Siéntate cerca de los recién llegados. Aprende un nombre cada domingo. Las parroquias no crecen primero con programas, sino con nombres recordados.", tag: "Comunidad" },
  { day: "Archivo", title: "La confesión es un reinicio, no un informe", body: "No vas a enumerar fracasos; vas a ser encontrado. Sábado 3:30 PM. Diez minutos. Saldrás más ligero de lo que entraste.", tag: "Misericordia" },
  { day: "Archivo", title: "Adoración a mediodía", body: "Doce minutos en una capilla silenciosa valen más que una hora de pantalla. No lleves nada más que tu cansancio. Él pidió tu compañía, no tu rendimiento.", tag: "Oración" }
];

export const PRAYERS = [
  { id: "padrenuestro", name: "Padrenuestro", category: "Esenciales", latin: "Pater Noster",
    text: "Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén." },
  { id: "avemaria", name: "Avemaría", category: "Esenciales", latin: "Ave Maria",
    text: "Dios te salve, María, llena eres de gracia; el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén." },
  { id: "gloria", name: "Gloria", category: "Esenciales", latin: "Gloria Patri",
    text: "Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén." },
  { id: "credo-apostoles", name: "Credo de los Apóstoles", category: "Credos", latin: "Symbolum Apostolorum",
    text: "Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado. Descendió a los infiernos. Al tercer día resucitó de entre los muertos. Subió a los cielos, y está sentado a la derecha de Dios, Padre todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos. Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén." },
  { id: "credo-niceno", name: "Credo Niceno", category: "Credos", latin: "Credo",
    text: "Creo en un solo Dios, Padre todopoderoso, Creador del cielo y de la tierra, de todo lo visible y lo invisible. Creo en un solo Señor, Jesucristo, Hijo único de Dios, nacido del Padre antes de todos los siglos: Dios de Dios, Luz de Luz, Dios verdadero de Dios verdadero, engendrado, no creado, de la misma naturaleza del Padre, por quien todo fue hecho; que por nosotros, los hombres, y por nuestra salvación bajó del cielo, y por obra del Espíritu Santo se encarnó de María, la Virgen, y se hizo hombre; y por nuestra causa fue crucificado en tiempos de Poncio Pilato, padeció y fue sepultado, y resucitó al tercer día según las Escrituras, y subió al cielo, y está sentado a la derecha del Padre; y de nuevo vendrá con gloria para juzgar a vivos y muertos, y su reino no tendrá fin. Creo en el Espíritu Santo, Señor y dador de vida, que procede del Padre y del Hijo, que con el Padre y el Hijo recibe una misma adoración y gloria, y que habló por los profetas. Creo en la Iglesia, que es una, santa, católica y apostólica. Confieso que hay un solo bautismo para el perdón de los pecados. Espero la resurrección de los muertos y la vida del mundo futuro. Amén." },
  { id: "acto-contricion", name: "Acto de contrición", category: "Misericordia", latin: null,
    text: "Dios mío, me arrepiento de todo corazón de haberos ofendido, y detesto todos mis pecados por el temor de vuestros justos castigos, pero mucho más porque os ofenden a Vos, Dios mío, que sois todo bueno y digno de todo mi amor. Propongo firmemente, con la ayuda de vuestra gracia, no pecar más y evitar las ocasiones de pecado. Amén." },
  { id: "acordaos", name: "Acordaos (Memorare)", category: "María", latin: null,
    text: "Acordaos, ¡oh piadosísima Virgen María!, que jamás se ha oído decir que ninguno de los que han acudido a vuestra protección, implorando vuestro auxilio, haya sido desamparado. Animado por esta confianza, a Vos acudo, oh Madre, Virgen de las vírgenes, y gimiendo bajo el peso de mis pecados me atrevo a comparecer ante Vos. Oh Madre del Verbo, no despreciéis mis súplicas, antes bien, escuchadlas y acogedlas benignamente. Amén." },
  { id: "angelus", name: "El Ángelus", category: "María", latin: null,
    text: "V. El Ángel del Señor anunció a María. R. Y concibió por obra del Espíritu Santo. Dios te salve, María… V. He aquí la esclava del Señor. R. Hágase en mí según tu palabra. Dios te salve, María… V. Y el Verbo se hizo carne. R. Y habitó entre nosotros. Dios te salve, María… V. Ruega por nosotros, santa Madre de Dios. R. Para que seamos dignos de las promesas de Cristo. Oremos: Infunde, Señor, tu gracia en nuestras almas, para que los que hemos conocido por el anuncio del Ángel la Encarnación de tu Hijo Jesucristo, por su Pasión y su Cruz alcancemos la gloria de la Resurrección. Por el mismo Cristo nuestro Señor. Amén." },
  { id: "san-miguel", name: "Oración a San Miguel", category: "Santos", latin: null,
    text: "San Miguel Arcángel, defiéndenos en la batalla. Sé nuestro amparo contra la perversidad y las acechanzas del demonio. Reprímale Dios, pedimos suplicantes, y tú, Príncipe de la milicia celestial, arroja al infierno con el divino poder a Satanás y a los demás espíritus malignos que andan dispersos por el mundo para la perdición de las almas. Amén." },
  { id: "angel-guarda", name: "Ángel de mi guarda", category: "Santos", latin: null,
    text: "Ángel de mi guarda, dulce compañía, no me desampares ni de noche ni de día. No me dejes solo, que me perdería. Amén." },
  { id: "ven-espiritu", name: "Ven, Espíritu Santo", category: "Liturgia", latin: "Veni Sancte Spiritus",
    text: "Ven, Espíritu Santo, llena los corazones de tus fieles y enciende en ellos el fuego de tu amor. Envía tu Espíritu y serán creados, y renovarás la faz de la tierra. Oh Dios, que instruiste los corazones de los fieles con la luz del Espíritu Santo, concédenos que animados por ese mismo Espíritu sepamos obrar rectamente y gocemos siempre de su consuelo. Por Cristo nuestro Señor. Amén." },
  { id: "alma-cristo", name: "Alma de Cristo", category: "Liturgia", latin: null,
    text: "Alma de Cristo, santifícame. Cuerpo de Cristo, sálvame. Sangre de Cristo, embriágame. Agua del costado de Cristo, lávame. Pasión de Cristo, confórtame. ¡Oh buen Jesús, óyeme! Dentro de tus llagas, escóndeme. No permitas que me aparte de Ti. Del enemigo malo, defiéndeme. En la hora de mi muerte, llámame, y mándame ir a Ti, para que con tus santos te alabe por los siglos de los siglos. Amén." },
  { id: "coronilla-corta", name: "Coronilla de la Divina Misericordia (forma breve)", category: "Coronillas", latin: null,
    text: "En las cuentas grandes: Padre Eterno, te ofrezco el Cuerpo y la Sangre, el Alma y la Divinidad de tu amadísimo Hijo, nuestro Señor Jesucristo, como propiciación de nuestros pecados y los del mundo entero. En las cuentas pequeñas (10 veces): Por su dolorosa Pasión, ten misericordia de nosotros y del mundo entero. Al final (3 veces): Santo Dios, Santo Fuerte, Santo Inmortal, ten piedad de nosotros y del mundo entero." },
  { id: "guia-rosario", name: "Cómo rezar el Rosario", category: "Coronillas", latin: null,
    text: "1. Señal de la Cruz y Credo. 2. Padrenuestro, tres Avemarías (fe, esperanza y caridad) y Gloria. 3. En cada misterio: anuncio, Padrenuestro, diez Avemarías, Gloria y la jaculatoria de Fátima. Misterios gozosos (lun/sáb): Anunciación, Visitación, Nacimiento, Presentación, Niño perdido y hallado. Dolorosos (mar/vie): Oración en el huerto, Flagelación, Coronación de espinas, Cruz a cuestas, Crucifixión. Gloriosos (mié/dom): Resurrección, Ascensión, Venida del Espíritu Santo, Asunción, Coronación de María. Luminosos (jue): Bautismo, Bodas de Caná, Anuncio del Reino, Transfiguración, Eucaristía." },
  { id: "bendicion-mesa", name: "Bendición de la mesa", category: "Diaria", latin: null,
    text: "Bendícenos, Señor, y bendice estos alimentos que por tu bondad vamos a tomar. Por Cristo nuestro Señor. Amén." },
  { id: "oracion-noche", name: "Oración de la noche", category: "Diaria", latin: null,
    text: "Dios mío, al terminar este día te doy gracias por cada gracia. Te ofrezco mi trabajo, mis alegrías y mis sufrimientos. Perdona mis faltas, cuida a mi familia y a mi parroquia mientras dormimos, y llévanos con bien a un nuevo amanecer. Amén." },
  { id: "regina-coeli", name: "Reina del cielo (Regina Coeli)", category: "María", latin: "Regina Caeli",
    text: "Reina del cielo, alégrate, aleluya, porque el Señor, a quien llevaste en tu seno, aleluya, ha resucitado según su palabra, aleluya. Ruega al Señor por nosotros, aleluya. Alégrate y gózate, Virgen María, aleluya, porque verdaderamente ha resucitado el Señor, aleluya. Oremos: Oh Dios, que por la resurrección de tu Hijo, nuestro Señor Jesucristo, has llenado el mundo de alegría, concédenos, por intercesión de su Madre, la Virgen María, llegar a los gozos eternos. Por el mismo Cristo nuestro Señor. Amén." },
  { id: "magnificat", name: "Magnificat", category: "María", latin: "Magnificat",
    text: "Proclama mi alma la grandeza del Señor, se alegra mi espíritu en Dios, mi salvador; porque ha mirado la humillación de su esclava. Desde ahora me felicitarán todas las generaciones, porque el Poderoso ha hecho obras grandes por mí: su nombre es santo, y su misericordia llega a sus fieles de generación en generación. Él hace proezas con su brazo: dispersa a los soberbios de corazón, derriba del trono a los poderosos y enaltece a los humildes, a los hambrientos los colma de bienes y a los ricos los despide vacíos. Auxilia a Israel, su siervo, acordándose de la misericordia, como lo había prometido a nuestros padres, en favor de Abrahán y su descendencia por siempre. Amén." },
  { id: "oracion-san-jose", name: "Oración a San José", category: "Santos", latin: null,
    text: "Oh glorioso San José, custodio de Jesús y esposo de María, a ti acudimos con confianza. Alcánzanos de tu Hijo adoptivo la gracia de vivir y morir santamente, cuida a nuestra parroquia como cuidaste a la Sagrada Familia, protege a los padres, a los trabajadores y a los moribundos. San José, ruega por nosotros. Amén." },
  { id: "oracion-familia", name: "Oración a la Sagrada Familia", category: "Sagrada Familia", latin: null,
    text: "Jesús, María y José, Sagrada Familia de Nazaret, hoy los contemplamos con admiración y confianza: en ustedes vemos el amor que nos salva. Jesús, enséñanos a obedecer y amar; María, enséñanos a guardar todo en el corazón; José, enséñanos a trabajar y custodiar. Bendigan nuestros hogares, unan a nuestras familias y guíen a nuestra parroquia. Sagrada Familia, ruega por nosotros. Amén." },
  { id: "oracion-congregacion", name: "Oración diaria por la Congregación", category: "Sagrada Familia", latin: null,
    text: "Sagrada Familia de Nazaret, Jesús, María y José, bendigan a los Hijos de la Sagrada Familia. Concédeles santidad de vida, celo por las almas y fidelidad a su vocación. Sostengan a los ancianos y enfermos de la Congregación, guíen a los que se forman y acompañen a los que sirven en esta parroquia. Que nunca falten obreros para tu mies, Señor. Amén." },
  { id: "oracion-vocaciones", name: "Oración por las vocaciones", category: "Vocaciones", latin: null,
    text: "Señor Jesús, Pastor bueno, que llamaste a los apóstoles a dejarlo todo y seguirte: mira a nuestra Congregación y a nuestra parroquia, y suscita entre nuestros jóvenes santas vocaciones al sacerdocio, a la vida religiosa y a la familia cristiana. Danos corazones generosos que digan «sí» sin miedo. San José Manyanet, patrono de las vocaciones, ruega por nosotros. Amén." },
  { id: "oracion-manana", name: "Ofrecimiento de la mañana", category: "Diaria", latin: null,
    text: "Dios mío, te ofrezco este día: mis oraciones, trabajos, alegrías y sufrimientos, en unión con el Corazón de Jesús y por las intenciones del Papa, por la santificación de los sacerdotes, por las vocaciones y por mi familia. Dame tu gracia para cumplir tu voluntad en todo. Amén." },
  { id: "comunion-espiritual", name: "Comunión espiritual", category: "Liturgia", latin: null,
    text: "Creo, Jesús mío, que estás real y verdaderamente en el cielo y en el Santísimo Sacramento del altar. Te amo sobre todas las cosas y deseo vivamente recibirte dentro de mi alma, pero no pudiendo hacerlo ahora sacramentalmente, ven al menos espiritualmente a mi corazón. Y como si ya te hubiese recibido, te abrazo y me uno del todo a Ti. No permitas, Señor, que jamás me aparte de Ti. Amén." },
  { id: "requiem", name: "Descanso eterno (por los difuntos)", category: "Misericordia", latin: "Requiem aeternam",
    text: "Dales, Señor, el descanso eterno, y brille para ellos la luz perpetua. Que las almas de los fieles difuntos, por la misericordia de Dios, descansen en paz. Amén." },
  { id: "oracion-paz", name: "Oración por la paz", category: "Misericordia", latin: null,
    text: "Señor, hazme instrumento de tu paz: donde haya odio, ponga yo amor; donde haya ofensa, perdón; donde haya discordia, unión; donde haya duda, fe; donde haya error, verdad; donde haya desesperación, esperanza; donde haya tristeza, alegría; donde haya tinieblas, luz. Oh Maestro, que no busque tanto ser consolado como consolar, ser comprendido como comprender, ser amado como amar. Porque dando se recibe, perdonando se es perdonado, muriendo se resucita a la vida eterna. Amén." },
  { id: "oracion-enfermos", name: "Oración por los enfermos", category: "Misericordia", latin: null,
    text: "Señor Jesús, que pasaste haciendo el bien y curando a los enfermos: mira con amor a nuestros enfermos y ancianos. Alivia su dolor, fortalece a quienes los cuidan y danos a todos fe y paciencia. Por la intercesión de la Virgen María, Salud de los enfermos, concédeles la salud si es tu voluntad, y siempre tu gracia. Amén." },
  { id: "oracion-capilla", name: "Oración por nuestra nueva Capilla", category: "Capilla", latin: null,
    text: "Oración por nuestra nueva Capilla. Señor Jesús, que te quedas con nosotros en el Santísimo Sacramento, te pedimos tu bendición sobre la construcción de nuestra nueva Capilla. Que este lugar sea un refugio de paz, silencio y adoración para toda nuestra comunidad. Bendice a todos los que trabajan, donan y oran por este proyecto. Ayúdanos a construir, al igual que la Sagrada Familia de Nazaret, un hogar donde Tú seas el centro. Que al entrar en esta Capilla, nuestros corazones se enciendan en amor y gratitud hacia Ti. Amén. (Pueden añadir aquí un Avemaría por las intenciones de los benefactores)." },
  { id: "sagrado-corazon", name: "Oración al Sagrado Corazón", category: "Liturgia", latin: null,
    text: "Oh Corazón de Jesús, fuente de toda bendición, te adoro, te amo y con arrepentimiento por mis pecados te ofrezco este pobre corazón mío. Hazme humilde, paciente, puro y obediente a tu voluntad. Concédeme vivir en Ti y por Ti. Protégeme en los peligros, consuélame en las aflicciones, dame salud del cuerpo y del alma, y bendice esta parroquia y mi familia. Sagrado Corazón de Jesús, en Ti confío. Amén." }
];

export const ROSARY_MYSTERIES = {
  gozosos: { name: "Gozosos", days: "Lunes y sábados", items: ["La Anunciación del Ángel a María", "La Visitación de María a su prima Isabel", "El Nacimiento de Jesús en Belén", "La Presentación del Niño en el templo", "El Niño perdido y hallado en el templo"] },
  dolorosos: { name: "Dolorosos", days: "Martes y viernes", items: ["La Oración de Jesús en el huerto", "La Flagelación del Señor", "La Coronación de espinas", "Jesús con la Cruz a cuestas", "La Crucifixión y muerte de Jesús"] },
  gloriosos: { name: "Gloriosos", days: "Miércoles y domingos", items: ["La Resurrección del Señor", "La Ascensión de Jesús al cielo", "La Venida del Espíritu Santo", "La Asunción de María al cielo", "La Coronación de María como Reina"] },
  luminosos: { name: "Luminosos", days: "Jueves", items: ["El Bautismo de Jesús en el Jordán", "Las Bodas de Caná", "El Anuncio del Reino de Dios", "La Transfiguración del Señor", "La Institución de la Eucaristía"] }
};
export function mysteriesForWeekday(jsDay){
  // 0=dom … 6=sáb
  if (jsDay===1||jsDay===6) return "gozosos";
  if (jsDay===2||jsDay===5) return "dolorosos";
  if (jsDay===0||jsDay===3) return "gloriosos";
  return "luminosos";
}

export const EVENTS = [
  { id: "e1", title: "Misa dominical · 10:30 AM (en vivo)", day: "sun", time: "10:30 AM", category: "Misa", location: "Templo histórico", desc: "Misa con transmisión en vivo. Vela por YouTube o radio 96.7 FM.", recurring: "Semanal", mass: "10:30 AM" },
  { id: "e1b", title: "Misa dominical en español · 8:30 AM", day: "sun", time: "8:30 AM", category: "Misa", location: "Templo histórico", desc: "Misa dominical en español. ¡Toda la familia es bienvenida!", recurring: "Semanal", mass: "8:30 AM (Español)" },
  { id: "e2", title: "Adoración eucarística · primer viernes", day: "fri", time: "7:30 AM – 4:00 PM", category: "Adoración", location: "Capilla", desc: "Adoración del primer viernes, 7:30 AM a 4 PM. Rosario todos los días antes de Misa.", recurring: "Mensual" },
  { id: "e3", title: "Noche de RICA (iniciación)", day: "tue", time: "7:00 PM", category: "Formación", location: "Salón parroquial", desc: "¿Curiosidad por la fe católica? Sin presión ni exámenes: conversación y café.", recurring: "Semanal" },
  { id: "e4", title: "Grupo Juvenil Oasis de Paz", day: "wed", time: "6:30 PM", category: "Jóvenes", location: "Salón juvenil", desc: "Jóvenes de secundaria y prepa. Trae un amigo.", recurring: "Semanal" },
  { id: "e5", title: "San Martín de Porres Soup Kitchen", day: "sat", time: "9:00 AM – 12:00 PM", category: "Servicio", location: "Comedor parroquial", desc: "Servimos comida a los necesitados. Voluntarios: solo preséntense.", recurring: "Mensual" },
  { id: "e6", title: "Ensayo del coro La Sagrada Familia", day: "thu", time: "7:00 PM", category: "Comunidad", location: "Coro alto", desc: "Voces nuevas bienvenidas, sin audición.", recurring: "Semanal" },
  { id: "e7", title: "Plática prebautismal", day: "mon", time: "6:30 PM", category: "Formación", location: "Oficina parroquial", desc: "Para papás y padrinos. Una sesión.", recurring: "Mensual" },
  { id: "e8", title: "Devoción del Primer Viernes", day: "fri", time: "7:00 PM", category: "Adoración", location: "Templo histórico", desc: "Devoción al Sagrado Corazón, bendición y oración de la noche.", recurring: "Mensual" },
  { id: "e9", title: "Fiesta patronal · Santa Cruz", day: "sat", time: "4:00 – 8:00 PM", category: "Comunidad", location: "Atrio parroquial", desc: "Celebración de toda la parroquia: comida, música y convivencia.", recurring: "Única" },
  { id: "e10", title: "Misa dominical · Capilla del Santo Niño", day: "sun", time: "Ver boletín", category: "Misa", location: "Capilla del Santo Niño, Española", desc: "Misa dominical en la capilla misión.", recurring: "Semanal" },
  { id: "e11", title: "Misa dominical · Capilla de San Isidro", day: "sun", time: "Ver boletín", category: "Misa", location: "Capilla de San Isidro, La Mesilla", desc: "Misa dominical en la capilla misión.", recurring: "Semanal", mass: "San Isidro" },
  { id: "e12", title: "Pizza & Prayer · Hora Santa vocacional", day: "fri", time: "6:00 PM", category: "Jóvenes", location: "Salón juvenil", desc: "Jóvenes: pizza, adoración y discernimiento vocacional.", recurring: "Mensual" },
  { id: "e13", title: "Rosario comunitario · Sociedad del Altar", day: "sat", time: "8:00 AM", category: "Comunidad", location: "Templo histórico", desc: "Rosario del primer sábado con la Sociedad del Altar.", recurring: "Mensual" },
  { id: "e14", title: "Misa de sanación y unción de los enfermos", day: "fri", time: "6:00 PM", category: "Misa", location: "Templo histórico", desc: "Unción de los enfermos y oración de sanación. Traigan a sus enfermos y ancianos.", recurring: "Mensual", special: true, mass: "Sanación" },
  { id: "e15", title: "Confirmaciones", day: "sat", time: "10:00 AM", category: "Sacramentos", location: "Templo histórico", desc: "Celebración del sacramento de la Confirmación. Inscripción previa en la oficina.", recurring: "Única", special: true },
  { id: "e16", title: "Primeras Comuniones", day: "sun", time: "12:00 PM", category: "Sacramentos", location: "Templo histórico", desc: "Misa de Primeras Comuniones de los niños de catequesis. Acompañemos a las familias.", recurring: "Mensual", special: true },
  { id: "e17", title: "Bautismos comunitarios", day: "sat", time: "11:00 AM", category: "Sacramentos", location: "Templo histórico", desc: "Bautizos comunitarios. Requisito: plática prebautismal del lunes (papás y padrinos).", recurring: "Mensual", special: true },
  { id: "e18", title: "Clases prematrimoniales", day: "thu", time: "7:00 PM", category: "Sacramentos", location: "Salón parroquial", desc: "Preparación para el matrimonio por la Iglesia. Requisito para apartar fecha de boda.", recurring: "Mensual", special: true }
];

export const BULLETINS = [
  {
    id: "b1", title: "Este domingo en Santa Cruz", date: "Semana del 8 de junio", cover: "Pentecostés",
    sections: [
      { h: "Del párroco", p: "Ven, Espíritu Santo. Esta semana vi a nuestros niños de segunda recibir la Primera Comunión con manos temblorosas y ojos enormes, y pensé: esta es toda la parroquia en miniatura. Temblorosa, hambrienta y amadísima. Gracias por hacer sitio a sus risas y su asombro." },
      { h: "Esta semana", p: "Lun — Plática prebautismal 6:30 PM (204) · Mar — RICA 7 PM · Mié — Fogata juvenil 6:30 PM · Vie — Adoración 1–6 PM, confesiones 4–5:30 PM · Sáb — Despensa 9 AM." },
      { h: "Corresponsabilidad", p: "Colecta pasada: $18,420 (meta $17,500). La despensa sirvió a 214 familias. Bienvenidas las 11 familias nuevas: salúdenlas después de Misa." }
    ]
  },
  {
    id: "b2", title: "Procesión de Corpus Christi", date: "Semana del 1 de junio", cover: "Eucaristía",
    sections: [
      { h: "Del párroco", p: "El próximo domingo llevaremos al Señor por nuestras calles. Traigan flores para los altares, niños que arrojen pétalos, vecinos que nunca hayan visto algo así. Plan de lluvia: procesión interior; el Cielo no se detiene por nubes." },
      { h: "Servicio", p: "La despensa necesita arroz, frijoles y crema de maní. Donaciones en los cestos del nártex. Voluntarios: sábado 9 AM, sin registro." },
      { h: "Aparte la fecha", p: "Convivio parroquial: sábado 4 PM en los terrenos. La subasta de pasteles apoya la peregrinación juvenil. Vayan practicando su masa." }
    ]
  }
];

export const CLERGY = [
  { id: "c1", name: "Rev Father Hernando Cortes, SF", role: "parroco", phone: "(505) 753-3345", email: "parroco@ejemplo.org", office: "Lun–Vie 9 AM–4 PM", bio: "Párroco y religioso Hijo de la Sagrada Familia." },
  { id: "c2", name: "Rev Father Sebastian Lee, SF", role: "vicario", phone: "(505) 753-3345", email: "vicario@ejemplo.org", office: "Mar–Jue 9 AM–1 PM", bio: "Vicario parroquial y religioso Hijo de la Sagrada Familia." },
  { id: "c6", name: "Rev Father John Plans, SF", role: "sacerdote", phone: "(505) 753-3345", email: "vicario@ejemplo.org", office: "Con cita", bio: "Sacerdote y religioso Hijo de la Sagrada Familia. Atiende las capillas de misión." },
  { id: "c3", name: "Diác. José Delgado", role: "diacono", phone: "(505) 555-0140", email: "diacono@ejemplo.org", office: "Con cita", bio: "Diácono permanente. Bautizos y matrimonios." },
  { id: "c4", name: "Diác. Pablo Herrera", role: "diacono", phone: "(505) 555-0141", email: "", office: "Con cita", bio: "Diácono permanente. Pastoral de enfermos." },
  { id: "c5", name: "Hna. María Lucía, SF", role: "religiosa", phone: "(505) 555-0142", email: "formacion@ejemplo.org", office: "Lun–Mié 10 AM–2 PM", bio: "Religiosa. Catequesis y formación en la fe." }
];

export const GROUPS = [
  { id: "g1", name: "Coro La Sagrada Familia", members: 24, desc: "Música para las Misas dominicales. Voces e instrumentos.", descEn: "Music for Sunday Masses. Voices and instruments.", open: true, cat: "liturgia", for: "Jóvenes y adultos con gusto por el canto", forEn: "Youth and adults who love singing", lead: "", when: "Jue 7 PM", where: "Coro alto", lang: "ambos" },
  { id: "g2", name: "Grupo Juvenil Oasis de Paz", members: 32, desc: "Jóvenes de secundaria y prepa: fe, amistad y servicio.", descEn: "High school youth: faith, friendship and service.", open: true, cat: "jovenes", for: "Jóvenes de secundaria y preparatoria", forEn: "High school youth", lead: "", when: "Mié 6:30 PM", where: "Salón juvenil", lang: "ambos" },
  { id: "g3", name: "San Vicente de Paúl", members: 18, desc: "Ayuda a los necesitados de la Cañada.", descEn: "Help for neighbors in need.", open: true, cat: "caridad", for: "Adultos con corazón servidor", forEn: "Adults with a servant heart", lead: "", when: "1er sáb 10 AM", where: "Oficina", lang: "ambos" },
  { id: "g4", name: "Acólitos y monaguillos", members: 15, desc: "Niños y jóvenes al servicio del altar.", descEn: "Children and youth serving at the altar.", open: false, cat: "liturgia", for: "Niños y jóvenes (con permiso de sus papás)", forEn: "Children and youth (with parents' permission)", lead: "", when: "Sáb 11 AM", where: "Sacristía", lang: "ambos" },
  { id: "g5", name: "Lectores", members: 20, desc: "Proclaman la Palabra en cada Misa.", descEn: "Proclaim the Word at every Mass.", open: true, cat: "liturgia", for: "Adultos y jóvenes con buena lectura en voz alta", forEn: "Adults and youth who read aloud well", lead: "", when: "3er mar 7 PM", where: "Templo", lang: "ambos" },
  { id: "g6", name: "San Martín de Porres Soup Kitchen", members: 26, desc: "Comedor para los más necesitados.", descEn: "Soup kitchen for those most in need.", open: true, cat: "caridad", for: "Voluntarios de todas las edades", forEn: "Volunteers of all ages", lead: "", when: "Sáb 9 AM", where: "Comedor", lang: "ambos" },
  { id: "g7", name: "Ujieres", members: 14, desc: "Reciben a todos con una sonrisa en la puerta.", descEn: "Welcome everyone with a smile at the door.", open: true, cat: "liturgia", for: "Adultos y jóvenes hospitalarios", forEn: "Welcoming adults and youth", lead: "", when: "Domingos", where: "Nártex", lang: "ambos" },
  { id: "g8", name: "Sociedad del Altar y Rosario", members: 40, desc: "Cuidado del altar y Rosario comunitario.", descEn: "Altar care and community Rosary.", open: true, cat: "devocion", for: "Mujeres y hombres devotos del Rosario", forEn: "Men and women devoted to the Rosary", lead: "", when: "1er sáb 8 AM", where: "Templo", lang: "ambos" },
  { id: "g9", name: "Ministros de la Eucaristía", members: 22, desc: "Distribuyen la Comunión y la llevan a los enfermos.", descEn: "Distribute Communion and bring it to the sick.", open: true, cat: "liturgia", for: "Adultos confirmados", forEn: "Confirmed adults", lead: "", when: "2º jue 7 PM", where: "Templo", lang: "ambos" },
  { id: "g10", name: "Pastoral de enfermos (homebound)", members: 12, desc: "Visitas y Comunión a quienes no pueden salir de casa.", descEn: "Visits and Communion for the homebound.", open: true, cat: "caridad", for: "Personas compasivas dispuestas a visitar", forEn: "Compassionate people willing to visit", lead: "", when: "Vie 10 AM", where: "Capilla", lang: "ambos" },
  { id: "g11", name: "Orden Seglar Carmelita", members: 16, desc: "Espiritualidad del Carmelo para laicos.", descEn: "Carmelite spirituality for lay people.", open: true, cat: "devocion", for: "Laicos adultos", forEn: "Adult lay people", lead: "", when: "3er dom 2 PM", where: "Salón 3", lang: "es" },
  { id: "g12", name: "Catequistas en español", members: 19, desc: "Catequesis de niños y RICA en español.", descEn: "Children's catechesis and RCIA in Spanish.", open: true, cat: "formacion", for: "Adultos de habla hispana", forEn: "Spanish-speaking adults", lead: "", when: "Lun 6 PM", where: "Salones", lang: "es" },
  { id: "g13", name: "Catechists in English", members: 11, desc: "Children's catechesis and RCIA in English.", descEn: "Children's catechesis and RCIA in English.", open: true, cat: "formacion", for: "Adultos de habla inglesa", forEn: "English-speaking adults", lead: "", when: "Tue 6 PM", where: "Classrooms", lang: "en" },
  { id: "g14", name: "Formación en la fe (RICA)", members: 14, desc: "Adultos que se preparan para los sacramentos.", descEn: "Adults preparing for the sacraments.", open: true, cat: "formacion", for: "Adultos que se preparan para sacramentos", forEn: "Adults preparing for sacraments", lead: "", when: "Mar 7 PM", where: "Salón 1", lang: "ambos" },
  { id: "g15", name: "Catholic Daughters", members: 21, desc: "Mujeres al servicio de la Iglesia y la comunidad.", descEn: "Women serving Church and community.", open: true, cat: "comunidad", for: "Mujeres católicas", forEn: "Catholic women", lead: "", when: "2º lun 6 PM", where: "Salón 2", lang: "en" },
  { id: "g16", name: "Celadoras del Santísimo", members: 17, desc: "Turnos de adoración y cuidado de la capilla.", descEn: "Adoration shifts and chapel care.", open: true, cat: "devocion", for: "Personas dispuestas a acompañar al Santísimo", forEn: "Those willing to keep company with the Blessed Sacrament", lead: "", when: "Vie 1–6 PM", where: "Capilla", lang: "es" },
  { id: "g17", name: "Cofradía de la Santa Cruz", members: 25, desc: "Devoción a la Santa Cruz y fiesta patronal.", descEn: "Devotion to the Holy Cross and patronal feast.", open: true, cat: "devocion", for: "Devotos de la Santa Cruz", forEn: "Devotees of the Holy Cross", lead: "", when: "Último vie 7 PM", where: "Atrio", lang: "es" },
  { id: "g18", name: "Hermanos de la Santa Cruz", members: 13, desc: "Varones: fe, trabajo y apoyo mutuo.", descEn: "Men: faith, work and mutual support.", open: true, cat: "comunidad", for: "Varones de la parroquia", forEn: "Men of the parish", lead: "", when: "2º sáb 8 AM", where: "Salón 1", lang: "es" },
  { id: "g19", name: "Pizza & Prayer (vocacional)", members: 10, desc: "Jóvenes disciernen su vocación con pizza y Hora Santa.", descEn: "Youth discerning vocation with pizza and Holy Hour.", open: true, cat: "jovenes", for: "Jóvenes que disciernen su vocación", forEn: "Youth discerning their vocation", lead: "", when: "1er vie 6 PM", where: "Salón juvenil", lang: "ambos" },
  { id: "g20", name: "Pastoral Familiar", members: 28, desc: "Matrimonios y familias: retiros y acompañamiento.", descEn: "Married couples and families: retreats and support.", open: true, cat: "familia", for: "Matrimonios y familias", forEn: "Married couples and families", lead: "", when: "2º dom 4 PM", where: "Salón 2", lang: "ambos" },
  { id: "g21", name: "Coro San José (español)", members: 15, desc: "Música para la Misa dominical en español.", descEn: "Music for the Spanish Sunday Mass.", open: true, cat: "liturgia", for: "Jóvenes y adultos (Misa en español)", forEn: "Youth and adults (Spanish Mass)", lead: "", when: "Mié 7 PM", where: "Coro alto", lang: "es" }
]

export const MESSAGES = [
  { id: "m1", from: "Oficina parroquial", time: "hace 2 h", channel: "Aviso", title: "Misa de 10:30 con transmisión en vivo", body: "Acompáñanos por YouTube o radio 96.7 FM St. Joseph Manyanet. El boletín semanal ya está disponible." },
  { id: "m2", from: "Oficina parroquial", time: "Ayer", channel: "Correo", title: "Boletín + voluntarios para la fiesta patronal", body: "Faltan voluntarios para la fiesta patronal. Confesiones los sábados a las 4 PM. Llama al (505) 753-3345." },
  { id: "m3", from: "Oasis de Paz", time: "hace 2 días", channel: "SMS", title: "Juvenil miércoles 6:30", body: "Grupo Juvenil Oasis de Paz este miércoles 6:30 PM. Trae un amigo." }
];

export const CATEGORIES = ["Misa", "Adoración", "Formación", "Jóvenes", "Servicio", "Comunidad", "Sacramentos"];

export const SAINTS = [
  { name: "Santa María, Madre de Dios", feast: "1 ene", patron: "Madre de la Iglesia", bio: "La Virgen de Nazaret, madre de Jesús y madre nuestra. Su «sí» abrió la puerta de la salvación." },
  { name: "San José", feast: "19 mar", patron: "Padres, trabajadores, buena muerte", bio: "Custodio de Jesús y María. Hombre justo y silencioso que cuidó a la Sagrada Familia con su trabajo." },
  { name: "San Pedro", feast: "29 jun", patron: "La Iglesia, pescadores", bio: "Pescador de Galilea, primer Papa. Negó y lloró, creyó y confirmó a sus hermanos." },
  { name: "San Pablo", feast: "29 jun", patron: "Misioneros, escritores", bio: "De perseguidor a apóstol de las naciones. Sus cartas sostienen la fe de medio mundo." },
  { name: "San Francisco de Asís", feast: "4 oct", patron: "Ecología, animales, paz", bio: "El pobrecillo de Asís que se casó con la Dama Pobreza y cantó al Hermano Sol." },
  { name: "Santa Teresa de Ávila", feast: "15 oct", patron: "Vida de oración", bio: "Reformadora del Carmelo y doctora de la Iglesia. «Solo Dios basta»." },
  { name: "San Juan Pablo II", feast: "22 oct", patron: "Jóvenes, familias", bio: "El Papa peregrino que abrazó al mundo y enseñó a no tener miedo." },
  { name: "Santa Teresa de Calcuta", feast: "5 sep", patron: "Pobres, misioneros de la caridad", bio: "Sirvió a «los más pobres entre los pobres» con una sonrisa que escondía noches oscuras de fe." },
  { name: "San Martín de Porres", feast: "3 nov", patron: "Afrodescendientes, barberos, enfermos", bio: "Hermano mulato de Lima: escoba, caridad y milagros humildes en el convento." },
  { name: "Santa Rosa de Lima", feast: "23 ago", patron: "América, Perú, jardineros", bio: "Primera santa de América. Flor limeña de oración y penitencia por los pecadores." },
  { name: "Santo Toribio de Mogrovejo", feast: "23 mar", patron: "Obispos de América Latina", bio: "Arzobispo de Lima que caminó su diócesis defendiendo a los indígenas." },
  { name: "San Juan Diego", feast: "9 dic", patron: "Indígenas, laicos", bio: "El humilde mensajero de la Virgen de Guadalupe en el Tepeyac (1531)." },
  { name: "Nuestra Señora de Guadalupe", feast: "12 dic", patron: "América, México", bio: "La Morenita que dejó su imagen en la tilma y unió a dos mundos en un solo pueblo." },
  { name: "San Ignacio de Loyola", feast: "31 jul", patron: "Ejercicios espirituales", bio: "Soldado herido convertido en peregrino; fundó la Compañía de Jesús." },
  { name: "San Francisco Javier", feast: "3 dic", patron: "Misiones", bio: "Jesuita incansable que llevó el Evangelio hasta Asia." },
  { name: "Santo Domingo de Guzmán", feast: "8 ago", patron: "Rosario, predicadores", bio: "Fundador de los dominicos; la tradición le vincula a la propagación del Rosario." },
  { name: "Santa Catalina de Siena", feast: "29 abr", patron: "Europa, enfermeras", bio: "Doctora joven y valiente que aconsejó a papas y cuidó apestados." },
  { name: "Santo Tomás de Aquino", feast: "28 ene", patron: "Estudiantes, teólogos", bio: "El Doctor Angélico: razón y fe abrazadas en la Suma Teológica." },
  { name: "San Agustín", feast: "28 ago", patron: "Convertidos, teólogos", bio: "«Nos hiciste, Señor, para ti». De vida inquieta a obispo y doctor de la gracia." },
  { name: "Santa Mónica", feast: "27 ago", patron: "Madres que oran por sus hijos", bio: "Lloró y oró años por su hijo Agustín hasta verlo convertido." },
  { name: "San Antonio de Padua", feast: "13 jun", patron: "Objetos perdidos, pobres", bio: "Predicador franciscano a quien los pueblos pedían pan y milagros." },
  { name: "Santa Cecilia", feast: "22 nov", patron: "Músicos", bio: "Mártir romana que cantó a Dios en su corazón; patrona de los coros." },
  { name: "San Lorenzo", feast: "10 ago", patron: "Diáconos", bio: "Diácono mártir que repartió los bienes a los pobres antes de la parrilla." },
  { name: "San Miguel Arcángel", feast: "29 sep", patron: "Policías, soldados, la Iglesia", bio: "«¿Quién como Dios?» Príncipe de la milicia celestial." },
  { name: "San Rafael Arcángel", feast: "29 sep", patron: "Viajeros, enfermos", bio: "El guía del joven Tobías: medicina de Dios en el camino." },
  { name: "Beato Carlo Acutis", feast: "12 oct", patron: "Jóvenes, internet", bio: "Adolescente italiano, genio de la informática y enamorado de la Eucaristía." },
  { name: "San José Sánchez del Río", feast: "10 feb", patron: "Jóvenes cristeros", bio: "Niño mártir mexicano que murió gritando «¡Viva Cristo Rey!»." },
  { name: "San Rafael Guízar y Valencia", feast: "24 oct", patron: "Obispos mexicanos", bio: "Obispo disfrazado de vendedor que confirmó a miles en tiempos de persecución." },
  { name: "Beato Miguel Pro", feast: "23 nov", patron: "Perseguidos por la fe", bio: "Jesuita mexicano, alegre hasta el martirio: «¡Viva Cristo Rey!»." },
  { name: "Santa Clara de Asís", feast: "11 ago", patron: "Televisión, clarisas", bio: "Primera seguidora de Francisco; defendió su privilegio de la pobreza." }
];

export const CANTOS = [
  { id: "c1", title: "Alabado sea el Santísimo", origin: "Letra tradicional · dominio público", lyrics: "Alabado sea el Santísimo Sacramento del altar. / Sea por siempre bendito y alabado.", notes: [523,523,587,659,659,587,523,440,440,523,523,440,392,440] },
  { id: "c2", title: "Venid, adoremos (Adeste fideles)", origin: "Letra tradicional · dominio público", lyrics: "Venid, adoremos; venid, adoremos; venid, adoremos a Cristo el Señor.", notes: [392,392,440,523,523,440,392,330,330,392,392,330,294,330] },
  { id: "c3", title: "Salve, Reina y Madre", origin: "Letra tradicional · dominio público", lyrics: "Salve, Reina y Madre, salve, dulzura de nuestras vidas, esperanza nuestra, salve.", notes: [440,440,523,587,659,587,523,523,440,392,440,440] },
  { id: "c4", title: "Vamos cantando al Señor", origin: "Canto popular tradicional", lyrics: "Vamos cantando al Señor: Él es nuestra alegría. / Vamos cantando al Señor: Él es nuestra salvación.", notes: [523,587,659,659,587,523,587,659,659,659,587,587,523,523] },
  { id: "c5", title: "Madre del Salvador (comunitaria)", origin: "Canto original de la comunidad", lyrics: "Madre del Salvador, enséñanos a orar; / guarda nuestra familia bajo tu manto de paz.", notes: [440,523,587,523,440,392,440,523,523,440,392,392] },
  { id: "c6", title: "Pan de vida (comunitaria)", origin: "Canto original de la comunidad", lyrics: "Pan de vida, Cáliz de amor: quédate con nosotros, Señor. / Pan de vida, Cáliz de amor: danos tu Cuerpo, danos tu paz.", notes: [392,440,523,523,587,523,440,440,392,330,392,392] },
  { id: "c7", title: "Tantum Ergo", origin: "Himno eucarístico tradicional · dominio público", lyrics: "Veneremos, pues, echados, tan augusto Sacramento; / y el antiguo documento ceda al nuevo rito. / Fe supliendo los sentidos al pecho cristiano. / Al Padre y al Hijo, gloria y honor, salud, virtud y bendición. / Amén.", notes: [523,523,440,392,392,440,523,523,587,523,440,392] },
  { id: "c8", title: "Adoro te devote", origin: "Himno eucarístico tradicional · dominio público", lyrics: "Te adoro con devoción, Dios escondido, / oculto verdaderamente bajo estas apariencias. / A Ti se somete mi corazón por completo, / pues al contemplarte, todo desfallece.", notes: [440,440,523,587,587,523,523,440,440,392,440,392] },
  { id: "c9", title: "Bendito, bendito", origin: "Canto tradicional · dominio público", lyrics: "Bendito, bendito, bendito sea Dios; / los ángeles cantan y alaban a Dios.", notes: [523,587,659,659,659,587,587,523,523,523,440,440] },
  { id: "c10", title: "Regina Coeli (canto)", origin: "Antífona pascual tradicional · dominio público", lyrics: "Reina del cielo, alégrate, aleluya, / porque el que mereciste llevar, aleluya, / resucitó como dijo, aleluya. / Ruega por nosotros a Dios, aleluya.", notes: [523,523,523,587,659,587,523,587,659,659,587,523] }
];

export const NEWS = [
  { id: "n1", cat: "Diócesis", date: "Esta semana", title: "Retiro diocesano de Cuaresma para servidores", body: "La diócesis invita a todos los ministerios a un retiro de un día: oración, confesiones y formación. Confirmen asistencia con su coordinador parroquial." },
  { id: "n2", cat: "Diócesis", date: "Esta semana", title: "Colecta anual para el seminario", body: "El próximo fin de semana la segunda colecta apoyará la formación de nuestros seminaristas. Oren por las vocaciones de la diócesis." },
  { id: "n3", cat: "País", date: "Hace 3 días", title: "Obispos llaman a orar por las familias", body: "En su mensaje, los obispos piden a cada parroquia una hora santa mensual por las familias y por la paz del país." },
  { id: "n4", cat: "País", date: "Hace 5 días", title: "Jornada nacional de servicio juvenil", body: "Miles de jóvenes católicos saldrán a servir comedores y asilos el último sábado del mes. El grupo juvenil parroquial ya se anotó." },
  { id: "n5", cat: "Iglesia", date: "Ayer", title: "El Papa anuncia un año de oración por la paz", body: "Desde Roma, el Santo Padre invitó a todas las parroquias del mundo a rezar el Rosario por la paz cada primer sábado de mes." },
  { id: "n6", cat: "Iglesia", date: "Hace 2 días", title: "Nuevo documento sobre la Eucaristía dominical", body: "La Santa Sede recuerda la centralidad de la Misa del domingo y anima a invitar personalmente a quienes se han alejado." }
];

export const MINISTRY_ROLES = ["Sacerdote", "Diácono", "Encargado/a de Misa", "Lectores", "Ministros de la Eucaristía", "Monaguillos", "Ujieres", "Coro", "Apertura y cierre", "Baño público"];
export const GIVING_PROJECTS = [
  { id: "offertory", name: "Colecta dominical", desc: "Sostiene la vida diaria de la parroquia.", descEn: "Supports the daily life of the parish.", goal: 17500, raised0: 12300,
    updates: [{ d: "Junio", t: "La colecta de mayo sostuvo la luz, el agua y el estipendio del personal. Gracias a las familias que aportan cada domingo." }] },
  { id: "pantry", name: "Despensa de alimentos", desc: "Alimentos para las familias de la Cañada.", descEn: "Food for families in need.", goal: 8000, raised0: 5210,
    updates: [{ d: "Esta semana", t: "La despensa sirvió a 214 familias. Urgen frijol, arroz y aceite para el sábado." }] },
  { id: "youth-pilgrimage", name: "Peregrinación juvenil", desc: "Apoya a los jóvenes en retiros y peregrinaciones.", descEn: "Supports youth retreats and pilgrimages.", goal: 6000, raised0: 2350,
    updates: [{ d: "Mayo", t: "12 jóvenes se inscribieron al retiro. Ya se apartó el autobús." }] },
  { id: "blessed-sacrament", name: "Blessed Sacrament Chapel", desc: "Capilla del Santísimo Sacramento — construcción y adecuación para la adoración.", descEn: "Blessed Sacrament Chapel — construction and fitting for adoration.", goal: 45000, raised0: 18750,
    updates: [{ d: "Mayo", t: "Se aprobó el plano arquitectónico de la capilla. Siguiente paso: los cimientos." }] },
  { id: "mariam-hall", name: "Mariam Hall for Events", desc: "Salón Mariam para eventos y convivencia parroquial.", descEn: "Mariam Hall for parish events and gatherings.", goal: 30000, raised0: 9200,
    updates: [{ d: "Abril", t: "Se compró la mitad de las sillas del salón. Falta el equipo de sonido." }] },
  { id: "offices", name: "Parish Offices", desc: "Oficinas parroquiales — atención y administración.", descEn: "Parish offices — welcome and administration.", goal: 25000, raised0: 6100,
    updates: [{ d: "Marzo", t: "Se terminó la instalación eléctrica de las oficinas." }] },
  { id: "security-parking", name: "Security and Parking Lot", desc: "Seguridad y estacionamiento para Misas y eventos.", descEn: "Security and parking lot for Masses and events.", goal: 18000, raised0: 12400,
    updates: [{ d: "Junio", t: "Se pintaron 40 cajones del estacionamiento. Siguen las lámparas." }] },
  { id: "stations-garden", name: "Stations of the Cross Garden", desc: "Jardín del Vía Crucis para oración al aire libre.", descEn: "Outdoor Stations of the Cross prayer garden.", goal: 12000, raised0: 3800,
    updates: [{ d: "Mayo", t: "Se plantaron los primeros 6 árboles del jardín del Vía Crucis." }] },
  { id: "maintenance", name: "Church & Buildings Maintenance", desc: "Mantenimiento de toda la iglesia y los edificios.", descEn: "Upkeep of the whole church and all buildings.", goal: 20000, raised0: 7650,
    updates: [{ d: "Junio", t: "Se impermeabilizó el techo del templo histórico antes de las lluvias." }] }
];
export const MINISTRY_SEED = {
  "7:00 AM": { "Sacerdote": "Rev Father Hernando Cortes, SF", "Diácono": "Por asignar", "Encargado/a de Misa": "Por asignar", "Lectores": "Por asignar", "Ministros de la Eucaristía": "Por asignar", "Monaguillos": "Por asignar", "Ujieres": "Por asignar", "Coro": "Por asignar", "Apertura y cierre": "Por asignar", "Baño público": "Por asignar" },
  "8:30 AM (Español)": { "Sacerdote": "Rev Father Hernando Cortes, SF", "Diácono": "Por asignar", "Encargado/a de Misa": "Por asignar", "Lectores": "Por asignar", "Ministros de la Eucaristía": "Por asignar", "Monaguillos": "Por asignar", "Ujieres": "Por asignar", "Coro": "Coro La Sagrada Familia", "Apertura y cierre": "Por asignar", "Baño público": "Por asignar" },
  "10:30 AM": { "Sacerdote": "Rev Father Hernando Cortes, SF", "Diácono": "Por asignar", "Encargado/a de Misa": "Por asignar", "Lectores": "Por asignar", "Ministros de la Eucaristía": "Por asignar", "Monaguillos": "Por asignar", "Ujieres": "Por asignar", "Coro": "Coro La Sagrada Familia", "Apertura y cierre": "Por asignar", "Baño público": "Por asignar" },
  "Santo Niño": { "Sacerdote": "Rev Father John Plans, SF", "Diácono": "Por asignar", "Encargado/a de Misa": "Por asignar", "Lectores": "Por asignar", "Ministros de la Eucaristía": "Por asignar", "Monaguillos": "Por asignar", "Ujieres": "Por asignar", "Coro": "Por asignar", "Apertura y cierre": "Por asignar", "Baño público": "Por asignar" },
  "San Isidro": { "Sacerdote": "Rev Father Sebastian Lee, SF", "Diácono": "Por asignar", "Encargado/a de Misa": "Por asignar", "Lectores": "Por asignar", "Ministros de la Eucaristía": "Por asignar", "Monaguillos": "Por asignar", "Ujieres": "Por asignar", "Coro": "Por asignar", "Apertura y cierre": "Por asignar", "Baño público": "Por asignar" },
  "Sanación": { "Sacerdote": "Rev Father Hernando Cortes, SF", "Diácono": "Diác. Pablo Herrera", "Encargado/a de Misa": "Por asignar", "Lectores": "Por asignar", "Ministros de la Eucaristía": "Por asignar", "Monaguillos": "Por asignar", "Ujieres": "Por asignar", "Coro": "Por asignar", "Apertura y cierre": "Por asignar", "Baño público": "Por asignar" }
}

export const FIELES_SEED = ["Familia Hernández", "María Torres", "José Rivas", "Ana Beltrán", "Luis Peña", "Carmen Ruiz", "Don Efraín", "Coro Ángeles"];
export const MURO_SEED = [
  { id: "w1", name: "María Torres", kind: "Saludo", text: "¡Bienvenidos a las familias nuevas! Pasen por el salón después de Misa por un cafecito.", when: "Ayer" },
  { id: "w2", name: "José Rivas", kind: "Nota", text: "Se buscan 2 ujieres para la Misa de 10:30. Hablen conmigo al salir.", when: "Hace 2 días" },
  { id: "w3", name: "Coro Ángeles", kind: "Nota", text: "Ensayo extra el jueves 7 PM para la fiesta patronal. ¡Traigan su voz!", when: "Hace 3 días" }
];
export const INTENCIONES_SEED = [
  { id: "i1", type: "Cumpleaños", names: "Sofía Hernández", date: "8 jun", text: "¡Felices 15 años! Tu familia y tu grupo juvenil celebran contigo." },
  { id: "i2", type: "Cumpleaños", names: "Don Efraín", date: "10 jun", text: "80 años de fe y servicio. ¡La parroquia lo felicita!" },
  { id: "i3", type: "Matrimonios", names: "Pablo y Lucía", date: "14 jun", mass: "Misa sáb 2 PM", place: "Templo histórico", text: "Se casan el sábado. Oremos por su nuevo hogar." },
  { id: "i4", type: "Aniversarios", names: "Fam. Herrera — 25 años", date: "20 jun", mass: "Misa de 10:30", massId: "10:30 AM", place: "Templo histórico", text: "Bodas de plata. Renovarán sus votos en la Misa de 10:30." },
  { id: "i5", type: "Defunciones", names: "D. Manuel Ortiz", date: "Q.E.P.D.", text: "Acompañemos a su familia. Rosario lunes 7 PM en la capilla." },
  { id: "i6", type: "Defunciones", names: "Dña. Rosa Gil", date: "Q.E.P.D.", text: "Misa de cuerpo presente martes 11 AM. Descanse en paz." },
  { id: "i7", type: "Nacimientos", names: "Bebé Mateo Reyes", date: "2 jun", text: "¡Bienvenido a la familia parroquial! Bautizo: plática el lunes 6:30 PM." },
  { id: "i8", type: "Quinceañeras", names: "Valeria Reyes", date: "21 jun", mass: "Misa sáb 12 PM", place: "Templo histórico", text: "Quinceañera de Valeria. Acompañemos a su familia con nuestra oración." },
  { id: "i9", type: "Exequias", names: "D. Felipe Baca", date: "Q.E.P.D.", mass: "Misa exequial vie 11 AM", massId: "Santo Niño", place: "Capilla del Santo Niño", text: "Misa de cuerpo presente. Acompañemos a la familia Baca." },
  { id: "i10", type: "Matrimonios", names: "Diego y Mariana", date: "28 jun", mass: "Misa sáb 3 PM", place: "Capilla de San Isidro", text: "Boda en la capilla misión. ¡Felicidades!" }
];


export const WEEK_EN = {
  sun: { weekday: "Sunday", feast: "The Lord's Day", season: "Ordinary Time", rank: "Solemnity", reflectionTitle: "The Breath That Rebuilds", reflection: "Pentecost is not a memory but a mission. The same Spirit that filled the upper room fills a parish hall, a kitchen, a hospital waiting room. Ask today: where does my parish need breath? Then go and stand there." },
  mon: { weekday: "Monday", feast: "Mary, Mother of the Church", season: "Ordinary Time", rank: "Memorial", reflectionTitle: "A Mother Received Twice", reflection: "At the cross, Mary received a second motherhood over every disciple. The parish is where that gift becomes practical: meals, visits, company. If you were given a mother, be a brother or sister today." },
  tue: { weekday: "Tuesday", feast: "Weekday", season: "Ordinary Time", rank: "Ferial", reflectionTitle: "The Arithmetic of Nearness", reflection: "James writes it like physics: draw near to God and he will draw near to you. Ten minutes of silence, one honest confession, one forgiven debt — small steps count double in the Kingdom." },
  wed: { weekday: "Wednesday", feast: "St. Charles Lwanga & Companions", season: "Ordinary Time", rank: "Memorial", reflectionTitle: "Young, Brave, Joyful", reflection: "The Ugandan martyrs were mostly teenagers. Courage is not the absence of fear but the presence of love. Pray today for the young people of your parish facing hard choices." },
  thu: { weekday: "Thursday", feast: "Eucharistic Thursday", season: "Ordinary Time", rank: "Ferial", reflectionTitle: "Salt Is Spent Seasoning", reflection: "Salt only seasons what it touches. A parish locked inside its church loses its flavor. Visit adoration if you can on Thursday, then carry that stillness into one noisy place." },
  fri: { weekday: "Friday", feast: "Sacred Heart of Jesus", season: "Ordinary Time", rank: "Solemnity", reflectionTitle: "The Heart That Searches", reflection: "The Sacred Heart is not God's affection for the worthy — it is his search party for the lost. If you have drifted, this is the feast that tells you: you are the one he came for." },
  sat: { weekday: "Saturday", feast: "Immaculate Heart of Mary", season: "Ordinary Time", rank: "Memorial", reflectionTitle: "Keeping Things in the Heart", reflection: "Mary's way with mystery was not to solve it but to keep it. Bring one unanswered question to prayer tonight. You don't need a solution — you need a place to keep it. Her heart has room." }
};
export const INSP_EN = [
  { title: "Begin with stillness", body: "Before the notifications, before the news — thirty seconds with the Sign of the Cross and one slow Our Father. The day can wait. Heaven is eager to meet you." },
  { title: "Carry one name", body: "Write one name on your hand today — someone who needs prayer. Every time you see it, whisper a Hail Mary. By nightfall you will have prayed a rosary without noticing." },
  { title: "The ministry of the pew", body: "Sit near the newcomers. Learn one name each Sunday. Parishes don't grow through programs first — they grow through remembered names." },
  { title: "Confession is a reset, not a report", body: "You don't go to list failures; you go to be found. Saturday 4 PM. Ten minutes. You will walk out lighter than you walked in." },
  { title: "Adoration at midday", body: "Twelve minutes in a quiet chapel beat an hour of scrolling. Bring nothing but your tiredness. He asked for your company, not your performance." }
];
export const ART = {
  hero: "https://user.uploads.dev/file/87e0ce0d425df2e875c28112e41d745c.jpg",
  desert: "https://user.uploads.dev/file/76f9bde0cb36da488f188959043d98c5.jpg",
  luminarias: "https://user.uploads.dev/file/6ac8b898cb825303bdb25d834afa26bd.jpg",
  retablo: "https://user.uploads.dev/file/83784f931846b510521a18dd0c888973.jpg"
};
export const DIRECTORY_SEED = [
  { id: "d1", family: "Familia Martínez", last: "Martínez", contact: "José Martínez", phone: "(505) 555-0114", email: "martinez@ejemplo.org", address: "Santa Cruz, NM", members: [{name:"Sofía Martínez", group:"g2"},{name:"María Martínez", group:"g8"}], groups: ["g2","g8"], clergy: null, birthdays: [{name:"Sofía Martínez", md:"06-08"},{name:"José Martínez", md:"11-02"}], anniversary: {couple: "José y María", md: "06-20"}, notes: "Hija en el coro juvenil." },
  { id: "d2", family: "Familia Trujillo", last: "Trujillo", contact: "Ana Trujillo", phone: "(505) 555-0132", email: "", address: "Española, NM", members: [{name:"Dieguito Trujillo", group:"g4"}], groups: ["g4","g20"], clergy: null, birthdays: [{name:"Dieguito Trujillo", md:"12-25"}], anniversary: null, notes: "Visita a los abuelos los domingos." },
  { id: "d3", family: "Familia Archuleta", last: "Archuleta", contact: "Pablo Archuleta", phone: "(505) 555-0177", email: "archuleta@ejemplo.org", address: "La Mesilla, NM", members: [{name:"Lucía Archuleta", group:"g12"}], groups: ["g12","g17"], clergy: null, birthdays: [{name:"Lucía Archuleta", md:"03-14"}], anniversary: {couple: "Pablo y Lucía", md: "06-14"}, notes: "" },
  { id: "d4", family: "Dña. Rosa Valdés", last: "Valdés", contact: "Rosa Valdés", phone: "(505) 555-0191", email: "", address: "Santa Cruz, NM", members: [], groups: ["g10"], clergy: null, homebound: true, birthdays: [{name:"Rosa Valdés", md:"01-19"}], anniversary: null, notes: "En casa; agradecería visita y Comunión." },
  { id: "d5", family: "Familia Delgado", last: "Delgado", contact: "Diác. José Delgado", phone: "(505) 555-0140", email: "diacono@ejemplo.org", address: "Santa Cruz, NM", members: [{name:"José Delgado", group:"g5"},{name:"Elena Delgado", group:"g9"}], groups: ["g5","g9"], clergy: "diacono", birthdays: [{name:"Elena Delgado", md:"04-30"}], anniversary: {couple: "José y Elena", md: "09-12"}, notes: "Diácono permanente de la parroquia." },
  { id: "d6", family: "Familia Reyes", last: "Reyes", contact: "Miguel Reyes", phone: "(505) 555-0155", email: "reyes@ejemplo.org", address: "Española, NM", members: [{name:"Valeria Reyes", group:"g2"},{name:"Mateo Reyes", group:""}], groups: ["g2","g12"], clergy: null, birthdays: [{name:"Valeria Reyes", md:"06-21"},{name:"Mateo Reyes", md:"06-02"}], anniversary: null, notes: "Quinceañera de Valeria el 21 de junio." },
  { id: "d7", family: "Familia Baca", last: "Baca", contact: "Felipe Baca", phone: "(505) 555-0160", email: "", address: "La Mesilla, NM", members: [{name:"Felipe Baca", group:"g18"}], groups: ["g18","g20"], clergy: null, birthdays: [{name:"Felipe Baca", md:"02-11"}], anniversary: {couple: "Felipe y Ana", md: "10-05"}, notes: "" }
];