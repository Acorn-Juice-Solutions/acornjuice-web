---
title: "Notificar vulnerabilidades bajo el CRA: qué obliga y en cuánto tiempo"
slug: "cra-notificacion-vulnerabilidades"
summary: "Desde septiembre de 2026 hay 24 horas para avisar de una vulnerabilidad explotada. Qué obliga el CRA, a quién alcanza y qué hay que tener listo antes."
date: 2026-09-23
sources:
  - title: "Comisión Europea — CRA: obligaciones de notificación"
    url: "https://digital-strategy.ec.europa.eu/en/policies/cra-reporting"
  - title: "ENISA — Single Reporting Platform: preguntas frecuentes"
    url: "https://www.enisa.europa.eu/topics/product-security/single-reporting-platform-srp/frequently-asked-questions"
  - title: "ENISA activa la plataforma única de notificación (Help Net Security)"
    url: "https://www.helpnetsecurity.com/2026/09/14/enisa-cra-single-reporting-platform/"
  - title: "La notificación del CRA ya es obligatoria (Crowell & Moring)"
    url: "https://www.crowell.com/en/insights/client-alerts/its-live-the-cyber-resilience-act-reporting-is-mandatory-as-of-today-11-september-2026"
---

El 11 de septiembre de 2026 entró en vigor la parte del Reglamento (UE) 2024/2847
—el Cyber Resilience Act— que cambia el día a día de cualquiera que publique
software en Europa. No es la parte de la que se habló en su momento, la del
marcado CE y los requisitos esenciales, que todavía queda lejos. Es la de
notificar, y ya está corriendo.

## Qué cambió exactamente

Desde esa fecha, un fabricante que descubre que una vulnerabilidad de su
producto está siendo explotada activamente tiene que avisar. No a sus clientes
—eso también, pero es otra conversación— sino a la autoridad: al CSIRT designado
como coordinador y a ENISA. Lo mismo vale para un incidente grave que afecte a
la seguridad del producto.

El aviso no se manda por correo a nadie ni se busca el formulario del país que
toque. ENISA encendió ese mismo día la plataforma única de notificación prevista
en el artículo 16, y una sola entrega llega a la vez al CSIRT coordinador y a la
agencia. Es, probablemente, la mejor noticia del paquete: la parte
administrativa está resuelta.

## Por qué esto probablemente te incluye

La palabra "fabricante" evoca una empresa con fábrica. En el reglamento
significa otra cosa: quien pone en el mercado de la Unión un producto con
elementos digitales. Una aplicación móvil en una tienda, un ejecutable
descargable, un widget, un dispositivo con firmware. El tamaño de la empresa no
cambia la categoría.

Hay dos matices que conviene tener claros antes de dar por hecho que te aplica o
que no. El primero: las obligaciones alcanzan también a productos que ya estaban
en el mercado, no solo a lo que se publique a partir de ahora. El segundo: las
entidades que sostienen software libre de forma estructurada tienen su propia
versión de la obligación, con un calendario distinto que arranca en diciembre de
2027. Lo que quede fuera de ambas figuras —un proyecto personal publicado sin
actividad comercial detrás— es otra historia, y es exactamente el punto donde
conviene leer el texto en vez de fiarse de un resumen, este incluido.

## Los tres plazos

El reglamento escalona la notificación en tres momentos, y cada uno pide un
nivel de detalle distinto:

Un **aviso temprano en 24 horas** desde que el fabricante tiene conocimiento de
la explotación activa. Es corto a propósito: identifica al fabricante y al
producto, dice qué ha pasado y cuándo, y apunta el impacto inicial y cualquier
medida de mitigación que ya exista. No hace falta tener la respuesta, hace falta
avisar.

Una **notificación en 72 horas** con la evaluación inicial: qué se sabe ya de la
vulnerabilidad o del incidente, su alcance y por dónde va la corrección.

Un **informe final a los 14 días** desde que existe una medida correctora o de
mitigación disponible. Aquí sí se espera el relato completo.

Visto de golpe parece mucho. Visto desde dentro de una organización que ya
gestiona incidentes, lo difícil no son los plazos: es el primero. Veinticuatro
horas se agotan solas mientras alguien decide si el aviso que llegó por correo
es real, quién responde por ese producto y si "explotada activamente" significa
lo que parece.

## Lo que hay que tener montado antes

