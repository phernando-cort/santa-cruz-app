// Calendario real de la parroquia — verificado en hcccsantacruz.org y boletines (nov 2026).
// Eventos recurrentes con día+hora+lugar confirmados. Los de fecha única (funerales,
// bodas, quinceañeras…) los publica el párroco con el formulario "Agregar celebración".

export const REAL_EVENTS = [
  { id: "r1", title: "Estudio bíblico (Bible Study)", day: "tue", time: "4:00 PM", category: "Formación", location: "Biblioteca", desc: "Estudio bíblico semanal en inglés. Trae tu Biblia.", recurring: "Semanal" },
  { id: "r2", title: "Rosario en latín", day: "tue", time: "5:15 PM", category: "Comunidad", location: "Templo histórico", desc: "Rosario rezado en latín, antes de la Misa de 6 PM.", recurring: "Semanal" },
  { id: "r3", title: "Rosario patriótico", day: "fri", time: "5:00 PM", category: "Comunidad", location: "Templo histórico", desc: "Rosario por la patria, antes de la Misa de 6 PM.", recurring: "Semanal" },
  { id: "r4", title: "Misa de unción de los enfermos", day: "wed", time: "6:00 PM", category: "Misa", location: "Templo histórico", desc: "Misa de unción el primer miércoles de mes. Traigan a sus enfermos y ancianos.", recurring: "Mensual", special: true, mass: "Unción" },
  { id: "r5", title: "Adoración · primer viernes", day: "fri", time: "7:30 AM – 4:00 PM", category: "Adoración", location: "Capilla", desc: "Adoración eucarística del primer viernes. Rosario todos los días antes de Misa.", recurring: "Mensual", special: true },
  { id: "r6", title: "San Vicente de Paúl", day: "mon", time: "Ver boletín", category: "Servicio", location: "Meeting Room", desc: "Ayuda a los necesitados. Reunión semanal del grupo.", recurring: "Semanal", group: "San Vicente de Paúl" },
  { id: "r7", title: "Las Palmas", day: "tue", time: "Ver boletín", category: "Comunidad", location: "Meeting Room", desc: "Reunión semanal del grupo Las Palmas.", recurring: "Semanal", group: "Las Palmas" },
  { id: "r8", title: "Celadoras del Santísimo · turnos", day: "fri", time: "1:00 – 6:00 PM", category: "Adoración", location: "Capilla", desc: "Turnos de adoración y cuidado de la capilla. Inscríbete a una hora en la sección Pastoral.", recurring: "Semanal", group: "Celadoras del Santísimo" },
];

// Fechas únicas verificadas (fiestas que no dependen del boletín semanal).
export const DATED_SEEDS = [
  { id: "d-guad26", title: "Fiesta de Ntra. Sra. de Guadalupe", day: "sat", date: "2026-12-12", time: "Ver boletín", category: "Comunidad", location: "Templo histórico", desc: "Fiesta de la Morenita. Mañanitas, Misa y convivencia.", recurring: "Única", special: true },
  { id: "d-nav26", title: "Misa de Navidad", day: "fri", date: "2026-12-25", time: "Ver boletín", category: "Misa", location: "Templo histórico", desc: "Solemnidad de la Natividad del Señor.", recurring: "Única", special: true, mass: "Navidad" },
  { id: "d-maria27", title: "María, Madre de Dios", day: "fri", date: "2027-01-01", time: "Ver boletín", category: "Misa", location: "Templo histórico", desc: "Solemnidad de Santa María, Madre de Dios.", recurring: "Única", special: true },
];

// Boletín vigente (respaldo si no hay internet; el vivo se descarga de la página parroquial).
export const BULLETIN_FALLBACK = {
  y: 2026, mo: 11, d1: 1, d2: 7,
  pdf: "https://irp.cdn-website.com/ba39fac3/files/uploaded/hccc_santa-cruz-catholic-church_bulletin_2026_11_01-07.pdf",
  view: "https://bulletins.jcpress.com/books/Holy-Cross-Bulletin-2026-11-01/"
};

