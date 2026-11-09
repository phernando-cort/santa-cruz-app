// Citas diarias offline 2023-01-01..2032-12-31 — instalación limpia 2026-11-09.
// - Base 2023-01-01..2027-10-31 (días de semana incluidos, src/vendor/lectionary-daily.js)
// - Extensión generada 2027-11-01..2032-12-31 (src/daily-extra.js, window.DailyExtra;
//   generada por src/tools/build-daily-extra.js)
// + overlay de fiesta+color 2026-04..2027-05 (índice mensual USCCB).
// Fuente vendorizada: src/vendor/lectionary-daily.js (westhong/catholic-daily-readings,
// Layer 1: solo citas, sin texto con copyright). Formato por fecha:
// [feast, color, lectionary, first, psalm, second, alleluia, gospel].
// Condiciones: rango con clamp 2023-01-01..2032-12-31; rankOf() para Feria/Weekday;
// santo único por saintsForDay(); texto oficial SOLO vía src/usccb.js (nunca aquí).

// La fuente deja vacías unas 15 fiestas mayores (Juves Santo en 2023-2025,
// Navidad, Pentecostés y Asunción casi todos los años): solo trae la Misa de
// Vigilia sin citas. Se rellenan aquí con las citas oficiales de la Misa del
// día (números de leccionario 39/16/63/622), verificadas contra el CSV
// Full_Lectionary_Raw del proyecto Catholic-Lectionary-on-ESP8266 (plishman,
// GPLv3 — usado solo como verificación cruzada, no vendorizado) y contra el
// leccionario oficial. Son lecturas universales e invariables cada año.
const FEAST_FILL = {
  holyThursday: ["Holy Thursday — Mass of the Lord's Supper", "white", 39,
    "Exodus 12:1-8, 11-14", "Psalm 116:12-13, 15-16bc, 17-18",
    "1 Corinthians 11:23-26", "", "John 13:1-15"],
  christmas: ["The Nativity of the Lord (Christmas)", "white", 16,
    "Isaiah 52:7-10", "Psalm 98:1, 2-3, 3-4, 5-6",
    "Hebrews 1:1-6", "", "John 1:1-18"],
  pentecost: ["Pentecost Sunday (Mass during the Day)", "red", 63,
    "Acts 2:1-11", "Psalm 104:1, 24, 29-30, 31, 34",
    "1 Corinthians 12:3b-7, 12-13", "", "John 20:19-23"],
  assumption: ["Solemnity of the Assumption of the Blessed Virgin Mary (Mass during the Day)", "white", 622,
    "Revelation 11:19a; 12:1-6a, 10ab", "Psalm 45:10, 11, 12, 16",
    "1 Corinthians 15:20-27", "", "Luke 1:39-56"],
};
const FEAST_FILL_DATES = {
  "2023-04-06": "holyThursday", "2024-03-28": "holyThursday", "2025-04-17": "holyThursday",
  "2023-12-25": "christmas", "2024-12-25": "christmas", "2025-12-25": "christmas", "2026-12-25": "christmas",
  "2023-05-28": "pentecost", "2024-05-19": "pentecost", "2025-06-08": "pentecost",
  "2023-08-15": "assumption", "2024-08-15": "assumption", "2025-08-15": "assumption",
  "2026-08-15": "assumption", "2027-08-15": "assumption",
};