El error de lectura habitual es tratar esto como un trámite y dejarlo para
cuando ocurra. Los plazos no se cumplen con un procedimiento escrito; se
cumplen con tres cosas que existen antes del incidente.

**Saber qué llevas dentro.** Cuando aparece una vulnerabilidad en una
dependencia, la pregunta operativa no es si es grave, sino si está en alguno de
tus productos y en qué versiones. Sin un inventario de dependencias por entrega
—un SBOM generado desde el lockfile, no desde lo que declaras— esa pregunta se
responde a mano, repositorio por repositorio, con el reloj corriendo. Más abajo
contamos cómo lo hemos resuelto nosotros.

**Tener forma de enterarte.** Un canal de contacto publicado, con una política
que diga a dónde escribir y qué esperar, y que alguien lea de verdad. Si el
correo de seguridad cae en una bandeja que se revisa los lunes, el plazo de 24
horas ya está comprometido antes de empezar.

**Saber quién decide.** La notificación la firma alguien. Conviene que esté
decidido quién es antes de necesitarlo, y que esa persona sepa dónde está la
plataforma de ENISA y con qué credenciales entra.

## Cómo lo hemos montado nosotros

Lo honesto es enseñarlo en vez de contarlo, así que el pipeline del que hablamos
está a la vista: el [widget Android que publicamos con licencia MIT](https://github.com/Acorn-Juice-Solutions/github_download_counter_widget_android)
lleva el workflow entero en `.github/workflows/supply-chain.yml`. Se ejecuta en
cada push a la rama principal, en cada pull request, una vez al día y a demanda,
y hace cinco cosas:

- **Genera el SBOM en formato CycloneDX a partir del lockfile de Gradle**, no de
  lo que declaran los ficheros de build. La diferencia no es cosmética: lo
  declarado es una intención, el lockfile es el árbol resuelto que acaba dentro
  del APK.
- **Escanea las dependencias contra OSV** y deja el informe junto al inventario.
- **Verifica que el lockfile concuerda con lo declarado**, que es lo que caza el
  cambio que alguien metió sin actualizar el candado.
- **Busca secretos en todo el historial**, no solo en el último commit.
- **Audita los propios workflows** y mantiene cada acción de GitHub anclada a un
  hash de commit en lugar de a una etiqueta. Esto último es lo que de verdad
  muerde: una etiqueta se reescribe, y ese es exactamente el camino por el que
  un gusano de cadena de suministro entra en un build ajeno.

Los informes se conservan como artefactos noventa días. Y desde la última
versión el `.cdx.json` **viaja adjunto a la release**, al lado del APK firmado y
con los SHA-256 que GitHub publica para ambos. Ese fue el cambio que más nos
costó ver: durante un tiempo generamos el inventario religiosamente y se quedaba
muriendo en CI, donde no le sirve de nada a quien descarga el binario seis meses
después.

Lo que todavía no tenemos, y lo decimos porque el hueco informa tanto como el
resto: **procedencia y attestations**. El inventario dice qué hay dentro; la
procedencia demuestra que ese binario salió de ese código y de ese pipeline, y
no de la máquina de cualquiera. Es lo siguiente en la lista.

## Lo que no resuelve

Conviene decirlo, porque el discurso de cumplimiento tiende a vender tranquilidad:
notificar no protege a nadie. Es un mecanismo para que la información circule y
para que las autoridades tengan visión del problema. La protección viene de lo
de antes —dependencias vigiladas, artefactos verificables, capacidad de publicar
una corrección rápido— y de lo de después, que es que el parche llegue de verdad
a quien lo usa.

Y hay una tensión honesta en el diseño: avisar a las autoridades de una
vulnerabilidad explotada antes de que exista corrección concentra información
sensible en un punto. El reglamento la gestiona con restricciones de uso y
difusión, pero es un debate legítimo que no conviene despachar como paranoia.

## Qué haríamos si empezáramos hoy

Por orden, y sin que ninguno de los tres pasos sea un proyecto: generar el
inventario de dependencias en el pipeline y adjuntarlo a cada release; publicar
un canal de contacto de seguridad con una política escrita y realista; y dejar
por escrito quién notifica, con qué cuenta y en qué plazo interno —un plazo
interno más corto que el legal, porque el legal es el límite, no el objetivo.

Con eso, el día que llegue el aviso, las 24 horas dan de sobra. Sin eso, dan
para descubrir que nadie sabía qué versiones estaban afectadas.
