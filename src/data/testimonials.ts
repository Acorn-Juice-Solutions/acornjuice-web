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
}

/**
 * Placeholder testimonials for the home page. Names, dates and ratings are
 * fictional but plausible; replace with real, permission-cleared quotes before
 * layering schema.org Review markup on top.
 *
 * Rating distribution is deliberately imperfect (mostly 5, some 4, one 3) so
 * the section reads as social proof rather than staged marketing copy.
 */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    name: 'Ana García',
    date: '2019-02',
    rating: 5,
    text: {
      es: 'Gente seria. Migraron toda nuestra infraestructura a la nube sin un minuto de caída y con un plan de vuelta atrás para cada paso. Tranquilidad total.',
      en: 'Serious professionals. Migrated our entire infrastructure to the cloud without a minute of downtime, with a rollback plan for every step. Total peace of mind.',
    },
  },
  {
    name: "James O'Brien",
    date: '2019-05',
    rating: 5,
    text: {
      es: 'Equipo profesional, directo y sin humo. Encuentran soluciones simples a problemas complejos y entregan cuando dicen. Volvería a contratarles mañana.',
      en: 'Professional, straightforward, no fluff. They find simple solutions to complex problems and deliver when they say they will. I would hire them again tomorrow.',
    },
  },
  {
    name: 'Laura Etxeberria',
    date: '2019-09',
    rating: 4,
    text: {
      es: 'Nos entregaron exactamente lo que necesitábamos, ni una línea de más. Nada de sobreingeniería ni features que nadie iba a usar. Se nota la experiencia.',
      en: 'They delivered exactly what we needed, not a line more. No over-engineering, no features nobody would use. The experience shows.',
    },
  },
  {
    name: 'Marc Dubois',
    date: '2020-01',
    rating: 5,
    text: {
      es: 'Técnicamente excelentes. Refactorizaron un servicio legacy crítico sin romper nada y con una cobertura de tests que nos sigue dando confianza meses después.',
      en: 'Technically excellent. They refactored a critical legacy service without breaking anything, with test coverage that still gives us confidence months later.',
    },
  },
  {
    name: 'Peter Neumann',
    date: '2020-08',
    rating: 5,
    text: {
      es: 'Gente seria y puntual. Entregaron una API limpia y bien documentada en la mitad del tiempo que había estimado el proveedor anterior. Cero regresiones en seis meses.',
      en: 'Serious, on-time delivery. They shipped a clean, well-documented API in half the time our previous vendor quoted. Zero regressions in six months.',
    },
  },
  {
    name: 'Iñaki Zabala',
    date: '2020-11',
    rating: 4,
    text: {
      es: 'Buenos consejos incluso cuando eso implicaba menos trabajo para ellos. Nos recomendaron simplificar el alcance y ahorrar coste. Esa honestidad se paga sola.',
      en: 'Good advice even when it meant less work for them. They recommended simplifying the scope and cutting cost. That kind of honesty pays for itself.',
    },
  },
  {
    name: 'Sarah Whitmore',
    date: '2021-02',
    rating: 5,
    text: {
      es: 'Buenos técnicos de verdad. Cogieron un código heredado enmarañado y entregaron algo simple donde tenía que serlo y robusto donde hacía falta. Soluciones simples a problemas complejos, tal cual.',
      en: 'Genuinely strong engineers. They took a tangled legacy codebase and delivered something simple where it needed to be and robust where it had to be. Simple solutions to complex problems, exactly.',
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
    name: 'Elena Marín',
    date: '2021-09',
    rating: 5,
    text: {
      es: 'Son unos cracks. Reformulamos un producto entero con ellos y el código que entregaron sigue siendo un placer mantener años después — calidad de verdad, no solo en la demo.',
      en: 'These guys are the real deal. We rebuilt an entire product with them and the code they delivered is still a pleasure to maintain years later — real quality, not just demo-quality.',
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
    name: 'Miguel Torres',
    date: '2022-04',
    rating: 5,
    text: {
      es: 'De los mejores equipos con los que he trabajado en quince años. Están un paso por delante del resto: criterio propio, buenos consejos y foco en lo que aporta valor.',
      en: 'One of the best teams I have worked with in fifteen years. They stand a step above the rest: real judgment, good advice, and focus on what actually adds value.',
    },
  },
  {
    name: 'Anna Kowalski',
    date: '2022-08',
    rating: 5,
    text: {
      es: 'Ajustaron la solución a nuestras necesidades reales, no a un catálogo genérico. Migraron el pipeline de datos sin un incidente y con documentación que seguimos usando.',
      en: 'They tailored the solution to our real needs, not a generic template. Migrated the data pipeline without an incident and left documentation we still use.',
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
    name: 'Rachel Hoffman',
    date: '2023-03',
    rating: 5,
    text: {
      es: 'Convirtieron un requisito de compliance complejo en un módulo simple y mantenible, ajustado justo a lo que exigía la norma. Sin sobreingeniería y sin atajos.',
      en: 'They turned a complex compliance requirement into a simple, maintainable module, tailored exactly to what the regulation required. No over-engineering, no cutting corners.',
    },
  },
  {
    name: 'Pablo Lasarte',
    date: '2023-06',
    rating: 5,
    text: {
      es: 'No fueron la opción más barata que valoramos, pero sí la más rentable a la larga. El dashboard que nos hicieron sigue vigente dos años después, sin una sola intervención correctiva.',
      en: 'They were not the cheapest option we quoted, but they were the most cost-effective in the long run. The dashboard they built is still running two years later, without a single corrective intervention.',
    },
  },
  {
    name: 'Chloé Martin',
    date: '2023-10',
    rating: 5,
    text: {
      es: 'Diferentes al resto: profesionales, serios y con criterio. Puntuales, precisos y sin florituras. Los recomiendo sin reservas.',
      en: 'Different from the rest: professional, serious, and thoughtful. Prompt, precise, no fluff. I recommend them without reservation.',
    },
  },
  {
    name: 'Sofía Delgado',
    date: '2024-02',
    rating: 4,
    text: {
      es: 'Nos ajustaron el proyecto a lo que de verdad necesitábamos, sin sobredimensionar la infraestructura. En arranque hubo que reajustar el alcance, pero desde ahí impecable.',
      en: 'They scoped the project to what we actually needed, without oversizing the infrastructure. Some rescoping at the start, but flawless from there.',
    },
  },
  {
    name: 'Kai Andersson',
    date: '2024-07',
    rating: 5,
    text: {
      es: 'Técnicamente los mejores que he visto en CI/CD. Los builds son reproducibles y los releases aburridos — que es exactamente lo que quieres en producción.',
      en: 'Technically the best I have seen on CI/CD. Builds are reproducible, releases are boring — which is exactly what you want in production.',
    },
  },
  {
    name: 'Nerea Aguirre',
    date: '2025-01',
    rating: 5,
    text: {
      es: 'En un mercado lleno de proveedores intercambiables, ellos son claramente distintos. Serios, con criterio, recomiendan lo que hace falta y no lo que abulta la factura.',
      en: 'In a market full of interchangeable vendors, they clearly stand apart. Serious, thoughtful, they recommend what you actually need — not what pads the invoice.',
    },
  },
] as const;
