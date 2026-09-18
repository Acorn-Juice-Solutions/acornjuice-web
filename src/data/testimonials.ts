import type { Locale } from '~/utils/i18n';

export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface Testimonial {
  /** Client name shown under the quote. */
  readonly name: string;
  /**
   * Year and month the recommendation was given, ISO `YYYY-MM`.
   * Rendered in a locale-aware short format at display time.
   */
  readonly date: `${number}-${number}`;
  readonly rating: StarRating;
  readonly text: Readonly<Record<Locale, string>>;
  /** Optional client industry/sector shown as a subtitle under the name. */
  readonly sector?: Readonly<Record<Locale, string>>;
}

/**
 * Testimonials received by email. Review markup on top.
 * Pending to add latest surveys 2025-2026
 */
export const TESTIMONIALS: readonly Testimonial[] = [

  {
    name: 'Haritz Urrestarazu',
    date: '2018-02',
    rating: 5,
    sector: {
      es: 'Servicios informáticos',
      en: 'IT services',
    },
    text: {
      es: 'Y le daría 6 si hubiera.\n\nGrandes profesionales. Saben lo que tienen entre manos y te ayudan en todo para afinar las cosas a unos límites insospechados.\n\nRecomendaría sus servicios siempre que pueda hacerlo.',
      en: "I'd give 6 stars if that were an option.\n\nGreat professionals. They know their craft and help you fine-tune everything to levels you wouldn't have thought possible.\n\nI'd recommend their services any chance I get.",
    },
  },
  {
    name: 'Pablo Lasarte',
    date: '2023-06',
    rating: 5,
    sector: {
      es: 'Retail',
      en: 'Retail',
    },
    text: {
      es: 'No fueron la opción más barata que valoramos, pero sí la más rentable a la larga. El dashboard que nos hicieron sigue vigente dos años después, sin una sola intervención correctiva.',
      en: 'They were not the cheapest option we quoted, but they were the most cost-effective in the long run. The dashboard they built is still running two years later, without a single corrective intervention.',
    },
  },
  {
    name: 'Joseba H.',
    date: '2024-11',
    rating: 5,
    sector: {
      es: 'Automoción',
      en: 'Automotive',
    },
    text: {
      es: 'Un 10 en todo. Grandes profesionales y siempre dispuestos a ayudar. Ganas tranquilidad sabiendo que están en el proyecto.',
      en: "Top marks across the board. Great professionals, always ready to help. Real peace of mind knowing they're on the project.",
    },
  },
  {
    name: 'Sergi Sánchez',
    date: '2025-07',
    rating: 5,
    sector: {
      es: 'Ingeniería industrial',
      en: 'Industrial engineering',
    },
    text: {
      es: 'En mi ámbito laboral he necesitado subcontratar a una empresa para configurar redes de datos, VPN, comunicaciones 5G, etc., todo ello usando equipos MikroTik.\n\nJavier, de Acornjuice, no solo es un experto en la materia, sino que va mucho más allá de la simple configuración de los equipos. Asesora sobre la instalación, detecta posibles puntos de mejora y tiene muy en cuenta aspectos de ciberseguridad en los que quizá ni siquiera habías pensado.\n\nAdemás, trabaja de forma muy profesional, cercana y clara, explicando en todo momento las decisiones tomadas y proponiendo soluciones prácticas y adaptadas a las necesidades reales de cada proyecto. Se nota que tiene una amplia experiencia y un gran conocimiento técnico.\n\nRecomendable 100%.',
      en: "In my line of work I've had to subcontract a company to configure data networks, VPNs, 5G communications, etc. — all of it running on MikroTik equipment.\n\nJavier, from Acornjuice, isn't just an expert in the field; he goes well beyond simply configuring the devices. He advises on installation, spots areas for improvement and pays close attention to cybersecurity angles you might not even have considered.\n\nOn top of that, he works in a very professional, approachable and clear way, always explaining the decisions he takes and proposing practical solutions tailored to the real needs of each project. His broad experience and strong technical knowledge really show.\n\nHighly recommended.",
    },
  },
  {
    name: 'Luis Miguel Roda',
    date: '2026-04',
    rating: 5,
    sector: {
      es: 'Telecom y seguridad',
      en: 'Telecom & security',
    },
    text: {
      es: 'Nos han dado un trato profesional.',
      en: 'They have treated us professionally throughout.',
    },
  },
  {
    name: 'Jaime Carrasco Tobares',
    date: '2026-09',
    rating: 5,
    sector: {
      es: 'Banca',
      en: 'Banking',
    },
    text: {
      es: 'Trabajar con Iosune y Javier ha sido una experiencia excelente. Destacan por su altísimo nivel de profesionalidad y por la capacidad de entender y captar los requerimientos del proyecto a la primera. Además, valoran enormemente tanto su tiempo como el de sus clientes, por lo que reducen las reuniones al mínimo indispensable sin perder ni un ápice de claridad ni alineación. Un equipo altamente eficiente y recomendable para cualquier actividad relacionada con el desarrollo de software.',
      en: 'Working with Iosune and Javier has been an excellent experience. They stand out for their outstanding level of professionalism and their ability to grasp project requirements right from the start. On top of that, they deeply value both their time and their clients’, keeping meetings to the strict minimum without losing an ounce of clarity or alignment. A highly efficient team, and one I would recommend for any software development work.',
    },
  },
  {
    name: 'Ammarah Uddin',
    date: '2026-09',
    rating: 5,
    sector: {
      es: 'Banca',
      en: 'Banking',
    },
    text: {
      es: 'Trabajar con Acorn Juice fue una experiencia positiva, con un equipo profesional y colaborativo que se comunicó con claridad durante todo el proyecto. Aprecié su solvencia técnica, capacidad de respuesta y foco en entregar soluciones de calidad.',
      en: 'Working with Acorn Juice was a positive experience, with a professional and collaborative team that communicated clearly throughout the project. I appreciated their technical expertise, responsiveness, and focus on delivering quality solutions.',
    },
  },
  {
    name: 'Athul Prasad',
    date: '2026-09',
    rating: 5,
    sector: {
      es: 'Banca',
      en: 'Banking',
    },
    text: {
      es: 'Ha sido un verdadero placer trabajar con vosotros. El nivel de experiencia, profesionalidad y soporte ha sido excepcional. Los retos complejos se abordan con reflexión, con un foco claro en entender la necesidad y encontrar soluciones prácticas.\n\nHe valorado especialmente el enfoque colaborativo y la disposición a ir más allá siempre que hace falta apoyo. El conocimiento y la experiencia que aportan a cada colaboración marcan una diferencia real en los resultados que hemos conseguido.\n\nRecomendaría sin reservas estos servicios a cualquiera que busque un partner con criterio, fiable y realmente comprometido.',
      en: 'It has been a real pleasure working with your services. The level of expertise, professionalism and support provided has been exceptional. Complex challenges are approached thoughtfully, with a clear focus on understanding the need and finding practical solutions.\n\nI have particularly valued the collaborative approach and willingness to go the extra mile whenever support is needed. The knowledge and experience brought to each engagement have made a genuine difference to the outcomes we have achieved.\n\nI would highly recommend these services to anyone looking for a knowledgeable, reliable and genuinely supportive partner.',
    },
  },
  {
    name: 'Miguel N.',
    date: '2026-09',
    rating: 5,
    sector: {
      es: 'Banca',
      en: 'Banking',
    },
    text: {
      es: 'He trabajado estrechamente con Iosune y Javier durante unos cuatro años, aunque los conozco desde hace más tiempo.\n\nLa experiencia siempre ha sido fantástica. Sus habilidades técnicas son excelentes, pero lo que más destacaría es su proactividad y su intención de hacerlo todo con un alto nivel de exigencia.',
      en: "I've worked closely with both Iosune and Javier for about four years, although I've known them for longer.\n\nThe experience has always been fantastic. Their engineering skills are excellent, but the quality I would highlight most is their proactivity and their intention to do everything to a high standard.",
    },
  },
] as const;