// Requisitos y contactos de sacramentos — del boletín y la oficina (nov 2026).
export const SACRAMENT_INFO = {
es: [
  { h: "Registro parroquial", p: "Para ser feligrés registrado pasa a la oficina (Lun–Jue 9 AM–4 PM, Vie 9 AM–1 PM) o llama al (505) 753-3345. Se pide para padrinos, bautismos y ciertos trámites." },
  { h: "Bautismo", p: "Ser feligrés registrado. Pasar a la oficina por la hoja de requisitos y documentos (niños menores de 7 años y padrinos). Plática prebautismal: lunes 6:30 PM en la oficina (papás y padrinos)." },
  { h: "Matrimonio", p: "Llamar a la rectoría con al menos seis meses de anticipación. Clases prematrimoniales requeridas para apartar fecha." },
  { h: "Primera Comunión", p: "Preparación a través de Formación en la fe. Español: Diác. Ernest Salazar (505) 412-7632 · Inglés: Alice Lucero (505) 747-9176." },
  { h: "Confirmación", p: "Preparación a través de Formación en la fe y OCIA. Pregunta en la oficina o con los contactos de formación." },
  { h: "Funerales", p: "Llama a la rectoría al (505) 753-3345 para coordinar con el párroco la Misa exequial y el acompañamiento a la familia." },
  { h: "Cementerio (lote)", p: "Para información sobre lotes en el cementerio parroquial, contacta la oficina: (505) 753-3345 · holycross.admoffice@gmail.com." },
  { h: "OCIA y RICA (español)", p: "Diác. Ernest Salazar (DRE): (505) 412-7632 · deaconernest.salazar16@gmail.com" },
  { h: "Formación en la fe (inglés) y OCIA inglés", p: "Alice Lucero: (505) 747-9176 · Melissa Esquibel (OCIA inglés): (505) 753-3345" },
  { h: "Pastoral de enfermos (homebound)", p: "Angelica Juarez: (505) 692-7249 · angelicajuarez2114@gmail.com" },
  { h: "Reconciliación", p: "Sábados 4:00–5:15 PM o con cita." },
  { h: "Oficina parroquial", p: "Lun–Jue 9 AM–4 PM (cerrado 1–2 PM) · Vie 9 AM–1 PM · (505) 753-3345 · holycross.admoffice@gmail.com · P.O. Box 1228, Santa Cruz, NM 87567" }
],
en: [
  { h: "Parish registration", p: "To become a registered parishioner stop by the office (Mon–Thu 9 AM–4 PM, Fri 9 AM–1 PM) or call (505) 753-3345. Required for godparents, baptisms and certain requests." },
  { h: "Baptism", p: "Be a registered parishioner. Stop by the office for the requirements sheet and documents (infants under 7 and godparents). Pre-baptismal class: Mondays 6:30 PM at the office (parents and godparents)." },
  { h: "Marriage", p: "Call the rectory at least six months in advance. Pre-marital classes required to set a date." },
  { h: "First Communion", p: "Preparation through Faith Formation. Spanish: Deacon Ernest Salazar (505) 412-7632 · English: Alice Lucero (505) 747-9176." },
  { h: "Confirmation", p: "Preparation through Faith Formation and OCIA. Ask at the office or contact the formation team." },
  { h: "Funerals", p: "Call the rectory at (505) 753-3345 to arrange the funeral Mass and family support with the pastor." },
  { h: "Cemetery (plot)", p: "For information about plots in the parish cemetery, contact the office: (505) 753-3345 · holycross.admoffice@gmail.com." },
  { h: "OCIA & RICA (Spanish)", p: "Deacon Ernest Salazar (DRE): (505) 412-7632 · deaconernest.salazar16@gmail.com" },
  { h: "Faith Formation (English) & English OCIA", p: "Alice Lucero: (505) 747-9176 · Melissa Esquibel (English OCIA): (505) 753-3345" },
  { h: "Homebound ministry", p: "Angelica Juarez: (505) 692-7249 · angelicajuarez2114@gmail.com" },
  { h: "Reconciliation", p: "Saturdays 4:00–5:15 PM or by appointment." },
  { h: "Parish office", p: "Mon–Thu 9 AM–4 PM (closed 1–2 PM) · Fri 9 AM–1 PM · (505) 753-3345 · holycross.admoffice@gmail.com · P.O. Box 1228, Santa Cruz, NM 87567" }
]};

export const PARISH_YT = "https://youtube.com/@santacruzparishespanola3397";
export const PARISH_BULLETIN_PAGE = "https://www.hcccsantacruz.org/bulletin";