// Relleno de citas para filas vacías de la fuente diaria (ver scratch/CURRENT_TASK.md).
// Clave = fecha ISO; valor = [color, primera, salmo, segunda, aleluya, evangelio].
// Fiestas mayores: Misa del Día (criterio ya usado en FEAST_FILL). Memoriales:
// lecturas feriales del número+ciclo con evangelio propio donde la fuente lo usa
// (Marta, Clara, Ángeles, Dolores) e híbrido Bernabé (fuente 2024/2025).
const DAILY_FILL = {
  "2023-01-31": ["white","Hebrews 12:1-4","Psalm 22:26b-27, 28 and 30, 31-32","","","Mark 5:21-43"],
  "2023-05-18": ["white","Acts 1:1-11","Psalm 47:2-3, 6-7, 8-9","Ephesians 1:17-23","","Matthew 28:16-20"],
  "2023-05-21": ["white","Acts 1:1-11","Psalm 47:2-3, 6-7, 8-9","Ephesians 1:17-23","","Matthew 28:16-20"],
  "2023-05-25": ["white","Acts 22:30; 23:6-11","Psalm 16:1-2a and 5, 7-8, 9-10, 11","","John 17:21","John 17:20-26"],
  "2023-06-24": ["white","Isaiah 49:1-6","Psalm 139:1b-3, 13-14ab, 14c-15","Acts 13:22-26","See Luke 1:76","Luke 1:57-66, 80"],
  "2023-06-29": ["red","Acts 12:1-11","Psalm 34:2-3, 4-5, 6-7, 8-9","2 Timothy 4:6-8, 17-18","Matthew 16:18","Matthew 16:13-19"],
  "2024-03-03": ["violet","Exodus 20:1-3, 7-8, 12-17","Psalm 19:8, 9, 10, 11","1 Corinthians 1:22-25","","John 2:13-25"],
  "2024-03-10": ["violet","2 Chronicles 36:14-16, 19-23","Psalm 137:1-2, 3, 4-5, 6","Ephesians 2:4-10","","John 3:14-21"],
  "2024-03-17": ["violet","Jeremiah 31:31-34","Psalm 51:3-4, 12-13, 14-15","Hebrews 5:7-9","","John 12:20-33"],
  "2024-05-09": ["white","Acts 1:1-11","Psalm 47:2-3, 6-7, 8-9","Ephesians 1:17-23","","Mark 16:15-20"],
  "2024-05-12": ["white","Acts 1:1-11","Psalm 47:2-3, 6-7, 8-9","Ephesians 1:17-23","","Mark 16:15-20"],
  "2024-06-29": ["red","Acts 12:1-11","Psalm 34:2-3, 4-5, 6-7, 8-9","2 Timothy 4:6-8, 17-18","Matthew 16:18","Matthew 16:13-19"],
  "2025-03-23": ["violet","Exodus 17:3-7","Psalm 95:1-2, 6-7, 8-9","Romans 5:1-2, 5-8","","John 4:5-42"],
  "2025-03-30": ["violet","1 Samuel 16:1b, 6-7, 10-13a","Psalm 23:1-3a, 3b-4, 5, 6","Ephesians 5:8-14","","John 9:1-41"],
  "2025-04-06": ["violet","Ezekiel 37:12-14","Psalm 130:1-2, 3-4, 5-6, 7-8","Romans 8:8-11","","John 11:1-45"],
  "2025-05-29": ["white","Acts 18:1-8","Psalm 98:1, 2-3ab, 3cd-4","","","John 16:16-20"],
  "2025-06-01": ["white","Acts 7:55-60","Psalm 97:1-2, 6-7, 9","Revelation 22:12-14, 16-17, 20","","John 17:20-26"],
  "2025-06-24": ["white","Isaiah 49:1-6","Psalm 139:1b-3, 13-14ab, 14c-15","Acts 13:22-26","See Luke 1:76","Luke 1:57-66, 80"],
  "2025-06-29": ["red","Acts 12:1-11","Psalm 34:2-3, 4-5, 6-7, 8-9","2 Timothy 4:6-8, 17-18","Matthew 16:18","Matthew 16:13-19"],
  "2026-05-14": ["white","Acts 1:1-11","Psalm 47:2-3, 6-7, 8-9","Ephesians 1:17-23","","Matthew 28:16-20"],
  "2027-05-06": ["white","Acts 18:1-8","Psalm 98:1, 2-3ab, 3cd-4","","","John 16:16-20"],
  "2027-06-01": ["red","Tobit 2:9-14","Psalm 112:1-2, 7-8, 9","","","Mark 12:13-17"],
  "2027-06-02": ["green","Tobit 3:1-11a, 16-17a","Psalm 25:2-3, 4-5ab, 6+7bc, 8-9","","","Mark 12:18-27"],
  "2027-06-03": ["red","Tobit 6:10-11; 7:1bcde, 9-17; 8:4-9a","Psalm 128:1-2, 3, 4-5","","","Mark 12:28b-34"],
  "2027-06-04": ["white","Hosea 11:1, 3-4, 8c-9","Isaiah 12:2-3, 4bcd, 5-6","Ephesians 3:8-12, 14-19","Matthew 11:29ab","John 19:31-37"],
  "2027-06-05": ["green","Tobit 12:1, 5-15, 20","Tobit 13:2, 6, 7, 10 [Vulg.]","","","Mark 12:38-44"],
  "2027-06-06": ["green","Genesis 3:9-15","Psalm 130:1-2, 3-4, 5-6, 7-8","2 Corinthians 4:13-5:1","","Mark 3:20-35"],
  "2027-06-07": ["green","2 Corinthians 1:1-7","Psalm 34:2-3, 4-5, 6-7, 8-9","","","Matthew 5:1-12"],
  "2027-06-08": ["green","2 Corinthians 1:18-22","Psalm 119:129, 130, 131, 132, 133, 135","","","Matthew 5:13-16"],
  "2027-06-09": ["green","2 Corinthians 3:4-11","Psalm 99:5, 6, 7, 8, 9","","","Matthew 5:17-19"],
  "2027-06-10": ["green","2 Corinthians 3:15-4:1, 3-6","Psalm 85:9ab+10, 11-12, 13-14","","","Matthew 5:20-26"],
  "2027-06-11": ["red","Acts 11:21b-26; 13:1-3","Psalm 98:1, 2-3ab, 3cd-4, 5-6","","Psalm 25:4b, 5a","Matthew 5:27-32"],
  "2027-06-12": ["green","2 Corinthians 5:14-21","Psalm 103:1-2, 3-4, 9-10, 11-12","","","Matthew 5:33-37"],
  "2027-06-13": ["green","Ezekiel 17:22-24","Psalm 92:2-3, 13-14, 15-16","2 Corinthians 5:6-10","","Mark 4:26-34"],
  "2027-06-14": ["green","2 Corinthians 6:1-10","Psalm 98:1, 2b-3ab, 3cd-4","","","Matthew 5:38-42"],
  "2027-06-15": ["green","2 Corinthians 8:1-9","Psalm 146:2, 5-6ab, 6c-7, 8-9a","","","Matthew 5:43-48"],
  "2027-06-16": ["green","2 Corinthians 9:6-11","Psalm 112:1bc-2, 3-4, 9","","","Matthew 6:1-6, 16-18"],
  "2027-06-17": ["green","2 Corinthians 11:1-11","Psalm 111:1b-2, 3-4, 7-8","","","Matthew 6:7-15"],
  "2027-06-18": ["green","2 Corinthians 11:18, 21-30","Psalm 34:2-3, 4-5, 6-7","","","Matthew 6:19-23"],
  "2027-06-19": ["green","2 Corinthians 12:1-10","Psalm 34:8-9, 10-11, 12-13","","","Matthew 6:24-34"],
  "2027-06-20": ["green","Job 38:1, 8-11","Psalm 107:23-24, 25-26, 28-29, 30-31","2 Corinthians 5:14-17","","Mark 4:35-41"],
  "2027-06-21": ["white","Genesis 12:1-9","Psalm 33:12-13, 18-19, 20+22","","","Matthew 7:1-5"],
  "2027-06-22": ["green","Genesis 13:2, 5-18","Psalm 15:2-3a, 3bc-4ab, 5","","","Matthew 7:6, 12-14"],
  "2027-06-23": ["green","Genesis 15:1-12, 17-18","Psalm 105:1-2, 3-4, 6-7, 8-9","","","Matthew 7:15-20"],
  "2027-06-24": ["white","Isaiah 49:1-6","Psalm 139:1b-3, 13-14ab, 14c-15","Acts 13:22-26","See Luke 1:76","Luke 1:57-66, 80"],
  "2027-06-25": ["green","Genesis 17:1, 9-10, 15-22","Psalm 128:1-2, 3, 4-5","","","Matthew 8:1-4"],
  "2027-06-26": ["green","Genesis 18:1-15","Luke 1:46-47, 48-49, 50+53, 54-55","","","Matthew 8:5-17"],
  "2027-06-27": ["green","Wisdom 1:13-15, 2:23-24","Psalm 30:2+4, 5-6, 11-12a+13b","2 Corinthians 8:7, 9, 13-15","","Mark 5:21-43 or 5:21-24, 35-43"],
  "2027-06-28": ["red","Genesis 18:16-33","Psalm 103:1b-2, 3-4, 8-9, 10-11","","","Matthew 8:18-22"],
  "2027-06-29": ["red","Acts 12:1-11","Psalm 34:2-3, 4-5, 6-7, 8-9","2 Timothy 4:6-8, 17-18","Matthew 16:18","Matthew 16:13-19"],
  "2027-06-30": ["green","Genesis 21:5, 8-20a","Psalm 34:7-8, 10-11, 12-13","","","Matthew 8:28-34"],
  "2027-07-01": ["green","Genesis 22:1b-19","Psalm 115:1-2, 3-4, 5-6, 8-9","","","Matthew 9:1-8"],
  "2027-07-02": ["green","Genesis 23:1-4, 19; 24:1-8, 62-67","Psalm 106:1b-2, 3-4a, 4b-5","","","Matthew 9:9-13"],
  "2027-07-03": ["red","Ephesians 2:19-22","Psalm 117:1, 2","","John 20:29","John 20:24-29"],
  "2027-07-04": ["green","Ezekiel 2:2-5","Psalm 123:1-2a, 2bc, 3-4","2 Corinthians 12:7-10","","Mark 6:1-6"],
  "2027-07-05": ["green","Genesis 28:10-22a","Psalm 91:1-2, 3-4, 14-15ab","","","Matthew 9:18-26"],
  "2027-07-06": ["green","Genesis 32:23-33","Psalm 17:1b, 2-3, 6-7ab, 8b+15","","","Matthew 9:32-38"],
  "2027-07-07": ["green","Genesis 41:55-57; 42:5-7a, 17-24a","Psalm 33:2-3, 10-11, 18-19","","","Matthew 10:1-7"],
  "2027-07-08": ["green","Genesis 44:18-21, 23b-29; 45:1-5","Psalm 105:16-17, 18-19, 20-21","","","Matthew 10:7-15"],
  "2027-07-09": ["green","Genesis 46:1-7, 28-30","Psalm 37:3-4, 18-19, 27-28, 39-40","","","Matthew 10:16-23"],
  "2027-07-10": ["green","Genesis 49:29-32; 50:15-26a","Psalm 105:1-2, 3-4, 6-7","","","Matthew 10:24-33"],
  "2027-07-11": ["green","Amos 7:12-15","Psalm 85:9ab+10, 11-12, 13-14","Ephesians 1:3-14 or 1:3-10","","Mark 6:7-13"],
  "2027-07-12": ["green","Exodus 1:8-14, 22","Psalm 124:1b-3, 4-6, 7-8","","","Matthew 10:34-11:1"],
  "2027-07-13": ["green","Exodus 2:1-15a","Psalm 69:3, 14, 30-31, 33-34","","","Matthew 11:20-24"],
  "2027-07-14": ["white","Exodus 3:1-6, 9-12","Psalm 103:1b-2, 3-4, 6-7","","","Matthew 11:25-27"],
  "2027-07-15": ["white","Exodus 3:13-20","Psalm 105:1+5, 8-9, 24-25, 26-27","","","Matthew 11:28-30"],
  "2027-07-16": ["green","Exodus 11:10-12:14","Psalm 116:12-13, 15+16bc, 17-18","","","Matthew 12:1-8"],
  "2027-07-17": ["green","Exodus 12:37-42","Psalm 136:1+23-24, 10-12, 13-15","","","Matthew 12:14-21"],
  "2027-07-18": ["green","Jeremiah 23:1-6","Psalm 23:1-3a, 3b-4, 5, 6","Ephesians 2:13-18","","Mark 6:30-34"],
  "2027-07-19": ["green","Exodus 14:5-18","Exodus 15:1bc-2, 3-4, 5-6","","","Matthew 12:38-42"],
  "2027-07-20": ["green","Exodus 14:21-15:1","Exodus 15:8-9, 10+12, 17","","","Matthew 12:46-50"],
  "2027-07-21": ["green","Exodus 16:1-5, 9-15","Psalm 78:18-19, 23-24, 25-26, 27-28","","","Matthew 13:1-9"],
  "2027-07-22": ["white","Song of Songs 3:1-4b","Psalm 63:2, 3-4, 5-6, 8-9","","","John 20:1-2, 11-18"],
  "2027-07-23": ["green","Exodus 20:1-17","Psalm 19:8, 9, 10, 11","","","Matthew 13:18-23"],
  "2027-07-24": ["green","Exodus 24:3-8","Psalm 50:1b-2, 5-6, 14-15","","","Matthew 13:24-30"],
  "2027-07-25": ["green","2 Kings 4:42-44","Psalm 145:10-11, 15-16, 17-18","Ephesians 4:1-6","","John 6:1-15"],
  "2027-07-26": ["white","Exodus 32:15-24, 30-34","Psalm 106:19-20, 21-22, 23","","","Matthew 13:31-35"],
  "2027-07-27": ["green","Exodus 33:7-11; 34:5b-9, 28","Psalm 103:6-7, 8-9, 10-11, 12-13","","","Matthew 13:36-43"],
  "2027-07-28": ["green","Exodus 34:29-35","Psalm 99:5, 6, 7, 9","","","Matthew 13:44-46"],
  "2027-07-29": ["white","Exodus 40:16-21, 34-38","Psalm 84:3, 4, 5-6a+8a, 11","","John 8:12","John 11:19-27"],
  "2027-07-30": ["green","Leviticus 23:1, 4-11, 15-16, 27, 34b-37","Psalm 81:3-4, 5-6ab, 10-11ab","","","Matthew 13:54-58"],
  "2027-07-31": ["white","Leviticus 25:1, 8-17","Psalm 67:2-3, 5, 7-8","","","Matthew 14:1-12"],
  "2027-08-01": ["green","Exodus 16:2-4, 12-15","Psalm 78:3-4, 23-24, 25+54","Ephesians 4:17, 20-24","","John 6:24-35"],
  "2027-08-02": ["green","Numbers 11:4b-15","Psalm 81:12-13, 14-15, 16-17","","","Matthew 14:13-21"],
  "2027-08-03": ["green","Numbers 12:1-13","Psalm 51:3-4, 5-6ab, 6cd-7, 12-13","","","Matthew 14:22-36"],
  "2027-08-04": ["white","Numbers 13:1-2, 25-14:1, 26a-29a, 34-35","Psalm 106:6-7ab, 13-14, 21-22, 23","","","Matthew 15:21-28"],
  "2027-08-05": ["green","Numbers 20:1-13","Psalm 95:1-2, 6-7, 8-9","","","Matthew 16:13-23"],
  "2027-08-06": ["white","Daniel 7:9-10, 13-14","Psalm 97:1-2, 5-6, 9","2 Peter 1:16-19","Matthew 17:5","Mark 9:2-10"],
  "2027-08-07": ["green","Deuteronomy 6:4-13","Psalm 18:2-3a, 3bc-4, 47+51","","","Matthew 17:14-20"],
  "2027-08-08": ["green","1 Kings 19:4-8","Psalm 34:2-3, 4-5, 6-7, 8-9","Ephesians 4:30-5:2","","John 6:41-51"],
  "2027-08-09": ["green","Deuteronomy 10:12-22","Psalm 147:12-13, 14-15, 19-20","","","Matthew 17:22-27"],
  "2027-08-10": ["red","2 Corinthians 9:6-10","Psalm 112:1-2, 5-6, 7-8, 9","","John 8:12","John 12:24-26"],
  "2027-08-11": ["white","Deuteronomy 34:1-12","Psalm 66:1-3a, 5+8, 16-17","","Matthew 11:29","Matthew 18:1-5, 10, 12-14"],
  "2027-08-12": ["green","Joshua 3:7-10a, 11, 13-17","Psalm 114:1-2, 3-4, 5-6","","","Matthew 18:21-19:1"],
  "2027-08-13": ["green","Joshua 24:1-13","Psalm 136:1-3, 16-18, 21-22+24","","","Matthew 19:3-12"],
  "2027-08-14": ["red","Joshua 24:14-29","Psalm 16:1-2a+5, 7-8, 11","","","Matthew 19:13-15"],
  "2027-08-16": ["green","Judges 2:11-19","Psalm 106:34-35, 36-37, 39-40, 43ab+44","","","Matthew 19:16-22"],
  "2027-08-17": ["green","Judges 6:11-24a","Psalm 85:9, 11-12, 13-14","","","Matthew 19:23-30"],
  "2027-08-18": ["green","Judges 9:6-15","Psalm 21:2-3, 4-5, 6-7","","","Matthew 20:1-16"],
  "2027-08-19": ["green","Judges 11:29-39a","Psalm 40:5, 7-8a, 8b-9, 10","","","Matthew 22:1-14"],
  "2027-08-20": ["white","Ruth 1:1, 3-6, 14b-16, 22","Psalm 146:5-6ab, 6c-7, 8-9a, 9bc-10","","","Matthew 22:34-40"],
  "2027-08-21": ["white","Ruth 2:1-3, 8-11; 4:13-17","Psalm 128:1b-2, 3, 4, 5","","","Matthew 23:1-12"],
  "2027-08-22": ["green","Joshua 24:1-2a, 15-17, 18b","Psalm 34:2-3, 16-17, 18-19, 20-21","Ephesians 5:21-32 or 5:2a, 25-32","","John 6:60-69"],
  "2027-08-23": ["green","1 Thess 1:1-5, 8b-10","Psalm 149:1b-2, 3-4, 5-6a+9b","","","Matthew 23:13-22"],
  "2027-08-24": ["red","Revelation 21:9b-14","Psalm 145:10-11, 12-13, 17-18","","John 1:49b","John 1:45-51"],
  "2027-08-25": ["green","1 Thess 2:9-13","Psalm 139:7-8, 9-10, 11-12ab","","","Matthew 23:27-32"],
  "2027-08-26": ["green","1 Thess 3:7-13","Psalm 90:3-4, 12-13, 14+17","","","Matthew 24:42-51"],
  "2027-08-27": ["white","1 Thess 4:1-8","Psalm 97:1+2b, 5-6, 10, 11-12","","","Matthew 25:1-13"],
  "2027-08-28": ["white","1 Thess 4:9-11","Psalm 98:1, 7-8, 9","","","Matthew 25:14-30"],
  "2027-08-29": ["green","Deuteronomy 4:1-2, 6-8","Psalm 15:2-3a, 3b-4a, 4b-5","James 1:17-18, 21b-22, 27","","Mark 7:1-8, 14-15, 21-23"],
  "2027-08-30": ["green","1 Thess 4:13-18","Psalm 96:1+3, 4-5, 11-12, 13","","","Luke 4:16-30"],
  "2027-08-31": ["green","1 Thess 5:1-6, 9-11","Psalm 27:1, 4, 13-14","","","Luke 4:31-37"],
  "2027-09-01": ["green","Colossians 1:1-8","Psalm 52:10, 11","","","Luke 4:38-44"],
  "2027-09-02": ["green","Colossians 1:9-14","Psalm 98:2-3ab, 3cd-4, 5-6","","","Luke 5:1-11"],
  "2027-09-03": ["white","Colossians 1:15-20","Psalm 100:1b-2, 3, 4, 5","","","Luke 5:33-39"],
  "2027-09-04": ["green","Colossians 1:21-23","Psalm 54:3-4, 6+8","","","Luke 6:1-5"],
  "2027-09-05": ["green","Isaiah 35:4-7a","Psalm 146:6c-7, 8-9a, 9b-10","James 2:1-5","","Mark 7:31-37"],
  "2027-09-06": ["green","Colossians 1:24-2:3","Psalm 62:6-7, 9","","","Luke 6:6-11"],
  "2027-09-07": ["green","Colossians 2:6-15","Psalm 145:1b-2, 8-9, 10-11","","","Luke 6:12-19"],
  "2027-09-08": ["white","Micah 5:1-4a","Psalm 13:6ab, 6c","","","Matthew 1:1-16, 18-23"],
  "2027-09-09": ["white","Colossians 3:12-17","Psalm 150:1b-2, 3-4, 5-6","","","Luke 6:27-38"],
  "2027-09-10": ["green","1 Timothy 1:1-2, 12-14","Psalm 16:1b-2a+5, 7-8, 11","","","Luke 6:39-42"],
  "2027-09-11": ["green","1 Timothy 1:15-17","Psalm 113:1b-2, 3-4, 5a+6-7","","","Luke 6:43-49"],
  "2027-09-12": ["green","Isaiah 50:4-9a","Psalm 116:1-2, 3-4, 5-6, 8-9","James 2:14-18","","Mark 8:27-35"],
  "2027-09-13": ["white","1 Timothy 2:1-8","Psalm 28:2, 7, 8-9","","","Luke 7:1-10"],
  "2027-09-14": ["red","Numbers 21:4b-9","Psalm 78:1bc-2, 34-35, 36-37, 38","Philippians 2:6-11","","John 3:13-17"],
  "2027-09-15": ["white","1 Timothy 3:14-16","Psalm 111:1-2, 3-4, 5-6","","","John 19:25-27"],
  "2027-09-16": ["red","1 Timothy 4:12-16","Psalm 111:7-8, 9, 10","","","Luke 7:36-50"],
  "2027-09-17": ["green","1 Timothy 6:2c-12","Psalm 49:6-7, 8-10, 17-18, 19-20","","","Luke 8:1-3"],
  "2027-09-18": ["green","1 Timothy 6:13-16","Psalm 100:1b-2, 3, 4, 5","","","Luke 8:4-15"],
  "2027-09-19": ["green","Wisdom 2:12, 17-20","Psalm 54:3-4, 5, 6-8","James 3:16-4:3","","Mark 9:30-37"],
  "2027-09-20": ["red","Ezra 1:1-6","Psalm 126:1b-2ab, 2cd-3, 4-5, 6","","","Luke 8:16-18"],
  "2027-09-21": ["red","Ephesians 4:1-7, 11-13","Psalm 19:2-3, 4-5","","","Matthew 9:9-13"],
  "2027-09-22": ["green","Ezra 9:5-9","Tobit 13:2, 3-4a, 6, 7, 10 [Vulg.]","","","Luke 9:1-6"],
  "2027-09-23": ["white","Haggai 1:1-8","Psalm 149:1b-2, 3-4, 5-6a+9b","","","Luke 9:7-9"],
  "2027-09-24": ["green","Haggai 2:1-9","Psalm 43:1, 2, 3, 4","","","Luke 9:18-22"],
  "2027-09-25": ["green","Zechariah 2:5-9, 14-15a","Jeremiah 31:10, 11-12ab, 13","","","Luke 9:43b-45"],
  "2027-09-26": ["green","Numbers 11:25-29","Psalm 19:8, 10, 12-13, 14","James 5:1-6","","Mark 9:38-43, 45, 47-48"],
  "2027-09-27": ["white","Zechariah 8:1-8","Psalm 102:16-18, 19-21, 29+22-23","","","Luke 9:46-50"],
  "2027-09-28": ["green","Zechariah 8:20-23","Psalm 87:1b-3, 4-5, 6-7","","","Luke 9:51-56"],
  "2027-09-29": ["white","Daniel 7:9-10, 13-14","Psalm 138:1-2ab, 2cde-3, 4-5","","Psalm 103:21","John 1:47-51"],
  "2027-09-30": ["white","Nehemiah 8:1-4a, 5-6, 7b-12","Psalm 19:8, 9, 10, 11","","","Luke 10:1-12"],
  "2027-10-01": ["white","Baruch 1:15-22","Psalm 79:1b-2, 3-5, 8, 9","","","Luke 10:13-16"],
  "2027-10-02": ["white","Baruch 4:5-12, 27-29","Psalm 69:33-35, 36-37","","Psalm 103:21","Matthew 18:1-5, 10"],
  "2027-10-03": ["green","Genesis 2:18-24","Psalm 128:1-2, 3, 4-5, 6","Hebrews 2:9-11","","Mark 10:2-16 or 10:2-12"],
  "2027-10-04": ["white","Jonah 1:1-2:2, 11","Jonah 2:3, 4, 5, 8","","","Luke 10:25-37"],
  "2027-10-05": ["green","Jonah 3:1-10","Psalm 130:1b-2, 3-4ab, 7-8","","","Luke 10:38-42"],
  "2027-10-06": ["green","Jonah 4:1-11","Psalm 86:3-4, 5-6, 9-10","","","Luke 11:1-4"],
  "2027-10-07": ["white","Malachi 3:13-20b","Psalm 1:1-2, 3, 4+6","","","Luke 11:5-13"],
  "2027-10-08": ["green","Joel 1:13-15; 2:1-2","Psalm 9:2-3, 6+16, 8-9","","","Luke 11:15-26"],
  "2027-10-09": ["green","Joel 4:12-21","Psalm 97:1-2, 5-6, 11-12","","","Luke 11:27-28"],
  "2027-10-10": ["green","Wisdom 7:7-11","Psalm 90:12-13, 14-15, 16-17","Hebrews 4:12-13","","Mark 10:17-30 or 10:17-27"],
  "2027-10-11": ["green","Romans 1:1-7","Psalm 98:1bcde, 2-3ab, 3cd-4","","","Luke 11:29-32"],
  "2027-10-12": ["green","Romans 1:16-25","Psalm 19:2-3, 4-5","","","Luke 11:37-41"],
  "2027-10-13": ["green","Romans 2:1-11","Psalm 62:2-3, 6-7, 9","","","Luke 11:42-46"],
  "2027-10-14": ["green","Romans 3:21-30","Psalm 130:1b-2, 3-4, 5-6ab","","","Luke 11:47-54"],
  "2027-10-15": ["white","Romans 4:1-8","Psalm 32:1b-2, 5, 11","","","Luke 12:1-7"],
  "2027-10-16": ["green","Romans 4:13, 16-18","Psalm 105:6-7, 8-9, 42-43","","","Luke 12:8-12"],
  "2027-10-17": ["green","Isaiah 53:10-11","Psalm 33:4-5, 18-19, 20+22","Hebrews 4:14-16","","Mark 10:35-45 or 10:42-45"],
  "2027-10-18": ["red","2 Timothy 4:10-17b","Psalm 145:10-11, 12-13, 17-18","","See John 15:16","Luke 10:1-9"],
  "2027-10-19": ["red","Romans 5:12, 15b, 17-19, 20b-21","Psalm 40:7-8a, 8b-9, 10, 17","","","Luke 12:35-38"],
  "2027-10-20": ["green","Romans 6:12-18","Psalm 124:1b-3, 4-6, 7-8","","","Luke 12:39-48"],
  "2027-10-21": ["green","Romans 6:19-23","Psalm 1:1-2, 3, 4+6","","","Luke 12:49-53"],
  "2027-10-22": ["green","Romans 7:18-25a","Psalm 119:66, 68, 76, 77, 93, 94","","","Luke 12:54-59"],
  "2027-10-23": ["green","Romans 8:1-11","Psalm 24:1b-2, 3-4ab, 5-6","","","Luke 13:1-9"],
  "2027-10-24": ["green","Jeremiah 31:7-9","Psalm 126:1-2a, 2b-3, 4-5, 6","Hebrews 5:1-6","","Mark 10:46-52"],
  "2027-10-25": ["green","Romans 8:12-17","Psalm 68:2+4, 6-7ab, 20-21","","","Luke 13:10-17"],
  "2027-10-26": ["green","Romans 8:18-25","Psalm 126:1b-2ab, 2cd-3, 4-5, 6","","","Luke 13:18-21"],
  "2027-10-27": ["green","Romans 8:26-30","Psalm 13:4-5, 6","","","Luke 13:22-30"],
  "2027-10-28": ["red","Ephesians 2:19-22","Psalm 19:2-3, 4-5","","","Luke 6:12-16"],
  "2027-10-29": ["green","Romans 9:1-5","Psalm 147:12-13, 14-15, 19-20","","","Luke 14:1-6"],
  "2027-10-30": ["green","Romans 11:1-2a, 11-12, 25-29","Psalm 94:12-13a, 14-15, 17-18","","","Luke 14:1, 7-11"],
  "2027-10-31": ["green","Deuteronomy 6:2-6","Psalm 18:2-3a, 3b-4, 47+51","Hebrews 7:23-28","","Mark 12:28b-34"],
};
// Etiquetas de fiesta ausentes o con glitch en la fuente:
const FEAST_FIX = {
  "2023-01-31": "Memorial of Saint John Bosco, Priest",
  "2023-05-25": "Thursday of the Seventh Week of Easter",
  "2025-06-01": "Seventh Sunday of Easter",
  "2027-03-25": "Holy Thursday \u2014 Mass of the Lord\u2019s Supper",
  "2027-05-09": "Seventh Sunday of Easter",
};

