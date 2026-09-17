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
    name: 'Marc',
    date: '2020-01',
    rating: 5,
    sector: {
      es: 'Seguros',
      en: 'Insurance',
    },
    text: {
      es: 'Técnicamente excelentes. Refactorizaron un servicio legacy crítico sin romper nada y con una cobertura de tests que nos sigue dando confianza meses después.',
      en: 'Technically excellent. They refactored a critical legacy service without breaking anything, with test coverage that still gives us confidence months later.',
    },
  },
  {
    name: 'David Chen',
    date: '2021-05',
    rating: 5,
    text: {
      es: 'Solvencia técnica y honestidad con los trade-offs. Nunca nos vendieron una arquitectura brillante cuando la aburrida era la correcta. Muy recomendables.',
      en: 'Technical rigor and honest about trade-offs. They never sold us a brilliant architecture when the boring one was the right call. Highly recommended.',
    },
  },
  {
    name: 'Thomas Berg',
    date: '2022-01',
    rating: 3,
    text: {
      es: 'Entrega profesional en conjunto. La comunicación en la fase inicial podría haber sido más afinada; una vez alineado el alcance, todo fue como la seda.',
      en: 'Professional delivery overall. Communication in the early phase could have been sharper; once we aligned on scope, everything went smoothly.',
    },
  },
  {
    name: 'Javier Ortiz',
    date: '2022-11',
    rating: 4,
    text: {
      es: 'Muy buenos técnicos, sobre todo en arquitectura. No son de los más baratos del mercado — se nota en la factura — pero también se nota en la calidad de lo que entregan.',
      en: 'Very strong engineers, especially on architecture. Not the cheapest option out there — you see it on the invoice — but you also see it in the quality of what they deliver.',
    },
  },
  {
    name: 'R. H.',
    date: '2023-03',
    rating: 5,
    sector: {
      es: 'Salud',
      en: 'Healthcare',
    },
    text: {
      es: 'Convirtieron un requisito de compliance complejo en un módulo simple y mantenible, ajustado justo a lo que exigía la norma. Sin sobreingeniería y sin atajos.',
      en: 'They turned a complex compliance requirement into a simple, maintainable module, tailored exactly to what the regulation required. No over-engineering, no cutting corners.',
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
    name: 'Sofía Delgado',
    date: '2024-02',
    rating: 4,
    sector: {
      es: 'Educación',
      en: 'Education',
    },
    text: {
      es: 'Nos ajustaron el proyecto a lo que de verdad necesitábamos, sin sobredimensionar la infraestructura. En arranque hubo que reajustar el alcance, pero desde ahí impecable.',
      en: 'They scoped the project to what we actually needed, without oversizing the infrastructure. Some rescoping at the start, but flawless from there.',
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