export function dailyAvailable() {
  return typeof window !== "undefined" && !!window.DailyCitations;
}
export function dailyFor(iso) {
  if (!dailyAvailable()) return null;
  const fill = FEAST_FILL_DATES[iso];
  if (fill) {
    const [feast, color, lectionary, first, psalm, second, alleluia, gospel] = FEAST_FILL[fill];
    const readings = [];
    if (first) readings.push({ type: "first", citation: first });
    if (psalm) readings.push({ type: "psalm", citation: psalm });
    if (second) readings.push({ type: "second", citation: second });
    if (alleluia) readings.push({ type: "alleluia", citation: alleluia });
    if (gospel) readings.push({ type: "gospel", citation: gospel });
    if (!readings.length) return null;
    return { iso, feast, color, lectionary, readings };
  }
  const row = window.DailyCitations[iso] || (window.DailyExtra && window.DailyExtra[iso]);
  if (!row) return null;
  let [feast, color, lectionary, first, psalm, second, alleluia, gospel] = row;
  if (typeof FEAST_FIX !== "undefined" && FEAST_FIX[iso]) feast = FEAST_FIX[iso];
  const df = (typeof DAILY_FILL !== "undefined" && DAILY_FILL[iso]) || null;
  if (df && !first && !psalm && !second && !alleluia && !gospel) {
    [color, first, psalm, second, alleluia, gospel] = df;
  }
  const readings = [];
  if (first) readings.push({ type: "first", citation: first });
  if (psalm) readings.push({ type: "psalm", citation: psalm });
  if (second) readings.push({ type: "second", citation: second });
  if (alleluia) readings.push({ type: "alleluia", citation: alleluia });
  if (gospel) readings.push({ type: "gospel", citation: gospel });
  if (!readings.length) return null;
  return { iso, feast, color, lectionary, readings };
}
export function dailyRange() {
  if (!dailyAvailable()) return null;
  const ks = new Set(Object.keys(window.DailyCitations));
  if (window.DailyExtra) for (const k of Object.keys(window.DailyExtra)) ks.add(k);
  const arr = [...ks].sort();
  return arr.length ? { from: arr[0], to: arr[arr.length - 1], days: arr.length } : null;
}
